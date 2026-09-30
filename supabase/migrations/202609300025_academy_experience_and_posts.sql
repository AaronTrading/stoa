alter table public.profiles add column if not exists bio text not null default '';

create table public.user_learning_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  url_path text not null,
  scroll_y integer not null default 0 check (scroll_y >= 0),
  progress_ratio numeric(5,4) not null default 0 check (progress_ratio between 0 and 1),
  anchor_id text,
  anchor_offset integer not null default 0,
  last_read_at timestamptz not null default now(),
  primary key (user_id,module_id)
);

alter table public.user_learning_state enable row level security;
grant select,insert,update,delete on public.user_learning_state to authenticated;
create policy "members read own learning state" on public.user_learning_state for select to authenticated using ((select auth.uid())=user_id);
create policy "members insert own learning state" on public.user_learning_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy "members update own learning state" on public.user_learning_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "members delete own learning state" on public.user_learning_state for delete to authenticated using ((select auth.uid())=user_id);
create index user_learning_state_recent_idx on public.user_learning_state(user_id,last_read_at desc);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'discussion' check (category in ('announcement','discussion','question','success','resource')),
  title text not null check (char_length(trim(title)) between 3 and 160),
  content text not null check (char_length(trim(content)) between 1 and 6000),
  image_url text,
  pinned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.community_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤','👏','💡')),
  created_at timestamptz not null default now(),
  unique(post_id,user_id,emoji)
);

alter table public.community_posts enable row level security;
alter table public.community_post_comments enable row level security;
alter table public.community_post_reactions enable row level security;
grant select,insert,update,delete on public.community_posts,public.community_post_comments,public.community_post_reactions to authenticated;

create policy "members read community posts" on public.community_posts for select to authenticated using (true);
create policy "admins create community posts" on public.community_posts for insert to authenticated with check ((select public.is_admin()) and author_id=(select auth.uid()));
create policy "admins update community posts" on public.community_posts for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete community posts" on public.community_posts for delete to authenticated using ((select public.is_admin()));

create policy "members read post comments" on public.community_post_comments for select to authenticated using (true);
create policy "members create own post comments" on public.community_post_comments for insert to authenticated with check (user_id=(select auth.uid()));
create policy "authors or admins update post comments" on public.community_post_comments for update to authenticated using (user_id=(select auth.uid()) or (select public.is_admin())) with check (user_id=(select auth.uid()) or (select public.is_admin()));
create policy "authors or admins delete post comments" on public.community_post_comments for delete to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));

create policy "members read post reactions" on public.community_post_reactions for select to authenticated using (true);
create policy "members create own post reactions" on public.community_post_reactions for insert to authenticated with check (user_id=(select auth.uid()));
create policy "members delete own post reactions" on public.community_post_reactions for delete to authenticated using (user_id=(select auth.uid()));

create index community_posts_feed_idx on public.community_posts(pinned_at desc,created_at desc);
create index community_post_comments_post_idx on public.community_post_comments(post_id,created_at);
create index community_post_reactions_post_idx on public.community_post_reactions(post_id);

do $$ begin
  alter publication supabase_realtime add table public.community_posts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.community_post_comments;
exception when duplicate_object then null;
end $$;
