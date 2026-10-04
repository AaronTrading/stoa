import { academyPriceId, corsHeaders, hasAcademyAccess, json, requireUser, resolveStripeCustomer, siteUrl, stripe } from '../_shared/billing.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Méthode non autorisée.' }, 405);
  try {
    if (!academyPriceId) throw new Error('STRIPE_PRICE_ID_MISSING');
    const user = await requireUser(request);
    if (await hasAcademyAccess(user.id)) return json(request, { error: 'Votre accès à l’Académie est déjà actif.' }, 409);
    const customer = await resolveStripeCustomer(user);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price: academyPriceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/abonnement-succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?annule=1`,
      metadata: { user_id: user.id, supabase_user_id: user.id, product: 'stoa_academie' },
      subscription_data: { metadata: { user_id: user.id, supabase_user_id: user.id, product: 'stoa_academie' } },
    }, { idempotencyKey: `stoa-checkout-${user.id}-${academyPriceId}-${Math.floor(Date.now() / 300000)}` });
    if (!session.url) throw new Error('CHECKOUT_URL_MISSING');
    return json(request, { url: session.url });
  } catch (error) {
    console.error('create-checkout', error);
    const message = error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'Connexion requise.' : 'Le paiement sécurisé ne peut pas être ouvert pour le moment.';
    return json(request, { error: message }, error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 500);
  }
});
