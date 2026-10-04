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
const stripeKey = env.STRIPE_SECRET_KEY;
const serviceHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
const parse = async response => {
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
};
const stripe = (path, options = {}) => fetch(`https://api.stripe.com/v1${path}`, { ...options, headers: { Authorization: `Bearer ${stripeKey}`, ...(options.headers || {}) } }).then(parse);

test('live Checkout exposes the exact Academy and Coaching schedules', { skip: process.env.RUN_STRIPE_LIVE_TEST !== '1' }, async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `stripe-checkout-${suffix}@example.invalid`;
  const password = `Stoa-${suffix}-Secure!`;
  const sessions = [];
  let userId;
  let customerId;
  try {
    const user = await parse(await fetch(`${base}/auth/v1/admin/users`, { method: 'POST', headers: serviceHeaders, body: JSON.stringify({ email, password, email_confirm: true }) }));
    userId = user.id;
    const login = await parse(await fetch(`${base}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }));
    const userHeaders = { apikey: publicKey, Authorization: `Bearer ${login.access_token}`, 'Content-Type': 'application/json' };
    for (const offer of ['academy', 'coaching']) {
      const checkout = await parse(await fetch(`${base}/functions/v1/create-checkout`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ offer }) }));
      sessions.push(new URL(checkout.url).pathname.split('/').at(-1));
    }
    const [academy, coaching] = await Promise.all(sessions.map(id => stripe(`/checkout/sessions/${id}`)));
    customerId = academy.customer;
    assert.equal(academy.mode, 'subscription');
    assert.equal(academy.amount_subtotal, 2499);
    assert.equal(academy.total_details.amount_discount, 1000);
    assert.equal(academy.amount_total, 1499);
    assert.equal(academy.metadata.product, 'stoa_academie');
    assert.equal(coaching.mode, 'subscription');
    assert.equal(coaching.amount_total, 29999);
    assert.equal(coaching.metadata.product, 'stoa_coaching');
  } finally {
    for (const sessionId of sessions) {
      try { await stripe(`/checkout/sessions/${sessionId}/expire`, { method: 'POST' }); } catch {}
    }
    if (customerId) {
      try { await stripe(`/customers/${customerId}`, { method: 'DELETE' }); } catch {}
    }
    if (userId) await fetch(`${base}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: serviceHeaders });
  }
});
