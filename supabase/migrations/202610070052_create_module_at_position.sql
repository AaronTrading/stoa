create or replace function public.admin_create_module_at_position(
  p_chapter_id uuid,
  p_title text,
  p_description text,
  p_duration_minutes integer,
  p_order_index integer
)
returns table(module_id uuid, module_order_index integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
  v_target integer;
  v_module_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;
  if not exists(select 1 from public.chapters where id = p_chapter_id) then
    raise exception 'Chapitre introuvable';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'Le titre est obligatoire';
  end if;

  perform 1 from public.modules where chapter_id = p_chapter_id for update;
  select count(*) into v_count from public.modules where chapter_id = p_chapter_id;
  v_target := greatest(0, least(coalesce(p_order_index, v_count), v_count));

  update public.modules
  set order_index = order_index + 10000
  where chapter_id = p_chapter_id and order_index >= v_target;

  update public.modules
  set order_index = order_index - 9999
  where chapter_id = p_chapter_id and order_index >= v_target + 10000;

  insert into public.modules(chapter_id, title, description, duration_minutes, order_index, is_visible)
  values(
    p_chapter_id,
    btrim(p_title),
    coalesce(btrim(p_description), ''),
    greatest(1, least(coalesce(p_duration_minutes, 10), 600)),
    v_target,
    true
  )
  returning id into v_module_id;

  insert into public.subchapters(module_id, title, content, order_index)
  values(v_module_id, 'Cours', '<p>Commencez à rédiger votre module ici.</p>', 0);

  return query select v_module_id, v_target;
end;
$$;

revoke all on function public.admin_create_module_at_position(uuid,text,text,integer,integer) from public, anon;
grant execute on function public.admin_create_module_at_position(uuid,text,text,integer,integer) to authenticated;
