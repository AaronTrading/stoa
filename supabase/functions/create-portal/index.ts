import { corsHeaders, json, requireUser, resolveStripeCustomer, siteUrl, stripe } from '../_shared/billing.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Méthode non autorisée.' }, 405);
  try {
    const user = await requireUser(request);
    const customer = await resolveStripeCustomer(user);
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${siteUrl}/profil#abonnement`,
      ...(Deno.env.get('STRIPE_PORTAL_CONFIGURATION_ID') ? { configuration: Deno.env.get('STRIPE_PORTAL_CONFIGURATION_ID') } : {}),
    });
    return json(request, { url: session.url });
  } catch (error) {
    console.error('create-portal', error);
    const message = error instanceof Error && error.message === 'AUTH_REQUIRED' ? 'Connexion requise.' : 'Le portail de facturation ne peut pas être ouvert pour le moment.';
    return json(request, { error: message }, error instanceof Error && error.message === 'AUTH_REQUIRED' ? 401 : 500);
  }
});
