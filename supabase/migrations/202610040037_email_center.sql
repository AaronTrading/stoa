-- STOA Email Center: admin-only campaigns, recipient resolution and delivery history.

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  subject text not null default '' check (char_length(subject) <= 180),
  audience text not null default 'all' check (audience in ('all','academy','coaching','custom')),
  custom_recipient_ids uuid[] not null default '{}',
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  settings jsonb not null default '{"background":"#f3f1e9","contentBackground":"#ffffff","textColor":"#293127","buttonColor":"#343b2d","width":640}'::jsonb check (jsonb_typeof(settings) = 'object'),
  status text not null default 'draft' check (status in ('draft','sending','sent','partial','failed')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  last_error text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  gmail_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create index email_campaigns_status_created_idx on public.email_campaigns(status, created_at desc);
create index email_deliveries_campaign_status_idx on public.email_deliveries(campaign_id, status);

alter table public.email_campaigns enable row level security;
alter table public.email_deliveries enable row level security;

grant select, insert, update, delete on public.email_campaigns, public.email_deliveries to authenticated;

create policy "admins manage email campaigns" on public.email_campaigns
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins read email deliveries" on public.email_deliveries
  for select to authenticated using ((select public.is_admin()));

create trigger email_campaigns_updated_at before update on public.email_campaigns
  for each row execute function public.set_updated_at();

create or replace function public.get_email_center_members()
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  username text,
  role text,
  has_academy boolean,
  has_coaching boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  return query
  select u.id, u.email::text, p.first_name, p.last_name, p.username, p.role::text,
    p.role::text in ('member','coaching','admin'),
    exists (
      select 1 from public.coaching_clients c
      where c.client_id = u.id and c.status in ('onboarding','active')
        and (c.ends_at is null or c.ends_at > now())
    )
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email is not null
  order by coalesce(p.first_name,p.username,u.email), coalesce(p.last_name,'');
end;
$$;

revoke all on function public.get_email_center_members() from public;
grant execute on function public.get_email_center_members() to authenticated;

create or replace function public.resolve_email_campaign_recipients(p_campaign_id uuid)
returns table (user_id uuid, email text, first_name text, last_name text)
language sql stable security definer set search_path = '' as $$
  select distinct u.id, u.email::text, coalesce(p.first_name,p.username,split_part(u.email,'@',1)), coalesce(p.last_name,'')
  from public.email_campaigns campaign
  join auth.users u on u.email is not null
  join public.profiles p on p.id = u.id
  where campaign.id = p_campaign_id and (
    campaign.audience = 'all'
    or campaign.audience = 'academy' and p.role::text in ('member','coaching','admin')
    or campaign.audience = 'coaching' and exists (
      select 1 from public.coaching_clients c
      where c.client_id = u.id and c.status in ('onboarding','active')
        and (c.ends_at is null or c.ends_at > now())
    )
    or campaign.audience = 'custom' and u.id = any(campaign.custom_recipient_ids)
  );
$$;

revoke all on function public.resolve_email_campaign_recipients(uuid) from public, anon, authenticated;
grant execute on function public.resolve_email_campaign_recipients(uuid) to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('email-assets','email-assets',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "admins upload email assets" on storage.objects for insert to authenticated
  with check (bucket_id='email-assets' and (select public.is_admin()));
create policy "admins update email assets" on storage.objects for update to authenticated
  using (bucket_id='email-assets' and (select public.is_admin()))
  with check (bucket_id='email-assets' and (select public.is_admin()));
create policy "admins delete email assets" on storage.objects for delete to authenticated
  using (bucket_id='email-assets' and (select public.is_admin()));
