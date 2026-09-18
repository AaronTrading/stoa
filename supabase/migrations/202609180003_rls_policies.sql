grant usage on schema public to authenticated;
grant select, insert, update, delete on public.chapters, public.modules, public.subchapters to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;

create policy "authenticated users read chapters"
  on public.chapters for select to authenticated using (true);
create policy "admins manage chapters"
  on public.chapters for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "authenticated users read modules"
  on public.modules for select to authenticated using (true);
create policy "admins manage modules"
  on public.modules for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "authenticated users read subchapters"
  on public.subchapters for select to authenticated using (true);
create policy "admins manage subchapters"
  on public.subchapters for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "users read own profile or admins read all"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));
create policy "users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "admins update profiles"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "users read own progress"
  on public.user_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users insert own progress"
  on public.user_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users update own progress"
  on public.user_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users delete own progress"
  on public.user_progress for delete to authenticated
  using ((select auth.uid()) = user_id);
