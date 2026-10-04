-- Close the gaps left by the first Community, support and Coaching policies.

-- Client code may inspect only its own Academy entitlement. Server-side code keeps
-- the UUID variant for membership synchronization and trusted service operations.
create or replace function public.has_active_academy_access(p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path=''
as $$
  select p_user_id is not null
  and (
    p_user_id=(select auth.uid())
    or coalesce(current_setting('request.jwt.claim.role',true),'')='service_role'
    or public.is_admin()
  )
  and (
    exists(select 1 from public.profiles p where p.id=p_user_id and p.role in ('admin','coaching'))
    or exists(select 1 from public.academy_entitlements e where e.user_id=p_user_id and e.status='active' and e.starts_at<=now() and (e.ends_at is null or e.ends_at>now()))
    or exists(select 1 from public.subscriptions s where s.user_id=p_user_id and s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now()))
  );
$$;

revoke all on function public.has_active_academy_access(uuid) from public,anon;
grant execute on function public.has_active_academy_access(uuid) to authenticated,service_role;

-- Community tables are part of the paid Academy entitlement.
drop policy if exists "authenticated users read channels" on public.channels;
drop policy if exists "admins manage channels" on public.channels;
create policy "academy members read channels" on public.channels for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "admins manage channels" on public.channels for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "authenticated users read messages" on public.messages;
drop policy if exists "authenticated users create messages" on public.messages;
drop policy if exists "authors or admins update messages" on public.messages;
drop policy if exists "authors or admins delete messages" on public.messages;
create policy "academy members read messages" on public.messages for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members create messages" on public.messages for insert to authenticated
  with check ((select public.has_active_academy_access()) and user_id=(select auth.uid()));
create policy "academy authors or admins update messages" on public.messages for update to authenticated
  using ((select public.has_active_academy_access()) and (user_id=(select auth.uid()) or (select public.is_admin())))
  with check ((select public.has_active_academy_access()) and (user_id=(select auth.uid()) or (select public.is_admin())));
create policy "academy authors or admins delete messages" on public.messages for delete to authenticated
  using ((select public.has_active_academy_access()) and (user_id=(select auth.uid()) or (select public.is_admin())));

drop policy if exists "authenticated users read reactions" on public.message_reactions;
drop policy if exists "users create own reactions" on public.message_reactions;
drop policy if exists "users delete own reactions" on public.message_reactions;
create policy "academy members read reactions" on public.message_reactions for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members create own reactions" on public.message_reactions for insert to authenticated
  with check ((select public.has_active_academy_access()) and user_id=(select auth.uid()));
create policy "academy members delete own reactions" on public.message_reactions for delete to authenticated
  using ((select public.has_active_academy_access()) and user_id=(select auth.uid()));

drop policy if exists "authenticated users read polls" on public.polls;
drop policy if exists "authenticated users read poll options" on public.poll_options;
drop policy if exists "authenticated users read poll votes" on public.poll_votes;
drop policy if exists "users vote once on active polls" on public.poll_votes;
create policy "academy members read polls" on public.polls for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members read poll options" on public.poll_options for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members read poll votes" on public.poll_votes for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members vote once" on public.poll_votes for insert to authenticated
  with check (
    (select public.has_active_academy_access()) and user_id=(select auth.uid())
    and exists (
      select 1 from public.poll_options option
      where option.id=poll_votes.option_id and option.poll_id=poll_votes.poll_id
    )
  );

drop policy if exists "members read community posts" on public.community_posts;
drop policy if exists "members create topics or admins publish" on public.community_posts;
drop policy if exists "authors update topics or admins update posts" on public.community_posts;
drop policy if exists "authors delete topics or admins delete posts" on public.community_posts;
create policy "academy members read community posts" on public.community_posts for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members create topics or admins publish" on public.community_posts for insert to authenticated
  with check (
    (select public.has_active_academy_access()) and author_id=(select auth.uid())
    and (post_type='member_topic' or (select public.is_admin()))
    and (pinned_at is null or (select public.is_admin()))
    and (category<>'announcement' or (select public.is_admin()))
  );
