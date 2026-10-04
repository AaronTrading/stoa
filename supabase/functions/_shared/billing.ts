import Stripe from 'npm:stripe@22';
import { createClient, type User } from 'npm:@supabase/supabase-js@2';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();
export const siteUrl = (Deno.env.get('SITE_URL') || 'https://stoa-coaching.fr').replace(/\/$/, '');
export const academyPriceId = Deno.env.get('STRIPE_PRICE_ID') || '';
export const academyFirstMonthCouponId = Deno.env.get('STRIPE_ACADEMY_FIRST_MONTH_COUPON_ID') || '';
export const coachingPriceId = Deno.env.get('STRIPE_COACHING_PRICE_ID') || '';

export const service = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const corsHeaders = (request: Request) => {
  const origin = request.headers.get('origin') || siteUrl;
  const allowed = origin === siteUrl || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : siteUrl,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

export const json = (request: Request, payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' },
});

export async function requireUser(request: Request): Promise<User> {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('AUTH_REQUIRED');
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) throw new Error('AUTH_REQUIRED');
  return data.user;
}

export async function resolveStripeCustomer(user: User): Promise<string> {
  const [{ data: profile }, { data: billing }] = await Promise.all([
    service.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle(),
    service.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle(),
  ]);
  const existing = profile?.stripe_customer_id || billing?.stripe_customer_id;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id, supabase_user_id: user.id, product: 'stoa_academie' },
  }, { idempotencyKey: `stoa-customer-${user.id}` });

  const { error: billingError } = await service.from('billing_customers').upsert({
    user_id: user.id,
    stripe_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (billingError) throw billingError;
  const { error: profileError } = await service.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', user.id);
  if (profileError) throw profileError;
  return customer.id;
}

export async function hasAcademyAccess(userId: string): Promise<boolean> {
  const { data, error } = await service.rpc('has_active_academy_access', { p_user_id: userId });
  if (error) throw error;
  return Boolean(data);
}

export async function hasCoachingAccess(userId: string): Promise<boolean> {
  const { data, error } = await service.rpc('has_coaching_access', { p_user_id: userId });
  if (error) throw error;
  return Boolean(data);
}
