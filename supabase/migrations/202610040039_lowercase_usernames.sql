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
  normalized := lower(left(regexp_replace(coalesce(candidate, ''), '[^[:alnum:]_.;-]+', '_', 'g'), 30));
  normalized := nullif(btrim(normalized, '_.;-'), '');

  if normalized is null then
    normalized := 'membre_' || left(replace(profile_id::text, '-', ''), 6);
  elsif char_length(normalized) < 3 then
    normalized := normalized || '_' || left(replace(profile_id::text, '-', ''), 6);
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(username) = normalized
      and id <> profile_id
  ) then
    normalized := left(normalized, 23) || '_' || left(replace(profile_id::text, '-', ''), 6);
  end if;

  return normalized;
end;
$$;

revoke all on function public.available_profile_username(text, uuid) from public;

update public.profiles
set username = lower(username)
where username is not null
  and username <> lower(username);

alter table public.profiles
  drop constraint if exists profiles_username_lowercase;

alter table public.profiles
  add constraint profiles_username_lowercase
  check (username is null or username = lower(username));
