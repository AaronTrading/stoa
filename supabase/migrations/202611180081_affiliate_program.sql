-- Programme d'affiliation STOA : attribution, statistiques, commissions et administration.

create table if not exists public.affiliate_programs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null,
  promo_code text not null,
  stripe_promotion_code_id text,
  discount_label text not null default 'Offre membre STOA',
  commission_rate numeric(5,2) not null default 10 check (commission_rate between 0 and 100),
  attribution_days integer not null default 30 check (attribution_days between 1 and 365),
  status text not null default 'active' check (status in ('active','suspended','disabled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]{2,39}$'),
  constraint affiliate_code_format check (promo_code ~ '^[A-Z0-9_-]{3,32}$')
);

create unique index if not exists affiliate_programs_slug_unique on public.affiliate_programs(lower(slug));
create unique index if not exists affiliate_programs_code_unique on public.affiliate_programs(upper(promo_code));

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.affiliate_programs(user_id) on delete cascade,
  visitor_token text not null check (char_length(visitor_token) between 16 and 100),
  landing_path text not null default '/',
  created_at timestamptz not null default now()
);
create index if not exists affiliate_clicks_owner_date_idx on public.affiliate_clicks(affiliate_user_id,created_at desc);
create index if not exists affiliate_clicks_visitor_idx on public.affiliate_clicks(visitor_token,created_at desc);

create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.affiliate_programs(user_id) on delete restrict,
  referred_user_id uuid references auth.users(id) on delete set null,
  offer text not null check (offer in ('academy','coaching')),
  promo_code text not null,
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'pending' check (status in ('pending','active','cancelled','refunded')),
  attributed_at timestamptz not null default now(),
  first_paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create unique index if not exists affiliate_referrals_user_offer_unique
  on public.affiliate_referrals(referred_user_id,offer) where referred_user_id is not null;
create index if not exists affiliate_referrals_owner_date_idx on public.affiliate_referrals(affiliate_user_id,attributed_at desc);
create index if not exists affiliate_referrals_subscription_idx on public.affiliate_referrals(stripe_subscription_id);

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.affiliate_referrals(id) on delete cascade,
  stripe_event_id text not null unique,
  stripe_invoice_id text unique,
  gross_amount integer not null check (gross_amount >= 0),
  currency text not null default 'eur',
  commission_rate numeric(5,2) not null check (commission_rate between 0 and 100),
  commission_amount integer not null check (commission_amount >= 0),
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')),
  eligible_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists affiliate_commissions_referral_idx on public.affiliate_commissions(referral_id,created_at desc);

alter table public.affiliate_programs enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_commissions enable row level security;

create policy "affiliates read own program" on public.affiliate_programs for select to authenticated
  using (user_id=(select auth.uid()) or (select public.is_admin()));
create policy "affiliates read own clicks" on public.affiliate_clicks for select to authenticated
  using (affiliate_user_id=(select auth.uid()) or (select public.is_admin()));
create policy "affiliates read own referrals" on public.affiliate_referrals for select to authenticated
  using (affiliate_user_id=(select auth.uid()) or (select public.is_admin()));
create policy "affiliates read own commissions" on public.affiliate_commissions for select to authenticated
  using (exists(select 1 from public.affiliate_referrals r where r.id=referral_id and (r.affiliate_user_id=(select auth.uid()) or (select public.is_admin()))));

revoke all on public.affiliate_programs,public.affiliate_clicks,public.affiliate_referrals,public.affiliate_commissions from public,anon,authenticated;
grant select on public.affiliate_programs,public.affiliate_clicks,public.affiliate_referrals,public.affiliate_commissions to authenticated;
grant select,insert,update,delete on public.affiliate_programs,public.affiliate_clicks,public.affiliate_referrals,public.affiliate_commissions to service_role;

create or replace function public.resolve_affiliate_reference(p_reference text)
returns table(slug text,promo_code text,discount_label text,attribution_days integer)
language sql stable security definer set search_path=''
as $$
  select a.slug,a.promo_code,a.discount_label,a.attribution_days
  from public.affiliate_programs a
  where a.status='active'
    and (lower(a.slug)=lower(btrim(coalesce(p_reference,''))) or upper(a.promo_code)=upper(btrim(coalesce(p_reference,''))))
  limit 1;
$$;
revoke all on function public.resolve_affiliate_reference(text) from public;
grant execute on function public.resolve_affiliate_reference(text) to anon,authenticated,service_role;

