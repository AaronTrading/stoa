import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=(path)=>readFile(new URL(path,import.meta.url),'utf8');
const [page,config,sales,shell,index]=await Promise.all([
  read('../dist/decouvrir-coaching.html'),
  read('../dist/commercial-config.js'),
  read('../dist/coaching-sales.js'),
  read('../dist/academy-shell.js'),
  read('../dist/index.html')
]);

test('la page commerciale reprend la terminologie STOA',()=>{
  assert.match(page,/L’Académie vous donne les connaissances/);
  assert.match(page,/Le Coaching vous aide/);
  assert.doesNotMatch(page,/Accompagnement|Academy/);
  assert.match(page,/data-coaching-price/);
});

test('le tarif Coaching vient d’une configuration unique',()=>{
  assert.match(config,/durationMonths:3/);
  assert.match(config,/billingIntervalMonths:3/);
  assert.match(config,/price:299\.99/);
  assert.match(index,/data-coaching-price/);
  assert.match(page,/Facturé tous les trois mois/);
});

test('la page est réservée aux membres et respecte le droit Coaching',()=>{
  assert.match(sales,/location\.replace\('\/#connexion'\)/);
  assert.match(sales,/get_my_coaching_access/);
  assert.match(sales,/location\.replace\('\/coaching'\)/);
  assert.match(shell,/hasCoaching\?'\/coaching':'\/decouvrir-coaching'/);
  assert.match(shell,/hasCoaching\?'Mon Coaching':'Coaching'/);
});

test('les événements commerciaux utilisent l’analytics existant sans dépendance ajoutée',()=>{
  for(const event of ['coaching_page_view','coaching_cta_click','coaching_pricing_view','coaching_checkout_started','coaching_purchase_completed'])assert.match(sales,new RegExp(event));
  assert.match(sales,/window\.dataLayer/);
  assert.match(sales,/functions\.invoke\('create-checkout',\{body:\{offer:'coaching'\}\}\)/);
});
