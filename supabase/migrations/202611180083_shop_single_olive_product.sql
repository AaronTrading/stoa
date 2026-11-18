-- La boutique STOA devient volontairement mono-produit.
update public.shop_products
set active=false
where id<>'huile-olive-charisma';

update public.shop_products
set name='Huile d’olive bio extra vierge STOA',
    description='Huile d’olive vierge extra biologique grecque, issue d’olives Koroneïki. Format 1 litre.',
    price=29.99,
    image_url='/assets/coaching/huile-stoa.png',
    producer='Vassilakis Estate',
    source_url='https://buy.stripe.com/7sYcN44Uw34S4Jh5gF2kw00',
    selections='[]'::jsonb,
    order_index=1,
    active=true
where id='huile-olive-charisma';
