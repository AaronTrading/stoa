alter table public.channels
  add column if not exists slug text;

update public.channels
set slug = case lower(name)
  when 'général' then 'general'
  when 'alimentation' then 'alimentation'
  when 'sport' then 'sport'
  when 'entraide' then 'entraide'
  else lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
end
where slug is null;

alter table public.channels
  alter column slug set not null,
  add constraint channels_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create unique index if not exists channels_slug_key on public.channels (slug);

create or replace function public.available_profile_username(
  candidate text,
  profile_id uuid
)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  normalized text;
begin
  normalized := nullif(left(btrim(candidate), 30), '');
  if normalized is null then
    return null;
  end if;

  if char_length(normalized) < 3 then
    normalized := normalized || '_' || left(replace(profile_id::text, '-', ''), 6);
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(username) = lower(normalized)
      and id <> profile_id
  ) then
    normalized := left(normalized, 23) || '_' || left(replace(profile_id::text, '-', ''), 6);
  end if;

  return normalized;
end;
$$;

revoke all on function public.available_profile_username(text, uuid) from public;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_full_name text;
  v_first_name text;
  v_username text;
begin
  v_full_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'global_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'user_name'), '')
  );
  v_first_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(split_part(btrim(v_full_name), ' ', 1), '')
  );
  v_username := public.available_profile_username(
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'username'
    ),
    new.id
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
      nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
      nullif(btrim(substr(btrim(v_full_name), length(coalesce(v_first_name, '')) + 1)), '')
    ),
    v_username,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'picture'), '')
    )
  );
  return new;
end;
$$;

create or replace function public.sync_discord_identity_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_name text;
  v_first_name text;
  v_username text;
  v_avatar text;
begin
  v_name := coalesce(
    nullif(btrim(new.identity_data ->> 'full_name'), ''),
    nullif(btrim(new.identity_data ->> 'name'), ''),
    nullif(btrim(new.identity_data ->> 'global_name'), ''),
    nullif(btrim(new.identity_data ->> 'user_name'), '')
  );
  v_first_name := nullif(split_part(btrim(v_name), ' ', 1), '');
  v_username := public.available_profile_username(
    coalesce(
      new.identity_data ->> 'user_name',
      new.identity_data ->> 'preferred_username',
      new.identity_data ->> 'username'
    ),
    new.user_id
  );
  v_avatar := coalesce(
    nullif(btrim(new.identity_data ->> 'avatar_url'), ''),
    nullif(btrim(new.identity_data ->> 'picture'), '')
  );

  update public.profiles
  set
    full_name = coalesce(v_name, full_name),
    first_name = coalesce(v_first_name, first_name),
    last_name = coalesce(
      nullif(btrim(substr(btrim(v_name), length(coalesce(v_first_name, '')) + 1)), ''),
      last_name
    ),
    username = coalesce(v_username, username),
    avatar_url = coalesce(v_avatar, avatar_url)
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists sync_discord_identity_profile on auth.identities;
create trigger sync_discord_identity_profile
  after insert or update of identity_data on auth.identities
  for each row
  when (new.provider = 'discord')
  execute function public.sync_discord_identity_profile();

