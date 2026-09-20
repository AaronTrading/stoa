alter table public.subchapter_images
  add column if not exists storage_path text;

create or replace function public.admin_update_module(
  p_id uuid, p_title text, p_description text, p_duration_minutes integer, p_order_index integer
) returns void language plpgsql security invoker set search_path = public as $$
declare v_chapter uuid; v_old integer; v_target integer; v_max integer;
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  select chapter_id, order_index into v_chapter, v_old from public.modules where id = p_id for update;
  if v_chapter is null then raise exception 'Module introuvable'; end if;
  select max(order_index) into v_max from public.modules where chapter_id = v_chapter;
  v_target := greatest(0, least(coalesce(p_order_index, v_old), v_max));
  update public.modules set order_index = 1000000 where id = p_id;
  if v_target < v_old then
    update public.modules set order_index = order_index + 10000 where chapter_id = v_chapter and order_index between v_target and v_old - 1;
    update public.modules set order_index = order_index - 9999 where chapter_id = v_chapter and order_index between v_target + 10000 and v_old - 1 + 10000;
  elsif v_target > v_old then
    update public.modules set order_index = order_index + 10000 where chapter_id = v_chapter and order_index between v_old + 1 and v_target;
    update public.modules set order_index = order_index - 10001 where chapter_id = v_chapter and order_index between v_old + 1 + 10000 and v_target + 10000;
  end if;
  update public.modules set title = trim(p_title), description = coalesce(p_description, ''), duration_minutes = greatest(1, p_duration_minutes), order_index = v_target where id = p_id;
end;
$$;

create or replace function public.admin_update_subchapter(
  p_id uuid, p_title text, p_content text, p_order_index integer
) returns void language plpgsql security invoker set search_path = public as $$
declare v_module uuid; v_old integer; v_target integer; v_max integer;
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  select module_id, order_index into v_module, v_old from public.subchapters where id = p_id for update;
  if v_module is null then raise exception 'Sous-module introuvable'; end if;
  select max(order_index) into v_max from public.subchapters where module_id = v_module;
  v_target := greatest(0, least(coalesce(p_order_index, v_old), v_max));
  update public.subchapters set order_index = 1000000 where id = p_id;
  if v_target < v_old then
    update public.subchapters set order_index = order_index + 10000 where module_id = v_module and order_index between v_target and v_old - 1;
    update public.subchapters set order_index = order_index - 9999 where module_id = v_module and order_index between v_target + 10000 and v_old - 1 + 10000;
  elsif v_target > v_old then
    update public.subchapters set order_index = order_index + 10000 where module_id = v_module and order_index between v_old + 1 and v_target;
    update public.subchapters set order_index = order_index - 10001 where module_id = v_module and order_index between v_old + 1 + 10000 and v_target + 10000;
  end if;
  update public.subchapters set title = trim(p_title), content = coalesce(p_content, ''), order_index = v_target where id = p_id;
end;
$$;

create or replace function public.admin_delete_module(p_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_chapter uuid; v_old integer;
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  select chapter_id, order_index into v_chapter, v_old from public.modules where id = p_id for update;
  delete from public.modules where id = p_id;
  update public.modules set order_index = order_index + 10000 where chapter_id = v_chapter and order_index > v_old;
  update public.modules set order_index = order_index - 10001 where chapter_id = v_chapter and order_index > v_old + 10000;
end;
$$;

create or replace function public.admin_delete_subchapter(p_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_module uuid; v_old integer;
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  select module_id, order_index into v_module, v_old from public.subchapters where id = p_id for update;
  delete from public.subchapters where id = p_id;
  update public.subchapters set order_index = order_index + 10000 where module_id = v_module and order_index > v_old;
  update public.subchapters set order_index = order_index - 10001 where module_id = v_module and order_index > v_old + 10000;
end;
$$;

grant execute on function public.admin_update_module(uuid,text,text,integer,integer) to authenticated;
grant execute on function public.admin_update_subchapter(uuid,text,text,integer) to authenticated;
grant execute on function public.admin_delete_module(uuid) to authenticated;
grant execute on function public.admin_delete_subchapter(uuid) to authenticated;
