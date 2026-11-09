-- Separate authentication state from Academy entitlement and restore every
-- legitimate access source (manual grant, Stripe subscription or Coaching).

create or replace function public.has_active_academy_access(p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path=''
as $$
  select p_user_id is not null
  and (
    p_user_id=(select auth.uid())
    or coalesce(current_setting('request.jwt.claim.role',true),'')='service_role'
    or public.is_admin()
  )
  and (
    exists(select 1 from public.profiles p where p.id=p_user_id and p.role in ('admin','coaching'))
    or exists(
      select 1 from public.academy_entitlements e
      where e.user_id=p_user_id and e.status='active' and e.starts_at<=now()
        and (e.ends_at is null or e.ends_at>now())
    )
    or exists(
      select 1 from public.subscriptions s
      where s.user_id=p_user_id and s.status in ('active','trialing')
        and (s.current_period_end is null or s.current_period_end>now())
    )
    or exists(
      select 1 from public.coaching_clients c
      where c.client_id=p_user_id and c.status in ('onboarding','active')
        and (c.ends_at is null or c.ends_at>now())
    )
  );
$$;

revoke all on function public.has_active_academy_access(uuid) from public,anon;
grant execute on function public.has_active_academy_access(uuid) to authenticated,service_role;

-- The role remains a projection only; it is never used as the source of truth.
create or replace function public.sync_academy_membership(p_user_id uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_profile_role public.user_role;
  v_has_access boolean;
begin
  select profile.role into v_profile_role from public.profiles profile where profile.id=p_user_id;
  if v_profile_role is null or v_profile_role in ('admin','coaching') then return; end if;

  select
    exists(select 1 from public.academy_entitlements e where e.user_id=p_user_id and e.status='active' and e.starts_at<=now() and (e.ends_at is null or e.ends_at>now()))
    or exists(select 1 from public.subscriptions s where s.user_id=p_user_id and s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now()))
    or exists(select 1 from public.coaching_clients c where c.client_id=p_user_id and c.status in ('onboarding','active') and (c.ends_at is null or c.ends_at>now()))
  into v_has_access;

  perform set_config('stoa.billing_sync','on',true);
  update public.profiles
  set role=case when v_has_access then 'member'::public.user_role else 'registered'::public.user_role end
  where id=p_user_id;
end;
$$;

revoke all on function public.sync_academy_membership(uuid) from public,anon,authenticated;
grant execute on function public.sync_academy_membership(uuid) to service_role;

-- Return a stable state for every authenticated account. A missing entitlement
-- is expected data, not an exception or a payment error.
create or replace function public.get_academy_shell_context()
returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
  v_user uuid:=(select auth.uid());
  v_access boolean;
  result jsonb;
begin
  if v_user is null then
    raise exception 'Authentification requise' using errcode='42501';
  end if;

  v_access:=public.has_active_academy_access(v_user);
  select jsonb_build_object(
    'has_academy_access',v_access,
    'profile',jsonb_build_object(
      'first_name',p.first_name,'last_name',p.last_name,'full_name',p.full_name,'username',p.username,
      'avatar_url',p.avatar_url,'role',p.role,'theme_preference',p.theme_preference,'theme_updated_at',p.theme_updated_at
    ),
    'has_coaching',case when v_access then public.has_coaching_access(v_user) else false end,
    'is_staff',public.is_coaching_staff()
  ) into result from public.profiles p where p.id=v_user;

  return coalesce(result,jsonb_build_object(
    'has_academy_access',false,'profile','{}'::jsonb,'has_coaching',false,'is_staff',false
  ));
end;
$$;

revoke all on function public.get_academy_shell_context() from public,anon;
grant execute on function public.get_academy_shell_context() to authenticated;

-- Preserve any legitimate legacy member if this migration is applied to an
-- environment where the role projection predates the entitlement table.
insert into public.academy_entitlements(user_id,status,source,note,starts_at)
select p.id,'active','legacy','Migration automatique de l’accès membre existant',now()
from public.profiles p
where p.role='member'
  and not exists(select 1 from public.academy_entitlements e where e.user_id=p.id)
  and not exists(select 1 from public.subscriptions s where s.user_id=p.id and s.status in ('active','trialing'))
  and not exists(select 1 from public.coaching_clients c where c.client_id=p.id and c.status in ('onboarding','active'))
on conflict(user_id) do nothing;

do $$
declare profile_row record;
begin
  for profile_row in select id from public.profiles loop
    perform public.sync_academy_membership(profile_row.id);
  end loop;
end;
$$;
