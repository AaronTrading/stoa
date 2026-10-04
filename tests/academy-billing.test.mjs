import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/202610040042_academy_billing.sql');
const roleMigration = read('supabase/migrations/202610040041_registered_role.sql');
const roleSyncFix = read('supabase/migrations/202610040043_fix_membership_role_sync.sql');
const offersMigration = read('supabase/migrations/202610040044_billing_offers.sql');
const manualAccessMigration = read('supabase/migrations/202610040045_manual_academy_access_and_onboarding.sql');
const checkout = read('supabase/functions/create-checkout/index.ts');
const webhook = read('supabase/functions/stripe-webhook/index.ts');
const shell = read('dist/academy-shell.js');
const success = read('dist/subscription-success.js');

test('new accounts are registered instead of members', () => {
  assert.match(roleMigration, /add value if not exists 'registered'/);
  assert.match(migration, /alter column role set default 'registered'/);
});

test('billing synchronization preserves privileged roles', () => {
  assert.match(roleSyncFix, /v_profile_role in \('admin','coaching'\)/);
  assert.doesNotMatch(roleSyncFix, /declare\s+current_role/i);
});

test('Academy access is centralized on active entitlements', () => {
  assert.match(migration, /function public\.has_active_academy_access/);
  assert.match(migration, /s\.status in \('active','trialing'\)/);
  assert.doesNotMatch(migration, /p\.role in \([^)]*'member'/);
  for (const table of ['pillars', 'chapters', 'modules', 'subchapters', 'subchapter_images']) {
    assert.match(migration, new RegExp(`academy members read ${table.replaceAll('_', ' ')}[\\s\\S]*has_active_academy_access`));
  }
});

test('Stripe synchronization is signed and idempotent', () => {
  assert.match(webhook, /request\.text\(\)/);
  assert.match(webhook, /constructEventAsync/);
  assert.match(migration, /stripe_webhook_events/);
  assert.match(migration, /on conflict\(stripe_event_id\) do nothing/);
  assert.match(checkout, /mode: 'subscription'/);
  assert.match(checkout, /client_reference_id: user\.id/);
  assert.match(checkout, /subscription_data: \{ metadata:/);
  assert.match(checkout, /discounts: \[\{ coupon: academyFirstMonthCouponId \}\]/);
  assert.match(checkout, /offer === 'coaching'/);
  assert.match(checkout, /managed_payments: \{ enabled: false \}/);
  assert.match(offersMigration, /product_type in \('academy','coaching'\)/);
  assert.match(offersMigration, /insert into public\.coaching_clients/);
});

test('frontend never grants access from the success redirect', () => {
  assert.match(success, /has_active_academy_access/);
  assert.match(success, /has_coaching_access/);
  assert.match(success, /for\(let attempt=0;attempt<15;attempt\+\+\)/);
  assert.match(shell, /location\.replace\('\/#offres'\)/);
  assert.match(shell, /has_active_academy_access/);
});

test('the public offer launches Academy Checkout without an intermediate sales page', () => {
  const landing = read('dist/app.js');
  assert.match(landing, /functions\.invoke\('create-checkout',\{body:\{offer:'academy'\}\}\)/);
  assert.match(landing, /stoa-pending-checkout/);
  assert.doesNotMatch(landing, /location\.assign\('\/subscribe'\)/);
});

test('admins can grant Academy access by username without Stripe', () => {
  assert.match(manualAccessMigration, /create table public\.academy_entitlements/);
  assert.match(manualAccessMigration, /function public\.admin_set_academy_access_by_username/);
  assert.match(manualAccessMigration, /if not public\.is_admin\(\)/);
  assert.match(manualAccessMigration, /public\.academy_entitlements e/);
  const admin = read('dist/coaching-coach.js');
  assert.match(admin, /admin_set_academy_access_by_username/);
  assert.match(admin, /Accès Académie accordé gratuitement/);
});

test('no Stripe secret is embedded in client files', () => {
  for (const path of ['dist/subscribe.js', 'dist/subscription-success.js', 'dist/commercial-config.js']) {
    const source = read(path);
    assert.doesNotMatch(source, /(?:sk|rk)_(?:test|live)_/);
    assert.doesNotMatch(source, /STRIPE_SECRET_KEY/);
  }
});
