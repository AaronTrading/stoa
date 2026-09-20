alter table public.messages
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists shared_message_id uuid references public.messages(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_share_not_self'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_share_not_self check (shared_message_id is null or shared_message_id <> id);
  end if;
end;
$$;

create index if not exists messages_shared_message_id_idx on public.messages (shared_message_id);
create index if not exists messages_user_created_at_idx on public.messages (user_id, created_at desc);

grant insert (shared_message_id) on public.messages to authenticated;
revoke delete on public.messages from authenticated;
drop policy if exists "authors or admins delete messages" on public.messages;

create table if not exists public.message_deletion_audit (
  message_id uuid primary key references public.messages(id) on delete cascade,
  original_content text not null,
  deleted_by uuid not null references auth.users(id) on delete cascade,
  deleted_at timestamptz not null default now()
);

alter table public.message_deletion_audit enable row level security;
grant select on public.message_deletion_audit to authenticated;
create policy "admins read deleted message audit"
  on public.message_deletion_audit for select to authenticated
  using ((select public.is_admin()));

create or replace function public.validate_community_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_kind text;
  v_parent_channel_id uuid;
  v_parent_parent_id uuid;
  v_recent_ten_seconds integer;
  v_recent_minute integer;
begin
  select kind into v_kind
  from public.channels
  where id = new.channel_id;

  if v_kind is null then
    raise exception 'Unknown community channel';
  end if;

  if tg_op = 'UPDATE' and old.deleted_at is not null and new.content is distinct from old.content then
    raise exception 'A deleted message cannot be edited';
  end if;

  -- La suppression douce est une opération système : elle ne doit pas être
  -- bloquée par les règles éditoriales propres aux questions ou annonces.
  if tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select
      count(*) filter (where created_at > now() - interval '10 seconds'),
      count(*) filter (where created_at > now() - interval '1 minute')
    into v_recent_ten_seconds, v_recent_minute
    from public.messages
    where user_id = new.user_id;

    if v_recent_ten_seconds >= 5 or v_recent_minute >= 20 then
      raise exception 'Vous envoyez des messages trop rapidement. Patientez un instant.';
    end if;

    if new.shared_message_id is null and exists (
      select 1 from public.messages
      where user_id = new.user_id
        and deleted_at is null
        and lower(btrim(content)) = lower(btrim(new.content))
        and created_at > now() - interval '1 minute'
    ) then
      raise exception 'Ce message vient déjà d’être envoyé.';
    end if;

    if regexp_count(new.content, 'https?://', 1, 'i') > 3 then
      raise exception 'Un message ne peut pas contenir plus de trois liens.';
    end if;

    if new.content ~ '(.)\1{19,}' then
      raise exception 'Réduisez les caractères répétés avant d’envoyer.';
    end if;
  end if;

  if new.shared_message_id is not null and not exists (
    select 1 from public.messages where id = new.shared_message_id
  ) then
    raise exception 'Le message partagé n’existe plus.';
  end if;

  if new.parent_message_id is not null then
    select channel_id, parent_message_id
    into v_parent_channel_id, v_parent_parent_id
    from public.messages
    where id = new.parent_message_id;

    if v_parent_channel_id is null
      or v_parent_channel_id <> new.channel_id
      or v_parent_parent_id is not null then
      raise exception 'A reply must target a root message in the same channel';
    end if;
  end if;

  if v_kind = 'announcements' then
    if not public.is_admin() then
      raise exception 'Only administrators can publish announcements';
    end if;
    if new.parent_message_id is not null then
      raise exception 'Announcements cannot be replies';
    end if;
    new.announcement_expires_at := now() + interval '10 minutes';
  elsif v_kind = 'questions' then
    new.announcement_expires_at := null;
    if new.parent_message_id is null
      and new.shared_message_id is null
      and right(btrim(new.content), 1) <> '?' then
      raise exception 'A question must end with a question mark';
    end if;
  else
    new.parent_message_id := null;
    new.announcement_expires_at := null;
  end if;

  return new;
end;
$$;

create or replace function public.soft_delete_message(p_message_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_message public.messages%rowtype;
begin
  select * into v_message from public.messages where id = p_message_id for update;
  if v_message.id is null then
    raise exception 'Message introuvable';
  end if;
  if v_message.user_id <> (select auth.uid()) and not public.is_admin() then
    raise exception 'Vous ne pouvez pas supprimer ce message';
  end if;
  if v_message.deleted_at is not null then
    return;
  end if;

  insert into public.message_deletion_audit (message_id, original_content, deleted_by)
  values (v_message.id, v_message.content, (select auth.uid()))
  on conflict (message_id) do nothing;

  update public.messages
  set content = 'Message supprimé',
      deleted_at = now(),
      deleted_by = (select auth.uid())
  where id = p_message_id;
end;
$$;

revoke all on function public.soft_delete_message(uuid) from public;
grant execute on function public.soft_delete_message(uuid) to authenticated;

create or replace function public.get_channel_messages(
  p_channel_id uuid,
  p_before timestamptz default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  channel_id uuid,
  user_id uuid,
  parent_message_id uuid,
  shared_message_id uuid,
  content text,
  created_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  announcement_expires_at timestamptz,
  message_reactions jsonb,
  shared_message jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    message.id,
    message.channel_id,
    message.user_id,
    message.parent_message_id,
    message.shared_message_id,
    case
      when message.deleted_at is null then message.content
      when public.is_admin() then coalesce(audit.original_content, message.content)
      else 'Message supprimé'
    end as content,
    message.created_at,
    message.edited_at,
    message.deleted_at,
    message.announcement_expires_at,
    coalesce(reactions.items, '[]'::jsonb) as message_reactions,
    case when shared.id is null then null else jsonb_build_object(
      'id', shared.id,
      'user_id', shared.user_id,
      'channel_id', shared.channel_id,
      'channel_name', shared_channel.name,
      'channel_slug', shared_channel.slug,
      'content', case
        when shared.deleted_at is null then shared.content
        when public.is_admin() then coalesce(shared_audit.original_content, shared.content)
        else 'Message supprimé'
      end,
      'created_at', shared.created_at,
      'deleted_at', shared.deleted_at
    ) end as shared_message
  from public.messages as message
  left join public.message_deletion_audit as audit on audit.message_id = message.id
  left join public.messages as shared on shared.id = message.shared_message_id
  left join public.channels as shared_channel on shared_channel.id = shared.channel_id
  left join public.message_deletion_audit as shared_audit on shared_audit.message_id = shared.id
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', reaction.id,
      'message_id', reaction.message_id,
      'user_id', reaction.user_id,
      'emoji', reaction.emoji
    ) order by reaction.id) as items
    from public.message_reactions as reaction
    where reaction.message_id = message.id
  ) as reactions on true
  where (select auth.uid()) is not null
    and message.channel_id = p_channel_id
    and (p_before is null or message.created_at < p_before)
  order by message.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_channel_messages(uuid, timestamptz, integer) from public;
grant execute on function public.get_channel_messages(uuid, timestamptz, integer) to authenticated;
