-- Deux offres, un seul code public : chaque programme peut désormais appliquer
-- un code Stripe et un taux de commission différents à l'Académie et au Coaching.
alter table public.affiliate_programs
  add column if not exists stripe_academy_promotion_code_id text,
  add column if not exists stripe_coaching_promotion_code_id text,
  add column if not exists academy_commission_rate numeric(5,2),
  add column if not exists coaching_commission_rate numeric(5,2);

update public.affiliate_programs
set stripe_academy_promotion_code_id=coalesce(stripe_academy_promotion_code_id,stripe_promotion_code_id),
    stripe_coaching_promotion_code_id=coalesce(stripe_coaching_promotion_code_id,stripe_promotion_code_id),
    academy_commission_rate=coalesce(academy_commission_rate,commission_rate),
    coaching_commission_rate=coalesce(coaching_commission_rate,commission_rate)
where stripe_academy_promotion_code_id is null
   or stripe_coaching_promotion_code_id is null
   or academy_commission_rate is null
   or coaching_commission_rate is null;

alter table public.affiliate_programs
  alter column academy_commission_rate set default 10,
  alter column academy_commission_rate set not null,
  alter column coaching_commission_rate set default 10,
  alter column coaching_commission_rate set not null;

alter table public.affiliate_programs
  drop constraint if exists affiliate_programs_academy_commission_rate_check,
  drop constraint if exists affiliate_programs_coaching_commission_rate_check;
alter table public.affiliate_programs
  add constraint affiliate_programs_academy_commission_rate_check check (academy_commission_rate between 0 and 100),
  add constraint affiliate_programs_coaching_commission_rate_check check (coaching_commission_rate between 0 and 100);

create or replace function public.admin_upsert_affiliate_v2(
  p_email text,p_slug text,p_promo_code text,
  p_stripe_academy_promotion_code_id text,p_stripe_coaching_promotion_code_id text,
  p_discount_label text,p_academy_commission_rate numeric,p_coaching_commission_rate numeric,
  p_attribution_days integer,p_status text
)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid; v_slug text:=lower(btrim(coalesce(p_slug,''))); v_code text:=upper(btrim(coalesce(p_promo_code,'')));
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  select id into v_user from auth.users where lower(email)=lower(btrim(coalesce(p_email,''))) limit 1;
  if v_user is null then raise exception 'Aucun compte STOA ne correspond à cet e-mail'; end if;
  if v_slug !~ '^[a-z0-9][a-z0-9_-]{2,39}$' then raise exception 'Le lien doit contenir 3 à 40 lettres minuscules, chiffres, tirets ou tirets bas'; end if;
  if v_code !~ '^[A-Z0-9_-]{3,32}$' then raise exception 'Le code doit contenir 3 à 32 lettres, chiffres, tirets ou tirets bas'; end if;
  if p_academy_commission_rate not between 0 and 100 or p_coaching_commission_rate not between 0 and 100
     or p_attribution_days not between 1 and 365 or p_status not in ('active','suspended','disabled')
  then raise exception 'Configuration invalide'; end if;
  insert into public.affiliate_programs(
    user_id,slug,promo_code,stripe_promotion_code_id,stripe_academy_promotion_code_id,stripe_coaching_promotion_code_id,
    discount_label,commission_rate,academy_commission_rate,coaching_commission_rate,attribution_days,status,created_by
  ) values(
    v_user,v_slug,v_code,nullif(btrim(coalesce(p_stripe_academy_promotion_code_id,'')),''),
    nullif(btrim(coalesce(p_stripe_academy_promotion_code_id,'')),''),nullif(btrim(coalesce(p_stripe_coaching_promotion_code_id,'')),''),
    left(coalesce(nullif(btrim(p_discount_label),''),'Offre membre STOA'),100),p_academy_commission_rate,
    p_academy_commission_rate,p_coaching_commission_rate,p_attribution_days,p_status,(select auth.uid())
  )
  on conflict(user_id) do update set
    slug=excluded.slug,promo_code=excluded.promo_code,
    stripe_promotion_code_id=excluded.stripe_promotion_code_id,
    stripe_academy_promotion_code_id=excluded.stripe_academy_promotion_code_id,
    stripe_coaching_promotion_code_id=excluded.stripe_coaching_promotion_code_id,
    discount_label=excluded.discount_label,commission_rate=excluded.commission_rate,
    academy_commission_rate=excluded.academy_commission_rate,coaching_commission_rate=excluded.coaching_commission_rate,
    attribution_days=excluded.attribution_days,status=excluded.status,updated_at=now();
  return v_user;
