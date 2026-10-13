-- Remove the self-medication lesson and close the resulting order gap.

do $$
declare
  v_chapter_id uuid;
begin
  select id into v_chapter_id
  from public.chapters
  where is_visible and title = 'Santé & Hygiène'
  order by order_index
  limit 1;

  if v_chapter_id is null then
    return;
  end if;

  delete from public.modules
  where chapter_id = v_chapter_id
    and title = 'Automédication utile';

  update public.modules
  set order_index = order_index + 10000
  where chapter_id = v_chapter_id;

  with ordered as (
    select id, row_number() over (order by order_index, id) - 1 as next_order
    from public.modules
    where chapter_id = v_chapter_id
  )
  update public.modules m
  set order_index = ordered.next_order
  from ordered
  where m.id = ordered.id;
end;
$$;
