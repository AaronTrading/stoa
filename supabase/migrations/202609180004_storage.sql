insert into storage.buckets (id, name, public)
values
  ('module-assets', 'module-assets', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "admins upload module assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'module-assets' and (select public.is_admin()));
create policy "admins update module assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'module-assets' and (select public.is_admin()))
  with check (bucket_id = 'module-assets' and (select public.is_admin()));
create policy "admins delete module assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'module-assets' and (select public.is_admin()));

create policy "users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "users delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "admins manage all avatars"
  on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (select public.is_admin()))
  with check (bucket_id = 'avatars' and (select public.is_admin()));

