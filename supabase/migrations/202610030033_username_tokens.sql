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
  normalized := left(regexp_replace(coalesce(candidate, ''), '[^[:alnum:]_.;-]+', '_', 'g'), 30);
  normalized := nullif(btrim(normalized, '_.;-'), '');

  if normalized is null then
    normalized := 'membre_' || left(replace(profile_id::text, '-', ''), 6);
  elsif char_length(normalized) < 3 then
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

update public.profiles
set username = public.available_profile_username(username, id)
where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_token_format;

alter table public.profiles
  add constraint profiles_username_token_format
  check (username is null or username ~ '^[[:alnum:]_.;-]{3,30}$');

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
        and lower(regexp_replace(ltrim(token, '@'), '[,!?:]+$', '', 'g')) = lower(profile.username)
    )
  on conflict (user_id, message_id) do update set kind = case when public.community_notifications.kind = 'reply' then 'reply_mention' else public.community_notifications.kind end;

  return new;
end;
$$;

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
        and lower(regexp_replace(ltrim(token, '@'), '[,!?:]+$', '', 'g')) = lower(profile.username)
    )
  on conflict (user_id, comment_id) do update set kind = case when public.community_post_notifications.kind = 'post_reply' then 'post_reply_mention' else public.community_post_notifications.kind end;

  return new;
end;
$$;
