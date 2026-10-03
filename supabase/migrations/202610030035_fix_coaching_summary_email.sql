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
