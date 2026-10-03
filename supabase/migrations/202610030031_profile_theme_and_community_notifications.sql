alter table public.profiles
  add column if not exists theme_preference text not null default 'light';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_theme_preference_check') then
    alter table public.profiles add constraint profiles_theme_preference_check check (theme_preference in ('light','dark'));
  end if;
end $$;

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  kind text not null check (kind in ('mention', 'reply', 'reply_mention')),
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint community_notifications_user_message_key unique (user_id, message_id)
);

alter table public.community_notifications enable row level security;
grant select, update (read_at) on public.community_notifications to authenticated;
drop policy if exists "users read own community notifications" on public.community_notifications;
create policy "users read own community notifications" on public.community_notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "users mark own community notifications read" on public.community_notifications;
create policy "users mark own community notifications read" on public.community_notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.create_community_notifications()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_reply_user uuid;
begin
  if new.deleted_at is not null then return new; end if;

  if new.reply_to_message_id is not null then
    select user_id into v_reply_user from public.messages where id = new.reply_to_message_id;
    if v_reply_user is not null and v_reply_user <> new.user_id then
      insert into public.community_notifications (user_id, actor_id, message_id, channel_id, kind, content, created_at)
      values (v_reply_user, new.user_id, new.id, new.channel_id, 'reply', new.content, new.created_at)
      on conflict (user_id, message_id) do update set kind = case when public.community_notifications.kind = 'mention' then 'reply_mention' else public.community_notifications.kind end;
    end if;
  end if;

  insert into public.community_notifications (user_id, actor_id, message_id, channel_id, kind, content, created_at)
  select profile.id, new.user_id, new.id, new.channel_id, 'mention', new.content, new.created_at
  from public.profiles as profile
  where profile.username is not null
    and exists (
      select 1 from regexp_split_to_table(new.content, E'\\s+') as token
      where left(token, 1) = '@'
        and lower(regexp_replace(token, '(^@|[.,!?;:]+$)', '', 'g')) = lower(profile.username)
    )
  on conflict (user_id, message_id) do update set kind = case when public.community_notifications.kind = 'reply' then 'reply_mention' else public.community_notifications.kind end;

  return new;
end;
$$;

drop trigger if exists messages_create_community_notifications on public.messages;
create trigger messages_create_community_notifications after insert on public.messages for each row execute function public.create_community_notifications();

create table if not exists public.community_post_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  comment_id uuid not null references public.community_post_comments(id) on delete cascade,
  kind text not null check (kind in ('post_reply','post_mention','post_reply_mention')),
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, comment_id)
);

create index if not exists community_post_notifications_unread_idx on public.community_post_notifications (user_id, created_at desc) where read_at is null;
create index if not exists community_post_notifications_post_idx on public.community_post_notifications (user_id, post_id, read_at);
alter table public.community_post_notifications enable row level security;
grant select, update (read_at) on public.community_post_notifications to authenticated;
drop policy if exists "users read own post notifications" on public.community_post_notifications;
create policy "users read own post notifications" on public.community_post_notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "users mark own post notifications read" on public.community_post_notifications;
create policy "users mark own post notifications read" on public.community_post_notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.create_community_post_notifications()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_post_author uuid;
begin
  select author_id into v_post_author from public.community_posts where id = new.post_id;
  if v_post_author is not null and v_post_author <> new.user_id then
    insert into public.community_post_notifications (user_id, actor_id, post_id, comment_id, kind, content, created_at)
    values (v_post_author, new.user_id, new.post_id, new.id, 'post_reply', new.content, new.created_at)
    on conflict (user_id, comment_id) do nothing;
  end if;

  insert into public.community_post_notifications (user_id, actor_id, post_id, comment_id, kind, content, created_at)
  select profile.id, new.user_id, new.post_id, new.id, 'post_mention', new.content, new.created_at
  from public.profiles as profile
  where profile.username is not null
    and exists (
      select 1 from regexp_split_to_table(new.content, E'\\s+') as token
      where left(token, 1) = '@'
        and lower(regexp_replace(token, '(^@|[.,!?;:]+$)', '', 'g')) = lower(profile.username)
    )
  on conflict (user_id, comment_id) do update set kind = case when public.community_post_notifications.kind = 'post_reply' then 'post_reply_mention' else public.community_post_notifications.kind end;

  return new;
end;
$$;

drop trigger if exists community_post_comments_create_notifications on public.community_post_comments;
create trigger community_post_comments_create_notifications after insert on public.community_post_comments for each row execute function public.create_community_post_notifications();

alter table public.community_notifications replica identity full;
alter table public.community_post_notifications replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_notifications') then
    alter publication supabase_realtime add table public.community_notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_post_notifications') then
    alter publication supabase_realtime add table public.community_post_notifications;
  end if;
end $$;
