-- Avoid PostgreSQL's CURRENT_ROLE keyword and repair privileged roles affected by the first sync.

create or replace function public.sync_academy_membership(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_profile_role public.user_role;
begin
  select p.role into v_profile_role from public.profiles p where p.id=p_user_id;
  if v_profile_role is null or v_profile_role in ('admin','coaching') then return; end if;
  perform set_config('stoa.billing_sync','on',true);
  update public.profiles
  set role=case when public.has_active_academy_access(p_user_id) then 'member'::public.user_role else 'registered'::public.user_role end
  where id=p_user_id;
end;
$$;

-- These are the two administrators identified during the pre-migration audit.
do $$
begin
  perform set_config('stoa.billing_sync','on',true);
  update public.profiles p
  set role='admin'::public.user_role
  from auth.users u
  where p.id=u.id
    and lower(u.email) in ('aaronzerubia@gmail.com','merciermekki@gmail.com');
end;
$$;

-- Reconcile every ordinary profile without changing privileged roles or deleting user data.
do $$
declare
  profile_row record;
begin
  for profile_row in select id from public.profiles loop
    perform public.sync_academy_membership(profile_row.id);
  end loop;
end;
$$;
