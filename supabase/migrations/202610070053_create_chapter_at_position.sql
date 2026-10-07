create or replace function public.admin_create_chapter_at_position(
  p_pillar_id uuid,
  p_title text,
  p_description text,
  p_order_index integer
)
returns table(chapter_id uuid, chapter_order_index integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pillar_order integer;
  v_count integer;
  v_local_target integer;
  v_global_target integer;
  v_chapter_id uuid;
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  if nullif(btrim(p_title), '') is null then raise exception 'Le titre est obligatoire'; end if;

  select order_index into v_pillar_order from public.pillars where id = p_pillar_id for update;
  if v_pillar_order is null then raise exception 'Pilier introuvable'; end if;
  perform 1 from public.chapters for update;

  select count(*) into v_count from public.chapters where pillar_id = p_pillar_id and is_visible;
  v_local_target := greatest(0, least(coalesce(p_order_index, v_count), v_count));

  if v_local_target < v_count then
    select order_index into v_global_target
    from public.chapters
    where pillar_id = p_pillar_id and is_visible
    order by order_index
    offset v_local_target limit 1;
  else
    select max(order_index) + 1 into v_global_target
    from public.chapters
    where pillar_id = p_pillar_id and is_visible;
  end if;

  if v_global_target is null then
    select min(c.order_index) into v_global_target
    from public.chapters c
    join public.pillars p on p.id = c.pillar_id
    where c.is_visible and p.order_index > v_pillar_order;
  end if;
  if v_global_target is null then
    select coalesce(max(order_index), -1) + 1 into v_global_target from public.chapters where is_visible;
  end if;

  update public.chapters set order_index = order_index + 10000 where order_index >= v_global_target;
  update public.chapters set order_index = order_index - 9999 where order_index >= v_global_target + 10000;

  insert into public.chapters(pillar_id, category, title, description, order_index, is_visible)
  values(p_pillar_id, btrim(p_title), btrim(p_title), coalesce(btrim(p_description), ''), v_global_target, true)
  returning id into v_chapter_id;

  return query select v_chapter_id, v_global_target;
end;
$$;

revoke all on function public.admin_create_chapter_at_position(uuid,text,text,integer) from public, anon;
grant execute on function public.admin_create_chapter_at_position(uuid,text,text,integer) to authenticated;
