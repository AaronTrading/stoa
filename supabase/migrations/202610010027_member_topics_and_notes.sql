-- Community topics and private lesson notes.
alter table public.community_posts
  add column if not exists post_type text not null default 'stoa_editorial';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'community_posts_post_type_check'
  ) then
    alter table public.community_posts add constraint community_posts_post_type_check
      check (post_type in ('stoa_editorial','member_topic'));
  end if;
end $$;

drop policy if exists "admins create community posts" on public.community_posts;
drop policy if exists "admins update community posts" on public.community_posts;
drop policy if exists "admins delete community posts" on public.community_posts;

create policy "members create topics or admins publish"
  on public.community_posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (post_type = 'member_topic' or (select public.is_admin()))
    and (pinned_at is null or (select public.is_admin()))
    and (category <> 'announcement' or (select public.is_admin()))
  );

create policy "authors update topics or admins update posts"
  on public.community_posts for update to authenticated
  using (
    (select public.is_admin())
    or (author_id = (select auth.uid()) and post_type = 'member_topic')
  )
  with check (
    (select public.is_admin())
    or (author_id = (select auth.uid()) and post_type = 'member_topic' and pinned_at is null and category <> 'announcement')
  );

create policy "authors delete topics or admins delete posts"
  on public.community_posts for delete to authenticated
  using (
    (select public.is_admin())
    or (author_id = (select auth.uid()) and post_type = 'member_topic')
  );

create table if not exists public.user_lesson_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id,module_id)
);

alter table public.user_lesson_notes enable row level security;
grant select,insert,update,delete on public.user_lesson_notes to authenticated;

drop policy if exists "members read own lesson notes" on public.user_lesson_notes;
drop policy if exists "members insert own lesson notes" on public.user_lesson_notes;
drop policy if exists "members update own lesson notes" on public.user_lesson_notes;
drop policy if exists "members delete own lesson notes" on public.user_lesson_notes;
create policy "members read own lesson notes" on public.user_lesson_notes for select to authenticated using (user_id=(select auth.uid()));
create policy "members insert own lesson notes" on public.user_lesson_notes for insert to authenticated with check (user_id=(select auth.uid()));
create policy "members update own lesson notes" on public.user_lesson_notes for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "members delete own lesson notes" on public.user_lesson_notes for delete to authenticated using (user_id=(select auth.uid()));

-- A member can upload only inside their own community-posts directory.
drop policy if exists "members upload own community post images" on storage.objects;
create policy "members upload own community post images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'module-assets'
    and (storage.foldername(name))[1] = 'community-posts'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
