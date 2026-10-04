-- Stripe is the payment source of truth. PostgreSQL stores the local entitlement used by RLS.

alter table public.profiles
  alter column role set default 'registered',
  add column if not exists stripe_customer_id text;

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;

create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null check (status in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index subscriptions_status_period_idx on public.subscriptions(user_id,status,current_period_end desc);

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  stripe_created_at timestamptz,
  processed_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

grant select on public.billing_customers,public.subscriptions to authenticated;
grant select,insert,update,delete on public.billing_customers,public.subscriptions,public.stripe_webhook_events to service_role;

create policy "users read own billing customer" on public.billing_customers
  for select to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));
create policy "users read own subscriptions" on public.subscriptions
  for select to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));

create or replace function public.has_active_academy_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select p_user_id is not null and (
    exists (
      select 1 from public.profiles p
      where p.id=p_user_id and p.role in ('admin','coaching')
    )
    or exists (
      select 1 from public.coaching_clients c
      where c.client_id=p_user_id
        and c.status in ('onboarding','active')
        and (c.ends_at is null or c.ends_at>now())
    )
    or exists (
      select 1 from public.subscriptions s
      where s.user_id=p_user_id
        and s.status in ('active','trialing')
        and (s.current_period_end is null or s.current_period_end>now())
    )
  );
$$;

revoke all on function public.has_active_academy_access(uuid) from public;
grant execute on function public.has_active_academy_access(uuid) to authenticated,service_role;

create or replace function public.sync_academy_membership(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  current_role public.user_role;
begin
  select role into current_role from public.profiles where id=p_user_id;
  if current_role is null or current_role in ('admin','coaching') then return; end if;
  perform set_config('stoa.billing_sync','on',true);
  update public.profiles
  set role=case when public.has_active_academy_access(p_user_id) then 'member'::public.user_role else 'registered'::public.user_role end
  where id=p_user_id;
end;
$$;

revoke all on function public.sync_academy_membership(uuid) from public,anon,authenticated;
grant execute on function public.sync_academy_membership(uuid) to service_role;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and not public.is_admin()
    and coalesce(current_setting('stoa.billing_sync',true),'') <> 'on'
  then
    raise exception 'Only billing synchronization or an admin can change a profile role';
  end if;
  if new.stripe_customer_id is distinct from old.stripe_customer_id
    and coalesce((select auth.role()),'') <> 'service_role'
    and not public.is_admin()
  then
    raise exception 'Only billing synchronization can change Stripe identifiers';
  end if;
  return new;
end;
$$;

create or replace function public.sync_subscription_membership_trigger()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.sync_academy_membership(coalesce(new.user_id,old.user_id));
  return coalesce(new,old);
end;
$$;

create trigger subscriptions_sync_membership
after insert or update or delete on public.subscriptions
for each row execute function public.sync_subscription_membership_trigger();

create or replace function public.sync_coaching_academy_membership_trigger()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.sync_academy_membership(coalesce(new.client_id,old.client_id));
  return coalesce(new,old);
end;
$$;

create trigger coaching_clients_sync_academy_membership
after insert or update or delete on public.coaching_clients
for each row execute function public.sync_coaching_academy_membership_trigger();

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
  p_cancel_at_period_end boolean
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  resolved_user_id uuid := p_user_id;
  inserted_event_id text;
begin
  if p_status not in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') then
    raise exception 'Unsupported Stripe subscription status';
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
    user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,status,
    current_period_start,current_period_end,cancel_at_period_end
  ) values (
    resolved_user_id,p_customer_id,p_subscription_id,p_price_id,p_status,
    p_period_start,p_period_end,coalesce(p_cancel_at_period_end,false)
  )
  on conflict(stripe_subscription_id) do update set
    user_id=excluded.user_id,
    stripe_customer_id=excluded.stripe_customer_id,
    stripe_price_id=excluded.stripe_price_id,
    status=excluded.status,
    current_period_start=excluded.current_period_start,
    current_period_end=excluded.current_period_end,
    cancel_at_period_end=excluded.cancel_at_period_end,
    updated_at=now();

  return true;
end;
$$;

