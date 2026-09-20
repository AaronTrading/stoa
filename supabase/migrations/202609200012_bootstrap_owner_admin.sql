alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set role = 'admin'
where id in (
  select id
  from auth.users
  where lower(email) = 'aaronzerubia@gmail.com'
);

alter table public.profiles enable trigger profiles_protect_role;

