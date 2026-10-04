import { academyFirstMonthCouponId, academyPriceId, coachingPriceId, corsHeaders, hasAcademyAccess, hasCoachingAccess, json, requireUser, resolveStripeCustomer, siteUrl, stripe } from '../_shared/billing.ts';

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
    const customer = await resolveStripeCustomer(user);
    const product = offer === 'coaching' ? 'stoa_coaching' : 'stoa_academie';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(offer === 'academy' ? { discounts: [{ coupon: academyFirstMonthCouponId }] } : {}),
      ...(offer === 'coaching' ? { managed_payments: { enabled: false } } : {}),
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
