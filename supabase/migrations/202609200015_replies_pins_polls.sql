alter table public.channels drop constraint if exists channels_kind_check;
alter table public.channels add constraint channels_kind_check
  check (kind in ('chat', 'announcements', 'questions', 'polls'));

insert into public.channels (name, slug, description, kind, order_index)
values ('Sondages', 'sondages', 'Les consultations rapides publiées par l’équipe STOA.', 'polls', 3)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  kind = excluded.kind,
  order_index = excluded.order_index;

alter table public.messages
  add column if not exists reply_to_message_id uuid references public.messages(id) on delete set null,
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_by uuid references auth.users(id) on delete set null;

create index if not exists messages_reply_to_message_id_idx on public.messages (reply_to_message_id);
create index if not exists messages_pinned_idx on public.messages (channel_id, pinned_at desc) where pinned_at is not null;
grant insert (reply_to_message_id) on public.messages to authenticated;

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(btrim(question)) between 3 and 300),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 120),
  order_index integer not null,
  unique (poll_id, order_index)
);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index polls_channel_created_idx on public.polls (channel_id, created_at desc);
create index poll_options_poll_idx on public.poll_options (poll_id, order_index);
create index poll_votes_poll_idx on public.poll_votes (poll_id);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

grant select on public.polls, public.poll_options, public.poll_votes to authenticated;
grant insert (poll_id, option_id, user_id) on public.poll_votes to authenticated;

create policy "authenticated users read polls" on public.polls
  for select to authenticated using (true);
create policy "authenticated users read poll options" on public.poll_options
  for select to authenticated using (true);
create policy "authenticated users read poll votes" on public.poll_votes
  for select to authenticated using (true);
create policy "users vote once on active polls" on public.poll_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.polls poll
      join public.poll_options option on option.poll_id = poll.id
      where poll.id = poll_votes.poll_id
        and option.id = poll_votes.option_id
        and poll.expires_at > now()
    )
  );

create or replace function public.create_poll(p_question text, p_options text[])
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_channel_id uuid;
  v_poll_id uuid;
  v_option text;
  v_index integer := 0;
