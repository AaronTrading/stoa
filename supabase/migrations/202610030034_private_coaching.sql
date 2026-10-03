-- STOA Coaching Privé: entitlement, longitudinal workspace and strict tenant RLS.

create table public.coaching_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.coaching_clients (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references auth.users(id) on delete cascade,
  coach_id uuid references auth.users(id) on delete set null,
  status text not null default 'onboarding' check (status in ('onboarding','active','paused','completed','cancelled')),
  access_source text not null default 'manual' check (access_source in ('manual','stripe','legacy','gift')),
  stripe_subscription_id text unique,
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  onboarding_step integer not null default 0 check (onboarding_step between 0 and 12),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coaching_questionnaires (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'admission' check (kind in ('admission','monthly','final')),
  status text not null default 'draft' check (status in ('draft','submitted','reviewed')),
  version integer not null default 1,
  current_step integer not null default 0 check (current_step between 0 and 12),
  total_steps integer not null default 12,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, client_id)
);
create unique index coaching_questionnaires_one_draft_idx on public.coaching_questionnaires(client_id,kind) where status='draft';

create table public.coaching_questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null,
  client_id uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  question_key text not null,
  answer jsonb not null default 'null'::jsonb,
  answered_at timestamptz not null default now(),
  foreign key (questionnaire_id,client_id) references public.coaching_questionnaires(id,client_id) on delete cascade,
  unique (questionnaire_id,question_key)
);

