-- Manual Academy entitlements and persistent member onboarding.

create table public.academy_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  source text not null default 'manual' check (source in ('manual','gift','legacy')),
  granted_by uuid references auth.users(id) on delete set null,
  note text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_entitlements enable row level security;
grant select on public.academy_entitlements to authenticated;
grant select,insert,update,delete on public.academy_entitlements to service_role;
create policy "members read own Academy entitlement" on public.academy_entitlements
  for select to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));

alter table public.profiles
  add column if not exists onboarding_state jsonb not null default '{}'::jsonb,
  add column if not exists location_label text;

-- Existing accounts keep their current experience. A new manual or paid activation
-- resets onboarding only for an account that did not already have Academy access.
update public.profiles
set onboarding_completed=true,
    onboarding_state=jsonb_build_object('completed',true,'migrated',true)
where onboarding_completed=false;

create or replace function public.has_active_academy_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select p_user_id is not null and (
    exists (select 1 from public.profiles p where p.id=p_user_id and p.role in ('admin','coaching'))
    or exists (
      select 1 from public.academy_entitlements e
      where e.user_id=p_user_id and e.status='active' and (e.ends_at is null or e.ends_at>now())
    )
    or exists (
      select 1 from public.coaching_clients c
      where c.client_id=p_user_id and c.status in ('onboarding','active') and (c.ends_at is null or c.ends_at>now())
    )
    or exists (
      select 1 from public.subscriptions s
      where s.user_id=p_user_id and s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now())
    )
  );
$$;

revoke all on function public.has_active_academy_access(uuid) from public;
grant execute on function public.has_active_academy_access(uuid) to authenticated,service_role;

create or replace function public.sync_manual_academy_membership_trigger()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.sync_academy_membership(coalesce(new.user_id,old.user_id));
  return coalesce(new,old);
end;
$$;

create trigger academy_entitlements_sync_membership
after insert or update or delete on public.academy_entitlements
for each row execute function public.sync_manual_academy_membership_trigger();

create or replace function public.prepare_paid_academy_onboarding_trigger()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.product_type='academy' and new.status in ('active','trialing')
    and exists(select 1 from public.profiles where id=new.user_id and role='registered')
  then
    update public.profiles set onboarding_completed=false,onboarding_state='{}'::jsonb where id=new.user_id;
  end if;
  return new;
end;
$$;

create trigger subscriptions_prepare_academy_onboarding
before insert or update on public.subscriptions
for each row execute function public.prepare_paid_academy_onboarding_trigger();

create or replace function public.admin_set_academy_access_by_username(
  p_username text,
  p_active boolean default true,
  p_ends_at timestamptz default null,
  p_note text default null
)
returns public.academy_entitlements
language plpgsql
security definer set search_path = ''
as $$
declare
  target_id uuid;
  target_role public.user_role;
  result public.academy_entitlements;
  normalized text := lower(ltrim(btrim(coalesce(p_username,'')),'@'));
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select id,role into target_id,target_role from public.profiles where lower(username)=normalized;
  if target_id is null then raise exception 'Aucun membre ne correspond à ce pseudo'; end if;

  if p_active then
    if target_role='registered' then
      update public.profiles set onboarding_completed=false,onboarding_state='{}'::jsonb where id=target_id;
    end if;
    insert into public.academy_entitlements(user_id,status,source,granted_by,note,starts_at,ends_at)
    values(target_id,'active','manual',(select auth.uid()),nullif(btrim(p_note),''),now(),p_ends_at)
    on conflict(user_id) do update set status='active',source='manual',granted_by=(select auth.uid()),note=excluded.note,starts_at=now(),ends_at=excluded.ends_at,updated_at=now()
    returning * into result;
  else
    insert into public.academy_entitlements(user_id,status,source,granted_by,note,starts_at,ends_at)
    values(target_id,'revoked','manual',(select auth.uid()),nullif(btrim(p_note),''),now(),now())
    on conflict(user_id) do update set status='revoked',granted_by=(select auth.uid()),note=excluded.note,ends_at=now(),updated_at=now()
    returning * into result;
  end if;
  return result;
end;
$$;

revoke all on function public.admin_set_academy_access_by_username(text,boolean,timestamptz,text) from public,anon;
grant execute on function public.admin_set_academy_access_by_username(text,boolean,timestamptz,text) to authenticated;

create or replace function public.is_profile_username_available(candidate text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and lower(ltrim(btrim(coalesce(candidate,'')),'@')) ~ '^[[:alnum:]_.;-]{3,30}$'
    and not exists (
      select 1 from public.profiles
      where lower(username)=lower(ltrim(btrim(candidate),'@')) and id<>(select auth.uid())
    );
$$;

revoke all on function public.is_profile_username_available(text) from public,anon;
grant execute on function public.is_profile_username_available(text) to authenticated;

