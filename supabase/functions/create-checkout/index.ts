import { academyFirstMonthCouponId, academyPriceId, coachingPriceId, corsHeaders, hasAcademyAccess, hasCoachingAccess, json, requireUser, resolveStripeCustomer, service, siteUrl, stripe } from '../_shared/billing.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Méthode non autorisée.' }, 405);
  try {
    const payload = await request.json().catch(() => ({}));
    const offer = payload?.offer === 'coaching' ? 'coaching' : 'academy';
    const priceId = offer === 'coaching' ? coachingPriceId : academyPriceId;
    if (!priceId) throw new Error('STRIPE_PRICE_ID_MISSING');
    if (offer === 'academy' && !academyFirstMonthCouponId) throw new Error('STRIPE_COUPON_ID_MISSING');
    const user = await requireUser(request);
    if (offer === 'academy' && await hasAcademyAccess(user.id)) return json(request, { error: 'Votre accès à l’Académie est déjà actif.' }, 409);
    if (offer === 'coaching' && await hasCoachingAccess(user.id)) return json(request, { error: 'Votre accès au Coaching est déjà actif.' }, 409);
    if (offer === 'coaching') {
      const normalizedEmail = String(user.email || '').toLowerCase();
      const [byUser, byEmail] = await Promise.all([
        service.from('coaching_call_bookings').select('id').eq('status', 'confirmed').eq('user_id', user.id).limit(1).maybeSingle(),
        service.from('coaching_call_bookings').select('id').eq('status', 'confirmed').eq('email', normalizedEmail).limit(1).maybeSingle(),
      ]);
      if (byUser.error || byEmail.error) throw byUser.error || byEmail.error;
      if (!byUser.data && !byEmail.data) return json(request, { error: 'Réservez d’abord votre appel gratuit de 15 minutes.', booking_required: true }, 409);
    }
    const customer = await resolveStripeCustomer(user);
    const existingSubscriptions = await stripe.subscriptions.list({ customer, status: 'all', limit: 100 });
    const duplicate = existingSubscriptions.data.some(subscription => ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'].includes(subscription.status) && subscription.items.data.some(item => item.price.id === priceId));
    if (duplicate) return json(request, { error: 'Une souscription à cette offre existe déjà. Ouvrez votre espace ou le portail de facturation.' }, 409);
    const product = offer === 'coaching' ? 'stoa_coaching' : 'stoa_academie';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(offer === 'academy' ? { discounts: [{ coupon: academyFirstMonthCouponId }] } : {}),
      ...(offer === 'coaching' ? {
        managed_payments: { enabled: false },
        billing_address_collection: 'required',
        shipping_address_collection: { allowed_countries: ['AT','BE','BG','HR','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'] },
      } : {}),
      success_url: `${siteUrl}/abonnement-succes?offre=${offer}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: offer === 'coaching' ? `${siteUrl}/decouvrir-coaching?annule=1` : `${siteUrl}/subscribe?annule=1`,
      metadata: { user_id: user.id, supabase_user_id: user.id, product },
      subscription_data: { metadata: { user_id: user.id, supabase_user_id: user.id, product } },
    }, { idempotencyKey: `stoa-checkout-${offer}-${user.id}-${priceId}-${Math.floor(Date.now() / 300000)}` });
    if (!session.url) throw new Error('CHECKOUT_URL_MISSING');
    return json(request, { url: session.url });
  } catch (error) {
    console.error('create-checkout', error);
    const message = error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'Connexion requise.' : 'Le paiement sécurisé ne peut pas être ouvert pour le moment.';
    return json(request, { error: message }, error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 500);
  }
});
