create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index integer not null check (order_index >= 0),
  created_at timestamptz not null default now(),
  constraint channels_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint channels_description_length check (description is null or char_length(description) <= 180),
  constraint channels_order_index_key unique (order_index)
);

create unique index channels_name_lower_key on public.channels (lower(btrim(name)));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint messages_user_profile_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint messages_content_length check (char_length(btrim(content)) between 1 and 2000)
);

create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '👏', '💡')),
  constraint message_reactions_user_profile_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint message_reactions_unique unique (message_id, user_id, emoji)
);

create index messages_channel_created_at_idx
  on public.messages (channel_id, created_at desc);
create index messages_user_id_idx on public.messages (user_id);
create index message_reactions_message_id_idx on public.message_reactions (message_id);
create index message_reactions_user_id_idx on public.message_reactions (user_id);

alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;

grant select, insert, update, delete on public.channels to authenticated;
grant select, delete on public.messages to authenticated;
grant insert (channel_id, user_id, content) on public.messages to authenticated;
grant update (content) on public.messages to authenticated;
grant select, delete on public.message_reactions to authenticated;
grant insert (message_id, user_id, emoji) on public.message_reactions to authenticated;

create policy "authenticated users read channels"
  on public.channels for select to authenticated using (true);
create policy "admins manage channels"
  on public.channels for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "authenticated users read messages"
  on public.messages for select to authenticated using (true);
create policy "authenticated users create messages"
  on public.messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "authors or admins update messages"
  on public.messages for update to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy "authors or admins delete messages"
  on public.messages for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "authenticated users read reactions"
  on public.message_reactions for select to authenticated using (true);
create policy "users create own reactions"
  on public.message_reactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users delete own reactions"
  on public.message_reactions for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_message_edited_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.content is distinct from old.content then
    new.edited_at = now();
  end if;
  return new;
end;
$$;

create trigger messages_set_edited_at
  before update of content on public.messages
  for each row execute function public.set_message_edited_at();

create or replace function public.get_community_profiles(profile_ids uuid[] default null)
returns table (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  role public.user_role,
  created_at timestamptz
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
    profile.role,
    profile.created_at
  from public.profiles as profile
  where (select auth.uid()) is not null
    and (profile_ids is null or profile.id = any(profile_ids));
$$;

revoke all on function public.get_community_profiles(uuid[]) from public;
grant execute on function public.get_community_profiles(uuid[]) to authenticated;

insert into public.channels (name, description, order_index)
values
  ('Général', 'Le portique commun de l’académie.', 0),
  ('Alimentation', 'Questions, habitudes et retours d’expérience.', 1),
  ('Sport', 'Entraînement, mouvement et progression.', 2),
  ('Entraide', 'Demander un regard, partager une difficulté.', 3)
on conflict do nothing;

alter table public.messages replica identity full;
alter table public.message_reactions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end;
$$;
