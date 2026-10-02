create table if not exists public.chat_restrictions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  restricted_until timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_restrictions enable row level security;
grant select, insert, update, delete on public.chat_restrictions to authenticated;

drop policy if exists "members read own chat restriction or admins read all" on public.chat_restrictions;
create policy "members read own chat restriction or admins read all"
  on public.chat_restrictions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admins manage chat restrictions" on public.chat_restrictions;
create policy "admins manage chat restrictions"
  on public.chat_restrictions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.set_chat_restriction(p_user_id uuid, p_duration text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_until timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Seuls les administrateurs peuvent gérer les exclusions du chat';
  end if;
  if p_user_id is null or not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Membre introuvable';
  end if;

  if p_duration = 'lift' then
    delete from public.chat_restrictions where user_id = p_user_id;
    return;
  elsif p_duration = 'day' then
    v_until := now() + interval '1 day';
  elsif p_duration = 'week' then
    v_until := now() + interval '1 week';
  elsif p_duration = 'month' then
    v_until := now() + interval '1 month';
  elsif p_duration = 'permanent' then
    v_until := null;
  else
    raise exception 'Durée d’exclusion invalide';
  end if;

  insert into public.chat_restrictions (user_id, restricted_until, created_by, updated_at)
  values (p_user_id, v_until, (select auth.uid()), now())
  on conflict (user_id) do update
  set restricted_until = excluded.restricted_until,
      created_by = excluded.created_by,
      updated_at = now();
end;
$$;

revoke all on function public.set_chat_restriction(uuid, text) from public;
grant execute on function public.set_chat_restriction(uuid, text) to authenticated;

create or replace function public.enforce_chat_restriction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_until timestamptz;
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  select restricted_until into v_until
  from public.chat_restrictions
  where user_id = (select auth.uid())
    and (restricted_until is null or restricted_until > now());

  if found then
    if v_until is null then
      raise exception 'Votre accès au chat a été suspendu définitivement';
    end if;
    raise exception 'Votre accès au chat est suspendu jusqu’au %', to_char(v_until at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI');
  end if;
  return new;
end;
$$;

drop trigger if exists messages_enforce_chat_restriction on public.messages;
create trigger messages_enforce_chat_restriction
  before insert or update of content on public.messages
  for each row execute function public.enforce_chat_restriction();

create or replace function public.delete_community_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id
  from public.community_posts
  where id = p_post_id;

  if v_author_id is null then
    raise exception 'Publication introuvable';
  end if;
  if v_author_id <> (select auth.uid()) and not public.is_admin() then
    raise exception 'Vous ne pouvez pas supprimer cette publication';
  end if;

  delete from public.community_posts where id = p_post_id;
end;
$$;

revoke all on function public.delete_community_post(uuid) from public;
grant execute on function public.delete_community_post(uuid) to authenticated;
