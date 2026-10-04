-- Distinguish Academy and Coaching subscriptions while keeping Stripe as source of truth.

alter table public.subscriptions
  add column if not exists product_type text not null default 'academy';

alter table public.subscriptions
  drop constraint if exists subscriptions_product_type_check;
alter table public.subscriptions
  add constraint subscriptions_product_type_check check (product_type in ('academy','coaching'));

create index if not exists subscriptions_user_product_status_idx
  on public.subscriptions(user_id,product_type,status,current_period_end desc);

drop function if exists public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean);

create or replace function public.process_stripe_subscription_event(
  p_event_id text,
  p_event_type text,
  p_stripe_created_at timestamptz,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_price_id text,
  p_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_product_type text default 'academy'
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  resolved_user_id uuid := p_user_id;
  inserted_event_id text;
  resolved_product_type text := coalesce(p_product_type,'academy');
begin
  if p_status not in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') then
    raise exception 'Unsupported Stripe subscription status';
  end if;
  if resolved_product_type not in ('academy','coaching') then
    raise exception 'Unsupported STOA product type';
  end if;

  insert into public.stripe_webhook_events(stripe_event_id,event_type,stripe_created_at)
  values(p_event_id,p_event_type,p_stripe_created_at)
  on conflict(stripe_event_id) do nothing
  returning stripe_event_id into inserted_event_id;
  if inserted_event_id is null then return false; end if;

  if resolved_user_id is null then
    select user_id into resolved_user_id from public.billing_customers where stripe_customer_id=p_customer_id;
  end if;
  if resolved_user_id is null then
    select id into resolved_user_id from public.profiles where stripe_customer_id=p_customer_id;
  end if;
  if resolved_user_id is null then raise exception 'Unable to resolve Supabase user for Stripe customer'; end if;

  insert into public.billing_customers(user_id,stripe_customer_id)
  values(resolved_user_id,p_customer_id)
  on conflict(user_id) do update set stripe_customer_id=excluded.stripe_customer_id,updated_at=now();

  update public.profiles
  set stripe_customer_id=p_customer_id
  where id=resolved_user_id and stripe_customer_id is distinct from p_customer_id;

  insert into public.subscriptions(
    user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,product_type,status,
    current_period_start,current_period_end,cancel_at_period_end
  ) values (
    resolved_user_id,p_customer_id,p_subscription_id,p_price_id,resolved_product_type,p_status,
    p_period_start,p_period_end,coalesce(p_cancel_at_period_end,false)
  )
  on conflict(stripe_subscription_id) do update set
    user_id=excluded.user_id,
    stripe_customer_id=excluded.stripe_customer_id,
    stripe_price_id=excluded.stripe_price_id,
    product_type=excluded.product_type,
    status=excluded.status,
    current_period_start=excluded.current_period_start,
    current_period_end=excluded.current_period_end,
    cancel_at_period_end=excluded.cancel_at_period_end,
    updated_at=now();

  if resolved_product_type='coaching' then
    insert into public.coaching_clients(
      client_id,status,access_source,stripe_subscription_id,started_at,ends_at
    ) values (
      resolved_user_id,
      case when p_status in ('active','trialing') then 'onboarding' else case when p_status='canceled' then 'cancelled' else 'paused' end end,
      'stripe',
      p_subscription_id,
      coalesce(p_period_start,now()),
      p_period_end
    )
    on conflict(client_id) do update set
      status=case
        when p_status in ('active','trialing') and public.coaching_clients.onboarding_completed then 'active'
        when p_status in ('active','trialing') then 'onboarding'
        when p_status='canceled' then 'cancelled'
        else 'paused'
      end,
      access_source='stripe',
      stripe_subscription_id=excluded.stripe_subscription_id,
      started_at=least(public.coaching_clients.started_at,excluded.started_at),
      ends_at=excluded.ends_at,
      updated_at=now();
  end if;

  return true;
end;
$$;

revoke all on function public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean,text) from public,anon,authenticated;
grant execute on function public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean,text) to service_role;
