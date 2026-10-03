create or replace function public.admin_set_coaching_client(p_client_id uuid,p_coach_id uuid,p_status text default 'onboarding',p_access_source text default 'manual',p_stripe_subscription_id text default null)
returns public.coaching_clients language plpgsql security definer set search_path='' as $$
declare result public.coaching_clients;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('onboarding','active','paused','completed','cancelled') then raise exception 'Invalid status'; end if;
  if p_coach_id is not null then insert into public.coaching_staff(user_id,active) values(p_coach_id,true) on conflict(user_id) do update set active=true; end if;
  insert into public.coaching_clients(client_id,coach_id,status,access_source,stripe_subscription_id)
  values(p_client_id,p_coach_id,p_status,p_access_source,p_stripe_subscription_id)
  on conflict(client_id) do update set coach_id=excluded.coach_id,status=excluded.status,access_source=excluded.access_source,stripe_subscription_id=coalesce(excluded.stripe_subscription_id,public.coaching_clients.stripe_subscription_id),updated_at=now()
  returning * into result; return result;
end $$;