create or replace function public.track_affiliate_visit(p_reference text,p_visitor_token text,p_landing_path text default '/')
returns table(slug text,promo_code text,discount_label text,attribution_days integer)
language plpgsql security definer set search_path=''
as $$
declare v_program public.affiliate_programs%rowtype; v_token text:=btrim(coalesce(p_visitor_token,''));
begin
  if char_length(v_token) not between 16 and 100 then return; end if;
  select * into v_program from public.affiliate_programs a
  where a.status='active' and (lower(a.slug)=lower(btrim(coalesce(p_reference,''))) or upper(a.promo_code)=upper(btrim(coalesce(p_reference,'')))) limit 1;
  if v_program.user_id is null then return; end if;
  if not exists(
    select 1 from public.affiliate_clicks c
    where c.affiliate_user_id=v_program.user_id and c.visitor_token=v_token and c.created_at>now()-interval '12 hours'
  ) then
    insert into public.affiliate_clicks(affiliate_user_id,visitor_token,landing_path)
    values(v_program.user_id,v_token,left(coalesce(nullif(p_landing_path,''),'/'),300));
  end if;
  return query select v_program.slug,v_program.promo_code,v_program.discount_label,v_program.attribution_days;
end;
$$;
revoke all on function public.track_affiliate_visit(text,text,text) from public;
grant execute on function public.track_affiliate_visit(text,text,text) to anon,authenticated,service_role;

create or replace function public.admin_upsert_affiliate(
  p_email text,p_slug text,p_promo_code text,p_stripe_promotion_code_id text,
  p_discount_label text,p_commission_rate numeric,p_attribution_days integer,p_status text
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
  if p_commission_rate not between 0 and 100 or p_attribution_days not between 1 and 365 or p_status not in ('active','suspended','disabled') then raise exception 'Configuration invalide'; end if;
  insert into public.affiliate_programs(user_id,slug,promo_code,stripe_promotion_code_id,discount_label,commission_rate,attribution_days,status,created_by)
  values(v_user,v_slug,v_code,nullif(btrim(coalesce(p_stripe_promotion_code_id,'')),''),left(coalesce(nullif(btrim(p_discount_label),''),'Offre membre STOA'),100),p_commission_rate,p_attribution_days,p_status,(select auth.uid()))
  on conflict(user_id) do update set slug=excluded.slug,promo_code=excluded.promo_code,stripe_promotion_code_id=excluded.stripe_promotion_code_id,
    discount_label=excluded.discount_label,commission_rate=excluded.commission_rate,attribution_days=excluded.attribution_days,status=excluded.status,updated_at=now();
  return v_user;
end;
$$;
revoke all on function public.admin_upsert_affiliate(text,text,text,text,text,numeric,integer,text) from public,anon;
grant execute on function public.admin_upsert_affiliate(text,text,text,text,text,numeric,integer,text) to authenticated;

create or replace function public.admin_list_affiliates()
returns table(user_id uuid,email text,display_name text,slug text,promo_code text,stripe_promotion_code_id text,discount_label text,commission_rate numeric,attribution_days integer,status text,clicks bigint,referrals bigint)
language sql stable security definer set search_path=''
as $$
  select a.user_id,u.email::text,coalesce(nullif(concat_ws(' ',p.first_name,p.last_name),''),p.full_name,p.username,u.email::text),
    a.slug,a.promo_code,a.stripe_promotion_code_id,a.discount_label,a.commission_rate,a.attribution_days,a.status,
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
    'program',jsonb_build_object('slug',v_program.slug,'promo_code',v_program.promo_code,'discount_label',v_program.discount_label,'commission_rate',v_program.commission_rate,'attribution_days',v_program.attribution_days),
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

-- L'entrée de navigation n'est envoyée qu'aux membres du programme.
create or replace function public.get_academy_shell_context()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_access boolean; result jsonb;
begin
  if v_user is null then raise exception 'Authentification requise' using errcode='42501'; end if;
  v_access:=public.has_active_academy_access(v_user);
  select jsonb_build_object(
    'has_academy_access',v_access,
    'profile',jsonb_build_object('first_name',p.first_name,'last_name',p.last_name,'full_name',p.full_name,'username',p.username,'avatar_url',p.avatar_url,'role',p.role,'theme_preference',p.theme_preference,'theme_updated_at',p.theme_updated_at),
    'has_coaching',case when v_access then public.has_coaching_access(v_user) else false end,
    'has_affiliate',exists(select 1 from public.affiliate_programs a where a.user_id=v_user and a.status='active'),
    'is_staff',public.is_coaching_staff()
  ) into result from public.profiles p where p.id=v_user;
  return coalesce(result,jsonb_build_object('has_academy_access',false,'profile','{}'::jsonb,'has_coaching',false,'has_affiliate',false,'is_staff',false));
end;
$$;
revoke all on function public.get_academy_shell_context() from public,anon;
grant execute on function public.get_academy_shell_context() to authenticated;
