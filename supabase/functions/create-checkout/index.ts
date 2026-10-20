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
    const openSessions = await stripe.checkout.sessions.list({ customer, status: 'open', limit: 100 });
    const reusable = openSessions.data.find(session => session.mode === 'subscription' && session.metadata?.product === product && session.url);
    if (reusable?.url) return json(request, { url: reusable.url, reused: true });

    const { data: claimRows, error: claimError } = await service.rpc('claim_checkout_session', { p_user_id: user.id, p_offer: offer });
    if (claimError) throw claimError;
    const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
    if (claim?.action === 'reuse' && claim.session_url) return json(request, { url: claim.session_url, reused: true });
    if (claim?.action === 'busy') return json(request, { error: 'Une page de paiement est déjà en cours d’ouverture. Réessayez dans quelques secondes.', checkout_pending: true }, 409);
    if (claim?.action !== 'create' || !claim.attempt_id) throw new Error('CHECKOUT_CLAIM_FAILED');

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer,
        client_reference_id: user.id,
        line_items: [{ price: priceId, quantity: 1 }],
        billing_address_collection: 'required',
        customer_update: { address: 'auto', name: 'auto' },
        consent_collection: { terms_of_service: 'required' },
        ...(offer === 'academy' ? { discounts: [{ coupon: academyFirstMonthCouponId }] } : {}),
        ...(offer === 'coaching' ? {
          managed_payments: { enabled: false },
          shipping_address_collection: { allowed_countries: ['AT','BE','BG','HR','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'] },
        } : {}),
        success_url: `${siteUrl}/abonnement-succes?offre=${offer}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: offer === 'coaching' ? `${siteUrl}/decouvrir-coaching?annule=1` : `${siteUrl}/subscribe?annule=1`,
        metadata: { user_id: user.id, supabase_user_id: user.id, product },
        subscription_data: { metadata: { user_id: user.id, supabase_user_id: user.id, product } },
      }, { idempotencyKey: `stoa-checkout-${claim.attempt_id}` });
      if (!session.url) throw new Error('CHECKOUT_URL_MISSING');
      const { data: completed, error: completeError } = await service.rpc('complete_checkout_session', {
        p_user_id: user.id, p_offer: offer, p_attempt_id: claim.attempt_id, p_session_id: session.id,
        p_url: session.url, p_expires_at: new Date(session.expires_at * 1000).toISOString(),
      });
      if (completeError || !completed) throw completeError || new Error('CHECKOUT_CLAIM_LOST');
      return json(request, { url: session.url });
    } catch (checkoutError) {
      await service.rpc('release_checkout_session', { p_user_id: user.id, p_offer: offer, p_attempt_id: claim.attempt_id });
      throw checkoutError;
    }
  } catch (error) {
    console.error('create-checkout', error);
    const message = error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'Connexion requise.' : 'Le paiement sécurisé ne peut pas être ouvert pour le moment.';
    return json(request, { error: message }, error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 500);
  }
});
