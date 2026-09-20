alter table public.profiles
  add column if not exists department text;

alter table public.profiles
  drop constraint if exists profiles_department_format,
  add constraint profiles_department_format check (
    department is null
    or department ~ '^(0[1-9]|[1-8][0-9]|9[0-5]|2A|2B|97[1-6]|98[4-8])$'
  );

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
    id, full_name, first_name, last_name, username, avatar_url, department
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
    ),
    nullif(upper(btrim(new.raw_user_meta_data ->> 'department')), '')
  );
  return new;
end;
$$;

drop function if exists public.get_community_profiles(uuid[]);
create function public.get_community_profiles(profile_ids uuid[] default null)
returns table (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  department text,
  role public.user_role,
  created_at timestamptz,
  completed_modules bigint,
  level_number integer,
  level_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    coalesce(
      nullif(btrim(profile.username), ''),
      nullif(btrim(profile.first_name), ''),
      'Membre'
    ) as display_name,
    profile.username,
    profile.avatar_url,
    profile.department,
    profile.role,
    profile.created_at,
    progress.completed_modules,
    least(5, floor(progress.completed_modules / 5.0)::integer + 1) as level_number,
    (array['Initié', 'Disciple', 'Pratiquant', 'Bâtisseur', 'Pilier'])[
      least(5, floor(progress.completed_modules / 5.0)::integer + 1)
    ] as level_label
  from public.profiles as profile
  cross join lateral (
    select count(distinct user_progress.module_id)::bigint as completed_modules
    from public.user_progress
    where user_progress.user_id = profile.id
      and user_progress.status = 'completed'
  ) as progress
  where (select auth.uid()) is not null
    and (profile_ids is null or profile.id = any(profile_ids));
$$;

revoke all on function public.get_community_profiles(uuid[]) from public;
grant execute on function public.get_community_profiles(uuid[]) to authenticated;

