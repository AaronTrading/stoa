-- PostgreSQL has no generate_series(time,time,interval). Generate quarter-hour
-- offsets explicitly so recurring availability works when the RPC is called.
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
  select v_user,(day::date+p_start_time+(quarter.index*interval '15 minutes'))::timestamp at time zone 'Europe/Paris',15
  from generate_series(p_from::timestamp,p_until::timestamp,interval '1 day') day
  cross join generate_series(0,greatest(0,(extract(epoch from (p_end_time-p_start_time))/900)::integer-1)) quarter(index)
  where extract(isodow from day)::integer=p_weekday
    and ((day::date+p_start_time+(quarter.index*interval '15 minutes'))::timestamp at time zone 'Europe/Paris')>=now()+interval '8 hours'
  on conflict(coach_id,starts_at) do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end; $$;

revoke all on function public.create_recurring_coaching_availability(integer,time,time,date,date) from public,anon;
grant execute on function public.create_recurring_coaching_availability(integer,time,time,date,date) to authenticated;
