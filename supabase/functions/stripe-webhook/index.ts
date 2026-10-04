import type Stripe from 'npm:stripe@22';
import { json, service, stripe, stripeCryptoProvider } from '../_shared/billing.ts';

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
  const productType = raw.metadata?.product === 'stoa_coaching' ? 'coaching' : 'academy';
  const { error } = await service.rpc('process_stripe_subscription_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_stripe_created_at: new Date(event.created * 1000).toISOString(),
    p_user_id: userId,
    p_customer_id: customerId(raw.customer),
    p_subscription_id: raw.id,
    p_price_id: item?.price?.id || '',
    p_status: raw.status,
    p_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    p_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    p_cancel_at_period_end: Boolean(raw.cancel_at_period_end),
    p_product_type: productType,
  });
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
      }
    } else if (event.type.startsWith('customer.subscription.')) {
      await synchronize(event, event.data.object as Stripe.Subscription);
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice & Record<string, unknown>;
      const subscriptionId = subscriptionIdFromInvoice(invoice);
      if (subscriptionId) await synchronize(event, await stripe.subscriptions.retrieve(subscriptionId));
    } else {
      return json(request, { received: true, ignored: true });
    }
    return json(request, { received: true });
  } catch (error) {
    console.error('stripe webhook sync', event.id, error);
    return json(request, { error: 'Synchronisation Stripe impossible.' }, 500);
  }
});
