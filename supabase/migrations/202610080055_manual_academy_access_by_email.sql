-- Allow administrators to grant or revoke complimentary Academy access by email.

create or replace function public.admin_set_academy_access_by_email(
  p_email text,
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
  normalized text := lower(btrim(coalesce(p_email,'')));
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Adresse e-mail invalide';
  end if;

  select users.id,profiles.role
    into target_id,target_role
  from auth.users users
  join public.profiles profiles on profiles.id=users.id
  where lower(users.email)=normalized
  limit 1;

  if target_id is null then
    raise exception 'Aucun compte ne correspond à cette adresse e-mail';
  end if;

  if p_active then
    if target_role='registered' then
      update public.profiles
      set onboarding_completed=false,onboarding_state='{}'::jsonb
      where id=target_id;
    end if;

    insert into public.academy_entitlements(user_id,status,source,granted_by,note,starts_at,ends_at)
    values(target_id,'active','gift',(select auth.uid()),nullif(btrim(p_note),''),now(),p_ends_at)
    on conflict(user_id) do update
      set status='active',source='gift',granted_by=(select auth.uid()),note=excluded.note,
          starts_at=now(),ends_at=excluded.ends_at,updated_at=now()
    returning * into result;
  else
    insert into public.academy_entitlements(user_id,status,source,granted_by,note,starts_at,ends_at)
    values(target_id,'revoked','gift',(select auth.uid()),nullif(btrim(p_note),''),now(),now())
    on conflict(user_id) do update
      set status='revoked',granted_by=(select auth.uid()),note=excluded.note,
          ends_at=now(),updated_at=now()
    returning * into result;
  end if;

  return result;
end;
$$;

revoke all on function public.admin_set_academy_access_by_email(text,boolean,timestamptz,text) from public,anon;
grant execute on function public.admin_set_academy_access_by_email(text,boolean,timestamptz,text) to authenticated;
