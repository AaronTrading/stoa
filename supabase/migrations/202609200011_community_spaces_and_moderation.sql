alter table public.channels
  add column if not exists kind text;

update public.channels
set kind = 'chat'
where kind is null;

alter table public.channels
  alter column kind set default 'chat',
  alter column kind set not null,
  add constraint channels_kind_check check (kind in ('chat', 'announcements', 'questions'));

delete from public.channels
where slug in ('alimentation', 'sport', 'entraide');

update public.channels
set name = 'Général',
    description = 'Le portique commun de l’académie.',
    kind = 'chat',
    order_index = 0
where slug = 'general';

insert into public.channels (name, slug, description, kind, order_index)
values
  ('Annonces', 'annonces', 'Les informations publiées par l’équipe STOA.', 'announcements', 1),
  ('Questions', 'questions', 'Posez une question précise et échangez autour des réponses.', 'questions', 2)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    kind = excluded.kind,
    order_index = excluded.order_index;

alter table public.messages
  add column if not exists parent_message_id uuid references public.messages(id) on delete cascade,
  add column if not exists announcement_expires_at timestamptz,
  add constraint messages_parent_not_self check (parent_message_id is null or parent_message_id <> id);

create index if not exists messages_parent_message_id_idx
  on public.messages (parent_message_id, created_at);

grant insert (parent_message_id) on public.messages to authenticated;

create or replace function public.validate_community_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_kind text;
  v_parent_channel_id uuid;
  v_parent_parent_id uuid;
begin
  select kind into v_kind
  from public.channels
  where id = new.channel_id;

  if v_kind is null then
    raise exception 'Unknown community channel';
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
    if new.parent_message_id is null and right(btrim(new.content), 1) <> '?' then
      raise exception 'A question must end with a question mark';
    end if;
  else
    new.parent_message_id := null;
    new.announcement_expires_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists messages_validate_community_rules on public.messages;
create trigger messages_validate_community_rules
  before insert or update of channel_id, content, parent_message_id on public.messages
  for each row execute function public.validate_community_message();

