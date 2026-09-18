create extension if not exists pgcrypto;

create type public.user_role as enum ('member', 'coaching', 'admin');
create type public.progress_status as enum ('locked', 'in_progress', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  role public.user_role not null default 'member',
  onboarding_completed boolean not null default false
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'Alimentation', 'Hydratation', 'Sport', 'Santé', 'Sommeil',
    'Hygiène', 'Énergie', 'Productivité', 'Longévité', 'Société',
    'Spiritualité', 'Courses', 'Recettes', 'Autonomie', 'Relations',
    'Argent', 'Toxines'
  )),
  title text not null,
  description text not null default '',
  order_index integer not null check (order_index >= 0),
  created_at timestamptz not null default now(),
  constraint chapters_order_index_key unique (order_index)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  video_url text,
  order_index integer not null check (order_index >= 0),
  created_at timestamptz not null default now(),
  constraint modules_chapter_order_key unique (chapter_id, order_index)
);

create table public.subchapters (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  content text not null default '',
  order_index integer not null check (order_index >= 0),
  constraint subchapters_module_order_key unique (module_id, order_index),
  constraint subchapters_id_module_key unique (id, module_id)
);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  subchapter_id uuid,
  status public.progress_status not null default 'locked',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint user_progress_subchapter_module_fkey
    foreign key (subchapter_id, module_id)
    references public.subchapters(id, module_id)
    on delete cascade,
  constraint completed_progress_has_timestamp check (
    status <> 'completed' or completed_at is not null
  )
);

create unique index user_progress_scope_key
  on public.user_progress (user_id, module_id, subchapter_id) nulls not distinct;
create index modules_chapter_id_idx on public.modules(chapter_id);
create index subchapters_module_id_idx on public.subchapters(module_id);
create index user_progress_user_id_idx on public.user_progress(user_id);
create index user_progress_module_id_idx on public.user_progress(module_id);

alter table public.profiles enable row level security;
alter table public.chapters enable row level security;
alter table public.modules enable row level security;
alter table public.subchapters enable row level security;
alter table public.user_progress enable row level security;

