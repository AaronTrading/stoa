import { supabase } from './supabase.js';

const status = document.querySelector('#auth-callback-status');
const retry = document.querySelector('#auth-callback-retry');
const PENDING_CHECKOUT_KEY = 'stoa-pending-checkout';
const PENDING_CHECKOUT_TTL = 2 * 60 * 60 * 1000;
const requestedOffer = new URLSearchParams(location.search).get('next');

const readPendingCheckout = () => {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_CHECKOUT_KEY) || 'null');
    if (value?.offer === 'academy' && Date.now() - Number(value.createdAt || 0) < PENDING_CHECKOUT_TTL) return value;
  } catch {}
  localStorage.removeItem(PENDING_CHECKOUT_KEY);
  return null;
};

const authParameters = () => {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const get = (key) => query.get(key) || hash.get(key) || '';
  return {
    code: get('code'),
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    tokenHash: get('token_hash'),
    type: get('type'),
    error: get('error_description') || get('error'),
  };
};

const resolveSession = async () => {
  const parameters = authParameters();
  if (parameters.error) throw new Error(parameters.error);

  let { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (session) return session;

  if (parameters.code) {
    ({ data: { session }, error } = await supabase.auth.exchangeCodeForSession(parameters.code));
  } else if (parameters.accessToken && parameters.refreshToken) {
    ({ data: { session }, error } = await supabase.auth.setSession({
      access_token: parameters.accessToken,
      refresh_token: parameters.refreshToken,
    }));
  } else if (parameters.tokenHash && parameters.type) {
    ({ data: { session }, error } = await supabase.auth.verifyOtp({
      token_hash: parameters.tokenHash,
      type: parameters.type,
    }));
  }
  if (error) throw error;
  if (!session) session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Le lien n’a pas permis de créer une session. Il est peut-être expiré ou déjà utilisé.');
  return session;
};

const finish = async () => {
  try {
    const session = await resolveSession();
    await supabase.rpc('ensure_my_profile');
    const { data: hasAccess } = await supabase.rpc('has_active_academy_access', { p_user_id: session.user.id });
    history.replaceState(null, '', '/auth-callback');
    if (hasAccess) {
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
      location.replace('/accueil');
      return;
    }
    if (requestedOffer === 'academy' && !readPendingCheckout()) {
      localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ offer: 'academy', createdAt: Date.now() }));
    }
    const pending = readPendingCheckout();
    status.textContent = pending ? 'Compte confirmé. Ouverture de votre paiement sécurisé…' : 'Compte confirmé. Redirection vers les offres…';
    location.replace('/?auth=confirmed#offres');
  } catch (error) {
    console.error('auth-callback', error);
    history.replaceState(null, '', '/auth-callback');
    status.textContent = error?.message || 'Ce lien de connexion ne peut plus être utilisé.';
    retry.hidden = false;
    document.querySelector('.subscription-loader')?.remove();
  }
};

finish();
