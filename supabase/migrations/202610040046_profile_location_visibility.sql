alter table public.profiles
  add column if not exists onboarding_state jsonb not null default '{}'::jsonb,
  add column if not exists location_label text;

-- Accounts that existed before the guided welcome keep their current experience.
update public.profiles
set onboarding_completed=true,
    onboarding_state=jsonb_build_object('completed',true,'migrated',true)
where onboarding_completed=false;

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

drop trigger if exists subscriptions_prepare_academy_onboarding on public.subscriptions;
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

create or replace function public.get_profile_locations(profile_ids uuid[] default null)
returns table (id uuid,location_label text)
language sql
stable
security definer set search_path=''
as $$
  select profile.id,profile.location_label
  from public.profiles profile
  where (select auth.uid()) is not null
    and (profile_ids is null or profile.id=any(profile_ids));
$$;

revoke all on function public.get_profile_locations(uuid[]) from public,anon;
grant execute on function public.get_profile_locations(uuid[]) to authenticated;
