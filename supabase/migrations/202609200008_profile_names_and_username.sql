alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists username text;

update public.profiles
set
  first_name = coalesce(
    first_name,
    nullif(split_part(btrim(full_name), ' ', 1), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(
      btrim(substr(
        btrim(full_name),
        length(split_part(btrim(full_name), ' ', 1)) + 1
      )),
      ''
    )
  )
where full_name is not null;

alter table public.profiles
  drop constraint if exists profiles_first_name_length,
  drop constraint if exists profiles_last_name_length,
  drop constraint if exists profiles_username_length;

alter table public.profiles
  add constraint profiles_first_name_length check (first_name is null or char_length(first_name) between 1 and 60),
  add constraint profiles_last_name_length check (last_name is null or char_length(last_name) between 1 and 80),
  add constraint profiles_username_length check (username is null or char_length(username) between 3 and 30);

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_full_name text;
  v_first_name text;
begin
  v_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  );
  v_first_name := coalesce(
    new.raw_user_meta_data ->> 'first_name',
    nullif(split_part(btrim(v_full_name), ' ', 1), '')
  );

  insert into public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    username,
    avatar_url
  )
  values (
    new.id,
    v_full_name,
    v_first_name,
    coalesce(
      new.raw_user_meta_data ->> 'last_name',
      nullif(
        btrim(substr(btrim(v_full_name), length(coalesce(v_first_name, '')) + 1)),
        ''
      )
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;