revoke all on function public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.process_stripe_subscription_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;

-- Academy content: authenticated is no longer enough. The Stripe/Coaching entitlement is mandatory.
drop policy if exists "authenticated users read pillars" on public.pillars;
create policy "academy members read pillars" on public.pillars for select to authenticated
  using ((select public.has_active_academy_access()));
drop policy if exists "authenticated users read chapters" on public.chapters;
create policy "academy members read chapters" on public.chapters for select to authenticated
  using ((select public.has_active_academy_access()));
drop policy if exists "authenticated users read modules" on public.modules;
create policy "academy members read modules" on public.modules for select to authenticated
  using ((select public.has_active_academy_access()));
drop policy if exists "authenticated users read subchapters" on public.subchapters;
create policy "academy members read subchapters" on public.subchapters for select to authenticated
  using ((select public.has_active_academy_access()));
drop policy if exists "authenticated users read subchapter images" on public.subchapter_images;
create policy "academy members read subchapter images" on public.subchapter_images for select to authenticated
  using ((select public.has_active_academy_access()));

drop policy if exists "users read own progress" on public.user_progress;
drop policy if exists "users insert own progress" on public.user_progress;
drop policy if exists "users update own progress" on public.user_progress;
drop policy if exists "users delete own progress" on public.user_progress;
create policy "academy members read own progress" on public.user_progress for select to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members insert own progress" on public.user_progress for insert to authenticated
  with check ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members update own progress" on public.user_progress for update to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()))
  with check ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members delete own progress" on public.user_progress for delete to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()));

drop policy if exists "members read own learning state" on public.user_learning_state;
drop policy if exists "members insert own learning state" on public.user_learning_state;
drop policy if exists "members update own learning state" on public.user_learning_state;
drop policy if exists "members delete own learning state" on public.user_learning_state;
create policy "academy members read own learning state" on public.user_learning_state for select to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members insert own learning state" on public.user_learning_state for insert to authenticated
  with check ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members update own learning state" on public.user_learning_state for update to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()))
  with check ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members delete own learning state" on public.user_learning_state for delete to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()));

drop policy if exists "members read own lesson notes" on public.user_lesson_notes;
drop policy if exists "members insert own lesson notes" on public.user_lesson_notes;
drop policy if exists "members update own lesson notes" on public.user_lesson_notes;
drop policy if exists "members delete own lesson notes" on public.user_lesson_notes;
create policy "academy members read own lesson notes" on public.user_lesson_notes for select to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members insert own lesson notes" on public.user_lesson_notes for insert to authenticated
  with check ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members update own lesson notes" on public.user_lesson_notes for update to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()))
  with check ((select auth.uid())=user_id and (select public.has_active_academy_access()));
create policy "academy members delete own lesson notes" on public.user_lesson_notes for delete to authenticated
  using ((select auth.uid())=user_id and (select public.has_active_academy_access()));

create or replace function public.get_user_progress_summary(p_user_id uuid)
returns table (chapter_id uuid, chapter_title text, completed_modules bigint, total_modules bigint, completion_percent numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_user_id is distinct from (select auth.uid()) and not public.is_admin() then raise exception 'Not authorized'; end if;
  if not public.has_active_academy_access(p_user_id) then raise exception 'Academy access required'; end if;
  return query
  select c.id,c.title,
    count(distinct up.module_id) filter (where up.status='completed' and up.subchapter_id is null),
    count(distinct m.id),
    case when count(distinct m.id)=0 then 0 else round(100.0*count(distinct up.module_id) filter (where up.status='completed' and up.subchapter_id is null)/count(distinct m.id),1) end
  from public.chapters c
  left join public.modules m on m.chapter_id=c.id and m.is_visible=true
  left join public.user_progress up on up.module_id=m.id and up.user_id=p_user_id
  where c.is_visible=true
  group by c.id,c.title,c.order_index order by c.order_index;
end;
$$;

-- Existing migration: privileged roles stay untouched; Coaching keeps Academy access.
do $$
declare profile_row record;
begin
  for profile_row in select id from public.profiles where role='member' loop
    perform public.sync_academy_membership(profile_row.id);
  end loop;
end;
$$;
