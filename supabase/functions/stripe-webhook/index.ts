import type Stripe from 'npm:stripe@22';
import { academyPriceId, coachingPriceId, json, service, stripe, stripeCryptoProvider } from '../_shared/billing.ts';

const customerId = (value: string | Stripe.Customer | Stripe.DeletedCustomer | null) => typeof value === 'string' ? value : value?.id || '';
const subscriptionIdFromInvoice = (invoice: Stripe.Invoice & Record<string, unknown>) => {
  const legacy = invoice.subscription;
  if (typeof legacy === 'string') return legacy;
  if (legacy && typeof legacy === 'object') return (legacy as { id?: string }).id || '';
  const parent = invoice.parent as { subscription_details?: { subscription?: string | { id?: string } } } | null | undefined;
  const current = parent?.subscription_details?.subscription;
  return typeof current === 'string' ? current : current?.id || '';
};

async function synchronize(event: Stripe.Event, subscription: Stripe.Subscription, fallbackUserId?: string | null) {
  const raw = subscription as Stripe.Subscription & Record<string, any>;
  const item = raw.items?.data?.[0];
  const userId = raw.metadata?.user_id || raw.metadata?.supabase_user_id || fallbackUserId || null;
  const periodStart = raw.current_period_start || item?.current_period_start;
  const periodEnd = raw.current_period_end || item?.current_period_end;
  const priceId = item?.price?.id || '';
  const productType = priceId === coachingPriceId ? 'coaching' : priceId === academyPriceId ? 'academy' : null;
  if (!productType) throw new Error(`UNRECOGNIZED_STRIPE_PRICE:${priceId || 'missing'}`);
  const { error } = await service.rpc('process_stripe_subscription_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_stripe_created_at: new Date(event.created * 1000).toISOString(),
    p_user_id: userId,
    p_customer_id: customerId(raw.customer),
    p_subscription_id: raw.id,
    p_price_id: priceId,
    p_status: raw.status,
    p_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    p_cancel_at_period_end: Boolean(raw.cancel_at_period_end),
    p_product_type: productType,
  });
  if (error) throw error;
}

const productOffer = (product?: string | null) => product === 'stoa_coaching' ? 'coaching' : 'academy';

async function recordReferral(session: Stripe.Checkout.Session, subscription?: Stripe.Subscription | null) {
  const metadata = { ...(subscription?.metadata || {}), ...(session.metadata || {}) };
  const affiliateUserId = metadata.affiliate_user_id || '';
  const referredUserId = metadata.user_id || metadata.supabase_user_id || session.client_reference_id || '';
  if (!affiliateUserId || !referredUserId) return;
  const offer = productOffer(metadata.product);
  const values = {
    affiliate_user_id: affiliateUserId,
    referred_user_id: referredUserId,
    offer,
    promo_code: metadata.affiliate_promo_code || '',
    stripe_checkout_session_id: session.id,
    stripe_customer_id: customerId(session.customer),
    stripe_subscription_id: subscription?.id || (typeof session.subscription === 'string' ? session.subscription : session.subscription?.id) || null,
    status: session.payment_status === 'paid' || session.payment_status === 'no_payment_required' ? 'active' : 'pending',
    first_paid_at: session.payment_status === 'paid' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: lookupError } = await service.from('affiliate_referrals').select('id,affiliate_user_id').eq('referred_user_id', referredUserId).eq('offer', offer).maybeSingle();
  if (lookupError) throw lookupError;
  const result = existing
    ? await service.from('affiliate_referrals').update({
        stripe_checkout_session_id: session.id,
        stripe_customer_id: values.stripe_customer_id,
        stripe_subscription_id: values.stripe_subscription_id,
        status: values.status,
        first_paid_at: values.first_paid_at,
        updated_at: values.updated_at,
      }).eq('id', existing.id)
    : await service.from('affiliate_referrals').insert(values);
  if (result.error) throw result.error;
}

async function recordCommission(event: Stripe.Event, invoice: Stripe.Invoice & Record<string, any>, subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const affiliateUserId = subscription.metadata?.affiliate_user_id || '';
  const referredUserId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id || '';
  if (!affiliateUserId || !referredUserId || Number(invoice.amount_paid || 0) <= 0) return;
  const offer = productOffer(subscription.metadata?.product);
  let { data: referral, error: referralError } = await service.from('affiliate_referrals').select('id').eq('stripe_subscription_id', subscriptionId).maybeSingle();
  if (referralError) throw referralError;
  if (!referral) {
    const inserted = await service.from('affiliate_referrals').insert({
      affiliate_user_id: affiliateUserId,
      referred_user_id: referredUserId,
      offer,
      promo_code: subscription.metadata?.affiliate_promo_code || '',
      stripe_customer_id: customerId(invoice.customer),
      stripe_subscription_id: subscriptionId,
      status: 'active',
      first_paid_at: new Date(event.created * 1000).toISOString(),
    }).select('id').single();
    if (inserted.error) throw inserted.error;
    referral = inserted.data;
  } else {
    const update = await service.from('affiliate_referrals').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', referral.id);
    if (update.error) throw update.error;
  }
  const { data: program, error: programError } = await service.from('affiliate_programs').select('commission_rate,academy_commission_rate,coaching_commission_rate').eq('user_id', affiliateUserId).single();
  if (programError) throw programError;
  const grossAmount = Number(invoice.amount_paid || 0);
  const commissionRate = Number(
    (offer === 'coaching' ? program.coaching_commission_rate : program.academy_commission_rate)
    ?? program.commission_rate
    ?? 0,
  );
  const commissionAmount = Math.round(grossAmount * commissionRate / 100);
  const { error } = await service.from('affiliate_commissions').upsert({
    referral_id: referral.id,
    stripe_event_id: event.id,
    stripe_invoice_id: invoice.id,
    gross_amount: grossAmount,
    currency: String(invoice.currency || 'eur').toLowerCase(),
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    status: 'pending',
  }, { onConflict: 'stripe_event_id', ignoreDuplicates: true });
  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json(request, { error: 'Méthode non autorisée.' }, 405);
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) return json(request, { error: 'Signature Stripe manquante.' }, 400);
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret, undefined, stripeCryptoProvider);
  } catch (error) {
    console.error('stripe signature', error);
    return json(request, { error: 'Signature Stripe invalide.' }, 400);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await synchronize(event, subscription, session.metadata?.user_id || session.metadata?.supabase_user_id || session.client_reference_id);
        await recordReferral(session, subscription);
      }
    } else if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription;
      await synchronize(event, subscription);
      if (event.type === 'customer.subscription.deleted' && subscription.metadata?.affiliate_user_id) {
        const { error } = await service.from('affiliate_referrals').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription.id);
        if (error) throw error;
      }
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice & Record<string, unknown>;
      const subscriptionId = subscriptionIdFromInvoice(invoice);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await synchronize(event, subscription);
        if (event.type === 'invoice.paid') await recordCommission(event, invoice, subscription);
      }
    } else {
      return json(request, { received: true, ignored: true });
    }
    return json(request, { received: true });
  } catch (error) {
    console.error('stripe webhook sync', event.id, error);
    return json(request, { error: 'Synchronisation Stripe impossible.' }, 500);
  }
});
