create table if not exists public.training_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  subchapter_id uuid references public.subchapters(id) on delete cascade,
  question_key text not null check (char_length(question_key) between 8 and 240),
  question_type text not null check (question_type in ('choice','true_false','scenario','ordering','trap','open')),
  mastery_score smallint not null default 0 check (mastery_score between 0 and 100),
  interval_days integer not null default 0 check (interval_days between 0 and 365),
  due_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  successful_attempts integer not null default 0 check (successful_attempts >= 0),
  last_result text check (last_result in ('incorrect','hesitant','mastered')),
  last_answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,question_key)
);

create table if not exists public.training_daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  answered_count integer not null default 0 check (answered_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  is_rest_day boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,activity_date),
  constraint training_rest_day_is_empty check (not is_rest_day or (answered_count=0 and correct_count=0))
);

create index if not exists training_reviews_due_idx on public.training_reviews(user_id,due_at);
create index if not exists training_reviews_module_idx on public.training_reviews(user_id,module_id);
create index if not exists training_activity_recent_idx on public.training_daily_activity(user_id,activity_date desc);

alter table public.training_reviews enable row level security;
alter table public.training_daily_activity enable row level security;
grant select on public.training_reviews,public.training_daily_activity to authenticated;

drop policy if exists "members read own training reviews" on public.training_reviews;
create policy "members read own training reviews" on public.training_reviews for select to authenticated
using ((select auth.uid())=user_id and public.has_active_academy_access((select auth.uid())));

drop policy if exists "members read own training activity" on public.training_daily_activity;
create policy "members read own training activity" on public.training_daily_activity for select to authenticated
using ((select auth.uid())=user_id and public.has_active_academy_access((select auth.uid())));

create or replace function public.record_training_answer(
  p_module_id uuid,
  p_subchapter_id uuid,
  p_question_key text,
  p_question_type text,
  p_result text,
  p_duration_seconds integer default 0
) returns public.training_reviews
language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=(select auth.uid());
  v_previous public.training_reviews;
  v_score integer;
  v_interval integer;
  v_due timestamptz;
  v_today date:=timezone('Europe/Paris',now())::date;
  v_saved public.training_reviews;
begin
  if v_user is null or not public.has_active_academy_access(v_user) then
    raise exception 'Accès Académie requis' using errcode='42501';
  end if;
  if p_result not in ('incorrect','hesitant','mastered') then raise exception 'Résultat invalide'; end if;
  if p_question_type not in ('choice','true_false','scenario','ordering','trap','open') then raise exception 'Type invalide'; end if;
  if not exists(select 1 from public.user_learning_state s where s.user_id=v_user and s.module_id=p_module_id) then
    raise exception 'La leçon doit avoir été consultée' using errcode='42501';
  end if;
  select * into v_previous from public.training_reviews where user_id=v_user and question_key=p_question_key for update;
  if p_result='incorrect' then
    v_score:=greatest(0,coalesce(v_previous.mastery_score,20)-20);v_interval:=0;v_due:=now()+interval '8 hours';
  elsif p_result='hesitant' then
    v_score:=least(100,coalesce(v_previous.mastery_score,15)+9);v_interval:=greatest(2,ceil(greatest(coalesce(v_previous.interval_days,1),1)*1.5)::integer);v_due:=now()+make_interval(days=>v_interval);
  else
    v_score:=least(100,coalesce(v_previous.mastery_score,20)+18);
    v_interval:=case when coalesce(v_previous.interval_days,0)<7 then 7 else least(120,round(v_previous.interval_days*2.2)::integer) end;
    v_due:=now()+make_interval(days=>v_interval);
  end if;
  insert into public.training_reviews(user_id,module_id,subchapter_id,question_key,question_type,mastery_score,interval_days,due_at,attempts,successful_attempts,last_result,last_answered_at,updated_at)
  values(v_user,p_module_id,p_subchapter_id,p_question_key,p_question_type,v_score,v_interval,v_due,1,case when p_result='incorrect' then 0 else 1 end,p_result,now(),now())
  on conflict(user_id,question_key) do update set
    module_id=excluded.module_id,subchapter_id=excluded.subchapter_id,question_type=excluded.question_type,
    mastery_score=excluded.mastery_score,interval_days=excluded.interval_days,due_at=excluded.due_at,
    attempts=public.training_reviews.attempts+1,
    successful_attempts=public.training_reviews.successful_attempts+case when excluded.last_result='incorrect' then 0 else 1 end,
    last_result=excluded.last_result,last_answered_at=now(),updated_at=now()
  returning * into v_saved;
  insert into public.training_daily_activity(user_id,activity_date,answered_count,correct_count,duration_seconds,is_rest_day,updated_at)
  values(v_user,v_today,1,case when p_result='incorrect' then 0 else 1 end,least(greatest(coalesce(p_duration_seconds,0),0),300),false,now())
  on conflict(user_id,activity_date) do update set
    answered_count=public.training_daily_activity.answered_count+1,
    correct_count=public.training_daily_activity.correct_count+case when p_result='incorrect' then 0 else 1 end,
    duration_seconds=public.training_daily_activity.duration_seconds+least(greatest(coalesce(p_duration_seconds,0),0),300),
    is_rest_day=false,updated_at=now();
  return v_saved;
end; $$;

create or replace function public.claim_training_rest_day(p_date date)
returns public.training_daily_activity
language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=(select auth.uid());
  v_yesterday date:=timezone('Europe/Paris',now())::date-1;
  v_saved public.training_daily_activity;
begin
  if v_user is null or not public.has_active_academy_access(v_user) then raise exception 'Accès Académie requis' using errcode='42501'; end if;
  if p_date<>v_yesterday then raise exception 'Le jour de respiration ne peut couvrir qu’hier'; end if;
  if exists(select 1 from public.training_daily_activity where user_id=v_user and activity_date=p_date) then raise exception 'Cette journée est déjà enregistrée'; end if;
  if exists(select 1 from public.training_daily_activity where user_id=v_user and is_rest_day and activity_date between p_date-6 and p_date) then raise exception 'Un seul jour de respiration est disponible sur sept jours'; end if;
  if not exists(select 1 from public.training_daily_activity where user_id=v_user and activity_date=p_date-1 and answered_count>0) then raise exception 'Aucune série à protéger'; end if;
  insert into public.training_daily_activity(user_id,activity_date,is_rest_day,updated_at) values(v_user,p_date,true,now()) returning * into v_saved;
  return v_saved;
end; $$;

revoke all on function public.record_training_answer(uuid,uuid,text,text,text,integer) from public,anon;
revoke all on function public.claim_training_rest_day(date) from public,anon;
grant execute on function public.record_training_answer(uuid,uuid,text,text,text,integer) to authenticated;
grant execute on function public.claim_training_rest_day(date) to authenticated;