end;
$$;
revoke all on function public.admin_upsert_affiliate_v2(text,text,text,text,text,text,numeric,numeric,integer,text) from public,anon;
grant execute on function public.admin_upsert_affiliate_v2(text,text,text,text,text,text,numeric,numeric,integer,text) to authenticated;

drop function if exists public.admin_list_affiliates();
create function public.admin_list_affiliates()
returns table(
  user_id uuid,email text,display_name text,slug text,promo_code text,
  stripe_academy_promotion_code_id text,stripe_coaching_promotion_code_id text,discount_label text,
  academy_commission_rate numeric,coaching_commission_rate numeric,attribution_days integer,status text,clicks bigint,referrals bigint
)
language sql stable security definer set search_path=''
as $$
  select a.user_id,u.email::text,coalesce(nullif(concat_ws(' ',p.first_name,p.last_name),''),p.full_name,p.username,u.email::text),
    a.slug,a.promo_code,a.stripe_academy_promotion_code_id,a.stripe_coaching_promotion_code_id,a.discount_label,
    a.academy_commission_rate,a.coaching_commission_rate,a.attribution_days,a.status,
    (select count(*) from public.affiliate_clicks c where c.affiliate_user_id=a.user_id),
    (select count(*) from public.affiliate_referrals r where r.affiliate_user_id=a.user_id)
  from public.affiliate_programs a join auth.users u on u.id=a.user_id left join public.profiles p on p.id=a.user_id
  where public.is_admin() order by a.created_at desc;
$$;
revoke all on function public.admin_list_affiliates() from public,anon;
grant execute on function public.admin_list_affiliates() to authenticated;

create or replace function public.get_affiliate_dashboard()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_program public.affiliate_programs%rowtype; v_result jsonb;
begin
  select * into v_program from public.affiliate_programs where user_id=v_user and status='active';
  if v_program.user_id is null then raise exception 'Programme d’affiliation inactif' using errcode='42501'; end if;
  with days as (
    select generate_series(current_date-29,current_date,interval '1 day')::date as metric_day
  ), daily as (
    select d.metric_day,
      (select count(*) from public.affiliate_clicks c where c.affiliate_user_id=v_user and c.created_at>=d.metric_day and c.created_at<d.metric_day+1)::integer clicks,
      (select count(*) from public.affiliate_referrals r where r.affiliate_user_id=v_user and r.attributed_at>=d.metric_day and r.attributed_at<d.metric_day+1)::integer referrals
    from days d
  )
  select jsonb_build_object(
    'program',jsonb_build_object(
      'slug',v_program.slug,'promo_code',v_program.promo_code,'discount_label',v_program.discount_label,
      'academy_commission_rate',v_program.academy_commission_rate,
      'coaching_commission_rate',v_program.coaching_commission_rate,
      'attribution_days',v_program.attribution_days
    ),
    'metrics',jsonb_build_object(
      'clicks_30d',(select count(*) from public.affiliate_clicks where affiliate_user_id=v_user and created_at>=now()-interval '30 days'),
      'referrals_total',(select count(*) from public.affiliate_referrals where affiliate_user_id=v_user),
      'active_referrals',(select count(*) from public.affiliate_referrals where affiliate_user_id=v_user and status='active'),
      'pending_commission',(select coalesce(sum(c.commission_amount),0) from public.affiliate_commissions c join public.affiliate_referrals r on r.id=c.referral_id where r.affiliate_user_id=v_user and c.status in ('pending','approved')),
      'paid_commission',(select coalesce(sum(c.commission_amount),0) from public.affiliate_commissions c join public.affiliate_referrals r on r.id=c.referral_id where r.affiliate_user_id=v_user and c.status='paid')
    ),
    'daily',(select coalesce(jsonb_agg(jsonb_build_object('date',metric_day,'clicks',clicks,'referrals',referrals) order by metric_day),'[]'::jsonb) from daily),
    'recent_referrals',(select coalesce(jsonb_agg(to_jsonb(x) order by x.attributed_at desc),'[]'::jsonb) from (
      select r.offer,r.status,r.attributed_at,coalesce(nullif(p.first_name,''),'Membre') member_name,
        coalesce((select sum(c.commission_amount) from public.affiliate_commissions c where c.referral_id=r.id and c.status<>'reversed'),0) commission_amount
      from public.affiliate_referrals r left join public.profiles p on p.id=r.referred_user_id
      where r.affiliate_user_id=v_user order by r.attributed_at desc limit 12
    ) x)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.get_affiliate_dashboard() from public,anon;
grant execute on function public.get_affiliate_dashboard() to authenticated;