create table public.coaching_profiles (
  client_id uuid primary key references auth.users(id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  priorities text[] not null default '{}',
  constraints text[] not null default '{}',
  preferences jsonb not null default '{}'::jsonb,
  missing_information text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.coaching_profile_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.coaching_plans (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  title text not null, content text not null default '', status text not null default 'draft' check(status in ('draft','active','completed','archived')),
  starts_on date, ends_on date, visible_to_client boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coaching_goals (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text not null default '', category text not null default 'general', priority integer not null default 1 check(priority between 1 and 3),
  target_date date, status text not null default 'active' check(status in ('active','completed','paused','cancelled')),
  progress integer not null default 0 check(progress between 0 and 100), created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coaching_goal_history (
  id uuid primary key default gen_random_uuid(), goal_id uuid not null references public.coaching_goals(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade, snapshot jsonb not null, changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.coaching_habits (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text not null default '', schedule jsonb not null default '{"frequency":"daily"}'::jsonb,
  active boolean not null default true, created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coaching_habit_logs (
  id uuid primary key default gen_random_uuid(), habit_id uuid not null references public.coaching_habits(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade, completed_on date not null default current_date,
  note text not null default '', created_at timestamptz not null default now(), unique(habit_id,completed_on)
);
create table public.coaching_tasks (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text not null default '', due_at timestamptz, status text not null default 'todo' check(status in ('todo','in_progress','completed','cancelled')),
  created_by uuid not null references auth.users(id) on delete restrict, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coaching_assignments (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade, note text not null default '', due_at timestamptz,
  status text not null default 'assigned' check(status in ('assigned','started','completed','skipped')),
  assigned_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(client_id,module_id)
);
create table public.coaching_checkins (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null, period_end date not null, status text not null default 'draft' check(status in ('draft','submitted','reviewed','late')),
  energy integer check(energy between 1 and 10), sleep integer check(sleep between 1 and 10), nutrition integer check(nutrition between 1 and 10), activity integer check(activity between 1 and 10),
  week_summary text not null default '', main_difficulty text not null default '', main_win text not null default '', next_focus text not null default '', help_needed text not null default '', comment text not null default '',
  coach_feedback text not null default '', due_at timestamptz, submitted_at timestamptz, reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(client_id,period_start)
);
create table public.coaching_notes (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict, content text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coaching_messages (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade, content text not null check(char_length(btrim(content)) between 1 and 4000),
  created_at timestamptz not null default now(), read_at timestamptz
);
create table public.coaching_reviews (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('initial','monthly','final')), title text not null, content text not null default '', period_start date, period_end date,
  visible_to_client boolean not null default true, created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.coaching_appointments (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null, duration_minutes integer not null default 45 check(duration_minutes between 10 and 240),
  format text not null default 'call' check(format in ('call','video','message','other')), note text not null default '',
  status text not null default 'planned' check(status in ('planned','completed','cancelled')), created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index coaching_clients_coach_idx on public.coaching_clients(coach_id,status);
create index coaching_responses_client_idx on public.coaching_questionnaire_responses(client_id,section_key);
create index coaching_messages_thread_idx on public.coaching_messages(client_id,created_at);
create index coaching_checkins_client_idx on public.coaching_checkins(client_id,period_start desc);
create index coaching_tasks_client_idx on public.coaching_tasks(client_id,status,due_at);

do $$ declare table_name text; begin
  foreach table_name in array array['coaching_staff','coaching_clients','coaching_questionnaires','coaching_questionnaire_responses','coaching_profiles','coaching_profile_history','coaching_plans','coaching_goals','coaching_goal_history','coaching_habits','coaching_habit_logs','coaching_tasks','coaching_assignments','coaching_checkins','coaching_notes','coaching_messages','coaching_reviews','coaching_appointments']
  loop execute format('alter table public.%I enable row level security',table_name); end loop;
end $$;

create or replace function public.is_coaching_staff()
returns boolean language sql stable security definer set search_path='' as $$
  select public.is_admin() or exists(select 1 from public.coaching_staff where user_id=(select auth.uid()) and active);
$$;
create or replace function public.has_coaching_access(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.coaching_clients where client_id=p_user_id and status in ('onboarding','active') and (ends_at is null or ends_at>now()));
$$;
create or replace function public.can_coach_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select public.is_admin() or exists(select 1 from public.coaching_clients c join public.coaching_staff s on s.user_id=(select auth.uid()) and s.active where c.client_id=p_client_id and c.coach_id=(select auth.uid()));
$$;
create or replace function public.can_access_coaching_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select (p_client_id=(select auth.uid()) and public.has_coaching_access(p_client_id)) or public.can_coach_client(p_client_id);
$$;
revoke all on function public.is_coaching_staff(),public.has_coaching_access(uuid),public.can_coach_client(uuid),public.can_access_coaching_client(uuid) from public;
grant execute on function public.is_coaching_staff(),public.has_coaching_access(uuid),public.can_coach_client(uuid),public.can_access_coaching_client(uuid) to authenticated;

insert into public.coaching_staff(user_id)
select id from public.profiles where role='admin' on conflict(user_id) do update set active=true;

create or replace function public.coaching_capture_profile_history()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.summary is distinct from new.summary or old.priorities is distinct from new.priorities or old.constraints is distinct from new.constraints or old.preferences is distinct from new.preferences then
    insert into public.coaching_profile_history(client_id,snapshot,changed_by) values(old.client_id,to_jsonb(old),(select auth.uid()));
  end if; new.updated_at=now(); return new;
end $$;
create trigger coaching_profiles_history before update on public.coaching_profiles for each row execute function public.coaching_capture_profile_history();

create or replace function public.coaching_capture_goal_history()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old is distinct from new then insert into public.coaching_goal_history(goal_id,client_id,snapshot,changed_by) values(old.id,old.client_id,to_jsonb(old),(select auth.uid())); end if;
  new.updated_at=now(); return new;
end $$;
create trigger coaching_goals_history before update on public.coaching_goals for each row execute function public.coaching_capture_goal_history();

create or replace function public.coaching_protect_client_updates()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if public.can_coach_client(old.client_id) then return new; end if;
  if old.client_id <> (select auth.uid()) or not public.has_coaching_access(old.client_id) then raise exception 'Not authorized'; end if;
  if tg_table_name='coaching_goals' and (to_jsonb(new)-array['status','progress','updated_at'])=(to_jsonb(old)-array['status','progress','updated_at']) then return new; end if;
  if tg_table_name='coaching_tasks' and (to_jsonb(new)-array['status','completed_at','updated_at'])=(to_jsonb(old)-array['status','completed_at','updated_at']) then return new; end if;
  if tg_table_name='coaching_assignments' and (to_jsonb(new)-array['status','updated_at'])=(to_jsonb(old)-array['status','updated_at']) then return new; end if;
  if tg_table_name='coaching_messages' and (to_jsonb(new)-array['read_at'])=(to_jsonb(old)-array['read_at']) then return new; end if;
  raise exception 'Only progress fields may be changed by the client';
end $$;
create trigger coaching_goals_protect_client before update on public.coaching_goals for each row execute function public.coaching_protect_client_updates();
create trigger coaching_tasks_protect_client before update on public.coaching_tasks for each row execute function public.coaching_protect_client_updates();
create trigger coaching_assignments_protect_client before update on public.coaching_assignments for each row execute function public.coaching_protect_client_updates();
create trigger coaching_messages_protect_client before update on public.coaching_messages for each row execute function public.coaching_protect_client_updates();

do $$ declare table_name text; begin
  foreach table_name in array array['coaching_clients','coaching_questionnaires','coaching_plans','coaching_habits','coaching_tasks','coaching_assignments','coaching_checkins','coaching_notes','coaching_reviews','coaching_appointments']
  loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',table_name||'_updated_at',table_name); end loop;
end $$;

grant select,insert,update,delete on public.coaching_staff,public.coaching_clients,public.coaching_questionnaires,
  public.coaching_questionnaire_responses,public.coaching_profiles,public.coaching_profile_history,
  public.coaching_plans,public.coaching_goals,public.coaching_goal_history,public.coaching_habits,
  public.coaching_habit_logs,public.coaching_tasks,public.coaching_assignments,public.coaching_checkins,
  public.coaching_notes,public.coaching_messages,public.coaching_reviews,public.coaching_appointments to authenticated;

create policy "coaching staff visibility" on public.coaching_staff for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy "admins manage coaching staff" on public.coaching_staff for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "participants read coaching access" on public.coaching_clients for select to authenticated using(client_id=(select auth.uid()) or public.can_coach_client(client_id));
create policy "admins manage coaching access" on public.coaching_clients for all to authenticated using(public.is_admin()) with check(public.is_admin());

create policy "participants read questionnaires" on public.coaching_questionnaires for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "participants create questionnaires" on public.coaching_questionnaires for insert to authenticated with check((client_id=(select auth.uid()) and public.has_coaching_access(client_id)) or public.can_coach_client(client_id));
create policy "participants update questionnaires" on public.coaching_questionnaires for update to authenticated using(public.can_access_coaching_client(client_id)) with check(public.can_access_coaching_client(client_id));
create policy "coaches delete questionnaires" on public.coaching_questionnaires for delete to authenticated using(public.can_coach_client(client_id));
create policy "participants read responses" on public.coaching_questionnaire_responses for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "clients write own responses" on public.coaching_questionnaire_responses for insert to authenticated with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "clients update own responses" on public.coaching_questionnaire_responses for update to authenticated using(client_id=(select auth.uid()) and public.has_coaching_access(client_id)) with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "coaches manage responses" on public.coaching_questionnaire_responses for all to authenticated using(public.can_coach_client(client_id)) with check(public.can_coach_client(client_id));

create policy "participants read coaching profiles" on public.coaching_profiles for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "clients create coaching profile" on public.coaching_profiles for insert to authenticated with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "participants update coaching profile" on public.coaching_profiles for update to authenticated using(public.can_access_coaching_client(client_id)) with check(public.can_access_coaching_client(client_id));
create policy "coaches read profile history" on public.coaching_profile_history for select to authenticated using(public.can_coach_client(client_id));

do $$ declare table_name text; begin
  foreach table_name in array array['coaching_goals','coaching_habits','coaching_tasks','coaching_appointments'] loop
    execute format('create policy "participants read %1$s" on public.%1$I for select to authenticated using(public.can_access_coaching_client(client_id))',table_name);
    execute format('create policy "coaches create %1$s" on public.%1$I for insert to authenticated with check(public.can_coach_client(client_id) and created_by=(select auth.uid()))',table_name);
    execute format('create policy "coaches update %1$s" on public.%1$I for update to authenticated using(public.can_coach_client(client_id)) with check(public.can_coach_client(client_id))',table_name);
    execute format('create policy "coaches delete %1$s" on public.%1$I for delete to authenticated using(public.can_coach_client(client_id))',table_name);
  end loop;
end $$;

create policy "participants read coaching plans" on public.coaching_plans for select to authenticated
  using(public.can_coach_client(client_id) or (client_id=(select auth.uid()) and public.has_coaching_access(client_id) and visible_to_client));
create policy "coaches create coaching plans" on public.coaching_plans for insert to authenticated
  with check(public.can_coach_client(client_id) and created_by=(select auth.uid()));
create policy "coaches update coaching plans" on public.coaching_plans for update to authenticated
  using(public.can_coach_client(client_id)) with check(public.can_coach_client(client_id));
create policy "coaches delete coaching plans" on public.coaching_plans for delete to authenticated using(public.can_coach_client(client_id));

create policy "participants read coaching reviews" on public.coaching_reviews for select to authenticated
  using(public.can_coach_client(client_id) or (client_id=(select auth.uid()) and public.has_coaching_access(client_id) and visible_to_client));
create policy "coaches create coaching reviews" on public.coaching_reviews for insert to authenticated
  with check(public.can_coach_client(client_id) and created_by=(select auth.uid()));
create policy "coaches update coaching reviews" on public.coaching_reviews for update to authenticated
  using(public.can_coach_client(client_id)) with check(public.can_coach_client(client_id));
create policy "coaches delete coaching reviews" on public.coaching_reviews for delete to authenticated using(public.can_coach_client(client_id));

create policy "participants read coaching_assignments" on public.coaching_assignments for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "coaches create coaching_assignments" on public.coaching_assignments for insert to authenticated with check(public.can_coach_client(client_id) and assigned_by=(select auth.uid()));
create policy "coaches update coaching_assignments" on public.coaching_assignments for update to authenticated using(public.can_coach_client(client_id)) with check(public.can_coach_client(client_id));
create policy "coaches delete coaching_assignments" on public.coaching_assignments for delete to authenticated using(public.can_coach_client(client_id));
create policy "participants read coaching_checkins" on public.coaching_checkins for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "coaches create coaching_checkins" on public.coaching_checkins for insert to authenticated with check(public.can_coach_client(client_id));
create policy "coaches update coaching_checkins" on public.coaching_checkins for update to authenticated using(public.can_coach_client(client_id)) with check(public.can_coach_client(client_id));
create policy "coaches delete coaching_checkins" on public.coaching_checkins for delete to authenticated using(public.can_coach_client(client_id));

create policy "clients update own goals" on public.coaching_goals for update to authenticated using(client_id=(select auth.uid()) and public.has_coaching_access(client_id)) with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "clients update own tasks" on public.coaching_tasks for update to authenticated using(client_id=(select auth.uid()) and public.has_coaching_access(client_id)) with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "clients update own assignments" on public.coaching_assignments for update to authenticated using(client_id=(select auth.uid()) and public.has_coaching_access(client_id)) with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "clients create checkins" on public.coaching_checkins for insert to authenticated with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "clients update own checkins" on public.coaching_checkins for update to authenticated using(client_id=(select auth.uid()) and public.has_coaching_access(client_id)) with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));

create policy "participants read habit logs" on public.coaching_habit_logs for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "clients log own habits" on public.coaching_habit_logs for insert to authenticated with check(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "clients delete own habit logs" on public.coaching_habit_logs for delete to authenticated using(client_id=(select auth.uid()) and public.has_coaching_access(client_id));
create policy "participants read goal history" on public.coaching_goal_history for select to authenticated using(public.can_access_coaching_client(client_id));

create policy "coaches read private notes" on public.coaching_notes for select to authenticated using(public.can_coach_client(client_id));
create policy "coaches create private notes" on public.coaching_notes for insert to authenticated with check(public.can_coach_client(client_id) and author_id=(select auth.uid()));
create policy "authors update private notes" on public.coaching_notes for update to authenticated using(author_id=(select auth.uid()) and public.can_coach_client(client_id)) with check(author_id=(select auth.uid()) and public.can_coach_client(client_id));
create policy "authors delete private notes" on public.coaching_notes for delete to authenticated using(author_id=(select auth.uid()) and public.can_coach_client(client_id));

create policy "participants read coaching messages" on public.coaching_messages for select to authenticated using(public.can_access_coaching_client(client_id));
create policy "participants send coaching messages" on public.coaching_messages for insert to authenticated with check(sender_id=(select auth.uid()) and public.can_access_coaching_client(client_id));
create policy "participants mark coaching messages read" on public.coaching_messages for update to authenticated using(public.can_access_coaching_client(client_id)) with check(public.can_access_coaching_client(client_id));

create or replace function public.get_my_coaching_access()
returns table(client_id uuid,status text,onboarding_step integer,onboarding_completed boolean,coach_id uuid,coach_name text,coach_avatar_url text)
language sql stable security definer set search_path='' as $$
  select c.client_id,c.status,c.onboarding_step,c.onboarding_completed,c.coach_id,
    coalesce(nullif(p.username,''),nullif(p.full_name,''),'Équipe STOA'),p.avatar_url
  from public.coaching_clients c left join public.profiles p on p.id=c.coach_id
  where c.client_id=(select auth.uid()) and c.status in ('onboarding','active') and (c.ends_at is null or c.ends_at>now());
$$;

create or replace function public.get_coaching_client_summaries()
returns table(client_id uuid,display_name text,email text,avatar_url text,status text,onboarding_completed boolean,coach_id uuid,last_checkin_at timestamptz,unread_messages bigint,active_goals bigint,questionnaire_submitted boolean,has_active_plan boolean,checkin_due boolean,review_due boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_coaching_staff() then raise exception 'Not authorized'; end if;
  return query select c.client_id,coalesce(nullif(p.username,''),nullif(p.full_name,''),'Client STOA'),u.email::text,p.avatar_url,c.status,c.onboarding_completed,c.coach_id,
    (select max(ci.submitted_at) from public.coaching_checkins ci where ci.client_id=c.client_id),
    (select count(*) from public.coaching_messages m where m.client_id=c.client_id and m.sender_id=c.client_id and m.read_at is null),
    (select count(*) from public.coaching_goals g where g.client_id=c.client_id and g.status='active'),
    exists(select 1 from public.coaching_questionnaires q where q.client_id=c.client_id and q.kind='admission' and q.status in ('submitted','reviewed')),
    exists(select 1 from public.coaching_plans pl where pl.client_id=c.client_id and pl.status='active'),
    not exists(select 1 from public.coaching_checkins ci where ci.client_id=c.client_id and ci.submitted_at >= now()-interval '8 days'),
    not exists(select 1 from public.coaching_reviews r where r.client_id=c.client_id and r.kind='monthly' and r.created_at >= now()-interval '35 days')
  from public.coaching_clients c join public.profiles p on p.id=c.client_id join auth.users u on u.id=c.client_id
  where public.is_admin() or c.coach_id=(select auth.uid()) order by c.created_at desc;
end $$;

create or replace function public.admin_set_coaching_client(p_client_id uuid,p_coach_id uuid,p_status text default 'onboarding',p_access_source text default 'manual',p_stripe_subscription_id text default null)
returns public.coaching_clients language plpgsql security definer set search_path='' as $$
declare result public.coaching_clients;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('onboarding','active','paused','completed','cancelled') then raise exception 'Invalid status'; end if;
  if p_coach_id is not null then insert into public.coaching_staff(user_id,active) values(p_coach_id,true) on conflict(user_id) do update set active=true; end if;
  insert into public.coaching_clients(client_id,coach_id,status,access_source,stripe_subscription_id)
  values(p_client_id,p_coach_id,p_status,p_access_source,p_stripe_subscription_id)
  on conflict(client_id) do update set coach_id=excluded.coach_id,status=excluded.status,access_source=excluded.access_source,stripe_subscription_id=coalesce(excluded.stripe_subscription_id,public.coaching_clients.stripe_subscription_id),updated_at=now()
  returning * into result; return result;
end $$;

create or replace function public.complete_coaching_onboarding(p_questionnaire_id uuid,p_summary jsonb,p_priorities text[],p_constraints text[],p_preferences jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid());
begin
  if not public.has_coaching_access(v_user) then raise exception 'Coaching access required'; end if;
  if not exists(select 1 from public.coaching_questionnaires where id=p_questionnaire_id and client_id=v_user and kind='admission') then raise exception 'Questionnaire not found'; end if;
  update public.coaching_questionnaires set status='submitted',current_step=12,submitted_at=now(),updated_at=now() where id=p_questionnaire_id and client_id=v_user;
  insert into public.coaching_profiles(client_id,summary,priorities,constraints,preferences)
  values(v_user,coalesce(p_summary,'{}'::jsonb),coalesce(p_priorities,'{}'),coalesce(p_constraints,'{}'),coalesce(p_preferences,'{}'::jsonb))
  on conflict(client_id) do update set summary=excluded.summary,priorities=excluded.priorities,constraints=excluded.constraints,preferences=excluded.preferences,updated_at=now();
  update public.coaching_clients set onboarding_completed=true,onboarding_step=12,status=case when status='onboarding' then 'active' else status end,updated_at=now() where client_id=v_user;
end $$;

revoke all on function public.get_my_coaching_access(),public.get_coaching_client_summaries(),public.admin_set_coaching_client(uuid,uuid,text,text,text),public.complete_coaching_onboarding(uuid,jsonb,text[],text[],jsonb) from public;
grant execute on function public.get_my_coaching_access(),public.get_coaching_client_summaries(),public.admin_set_coaching_client(uuid,uuid,text,text,text),public.complete_coaching_onboarding(uuid,jsonb,text[],text[],jsonb) to authenticated;

alter table public.coaching_messages replica identity full;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='coaching_messages') then alter publication supabase_realtime add table public.coaching_messages; end if;
end $$;
