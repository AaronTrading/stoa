create or replace function public.admin_revoke_coaching_access(p_client_id uuid)
returns public.coaching_clients
language plpgsql
security definer set search_path = ''
as $$
declare
  result public.coaching_clients;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.coaching_clients
  set status = 'cancelled',
      updated_at = now()
  where client_id = p_client_id
  returning * into result;

  if result.id is null then
    raise exception 'Client Coaching introuvable';
  end if;

  return result;
end;
$$;

revoke all on function public.admin_revoke_coaching_access(uuid) from public, anon;
grant execute on function public.admin_revoke_coaching_access(uuid) to authenticated;
