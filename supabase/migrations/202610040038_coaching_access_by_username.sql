create or replace function public.admin_set_coaching_client_by_username(
  p_client_username text,
  p_coach_username text default null,
  p_status text default 'onboarding',
  p_access_source text default 'manual',
  p_stripe_subscription_id text default null
)
returns public.coaching_clients
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_username text := ltrim(btrim(coalesce(p_client_username, '')), '@');
  v_coach_username text := nullif(ltrim(btrim(coalesce(p_coach_username, '')), '@'), '');
  v_client_id uuid;
  v_coach_id uuid;
  result public.coaching_clients;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;
  if p_status not in ('onboarding','active','paused','completed','cancelled') then
    raise exception 'État de Coaching invalide';
  end if;

  select id into v_client_id
  from public.profiles
  where lower(username) = lower(v_client_username);
  if v_client_id is null then
    raise exception 'Pseudo membre introuvable';
  end if;

  if v_coach_username is null then
    v_coach_id := (select auth.uid());
  else
    select id into v_coach_id
    from public.profiles
    where lower(username) = lower(v_coach_username);
    if v_coach_id is null then
      raise exception 'Pseudo coach introuvable';
    end if;
  end if;

  insert into public.coaching_staff(user_id, active)
  values(v_coach_id, true)
  on conflict(user_id) do update set active = true;

  insert into public.coaching_clients(client_id, coach_id, status, access_source, stripe_subscription_id)
  values(v_client_id, v_coach_id, p_status, p_access_source, p_stripe_subscription_id)
  on conflict(client_id) do update set
    coach_id = excluded.coach_id,
    status = excluded.status,
    access_source = excluded.access_source,
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.coaching_clients.stripe_subscription_id),
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.admin_set_coaching_client_by_username(text,text,text,text,text) from public;
grant execute on function public.admin_set_coaching_client_by_username(text,text,text,text,text) to authenticated;
