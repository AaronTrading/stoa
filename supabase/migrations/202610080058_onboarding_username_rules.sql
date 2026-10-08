-- Usernames beginning with the generated "membre" fallback are placeholders,
-- never a public identity chosen by a member.

create or replace function public.is_profile_username_available(candidate text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and lower(ltrim(btrim(coalesce(candidate,'')),'@')) ~ '^[[:alnum:]_.;-]{3,30}$'
    and lower(ltrim(btrim(coalesce(candidate,'')),'@')) !~ '^membre'
    and not exists (
      select 1 from public.profiles
      where lower(username)=lower(ltrim(btrim(candidate),'@')) and id<>(select auth.uid())
    );
$$;

revoke all on function public.is_profile_username_available(text) from public,anon;
grant execute on function public.is_profile_username_available(text) to authenticated;

create or replace function public.reject_reserved_profile_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is distinct from old.username
    and lower(coalesce(new.username,'')) ~ '^membre'
  then
    raise exception 'Le préfixe membre est réservé';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_reject_reserved_username on public.profiles;
create trigger profiles_reject_reserved_username
before update of username on public.profiles
for each row execute function public.reject_reserved_profile_username();
