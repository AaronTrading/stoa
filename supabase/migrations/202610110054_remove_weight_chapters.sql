do $$
declare
  v_removed_orders integer[];
begin
  select array_agg(order_index order by order_index)
  into v_removed_orders
  from public.chapters
  where title in ('Perdre du poids', 'Prendre du poids');

  delete from public.chapters
  where title in ('Perdre du poids', 'Prendre du poids');

  if coalesce(array_length(v_removed_orders, 1), 0) > 0 then
    update public.chapters
    set order_index = order_index + 10000;

    update public.chapters chapter
    set order_index = chapter.order_index - 10000 - (
      select count(*)
      from unnest(v_removed_orders) removed_order
      where removed_order < chapter.order_index - 10000
    );
  end if;
end;
$$;
