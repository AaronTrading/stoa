update public.shop_products product
set selections = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object('name', item.value #>> '{}', 'price', product.price)
      order by item.ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(product.selections) with ordinality as item(value, ordinality)
)
where jsonb_array_length(product.selections) > 0
  and jsonb_typeof(product.selections -> 0) = 'string';