create policy "academy authors update topics or admins update posts" on public.community_posts for update to authenticated
  using ((select public.has_active_academy_access()) and ((select public.is_admin()) or (author_id=(select auth.uid()) and post_type='member_topic')))
  with check ((select public.has_active_academy_access()) and ((select public.is_admin()) or (author_id=(select auth.uid()) and post_type='member_topic' and pinned_at is null and category<>'announcement')));
create policy "academy authors delete topics or admins delete posts" on public.community_posts for delete to authenticated
  using ((select public.has_active_academy_access()) and ((select public.is_admin()) or (author_id=(select auth.uid()) and post_type='member_topic')));

drop policy if exists "members read post comments" on public.community_post_comments;
drop policy if exists "members create own post comments" on public.community_post_comments;
drop policy if exists "authors or admins update post comments" on public.community_post_comments;
drop policy if exists "authors or admins delete post comments" on public.community_post_comments;
create policy "academy members read post comments" on public.community_post_comments for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members create own post comments" on public.community_post_comments for insert to authenticated
  with check ((select public.has_active_academy_access()) and user_id=(select auth.uid()));
create policy "academy authors or admins update post comments" on public.community_post_comments for update to authenticated
  using ((select public.has_active_academy_access()) and (user_id=(select auth.uid()) or (select public.is_admin())))
  with check ((select public.has_active_academy_access()) and (user_id=(select auth.uid()) or (select public.is_admin())));
create policy "academy authors or admins delete post comments" on public.community_post_comments for delete to authenticated
  using ((select public.has_active_academy_access()) and (user_id=(select auth.uid()) or (select public.is_admin())));

drop policy if exists "members read post reactions" on public.community_post_reactions;
drop policy if exists "members create own post reactions" on public.community_post_reactions;
drop policy if exists "members delete own post reactions" on public.community_post_reactions;
create policy "academy members read post reactions" on public.community_post_reactions for select to authenticated
  using ((select public.has_active_academy_access()));
create policy "academy members create own post reactions" on public.community_post_reactions for insert to authenticated
  with check ((select public.has_active_academy_access()) and user_id=(select auth.uid()));
create policy "academy members delete own post reactions" on public.community_post_reactions for delete to authenticated
  using ((select public.has_active_academy_access()) and user_id=(select auth.uid()));

drop policy if exists "users read own community notifications" on public.community_notifications;
drop policy if exists "users mark own community notifications read" on public.community_notifications;
create policy "academy members read own community notifications" on public.community_notifications for select to authenticated
  using ((select public.has_active_academy_access()) and user_id=(select auth.uid()));
create policy "academy members mark own community notifications read" on public.community_notifications for update to authenticated
  using ((select public.has_active_academy_access()) and user_id=(select auth.uid()))
  with check ((select public.has_active_academy_access()) and user_id=(select auth.uid()));

drop policy if exists "users read own post notifications" on public.community_post_notifications;
drop policy if exists "users mark own post notifications read" on public.community_post_notifications;
create policy "academy members read own post notifications" on public.community_post_notifications for select to authenticated
  using ((select public.has_active_academy_access()) and user_id=(select auth.uid()));
create policy "academy members mark own post notifications read" on public.community_post_notifications for update to authenticated
  using ((select public.has_active_academy_access()) and user_id=(select auth.uid()))
  with check ((select public.has_active_academy_access()) and user_id=(select auth.uid()));

-- Security-definer profile directory functions must enforce the entitlement too.
create or replace function public.get_profile_locations(profile_ids uuid[] default null)
returns table (id uuid,location_label text)
language sql stable security definer set search_path=''
as $$
  select profile.id,profile.location_label
  from public.profiles profile
  where public.has_active_academy_access()
    and (profile_ids is null or profile.id=any(profile_ids));
