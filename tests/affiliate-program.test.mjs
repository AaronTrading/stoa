import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { chartPoints,normalizeAffiliateReference } from '../dist/affiliate-utils.js';

test('affiliate references are normalized without accepting unbounded input',()=>{
  assert.equal(normalizeAffiliateReference('  @STOA-AARON  '),'STOA-AARON');
  assert.equal(normalizeAffiliateReference('x'.repeat(80)).length,40);
});

test('affiliate chart produces bounded points, including an empty series',()=>{
  assert.equal(chartPoints([],720,190),'');
  assert.equal(chartPoints([0,5,10],100,50),'0,50 50,25 100,0');
  assert.equal(chartPoints([0,0],100,50),'0,50 100,50');
});

test('checkout only accepts affiliate configuration resolved on the server',()=>{
  const source=readFileSync(new URL('../supabase/functions/create-checkout/index.ts',import.meta.url),'utf8');
  assert.match(source,/from\('affiliate_programs'\)/);
  assert.match(source,/affiliate\?\.stripe_promotion_code_id/);
  assert.match(source,/affiliate_user_id: affiliate\?\.user_id/);
  assert.doesNotMatch(source,/payload\?\.stripe_promotion_code_id/);
  assert.doesNotMatch(source,/payload\?\.commission_rate/);
});

test('webhook records referrals and invoice commissions idempotently',()=>{
  const source=readFileSync(new URL('../supabase/functions/stripe-webhook/index.ts',import.meta.url),'utf8');
  assert.match(source,/recordReferral\(session, subscription\)/);
  assert.match(source,/recordCommission\(event, invoice, subscription\)/);
  assert.match(source,/onConflict: 'stripe_event_id'/);
});

test('affiliate database migration contains RLS and conditional shell access',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/202611180081_affiliate_program.sql',import.meta.url),'utf8');
  assert.match(sql,/enable row level security/g);
  assert.match(sql,/track_affiliate_visit/);
  assert.match(sql,/get_affiliate_dashboard/);
  assert.match(sql,/'has_affiliate'/);
});

test('Academy and Coaching have distinct affiliate settings and dedicated links',()=>{
  const migration=readFileSync(new URL('../supabase/migrations/202611180082_affiliate_academy_coaching.sql',import.meta.url),'utf8');
  const page=readFileSync(new URL('../dist/affiliation.html',import.meta.url),'utf8');
  const client=readFileSync(new URL('../dist/affiliation.js',import.meta.url),'utf8');
  assert.match(migration,/stripe_academy_promotion_code_id/);
  assert.match(migration,/stripe_coaching_promotion_code_id/);
  assert.match(migration,/academy_commission_rate/);
  assert.match(migration,/coaching_commission_rate/);
  assert.match(page,/affiliate-academy-link/);
  assert.match(page,/affiliate-coaching-link/);
  assert.doesNotMatch(client,/setTimeout\(\(\)=>location\.replace\('\/accueil'\)/);
});

test('the shop contains only the STOA olive oil and points directly to Stripe',()=>{
  const page=readFileSync(new URL('../dist/boutique.html',import.meta.url),'utf8');
  const config=readFileSync(new URL('../dist/commercial-config.js',import.meta.url),'utf8');
  assert.match(page,/Huile d’olive bio extra vierge STOA/);
  assert.match(page,/data-olive-checkout/);
  assert.match(config,/https:\/\/buy\.stripe\.com\//);
  assert.doesNotMatch(page,/product-grid|order-dialog|demande manuelle/i);
});
