alter table public.profiles
  add column if not exists theme_preference text not null default 'light',
  add column if not exists theme_updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_theme_preference_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_theme_preference_check
      check (theme_preference in ('light', 'dark'));
  end if;
end $$;

create or replace function public.set_theme_preference(p_theme text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if p_theme not in ('light', 'dark') then
    raise exception 'Invalid theme preference';
  end if;

  update public.profiles
  set theme_preference = p_theme,
      theme_updated_at = now()
  where id = (select auth.uid());
end;
$$;

revoke all on function public.set_theme_preference(text) from public;
grant execute on function public.set_theme_preference(text) to authenticated;

drop trigger if exists community_posts_enforce_chat_restriction on public.community_posts;
create trigger community_posts_enforce_chat_restriction
  before insert or update of content on public.community_posts
  for each row execute function public.enforce_chat_restriction();

drop trigger if exists community_post_comments_enforce_chat_restriction on public.community_post_comments;
create trigger community_post_comments_enforce_chat_restriction
  before insert or update of content on public.community_post_comments
  for each row execute function public.enforce_chat_restriction();