$$;

drop function if exists public.get_community_profiles(uuid[]);
create function public.get_community_profiles(profile_ids uuid[] default null)
returns table (id uuid,display_name text,username text,avatar_url text,department text,bio text,role public.user_role,created_at timestamptz,completed_modules bigint,level_number integer,level_label text)
language sql stable security definer set search_path=''
as $$
  select profile.id,
    case when profile.hide_last_name_in_community then coalesce(nullif(btrim(profile.first_name),''),'Membre')
      else coalesce(nullif(btrim(concat_ws(' ',profile.first_name,profile.last_name)),''),nullif(btrim(profile.full_name),''),nullif(btrim(profile.first_name),''),'Membre') end,
    profile.username,profile.avatar_url,profile.department,profile.bio,profile.role,profile.created_at,
    progress.completed_modules,least(5,floor(progress.completed_modules/5.0)::integer+1),
    (array['Initié','Disciple','Pratiquant','Bâtisseur','Pilier'])[least(5,floor(progress.completed_modules/5.0)::integer+1)]
  from public.profiles profile
  cross join lateral (
    select count(distinct up.module_id)::bigint completed_modules from public.user_progress up
    where up.user_id=profile.id and up.status='completed'
  ) progress
  where public.has_active_academy_access()
    and (profile_ids is null or profile.id=any(profile_ids));
$$;
revoke all on function public.get_community_profiles(uuid[]) from public,anon;
grant execute on function public.get_community_profiles(uuid[]) to authenticated;

