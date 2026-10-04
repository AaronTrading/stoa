-- Stripe events are monotone per subscription. Email campaigns use an atomic,
-- expiring lease and durable recipient rows so a retry never duplicates a send.

alter table public.subscriptions
  add column if not exists last_stripe_event_created_at timestamptz,
  add column if not exists last_stripe_event_priority integer not null default 0,
  add column if not exists last_stripe_event_id text;

create or replace function public.process_stripe_subscription_event(
  p_event_id text,p_event_type text,p_stripe_created_at timestamptz,p_user_id uuid,
  p_customer_id text,p_subscription_id text,p_price_id text,p_status text,
  p_period_start timestamptz,p_period_end timestamptz,p_cancel_at_period_end boolean,
  p_product_type text default 'academy'
)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  resolved_user_id uuid:=p_user_id;
  inserted_event_id text;
  applied_subscription_id uuid;
  resolved_product_type text:=p_product_type;
  event_priority integer:=case p_event_type
    when 'customer.subscription.deleted' then 100
    when 'invoice.payment_failed' then 90
    when 'customer.subscription.paused' then 80
    when 'customer.subscription.updated' then 60
    when 'invoice.paid' then 50
    when 'customer.subscription.created' then 40
    when 'checkout.session.completed' then 30
    else 10 end;
begin
  if p_status not in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') then raise exception 'Unsupported Stripe subscription status'; end if;
  if resolved_product_type not in ('academy','coaching') then raise exception 'Unsupported STOA product type'; end if;
  if nullif(p_price_id,'') is null then raise exception 'Stripe price is required'; end if;

  insert into public.stripe_webhook_events(stripe_event_id,event_type,stripe_created_at)
  values(p_event_id,p_event_type,p_stripe_created_at) on conflict(stripe_event_id) do nothing
  returning stripe_event_id into inserted_event_id;
  if inserted_event_id is null then return false; end if;

  if resolved_user_id is null then select user_id into resolved_user_id from public.billing_customers where stripe_customer_id=p_customer_id; end if;
  if resolved_user_id is null then select id into resolved_user_id from public.profiles where stripe_customer_id=p_customer_id; end if;
  if resolved_user_id is null then raise exception 'Unable to resolve Supabase user for Stripe customer'; end if;

  insert into public.billing_customers(user_id,stripe_customer_id) values(resolved_user_id,p_customer_id)
  on conflict(user_id) do update set stripe_customer_id=excluded.stripe_customer_id,updated_at=now();
  update public.profiles set stripe_customer_id=p_customer_id where id=resolved_user_id and stripe_customer_id is distinct from p_customer_id;

  insert into public.subscriptions(
    user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,product_type,status,
    current_period_start,current_period_end,cancel_at_period_end,
    last_stripe_event_created_at,last_stripe_event_priority,last_stripe_event_id
  ) values(
    resolved_user_id,p_customer_id,p_subscription_id,p_price_id,resolved_product_type,p_status,
    p_period_start,p_period_end,coalesce(p_cancel_at_period_end,false),
    p_stripe_created_at,event_priority,p_event_id
  )
  on conflict(stripe_subscription_id) do update set
    user_id=excluded.user_id,stripe_customer_id=excluded.stripe_customer_id,stripe_price_id=excluded.stripe_price_id,
    product_type=excluded.product_type,status=excluded.status,current_period_start=excluded.current_period_start,
    current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,
    last_stripe_event_created_at=excluded.last_stripe_event_created_at,
    last_stripe_event_priority=excluded.last_stripe_event_priority,last_stripe_event_id=excluded.last_stripe_event_id,updated_at=now()
  where (excluded.last_stripe_event_created_at,excluded.last_stripe_event_priority,excluded.last_stripe_event_id)
    > (coalesce(public.subscriptions.last_stripe_event_created_at,'-infinity'::timestamptz),public.subscriptions.last_stripe_event_priority,coalesce(public.subscriptions.last_stripe_event_id,''))
  returning id into applied_subscription_id;
  if applied_subscription_id is null then return false; end if;

  if resolved_product_type='coaching' then
    insert into public.coaching_clients(client_id,status,access_source,stripe_subscription_id,started_at,ends_at)
    values(resolved_user_id,case when p_status in ('active','trialing') then 'onboarding' when p_status='canceled' then 'cancelled' else 'paused' end,'stripe',p_subscription_id,coalesce(p_period_start,now()),p_period_end)
    on conflict(client_id) do update set
      status=case when p_status in ('active','trialing') and public.coaching_clients.onboarding_completed then 'active' when p_status in ('active','trialing') then 'onboarding' when p_status='canceled' then 'cancelled' else 'paused' end,
      access_source='stripe',stripe_subscription_id=excluded.stripe_subscription_id,
      started_at=least(public.coaching_clients.started_at,excluded.started_at),ends_at=excluded.ends_at,updated_at=now();
  end if;
  return true;
