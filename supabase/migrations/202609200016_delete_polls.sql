create or replace function public.delete_poll(p_poll_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Seuls les administrateurs peuvent supprimer un sondage';
  end if;

  delete from public.polls where id = p_poll_id;
  if not found then
    raise exception 'Sondage introuvable';
  end if;
end;
$$;

revoke all on function public.delete_poll(uuid) from public;
grant execute on function public.delete_poll(uuid) to authenticated;