create or replace function public.soft_delete_message(p_message_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_message public.messages%rowtype;
begin
  if not public.has_active_academy_access() then raise exception 'Academy access required'; end if;
  select * into v_message from public.messages where id=p_message_id for update;
  if v_message.id is null then raise exception 'Message introuvable'; end if;
  if v_message.user_id<>(select auth.uid()) and not public.is_admin() then raise exception 'Vous ne pouvez pas supprimer ce message'; end if;
  if v_message.deleted_at is not null then return; end if;
  insert into public.message_deletion_audit(message_id,original_content,deleted_by)
  values(v_message.id,v_message.content,(select auth.uid())) on conflict(message_id) do nothing;
  update public.messages set content='Message supprimé',deleted_at=now(),deleted_by=(select auth.uid()) where id=p_message_id;
end; $$;

create or replace function public.get_channel_messages(p_channel_id uuid,p_before timestamptz default null,p_limit integer default 50)
returns table (
  id uuid,channel_id uuid,user_id uuid,parent_message_id uuid,reply_to_message_id uuid,shared_message_id uuid,
  content text,created_at timestamptz,edited_at timestamptz,deleted_at timestamptz,announcement_expires_at timestamptz,
  pinned_at timestamptz,message_reactions jsonb,shared_message jsonb,replied_message jsonb
)
language sql stable security definer set search_path='' as $$
  select message.id,message.channel_id,message.user_id,message.parent_message_id,message.reply_to_message_id,message.shared_message_id,
    case when message.deleted_at is null then message.content when public.is_admin() then coalesce(audit.original_content,message.content) else 'Message supprimé' end,
    message.created_at,message.edited_at,message.deleted_at,message.announcement_expires_at,message.pinned_at,
    coalesce(reactions.items,'[]'::jsonb),
    case when shared.id is null then null else jsonb_build_object('id',shared.id,'user_id',shared.user_id,'channel_id',shared.channel_id,'channel_name',shared_channel.name,'channel_slug',shared_channel.slug,'content',case when shared.deleted_at is null then shared.content when public.is_admin() then coalesce(shared_audit.original_content,shared.content) else 'Message supprimé' end,'created_at',shared.created_at,'deleted_at',shared.deleted_at) end,
    case when replied.id is null then null else jsonb_build_object('id',replied.id,'user_id',replied.user_id,'content',case when replied.deleted_at is null then replied.content else 'Message supprimé' end,'deleted_at',replied.deleted_at) end
  from public.messages message
  left join public.message_deletion_audit audit on audit.message_id=message.id
  left join public.messages shared on shared.id=message.shared_message_id
  left join public.channels shared_channel on shared_channel.id=shared.channel_id
  left join public.message_deletion_audit shared_audit on shared_audit.message_id=shared.id
  left join public.messages replied on replied.id=message.reply_to_message_id
  left join lateral(select jsonb_agg(jsonb_build_object('id',r.id,'message_id',r.message_id,'user_id',r.user_id,'emoji',r.emoji) order by r.id) items from public.message_reactions r where r.message_id=message.id) reactions on true
  where public.has_active_academy_access() and message.channel_id=p_channel_id and (p_before is null or message.created_at<p_before)
  order by message.created_at desc limit least(greatest(p_limit,1),100);
$$;

-- The support channel is reserved for Academy members and staff. Message identity
-- and content become immutable after insertion; only read_at may change.
drop policy if exists "members and admins read support conversations" on public.support_messages;
drop policy if exists "members and admins send support messages" on public.support_messages;
drop policy if exists "members and admins mark support messages read" on public.support_messages;
create policy "academy members and admins read support conversations" on public.support_messages for select to authenticated
  using ((select public.has_active_academy_access()) and (member_id=(select auth.uid()) or (select public.is_admin())));
create policy "academy members and admins send support messages" on public.support_messages for insert to authenticated
  with check ((select public.has_active_academy_access()) and sender_id=(select auth.uid()) and (member_id=(select auth.uid()) or (select public.is_admin())));
create policy "academy members and admins mark support messages read" on public.support_messages for update to authenticated
  using ((select public.has_active_academy_access()) and (member_id=(select auth.uid()) or (select public.is_admin())))
  with check ((select public.has_active_academy_access()) and (member_id=(select auth.uid()) or (select public.is_admin())));

create or replace function public.protect_support_message_update()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.id is distinct from old.id or new.member_id is distinct from old.member_id
    or new.sender_id is distinct from old.sender_id or new.content is distinct from old.content
    or new.created_at is distinct from old.created_at then
    raise exception 'Only the read state of a support message can be changed';
  end if;
  return new;
end; $$;
drop trigger if exists support_messages_protect_update on public.support_messages;
create trigger support_messages_protect_update before update on public.support_messages
  for each row execute function public.protect_support_message_update();

-- Clients can submit their own answers, but cannot impersonate a coach or alter
-- review fields, periods and ownership.
create or replace function public.protect_coaching_questionnaire_client_update()
returns trigger language plpgsql set search_path='' as $$
begin
  if public.can_coach_client(coalesce(new.client_id,old.client_id)) then return new; end if;
  if tg_op='INSERT' then
    if new.client_id is distinct from (select auth.uid()) or new.status not in ('draft','submitted')
      or new.reviewed_at is not null or new.total_steps<>12 then
      raise exception 'Questionnaire fields reserved for coaching staff';
    end if;
  elsif new.id is distinct from old.id or new.client_id is distinct from old.client_id
    or new.kind is distinct from old.kind or new.version is distinct from old.version
    or new.total_steps is distinct from old.total_steps or new.reviewed_at is distinct from old.reviewed_at
    or new.created_at is distinct from old.created_at or new.status='reviewed'
    or (old.status='submitted' and new.status is distinct from old.status) then
    raise exception 'Questionnaire fields reserved for coaching staff';
  end if;
  return new;
end; $$;
drop trigger if exists coaching_questionnaires_protect_client on public.coaching_questionnaires;
create trigger coaching_questionnaires_protect_client before insert or update on public.coaching_questionnaires
  for each row execute function public.protect_coaching_questionnaire_client_update();

create or replace function public.protect_coaching_checkin_client_update()
returns trigger language plpgsql set search_path='' as $$
begin
  if public.can_coach_client(coalesce(new.client_id,old.client_id)) then return new; end if;
  if tg_op='INSERT' then
    if new.client_id is distinct from (select auth.uid()) or new.status not in ('draft','submitted')
      or new.coach_feedback<>'' or new.reviewed_at is not null or new.due_at is not null
      or new.period_start is distinct from date_trunc('week',now() at time zone 'Europe/Paris')::date
      or new.period_end is distinct from (date_trunc('week',now() at time zone 'Europe/Paris')::date+6) then
      raise exception 'Check-in fields reserved for coaching staff';
    end if;
  elsif new.id is distinct from old.id or new.client_id is distinct from old.client_id
    or new.period_start is distinct from old.period_start or new.period_end is distinct from old.period_end
    or new.coach_feedback is distinct from old.coach_feedback or new.reviewed_at is distinct from old.reviewed_at
    or new.due_at is distinct from old.due_at or new.created_at is distinct from old.created_at
    or new.status not in ('draft','submitted')
    or (old.status in ('reviewed','late') and new.status is distinct from old.status) then
    raise exception 'Check-in fields reserved for coaching staff';
  end if;
  return new;
end; $$;
drop trigger if exists coaching_checkins_protect_client on public.coaching_checkins;
create trigger coaching_checkins_protect_client before insert or update on public.coaching_checkins
  for each row execute function public.protect_coaching_checkin_client_update();

create or replace function public.submit_my_coaching_checkin(
  p_energy integer,p_sleep integer,p_nutrition integer,p_activity integer,
  p_main_win text,p_main_difficulty text,p_next_focus text,p_help_needed text
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=(select auth.uid());
  v_start date:=date_trunc('week',now() at time zone 'Europe/Paris')::date;
  v_id uuid;
begin
  if not public.has_coaching_access(v_user) then raise exception 'Coaching access required'; end if;
  if p_energy not between 1 and 10 or p_sleep not between 1 and 10
    or p_nutrition not between 1 and 10 or p_activity not between 1 and 10 then
    raise exception 'Scores must be between 1 and 10';
  end if;
  insert into public.coaching_checkins(client_id,period_start,period_end,status,energy,sleep,nutrition,activity,main_win,main_difficulty,next_focus,help_needed,submitted_at)
  values(v_user,v_start,v_start+6,'submitted',p_energy,p_sleep,p_nutrition,p_activity,btrim(coalesce(p_main_win,'')),btrim(coalesce(p_main_difficulty,'')),btrim(coalesce(p_next_focus,'')),btrim(coalesce(p_help_needed,'')),now())
  on conflict(client_id,period_start) do update set
    status='submitted',energy=excluded.energy,sleep=excluded.sleep,nutrition=excluded.nutrition,activity=excluded.activity,
    main_win=excluded.main_win,main_difficulty=excluded.main_difficulty,next_focus=excluded.next_focus,
    help_needed=excluded.help_needed,submitted_at=now(),updated_at=now()
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.submit_my_coaching_checkin(integer,integer,integer,integer,text,text,text,text) from public,anon;
grant execute on function public.submit_my_coaching_checkin(integer,integer,integer,integer,text,text,text,text) to authenticated;

alter table public.coaching_checkins drop constraint if exists coaching_checkins_period_check;
alter table public.coaching_checkins add constraint coaching_checkins_period_check check(period_end>=period_start);

-- Repair any historical mismatch before enforcing tenant integrity on habit logs.
update public.coaching_habit_logs log set client_id=habit.client_id
from public.coaching_habits habit where habit.id=log.habit_id and log.client_id<>habit.client_id;
alter table public.coaching_habits add constraint coaching_habits_id_client_key unique(id,client_id);
do $$ declare constraint_name text; begin
  select conname into constraint_name from pg_constraint
  where conrelid='public.coaching_habit_logs'::regclass and contype='f'
    and confrelid='public.coaching_habits'::regclass limit 1;
  if constraint_name is not null then execute format('alter table public.coaching_habit_logs drop constraint %I',constraint_name); end if;
end $$;
alter table public.coaching_habit_logs add constraint coaching_habit_logs_habit_client_fkey
  foreign key(habit_id,client_id) references public.coaching_habits(id,client_id) on delete cascade;

create index if not exists coaching_plans_client_status_idx on public.coaching_plans(client_id,status,created_at desc);
create index if not exists coaching_goals_client_status_idx on public.coaching_goals(client_id,status,created_at desc);
create index if not exists coaching_habits_client_active_idx on public.coaching_habits(client_id,active,created_at desc);
create index if not exists coaching_habit_logs_client_date_idx on public.coaching_habit_logs(client_id,completed_on desc);
create index if not exists coaching_assignments_client_status_idx on public.coaching_assignments(client_id,status,created_at desc);
create index if not exists coaching_reviews_client_created_idx on public.coaching_reviews(client_id,created_at desc);
create index if not exists coaching_appointments_client_starts_idx on public.coaching_appointments(client_id,starts_at);
create index if not exists coaching_notes_client_created_idx on public.coaching_notes(client_id,created_at desc);
create index if not exists coaching_questionnaires_client_status_idx on public.coaching_questionnaires(client_id,status,created_at desc);

-- Profile ownership never includes database identity, creation time or billing keys.
create or replace function public.protect_profile_system_fields()
returns trigger language plpgsql set search_path='' as $$
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')='service_role' or public.is_admin() then return new; end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at
    or new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception 'Profile system fields are immutable';
  end if;
  return new;
end; $$;
drop trigger if exists profiles_protect_system_fields on public.profiles;
create trigger profiles_protect_system_fields before update on public.profiles
  for each row execute function public.protect_profile_system_fields();

create or replace function public.ensure_my_profile()
returns public.profiles language plpgsql security definer set search_path='' as $$
declare v_user auth.users%rowtype; v_profile public.profiles%rowtype;
begin
  select * into v_user from auth.users where id=(select auth.uid());
  if v_user.id is null then raise exception 'Authentication required'; end if;
  insert into public.profiles(id,full_name,first_name,last_name,avatar_url)
  values(
    v_user.id,
    nullif(btrim(coalesce(v_user.raw_user_meta_data->>'full_name',v_user.raw_user_meta_data->>'name','')),''),
    nullif(btrim(coalesce(v_user.raw_user_meta_data->>'first_name','')),''),
    nullif(btrim(coalesce(v_user.raw_user_meta_data->>'last_name','')),''),
    nullif(btrim(coalesce(v_user.raw_user_meta_data->>'avatar_url',v_user.raw_user_meta_data->>'picture','')),'')
  ) on conflict(id) do nothing;
  select * into v_profile from public.profiles where id=v_user.id;
  return v_profile;
end; $$;
revoke all on function public.ensure_my_profile() from public,anon;
grant execute on function public.ensure_my_profile() to authenticated;

-- Community post uploads move to a dedicated, bounded bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-assets','community-assets',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "members upload own community post images" on storage.objects;
create policy "academy members upload own community images" on storage.objects for insert to authenticated
  with check (bucket_id='community-assets' and (select public.has_active_academy_access())
    and (storage.foldername(name))[1]=(select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
create policy "academy members update own community images" on storage.objects for update to authenticated
  using (bucket_id='community-assets' and owner_id=(select auth.uid())::text and (select public.has_active_academy_access()))
  with check (bucket_id='community-assets' and owner_id=(select auth.uid())::text and (select public.has_active_academy_access()));
create policy "academy members delete own community images" on storage.objects for delete to authenticated
  using (bucket_id='community-assets' and owner_id=(select auth.uid())::text and (select public.has_active_academy_access()));
