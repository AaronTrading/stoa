-- Security and performance hardening for public booking, Stripe checkout,
-- Academy search, email delivery and the Coaching workspace.

-- Never let a failed notification leave a booking looking confirmed.
alter table public.coaching_availability_slots drop constraint if exists coaching_availability_slots_status_check;
alter table public.coaching_availability_slots
  add constraint coaching_availability_slots_status_check check(status in ('available','held','booked','blocked'));

alter table public.coaching_call_bookings drop constraint if exists coaching_call_bookings_status_check;
alter table public.coaching_call_bookings
  add constraint coaching_call_bookings_status_check check(status in ('pending_confirmation','confirmed','cancelled','completed'));
alter table public.coaching_call_bookings add column if not exists confirmed_at timestamptz;
update public.coaching_call_bookings set confirmed_at=coalesce(confirmed_at,created_at) where status='confirmed';

create table if not exists public.booking_request_limits(
  fingerprint text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.booking_request_limits enable row level security;
revoke all on public.booking_request_limits from public,anon,authenticated;
grant select,insert,update,delete on public.booking_request_limits to service_role;

create or replace function public.consume_booking_rate_limit(p_fingerprint text,p_max_attempts integer default 5,p_window_minutes integer default 60)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_row public.booking_request_limits%rowtype; v_now timestamptz:=now();
begin
  if nullif(btrim(p_fingerprint),'') is null then return false; end if;
  insert into public.booking_request_limits(fingerprint,window_started_at,attempts,updated_at)
  values(p_fingerprint,v_now,1,v_now)
  on conflict(fingerprint) do update set
    window_started_at=case when public.booking_request_limits.window_started_at < v_now-make_interval(mins=>greatest(1,p_window_minutes)) then v_now else public.booking_request_limits.window_started_at end,
    attempts=case when public.booking_request_limits.window_started_at < v_now-make_interval(mins=>greatest(1,p_window_minutes)) then 1 else public.booking_request_limits.attempts+1 end,
    blocked_until=case when public.booking_request_limits.window_started_at >= v_now-make_interval(mins=>greatest(1,p_window_minutes)) and public.booking_request_limits.attempts+1>greatest(1,p_max_attempts) then v_now+interval '1 hour' else public.booking_request_limits.blocked_until end,
    updated_at=v_now
  returning * into v_row;
  return coalesce(v_row.blocked_until<=v_now,true) and v_row.attempts<=greatest(1,p_max_attempts);
end; $$;
revoke all on function public.consume_booking_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_booking_rate_limit(text,integer,integer) to service_role;

create or replace function public.cleanup_stale_coaching_booking_holds()
returns integer language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
  with stale as (
    update public.coaching_call_bookings
    set status='cancelled',updated_at=now()
    where status='pending_confirmation' and created_at<now()-interval '10 minutes'
    returning slot_id
  )
  update public.coaching_availability_slots slot set status='available'
  where slot.status='held' and slot.id in(select slot_id from stale);
  get diagnostics v_count=row_count;
  return v_count;
end; $$;
revoke all on function public.cleanup_stale_coaching_booking_holds() from public,anon,authenticated;
grant execute on function public.cleanup_stale_coaching_booking_holds() to service_role;

create or replace function public.book_coaching_call(
  p_slot_id uuid,p_user_id uuid,p_first_name text,p_last_name text,p_email text,p_phone text,
  p_address_line1 text,p_address_line2 text,p_postal_code text,p_city text,p_country text,p_reason text,p_stage text
)
returns table(booking_id uuid,coach_id uuid,coach_email text,starts_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare slot public.coaching_availability_slots%rowtype; booking uuid; notification_email text; normalized_email text:=lower(btrim(p_email));
begin
  perform public.cleanup_stale_coaching_booking_holds();
  if coalesce(p_stage,'') not in ('pre_purchase','post_purchase') then raise exception 'Invalid booking stage'; end if;
  if position('@' in coalesce(normalized_email,''))<2 then raise exception 'Invalid email'; end if;
  if nullif(btrim(p_first_name),'') is null or nullif(btrim(p_last_name),'') is null
    or nullif(btrim(p_address_line1),'') is null or nullif(btrim(p_postal_code),'') is null
    or nullif(btrim(p_city),'') is null or nullif(btrim(p_country),'') is null then raise exception 'Missing booking details'; end if;
  if exists(
    select 1 from public.coaching_call_bookings booking
    join public.coaching_availability_slots future_slot on future_slot.id=booking.slot_id
    where lower(booking.email)=normalized_email and booking.status in ('pending_confirmation','confirmed') and future_slot.starts_at>now()
  ) then raise exception 'Future booking already exists'; end if;
  select * into slot from public.coaching_availability_slots where id=p_slot_id for update;
  if slot.id is null or slot.status<>'available' then raise exception 'Slot unavailable'; end if;
  if slot.starts_at<now()+interval '8 hours' then raise exception 'A call must be booked at least eight hours in advance'; end if;
  insert into public.coaching_call_bookings(slot_id,user_id,first_name,last_name,email,phone,address_line1,address_line2,postal_code,city,country,reason,stage,status)
  values(slot.id,p_user_id,btrim(p_first_name),btrim(p_last_name),normalized_email,nullif(btrim(p_phone),''),btrim(p_address_line1),nullif(btrim(p_address_line2),''),btrim(p_postal_code),btrim(p_city),btrim(p_country),btrim(coalesce(p_reason,'')),p_stage,'pending_confirmation')
  returning id into booking;
  update public.coaching_availability_slots set status='held' where id=slot.id;
  select email::text into notification_email from auth.users where id=slot.coach_id;
  return query select booking,slot.coach_id,notification_email,slot.starts_at;
end; $$;
revoke all on function public.book_coaching_call(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.book_coaching_call(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text) to service_role;

create or replace function public.confirm_coaching_booking_notifications(p_booking_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_slot uuid;
begin
  update public.coaching_call_bookings set status='confirmed',confirmed_at=now(),updated_at=now()
  where id=p_booking_id and status='pending_confirmation' returning slot_id into v_slot;
  if v_slot is null then return false; end if;
  update public.coaching_availability_slots set status='booked' where id=v_slot and status='held';
  return found;
end; $$;

create or replace function public.release_coaching_booking_hold(p_booking_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_slot uuid;
begin
  update public.coaching_call_bookings set status='cancelled',updated_at=now()
  where id=p_booking_id and status='pending_confirmation' returning slot_id into v_slot;
  if v_slot is null then return false; end if;
  update public.coaching_availability_slots set status='available' where id=v_slot and status='held';
  return true;
end; $$;
revoke all on function public.confirm_coaching_booking_notifications(uuid),public.release_coaching_booking_hold(uuid) from public,anon,authenticated;
grant execute on function public.confirm_coaching_booking_notifications(uuid),public.release_coaching_booking_hold(uuid) to service_role;

-- Publish the same weekly window over any bounded date range (up to one year).
create or replace function public.create_recurring_coaching_availability(
  p_weekday integer,p_start_time time,p_end_time time,p_from date,p_until date
)
returns integer language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_count integer;
begin
  if v_user is null or not public.is_coaching_staff() then raise exception 'Accès coach requis'; end if;
  if p_weekday not between 1 and 7 or p_start_time<'07:00'::time or p_end_time>'21:15'::time or p_end_time<=p_start_time then raise exception 'Plage horaire invalide'; end if;
  if p_from<current_date or p_until<p_from or p_until>p_from+366 then raise exception 'Période invalide'; end if;
  insert into public.coaching_availability_slots(coach_id,starts_at,duration_minutes)
  select v_user,(day::date+slot_time)::timestamp at time zone 'Europe/Paris',15
  from generate_series(p_from::timestamp,p_until::timestamp,interval '1 day') day
  cross join lateral generate_series(p_start_time,p_end_time-interval '15 minutes',interval '15 minutes') slot_time
  where extract(isodow from day)::integer=p_weekday
    and ((day::date+slot_time)::timestamp at time zone 'Europe/Paris')>=now()+interval '8 hours'
  on conflict(coach_id,starts_at) do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end; $$;
revoke all on function public.create_recurring_coaching_availability(integer,time,time,date,date) from public,anon;
grant execute on function public.create_recurring_coaching_availability(integer,time,time,date,date) to authenticated;

-- One active Checkout session per user and offer. The database lock closes the
-- race that Stripe-side subscription checks cannot close on their own.
create table if not exists public.checkout_session_locks(
  user_id uuid not null references auth.users(id) on delete cascade,
  offer text not null check(offer in ('academy','coaching')),
  attempt_id uuid,
  state text not null default 'idle' check(state in ('idle','creating','ready')),
  stripe_session_id text,
  session_url text,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,offer)
);
alter table public.checkout_session_locks enable row level security;
revoke all on public.checkout_session_locks from public,anon,authenticated;
grant select,insert,update,delete on public.checkout_session_locks to service_role;

create or replace function public.claim_checkout_session(p_user_id uuid,p_offer text)
returns table(action text,attempt_id uuid,stripe_session_id text,session_url text)
language plpgsql security definer set search_path='' as $$
declare v_row public.checkout_session_locks%rowtype; v_attempt uuid:=gen_random_uuid();
begin
  if p_offer not in ('academy','coaching') or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'Invalid checkout claim'; end if;
  insert into public.checkout_session_locks(user_id,offer) values(p_user_id,p_offer) on conflict do nothing;
  select * into v_row from public.checkout_session_locks where user_id=p_user_id and offer=p_offer for update;
  if v_row.state='ready' and v_row.session_url is not null and v_row.expires_at>now()+interval '1 minute' then
    return query select 'reuse'::text,v_row.attempt_id,v_row.stripe_session_id,v_row.session_url; return;
  end if;
  if v_row.state='creating' and v_row.updated_at>now()-interval '2 minutes' then
    return query select 'busy'::text,v_row.attempt_id,null::text,null::text; return;
  end if;
  update public.checkout_session_locks set state='creating',attempt_id=v_attempt,stripe_session_id=null,session_url=null,expires_at=null,updated_at=now()
  where user_id=p_user_id and offer=p_offer;
  return query select 'create'::text,v_attempt,null::text,null::text;
end; $$;

create or replace function public.complete_checkout_session(p_user_id uuid,p_offer text,p_attempt_id uuid,p_session_id text,p_url text,p_expires_at timestamptz)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  update public.checkout_session_locks set state='ready',stripe_session_id=p_session_id,session_url=p_url,expires_at=p_expires_at,updated_at=now()
  where user_id=p_user_id and offer=p_offer and state='creating' and attempt_id=p_attempt_id;
  return found;
end; $$;

create or replace function public.release_checkout_session(p_user_id uuid,p_offer text,p_attempt_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  update public.checkout_session_locks set state='idle',stripe_session_id=null,session_url=null,expires_at=null,updated_at=now()
  where user_id=p_user_id and offer=p_offer and state='creating' and attempt_id=p_attempt_id;
  return found;
end; $$;
revoke all on function public.claim_checkout_session(uuid,text),public.complete_checkout_session(uuid,text,uuid,text,text,timestamptz),public.release_checkout_session(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.claim_checkout_session(uuid,text),public.complete_checkout_session(uuid,text,uuid,text,text,timestamptz),public.release_checkout_session(uuid,text,uuid) to service_role;

-- Bounded, retryable email batches.
alter table public.email_deliveries add column if not exists attempt_count integer not null default 0;

-- Search stays in PostgreSQL: the browser receives at most a few snippets,
-- never the complete contents of every lesson.
create index if not exists subchapters_search_document_idx on public.subchapters using gin(
  to_tsvector('french',coalesce(title,'')||' '||regexp_replace(coalesce(content,''),'<[^>]+>',' ','g'))
);
create index if not exists modules_search_document_idx on public.modules using gin(
  to_tsvector('french',coalesce(title,'')||' '||coalesce(description,''))
);

create or replace function public.search_academy_content(p_query text,p_limit integer default 8)
returns table(module_id uuid,module_title text,chapter_title text,pillar_title text,chapter_order integer,module_order integer,section_id uuid,excerpt text,rank real)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.has_active_academy_access() then raise exception 'Accès Académie requis'; end if;
  if char_length(btrim(coalesce(p_query,'')))<2 then return; end if;
  return query
  with q as(select websearch_to_tsquery('french',left(btrim(p_query),160)) value), ranked as(
    select m.id module_id,m.title module_title,c.title chapter_title,p.title pillar_title,c.order_index chapter_order,m.order_index module_order,
      s.id section_id,left(regexp_replace(coalesce(s.content,m.description,''),'<[^>]+>',' ','g'),260) excerpt,
      (ts_rank(to_tsvector('french',coalesce(m.title,'')||' '||coalesce(m.description,'')),q.value)
       +coalesce(ts_rank(to_tsvector('french',coalesce(s.title,'')||' '||regexp_replace(coalesce(s.content,''),'<[^>]+>',' ','g')),q.value),0))::real rank
    from public.modules m join public.chapters c on c.id=m.chapter_id left join public.pillars p on p.id=c.pillar_id cross join q
    left join public.subchapters s on s.module_id=m.id and to_tsvector('french',coalesce(s.title,'')||' '||regexp_replace(coalesce(s.content,''),'<[^>]+>',' ','g'))@@q.value
    where coalesce(m.is_visible,true) and (to_tsvector('french',coalesce(m.title,'')||' '||coalesce(m.description,''))@@q.value or s.id is not null)
  ), deduplicated as(
    select distinct on(ranked.module_id) * from ranked order by ranked.module_id,ranked.rank desc,ranked.section_id nulls last
  )
  select d.module_id,d.module_title,d.chapter_title,d.pillar_title,d.chapter_order,d.module_order,d.section_id,d.excerpt,d.rank
  from deduplicated d order by d.rank desc,d.chapter_order,d.module_order limit least(greatest(coalesce(p_limit,8),1),20);
end; $$;
revoke all on function public.search_academy_content(text,integer) from public,anon;
grant execute on function public.search_academy_content(text,integer) to authenticated;

-- Replace eleven per-client requests with one bounded snapshot.
create or replace function public.get_coaching_client_detail(p_client_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.can_coach_client(p_client_id) then raise exception 'Accès coach requis'; end if;
  select jsonb_build_object(
    'profile',(select to_jsonb(x) from public.coaching_profiles x where x.client_id=p_client_id),
    'responses',coalesce((select jsonb_agg(to_jsonb(x) order by x.answered_at) from (select * from public.coaching_questionnaire_responses where client_id=p_client_id order by answered_at desc limit 300) x),'[]'::jsonb),
    'goals',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.coaching_goals where client_id=p_client_id order by created_at desc limit 100) x),'[]'::jsonb),
    'tasks',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.coaching_tasks where client_id=p_client_id order by created_at desc limit 150) x),'[]'::jsonb),
    'habits',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.coaching_habits where client_id=p_client_id order by created_at desc limit 100) x),'[]'::jsonb),
    'assignments',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select a.*,jsonb_build_object('title',m.title) modules from public.coaching_assignments a join public.modules m on m.id=a.module_id where a.client_id=p_client_id order by a.created_at desc limit 150) x),'[]'::jsonb),
    'checkins',coalesce((select jsonb_agg(to_jsonb(x) order by x.period_start desc) from (select * from public.coaching_checkins where client_id=p_client_id order by period_start desc limit 52) x),'[]'::jsonb),
    'plans',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.coaching_plans where client_id=p_client_id order by created_at desc limit 30) x),'[]'::jsonb),
    'appointments',coalesce((select jsonb_agg(to_jsonb(x) order by x.starts_at) from (select * from public.coaching_appointments where client_id=p_client_id and starts_at>=now() order by starts_at limit 10) x),'[]'::jsonb),
    'messages',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from (select * from public.coaching_messages where client_id=p_client_id order by created_at desc limit 200) x),'[]'::jsonb),
    'notes',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.coaching_notes where client_id=p_client_id order by created_at desc limit 100) x),'[]'::jsonb)
  ) into result;
  return result;
