create or replace function public.get_admin_member_contact(target_user_id uuid)
returns table (
  email text,
  phone text,
  discord_username text,
  discord_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;

  return query
  select
    account.email::text,
    nullif(account.phone::text, ''),
    nullif(coalesce(
      discord.identity_data ->> 'global_name',
      discord.identity_data ->> 'username',
      discord.identity_data ->> 'user_name'
    ), ''),
    nullif(coalesce(discord.identity_data ->> 'sub', discord.provider_id), '')
  from auth.users account
  left join lateral (
    select identity.identity_data, identity.provider_id
    from auth.identities identity
    where identity.user_id = account.id and identity.provider = 'discord'
    order by identity.created_at desc
    limit 1
  ) discord on true
  where account.id = target_user_id;
end;
$$;

revoke all on function public.get_admin_member_contact(uuid) from public;
grant execute on function public.get_admin_member_contact(uuid) to authenticated;
