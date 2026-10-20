-- One authorization-aware request replaces four independent shell requests.
create or replace function public.get_academy_shell_context()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); result jsonb;
begin
  if v_user is null or not public.has_active_academy_access(v_user) then
    raise exception 'Accès Académie requis' using errcode='42501';
  end if;
  select jsonb_build_object(
    'profile',jsonb_build_object(
      'first_name',p.first_name,'last_name',p.last_name,'full_name',p.full_name,'username',p.username,
      'avatar_url',p.avatar_url,'role',p.role,'theme_preference',p.theme_preference,'theme_updated_at',p.theme_updated_at
    ),
    'has_coaching',public.has_coaching_access(v_user),
    'is_staff',public.is_coaching_staff()
  ) into result from public.profiles p where p.id=v_user;
  return result;
end; $$;

revoke all on function public.get_academy_shell_context() from public,anon;
grant execute on function public.get_academy_shell_context() to authenticated;