end; $$;
revoke all on function public.get_coaching_client_detail(uuid) from public,anon;
grant execute on function public.get_coaching_client_detail(uuid) to authenticated;

create or replace function public.get_my_support_conversations()
returns table(conversation_id uuid,is_anonymous boolean,created_at timestamptz,updated_at timestamptz,last_message text,last_message_at timestamptz,unread_count bigint)
language sql stable security definer set search_path='' as $$
  select c.id,c.is_anonymous,c.created_at,c.updated_at,last.content,last.created_at,
    (select count(*) from public.support_messages unread where unread.conversation_id=c.id and unread.sender_id<>c.member_id and unread.read_at is null)
  from public.support_conversations c
  left join lateral(select m.content,m.created_at from public.support_messages m where m.conversation_id=c.id order by m.created_at desc limit 1) last on true
  where c.member_id=(select auth.uid()) order by c.updated_at desc limit 50;
$$;

create or replace function public.get_support_inbox()
returns table(conversation_id uuid,is_anonymous boolean,member_id uuid,display_name text,username text,avatar_url text,last_message text,last_message_at timestamptz,unread_count bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Accès réservé au staff'; end if;
  return query
  select c.id,c.is_anonymous,case when c.is_anonymous then null else c.member_id end,
    case when c.is_anonymous then 'Conversation anonyme' else coalesce(nullif(btrim(concat_ws(' ',p.first_name,p.last_name)),''),nullif(p.full_name,''),'Membre STOA') end,
    case when c.is_anonymous then null else p.username end,case when c.is_anonymous then null else p.avatar_url end,last.content,last.created_at,
    (select count(*) from public.support_messages unread where unread.conversation_id=c.id and unread.sender_id=c.member_id and unread.read_at is null)
  from public.support_conversations c join public.profiles p on p.id=c.member_id
  left join lateral(select m.content,m.created_at from public.support_messages m where m.conversation_id=c.id order by m.created_at desc limit 1) last on true
  where last.created_at is not null order by last.created_at desc limit 100;
end; $$;

create or replace function public.get_support_thread(p_conversation_id uuid)
returns table(id uuid,conversation_id uuid,sender_kind text,content text,created_at timestamptz,read_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare v_conversation public.support_conversations%rowtype;
begin
  select conversation.* into v_conversation from public.support_conversations conversation where conversation.id=p_conversation_id;
  if v_conversation.id is null or (v_conversation.member_id<>(select auth.uid()) and not public.is_admin()) then raise exception 'Conversation introuvable'; end if;
  return query select recent.id,recent.conversation_id,recent.sender_kind,recent.content,recent.created_at,recent.read_at from(
    select m.id,m.conversation_id,case when m.sender_id=v_conversation.member_id then 'member' else 'support' end sender_kind,m.content,m.created_at,m.read_at
    from public.support_messages m where m.conversation_id=p_conversation_id order by m.created_at desc limit 300
  ) recent order by recent.created_at;
end; $$;

revoke all on function public.get_my_support_conversations(),public.get_support_inbox(),public.get_support_thread(uuid) from public,anon;
grant execute on function public.get_my_support_conversations(),public.get_support_inbox(),public.get_support_thread(uuid) to authenticated;
