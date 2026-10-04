import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1)];
}));
const base = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;
const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const serviceHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
const rest = async (path, options = {}) => fetch(`${base}${path}`, { ...options, headers: { ...serviceHeaders, ...(options.headers || {}) } });
const assertStatus = async (response, expected) => assert.equal(response.status, expected, await response.clone().text());

test('RLS denies a signed-in non-subscriber and follows webhook entitlement changes', async () => {
  assert.ok(base && serviceKey && publicKey, 'Supabase integration environment is missing');
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `stripe-rls-${suffix}@example.invalid`;
  const password = `Stoa-${suffix}-Secure!`;
  let userId;
  try {
    const create = await rest('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) });
    await assertStatus(create, 200);
    const created = await create.json();
    userId = created.id;

    const login = await fetch(`${base}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    await assertStatus(login, 200);
    const token = (await login.json()).access_token;
    const userHeaders = { apikey: publicKey, Authorization: `Bearer ${token}` };
    const academyRows = () => fetch(`${base}/rest/v1/chapters?select=id&limit=1`, { headers: userHeaders }).then(async response => ({ status: response.status, body: await response.json() }));

    const denied = await academyRows();
    assert.equal(denied.status, 200);
    assert.deepEqual(denied.body, []);

    const eventBase = { p_event_type: 'customer.subscription.updated', p_stripe_created_at: new Date().toISOString(), p_user_id: userId, p_customer_id: `cus_rls_${suffix}`, p_subscription_id: `sub_rls_${suffix}`, p_price_id: 'price_rls', p_period_start: new Date().toISOString(), p_period_end: new Date(Date.now() + 86400000).toISOString(), p_cancel_at_period_end: false };
    const activate = await rest('/rest/v1/rpc/process_stripe_subscription_event', { method: 'POST', body: JSON.stringify({ ...eventBase, p_event_id: `evt_active_${suffix}`, p_status: 'active' }) });
    await assertStatus(activate, 200);
    const allowed = await academyRows();
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.length, 1);

    const duplicate = await rest('/rest/v1/rpc/process_stripe_subscription_event', { method: 'POST', body: JSON.stringify({ ...eventBase, p_event_id: `evt_active_${suffix}`, p_status: 'active' }) });
    await assertStatus(duplicate, 200);
    assert.equal(await duplicate.json(), false);

    const cancel = await rest('/rest/v1/rpc/process_stripe_subscription_event', { method: 'POST', body: JSON.stringify({ ...eventBase, p_event_id: `evt_cancel_${suffix}`, p_status: 'canceled', p_period_end: new Date(Date.now() - 1000).toISOString() }) });
    await assertStatus(cancel, 200);
    const deniedAgain = await academyRows();
    assert.deepEqual(deniedAgain.body, []);
  } finally {
    await rest(`/rest/v1/stripe_webhook_events?stripe_event_id=in.(evt_active_${suffix},evt_cancel_${suffix})`, { method: 'DELETE' });
    if (userId) await rest(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' });
  }
});
