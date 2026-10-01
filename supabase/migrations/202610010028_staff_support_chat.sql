create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;
grant select,insert,update on public.support_messages to authenticated;

create policy "members and admins read support conversations"
  on public.support_messages for select to authenticated
  using (member_id=(select auth.uid()) or (select public.is_admin()));

create policy "members and admins send support messages"
  on public.support_messages for insert to authenticated
  with check (
    sender_id=(select auth.uid())
    and (member_id=(select auth.uid()) or (select public.is_admin()))
  );

create policy "members and admins mark support messages read"
  on public.support_messages for update to authenticated
  using (member_id=(select auth.uid()) or (select public.is_admin()))
  with check (member_id=(select auth.uid()) or (select public.is_admin()));

create index if not exists support_messages_conversation_idx on public.support_messages(member_id,created_at);

do $$ begin
  alter publication supabase_realtime add table public.support_messages;
exception when duplicate_object then null;
end $$;