begin
  if not public.is_admin() then raise exception 'Seuls les administrateurs peuvent publier un sondage'; end if;
  if char_length(btrim(p_question)) < 3 or char_length(btrim(p_question)) > 300 then raise exception 'La question doit contenir entre 3 et 300 caractères'; end if;
  if coalesce(array_length(p_options, 1), 0) < 2 or array_length(p_options, 1) > 6 then raise exception 'Un sondage doit proposer entre 2 et 6 réponses'; end if;
  if (select count(*) from public.polls where user_id = (select auth.uid()) and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Trop de sondages ont été publiés récemment';
  end if;
  select id into v_channel_id from public.channels where kind = 'polls' order by order_index limit 1;
  insert into public.polls (channel_id, user_id, question) values (v_channel_id, (select auth.uid()), btrim(p_question)) returning id into v_poll_id;
  foreach v_option in array p_options loop
    if char_length(btrim(v_option)) < 1 or char_length(btrim(v_option)) > 120 then raise exception 'Chaque réponse doit contenir entre 1 et 120 caractères'; end if;
    insert into public.poll_options (poll_id, label, order_index) values (v_poll_id, btrim(v_option), v_index);
    v_index := v_index + 1;
  end loop;
  return v_poll_id;
end;
$$;
revoke all on function public.create_poll(text, text[]) from public;
grant execute on function public.create_poll(text, text[]) to authenticated;

create or replace function public.toggle_message_pin(p_message_id uuid, p_pinned boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Seuls les administrateurs peuvent épingler un message'; end if;
  update public.messages set
    pinned_at = case when p_pinned then now() else null end,
    pinned_by = case when p_pinned then (select auth.uid()) else null end
  where id = p_message_id and deleted_at is null;
  if not found then raise exception 'Message introuvable'; end if;
end;
$$;
revoke all on function public.toggle_message_pin(uuid, boolean) from public;
grant execute on function public.toggle_message_pin(uuid, boolean) to authenticated;

create or replace function public.validate_community_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_kind text;
  v_parent_channel_id uuid;
  v_parent_parent_id uuid;
  v_reply_channel_id uuid;
  v_recent_ten_seconds integer;
  v_recent_minute integer;
begin
  select kind into v_kind from public.channels where id = new.channel_id;
  if v_kind is null then raise exception 'Unknown community channel'; end if;
  if v_kind = 'polls' then raise exception 'Utilisez le formulaire de sondage'; end if;
  if tg_op = 'UPDATE' and old.deleted_at is not null and new.content is distinct from old.content then raise exception 'A deleted message cannot be edited'; end if;
  if tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then return new; end if;

  if tg_op = 'INSERT' then
    select count(*) filter (where created_at > now() - interval '10 seconds'), count(*) filter (where created_at > now() - interval '1 minute')
    into v_recent_ten_seconds, v_recent_minute from public.messages where user_id = new.user_id;
    if v_recent_ten_seconds >= 5 or v_recent_minute >= 20 then raise exception 'Vous envoyez des messages trop rapidement. Patientez un instant.'; end if;
    if new.shared_message_id is null and exists (select 1 from public.messages where user_id = new.user_id and deleted_at is null and lower(btrim(content)) = lower(btrim(new.content)) and created_at > now() - interval '1 minute') then raise exception 'Ce message vient déjà d’être envoyé.'; end if;
    if regexp_count(new.content, 'https?://', 1, 'i') > 3 then raise exception 'Un message ne peut pas contenir plus de trois liens.'; end if;
    if new.content ~ '(.)\1{19,}' then raise exception 'Réduisez les caractères répétés avant d’envoyer.'; end if;
  end if;

  if new.shared_message_id is not null and not exists (select 1 from public.messages where id = new.shared_message_id) then raise exception 'Le message partagé n’existe plus.'; end if;
  if new.reply_to_message_id is not null then
    select channel_id into v_reply_channel_id from public.messages where id = new.reply_to_message_id and deleted_at is null;
    if v_reply_channel_id is null or v_reply_channel_id <> new.channel_id then raise exception 'La réponse doit viser un message actif du même canal'; end if;
  end if;
  if new.parent_message_id is not null then
    select channel_id, parent_message_id into v_parent_channel_id, v_parent_parent_id from public.messages where id = new.parent_message_id;
    if v_parent_channel_id is null or v_parent_channel_id <> new.channel_id or v_parent_parent_id is not null then raise exception 'A reply must target a root message in the same channel'; end if;
  end if;

  if v_kind = 'announcements' then
    if not public.is_admin() then raise exception 'Only administrators can publish announcements'; end if;
    if new.parent_message_id is not null then raise exception 'Announcements cannot be replies'; end if;
    new.announcement_expires_at := now() + interval '10 minutes';
  elsif v_kind = 'questions' then
    new.announcement_expires_at := null;
    if new.parent_message_id is null and new.shared_message_id is null and right(btrim(new.content), 1) <> '?' then raise exception 'A question must end with a question mark'; end if;
  else
    new.parent_message_id := null;
    new.announcement_expires_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_validate_community_rules on public.messages;
create trigger messages_validate_community_rules
  before insert or update of channel_id, content, parent_message_id, reply_to_message_id on public.messages
  for each row execute function public.validate_community_message();

drop function if exists public.get_channel_messages(uuid, timestamptz, integer);
create function public.get_channel_messages(p_channel_id uuid, p_before timestamptz default null, p_limit integer default 50)
returns table (
  id uuid, channel_id uuid, user_id uuid, parent_message_id uuid, reply_to_message_id uuid, shared_message_id uuid,
  content text, created_at timestamptz, edited_at timestamptz, deleted_at timestamptz, announcement_expires_at timestamptz,
  pinned_at timestamptz, message_reactions jsonb, shared_message jsonb, replied_message jsonb
)
language sql stable security definer set search_path = ''
as $$
  select message.id, message.channel_id, message.user_id, message.parent_message_id, message.reply_to_message_id, message.shared_message_id,
    case when message.deleted_at is null then message.content when public.is_admin() then coalesce(audit.original_content, message.content) else 'Message supprimé' end,
    message.created_at, message.edited_at, message.deleted_at, message.announcement_expires_at, message.pinned_at,
    coalesce(reactions.items, '[]'::jsonb),
    case when shared.id is null then null else jsonb_build_object('id',shared.id,'user_id',shared.user_id,'channel_id',shared.channel_id,'channel_name',shared_channel.name,'channel_slug',shared_channel.slug,'content',case when shared.deleted_at is null then shared.content when public.is_admin() then coalesce(shared_audit.original_content,shared.content) else 'Message supprimé' end,'created_at',shared.created_at,'deleted_at',shared.deleted_at) end,
    case when replied.id is null then null else jsonb_build_object('id',replied.id,'user_id',replied.user_id,'content',case when replied.deleted_at is null then replied.content else 'Message supprimé' end,'deleted_at',replied.deleted_at) end
  from public.messages message
  left join public.message_deletion_audit audit on audit.message_id=message.id
  left join public.messages shared on shared.id=message.shared_message_id
  left join public.channels shared_channel on shared_channel.id=shared.channel_id
  left join public.message_deletion_audit shared_audit on shared_audit.message_id=shared.id
  left join public.messages replied on replied.id=message.reply_to_message_id
  left join lateral (select jsonb_agg(jsonb_build_object('id',r.id,'message_id',r.message_id,'user_id',r.user_id,'emoji',r.emoji) order by r.id) items from public.message_reactions r where r.message_id=message.id) reactions on true
  where (select auth.uid()) is not null and message.channel_id=p_channel_id and (p_before is null or message.created_at<p_before)
  order by message.created_at desc limit least(greatest(p_limit,1),100);
$$;
revoke all on function public.get_channel_messages(uuid, timestamptz, integer) from public;
grant execute on function public.get_channel_messages(uuid, timestamptz, integer) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='polls') then alter publication supabase_realtime add table public.polls; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='poll_votes') then alter publication supabase_realtime add table public.poll_votes; end if;
end $$;
