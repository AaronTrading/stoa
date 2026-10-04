import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/202610040042_academy_billing.sql');
const roleMigration = read('supabase/migrations/202610040041_registered_role.sql');
const roleSyncFix = read('supabase/migrations/202610040043_fix_membership_role_sync.sql');
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
});

test('frontend never grants access from the success redirect', () => {
  assert.match(success, /has_active_academy_access/);
  assert.match(success, /for\(let attempt=0;attempt<15;attempt\+\+\)/);
  assert.match(shell, /location\.replace\(`\/subscribe/);
  assert.match(shell, /has_active_academy_access/);
});

test('no Stripe secret is embedded in client files', () => {
  for (const path of ['dist/subscribe.js', 'dist/subscription-success.js', 'dist/commercial-config.js']) {
    const source = read(path);
    assert.doesNotMatch(source, /(?:sk|rk)_(?:test|live)_/);
    assert.doesNotMatch(source, /STRIPE_SECRET_KEY/);
  }
});
