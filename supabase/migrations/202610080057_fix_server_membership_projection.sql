-- The role is a projection of the entitlement. Its trusted synchronizer must
-- not depend on the caller-facing authorization checks of the public accessor.
create or replace function public.sync_academy_membership(p_user_id uuid)
returns void
language plpgsql
security definer set search_path=''
as $$
declare
  v_profile_role public.user_role;
  v_has_access boolean;
begin
  select profile.role into v_profile_role
  from public.profiles profile
  where profile.id=p_user_id;

  if v_profile_role is null or v_profile_role in ('admin','coaching') then
    return;
  end if;

  select
    exists(
      select 1 from public.academy_entitlements entitlement
      where entitlement.user_id=p_user_id
        and entitlement.status='active'
        and entitlement.starts_at<=now()
        and (entitlement.ends_at is null or entitlement.ends_at>now())
    )
    or exists(
      select 1 from public.subscriptions subscription
      where subscription.user_id=p_user_id
        and subscription.status in ('active','trialing')
        and (subscription.current_period_end is null or subscription.current_period_end>now())
    )
  into v_has_access;

  perform set_config('stoa.billing_sync','on',true);
  update public.profiles
  set role=case when v_has_access then 'member'::public.user_role else 'registered'::public.user_role end
  where id=p_user_id;
end;
$$;

revoke all on function public.sync_academy_membership(uuid) from public,anon,authenticated;
grant execute on function public.sync_academy_membership(uuid) to service_role;