end; $$;
revoke all on function public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean,text) from public,anon,authenticated;
grant execute on function public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean,text) to service_role;

alter table public.email_campaigns
  add column if not exists send_attempt_id uuid,
  add column if not exists send_lease_expires_at timestamptz;

create or replace function public.claim_email_campaign(p_campaign_id uuid,p_recipient_count integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare attempt uuid:=gen_random_uuid();
begin
  update public.email_campaigns set status='sending',send_attempt_id=attempt,
    send_lease_expires_at=now()+interval '10 minutes',recipient_count=greatest(p_recipient_count,0),last_error=null
  where id=p_campaign_id and (status in ('draft','partial','failed') or (status='sending' and send_lease_expires_at<now()));
  if not found then return null; end if;
  return attempt;
end; $$;
revoke all on function public.claim_email_campaign(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_email_campaign(uuid,integer) to service_role;

create or replace function public.finish_email_campaign(p_campaign_id uuid,p_attempt_id uuid,p_last_error text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare sent_total integer; failed_total integer; pending_total integer;
begin
  if not exists(select 1 from public.email_campaigns where id=p_campaign_id and status='sending' and send_attempt_id=p_attempt_id) then return false; end if;
  select count(*) filter(where status='sent'),count(*) filter(where status='failed'),count(*) filter(where status='pending')
  into sent_total,failed_total,pending_total from public.email_deliveries where campaign_id=p_campaign_id;
  update public.email_campaigns set sent_count=sent_total,failed_count=failed_total,
    status=case when pending_total>0 then 'partial' when failed_total=0 then 'sent' when sent_total=0 then 'failed' else 'partial' end,
    last_error=nullif(p_last_error,''),sent_at=case when sent_total>0 then coalesce(sent_at,now()) else sent_at end,
    send_lease_expires_at=null
  where id=p_campaign_id and send_attempt_id=p_attempt_id;
  return found;
end; $$;
revoke all on function public.finish_email_campaign(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.finish_email_campaign(uuid,uuid,text) to service_role;

-- Audience membership follows the authoritative entitlement, not the cached role.
create or replace function public.resolve_email_campaign_recipients(p_campaign_id uuid)
returns table(user_id uuid,email text,first_name text,last_name text)
language sql stable security definer set search_path='' as $$
  select distinct u.id,u.email::text,
    coalesce(nullif(btrim(p.first_name),''),nullif(split_part(btrim(p.full_name),' ',1),''),'Membre'),
    coalesce(nullif(btrim(p.last_name),''),nullif(btrim(substr(btrim(p.full_name),length(split_part(btrim(p.full_name),' ',1))+1)),''),'')
  from public.email_campaigns campaign join auth.users u on u.email is not null join public.profiles p on p.id=u.id
  where campaign.id=p_campaign_id and (
    campaign.audience='all'
    or campaign.audience='academy' and public.has_active_academy_access(u.id)
    or campaign.audience='coaching' and exists(select 1 from public.coaching_clients c where c.client_id=u.id and c.status in ('onboarding','active') and (c.ends_at is null or c.ends_at>now()))
    or campaign.audience='custom' and u.id=any(campaign.custom_recipient_ids)
  );
$$;
revoke all on function public.resolve_email_campaign_recipients(uuid) from public,anon,authenticated;
grant execute on function public.resolve_email_campaign_recipients(uuid) to service_role;
