drop function if exists public.get_community_profiles(uuid[]);
create function public.get_community_profiles(profile_ids uuid[] default null)
returns table (id uuid,display_name text,username text,avatar_url text,department text,bio text,role public.user_role,created_at timestamptz,completed_modules bigint,level_number integer,level_label text)
language sql stable security definer set search_path='' as $$
  select profile.id,
    coalesce(nullif(btrim(profile.username),''),nullif(btrim(profile.first_name),''),'Membre'),
    profile.username,profile.avatar_url,profile.department,profile.bio,profile.role,profile.created_at,
    progress.completed_modules,
    least(5,floor(progress.completed_modules/5.0)::integer+1),
    (array['Initié','Disciple','Pratiquant','Bâtisseur','Pilier'])[least(5,floor(progress.completed_modules/5.0)::integer+1)]
  from public.profiles profile
  cross join lateral (select count(distinct up.module_id)::bigint completed_modules from public.user_progress up where up.user_id=profile.id and up.status='completed') progress
  where (select auth.uid()) is not null and (profile_ids is null or profile.id=any(profile_ids));
$$;
revoke all on function public.get_community_profiles(uuid[]) from public;
grant execute on function public.get_community_profiles(uuid[]) to authenticated;
