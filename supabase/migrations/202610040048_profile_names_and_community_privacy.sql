alter table public.profiles
  add column if not exists hide_last_name_in_community boolean not null default false;

create or replace function public.get_email_center_members()
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  username text,
  role text,
  has_academy boolean,
  has_coaching boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  return query
  select
    u.id,
    u.email::text,
    coalesce(nullif(btrim(p.first_name),''),nullif(split_part(btrim(p.full_name),' ',1),''),'Membre'),
    coalesce(nullif(btrim(p.last_name),''),nullif(btrim(substr(btrim(p.full_name),length(split_part(btrim(p.full_name),' ',1))+1)),''),''),
    p.username,
    p.role::text,
    p.role::text in ('member','coaching','admin'),
    exists (
      select 1 from public.coaching_clients c
      where c.client_id = u.id and c.status in ('onboarding','active')
        and (c.ends_at is null or c.ends_at > now())
    )
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email is not null
  order by coalesce(nullif(btrim(p.first_name),''),nullif(split_part(btrim(p.full_name),' ',1),''),'Membre'),coalesce(p.last_name,'');
end;
$$;

create or replace function public.resolve_email_campaign_recipients(p_campaign_id uuid)
returns table (user_id uuid,email text,first_name text,last_name text)
language sql stable security definer set search_path = '' as $$
  select distinct
    u.id,
    u.email::text,
    coalesce(nullif(btrim(p.first_name),''),nullif(split_part(btrim(p.full_name),' ',1),''),'Membre'),
    coalesce(nullif(btrim(p.last_name),''),nullif(btrim(substr(btrim(p.full_name),length(split_part(btrim(p.full_name),' ',1))+1)),''),'')
  from public.email_campaigns campaign
  join auth.users u on u.email is not null
  join public.profiles p on p.id = u.id
  where campaign.id = p_campaign_id and (
    campaign.audience = 'all'
    or campaign.audience = 'academy' and p.role::text in ('member','coaching','admin')
    or campaign.audience = 'coaching' and exists (
      select 1 from public.coaching_clients c
      where c.client_id = u.id and c.status in ('onboarding','active')
        and (c.ends_at is null or c.ends_at > now())
    )
    or campaign.audience = 'custom' and u.id = any(campaign.custom_recipient_ids)
  );
$$;

drop function if exists public.get_community_profiles(uuid[]);
create function public.get_community_profiles(profile_ids uuid[] default null)
returns table (id uuid,display_name text,username text,avatar_url text,department text,bio text,role public.user_role,created_at timestamptz,completed_modules bigint,level_number integer,level_label text)
language sql stable security definer set search_path = '' as $$
  select
    profile.id,
    case
      when profile.hide_last_name_in_community then coalesce(nullif(btrim(profile.first_name),''),'Membre')
      else coalesce(
        nullif(btrim(concat_ws(' ',profile.first_name,profile.last_name)),''),
        nullif(btrim(profile.full_name),''),
        nullif(btrim(profile.first_name),''),
        'Membre'
      )
    end,
    profile.username,
    profile.avatar_url,
    profile.department,
    profile.bio,
    profile.role,
    profile.created_at,
    progress.completed_modules,
    least(5,floor(progress.completed_modules/5.0)::integer+1),
    (array['Initié','Disciple','Pratiquant','Bâtisseur','Pilier'])[least(5,floor(progress.completed_modules/5.0)::integer+1)]
  from public.profiles profile
  cross join lateral (
    select count(distinct up.module_id)::bigint completed_modules
    from public.user_progress up
    where up.user_id = profile.id and up.status = 'completed'
  ) progress
  where (select auth.uid()) is not null and (profile_ids is null or profile.id = any(profile_ids));
$$;

revoke all on function public.get_community_profiles(uuid[]) from public;
grant execute on function public.get_community_profiles(uuid[]) to authenticated;
