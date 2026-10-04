-- Simple STOA call booking: coaches publish one-time slots, visitors book at
-- least eight hours in advance, and Coaching onboarding requires a booking.

create table public.coaching_availability_slots(
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null default 15 check(duration_minutes between 15 and 120),
  status text not null default 'available' check(status in ('available','booked','blocked')),
  created_at timestamptz not null default now(),
  unique(coach_id,starts_at)
);

create table public.coaching_call_bookings(
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null unique references public.coaching_availability_slots(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null check(char_length(btrim(first_name)) between 1 and 80),
  last_name text not null check(char_length(btrim(last_name)) between 1 and 80),
  email text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  postal_code text not null,
  city text not null,
  country text not null,
  reason text not null default '' check(char_length(reason)<=1500),
  stage text not null default 'pre_purchase' check(stage in ('pre_purchase','post_purchase')),
  status text not null default 'confirmed' check(status in ('confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coaching_slots_available_idx on public.coaching_availability_slots(status,starts_at);
create index coaching_bookings_user_idx on public.coaching_call_bookings(user_id,created_at desc);
create index coaching_bookings_email_idx on public.coaching_call_bookings(lower(email),created_at desc);
alter table public.coaching_availability_slots enable row level security;
alter table public.coaching_call_bookings enable row level security;
grant select on public.coaching_availability_slots to anon,authenticated;
grant select,insert,update,delete on public.coaching_availability_slots to authenticated;
grant select on public.coaching_call_bookings to authenticated;
grant select,insert,update,delete on public.coaching_availability_slots,public.coaching_call_bookings to service_role;

create policy "public read future coaching slots" on public.coaching_availability_slots for select to anon,authenticated
  using(status='available' and starts_at>=now()+interval '8 hours' or coach_id=(select auth.uid()) or (select public.is_admin()));
create policy "coaches manage own availability" on public.coaching_availability_slots for all to authenticated
  using(coach_id=(select auth.uid()) and public.is_coaching_staff() or (select public.is_admin()))
  with check(coach_id=(select auth.uid()) and public.is_coaching_staff() or (select public.is_admin()));
create policy "clients read own call bookings" on public.coaching_call_bookings for select to authenticated
  using(
    user_id=(select auth.uid())
    or exists(
      select 1
      from public.coaching_availability_slots slot
      where slot.id=slot_id
        and (slot.coach_id=(select auth.uid()) or (select public.is_admin()))
    )
  );

create trigger coaching_call_bookings_updated_at before update on public.coaching_call_bookings
  for each row execute function public.set_updated_at();

create or replace function public.book_coaching_call(
  p_slot_id uuid,p_user_id uuid,p_first_name text,p_last_name text,p_email text,p_phone text,
  p_address_line1 text,p_address_line2 text,p_postal_code text,p_city text,p_country text,p_reason text,p_stage text
)
returns table(booking_id uuid,coach_id uuid,coach_email text,starts_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare slot public.coaching_availability_slots%rowtype; booking uuid; notification_email text;
begin
  if coalesce(p_stage,'') not in ('pre_purchase','post_purchase') then raise exception 'Invalid booking stage'; end if;
  if position('@' in coalesce(p_email,''))<2 then raise exception 'Invalid email'; end if;
  if nullif(btrim(p_first_name),'') is null or nullif(btrim(p_last_name),'') is null
    or nullif(btrim(p_address_line1),'') is null or nullif(btrim(p_postal_code),'') is null
    or nullif(btrim(p_city),'') is null or nullif(btrim(p_country),'') is null then raise exception 'Missing booking details'; end if;
  select * into slot from public.coaching_availability_slots where id=p_slot_id for update;
  if slot.id is null or slot.status<>'available' then raise exception 'Slot unavailable'; end if;
  if slot.starts_at<now()+interval '8 hours' then raise exception 'A call must be booked at least eight hours in advance'; end if;
  insert into public.coaching_call_bookings(slot_id,user_id,first_name,last_name,email,phone,address_line1,address_line2,postal_code,city,country,reason,stage)
  values(slot.id,p_user_id,btrim(p_first_name),btrim(p_last_name),lower(btrim(p_email)),nullif(btrim(p_phone),''),btrim(p_address_line1),nullif(btrim(p_address_line2),''),btrim(p_postal_code),btrim(p_city),btrim(p_country),btrim(coalesce(p_reason,'')),p_stage)
  returning id into booking;
  update public.coaching_availability_slots set status='booked' where id=slot.id;
  select email::text into notification_email from auth.users where id=slot.coach_id;
  return query select booking,slot.coach_id,notification_email,slot.starts_at;
end; $$;
revoke all on function public.book_coaching_call(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.book_coaching_call(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text) to service_role;

create or replace function public.complete_coaching_onboarding(p_questionnaire_id uuid,p_summary jsonb,p_priorities text[],p_constraints text[],p_preferences jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_email text;
begin
  if not public.has_coaching_access(v_user) then raise exception 'Coaching access required'; end if;
  select lower(email::text) into v_email from auth.users where id=v_user;
  if not exists(select 1 from public.coaching_call_bookings booking where booking.status='confirmed' and (booking.user_id=v_user or lower(booking.email)=v_email)) then raise exception 'A coaching call must be booked before completing onboarding'; end if;
  update public.coaching_call_bookings set user_id=v_user,stage='post_purchase' where user_id is null and lower(email)=v_email and status='confirmed';
  if not exists(select 1 from public.coaching_questionnaires where id=p_questionnaire_id and client_id=v_user and kind='admission') then raise exception 'Questionnaire not found'; end if;
  update public.coaching_questionnaires set status='submitted',current_step=12,submitted_at=now(),updated_at=now() where id=p_questionnaire_id and client_id=v_user;
  insert into public.coaching_profiles(client_id,summary,priorities,constraints,preferences)
  values(v_user,coalesce(p_summary,'{}'::jsonb),coalesce(p_priorities,'{}'),coalesce(p_constraints,'{}'),coalesce(p_preferences,'{}'::jsonb))
  on conflict(client_id) do update set summary=excluded.summary,priorities=excluded.priorities,constraints=excluded.constraints,preferences=excluded.preferences,updated_at=now();
  update public.coaching_clients set onboarding_completed=true,onboarding_step=12,status=case when status='onboarding' then 'active' else status end,updated_at=now() where client_id=v_user;
end; $$;
