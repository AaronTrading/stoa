alter table public.polls
  alter column expires_at set default '9999-12-31 23:59:59+00'::timestamptz;

update public.polls
set expires_at = '9999-12-31 23:59:59+00'::timestamptz;
