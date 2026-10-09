import { siteUrl, supabase } from './supabase.js';

const statusToast = document.createElement('div');
statusToast.className = 'auth-status';
statusToast.setAttribute('role', 'status');
statusToast.setAttribute('aria-live', 'polite');
document.body.append(statusToast);

const dialog = document.createElement('dialog');
dialog.className = 'auth-dialog';
dialog.setAttribute('aria-labelledby', 'auth-title');
dialog.innerHTML = `
  <button class="auth-close" type="button" aria-label="Fermer">×</button>
  <img class="auth-logo-image" src="/assets/branding/fondtransparent.png" alt="">
  <span class="eyebrow">ENTRER DANS STOA</span>
  <h2 id="auth-title">Votre espace membre</h2>
  <p class="auth-intro">Retrouvez votre parcours avec votre adresse email, Google ou Discord.</p>
  <div class="auth-guest-view">
    <div class="auth-mode-tabs" role="tablist" aria-label="Connexion ou inscription"><button type="button" role="tab" data-auth-mode="login" aria-selected="true">Se connecter</button><button type="button" role="tab" data-auth-mode="signup" aria-selected="false">S’inscrire</button></div>
    <form class="auth-form" novalidate>
      <div class="auth-signup-fields" hidden>
        <div><label for="auth-first-name">Prénom</label><input id="auth-first-name" name="firstName" type="text" autocomplete="given-name" placeholder="Votre prénom"></div>
        <div><label for="auth-last-name">Nom</label><input id="auth-last-name" name="lastName" type="text" autocomplete="family-name" placeholder="Votre nom"></div>
      </div>
      <label for="auth-email">Adresse email</label>
      <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="vous@exemple.fr" required>
      <label for="auth-password">Mot de passe</label>
      <input id="auth-password" name="password" type="password" autocomplete="current-password" minlength="8" placeholder="8 caractères minimum" required>
      <button class="button dark auth-submit" type="submit">Se connecter <span>↗</span></button>
    </form>
    <button class="auth-secondary" type="button" data-auth-action="forgot-password">Mot de passe oublié ?</button>
    <div class="auth-separator"><span>ou</span></div>
    <button class="auth-provider google" type="button" data-auth-action="google"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34a853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.62A10 10 0 0 0 12 22Z"/><path fill="#fbbc05" d="M6.4 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.92V7.46H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.54l3.34-2.62Z"/><path fill="#ea4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.94 5.46l3.34 2.62c.79-2.37 3-4.13 5.6-4.13Z"/></svg> Continuer avec Google</button>
    <button class="auth-provider" type="button" data-auth-action="magic-link"><span aria-hidden="true">✉</span> Recevoir un lien magique</button>
    <button class="auth-provider discord" type="button" data-auth-action="discord"><img src="assets/branding/discord.svg" alt="" aria-hidden="true"> Continuer avec Discord</button>
  </div>
  <form class="auth-recovery-view" hidden>
    <p>Choisissez un nouveau mot de passe pour sécuriser votre compte.</p>
    <label for="auth-new-password">Nouveau mot de passe</label>
    <input id="auth-new-password" name="newPassword" type="password" autocomplete="new-password" minlength="8" required>
    <label for="auth-confirm-password">Confirmer le mot de passe</label>
    <input id="auth-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required>
    <button class="button dark" type="submit">Enregistrer le mot de passe <span>→</span></button>
  </form>
  <p class="auth-message" role="status" aria-live="polite"></p>
`;
document.body.append(dialog);

const form = dialog.querySelector('.auth-form');
const message = dialog.querySelector('.auth-message');
let currentSession = null;
let currentProfile = null;
let currentProfileUserId = null;
let currentAcademyAccess = false;
let authMode = 'login';
const googleClientId = globalThis.__STOA_ENV__?.GOOGLE_CLIENT_ID || '';
let googleNonce = '';
let googleIdentityReady = false;

const authenticatedDestination = (session = currentSession, profile = currentProfile) => {
  const hasAcademyAccess = Boolean(session?.user && currentAcademyAccess);
  return hasAcademyAccess ? '/accueil' : '/#offres';
};

const setAuthMode = (mode) => {
  authMode = mode === 'signup' ? 'signup' : 'login';
  dialog.querySelector('.auth-signup-fields').hidden = authMode !== 'signup';
  dialog.querySelectorAll('[data-auth-mode]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.authMode === authMode)));
  const submit = dialog.querySelector('.auth-submit');
  submit.innerHTML = authMode === 'signup' ? 'Créer mon compte <span>↗</span>' : 'Se connecter <span>↗</span>';
  dialog.querySelector('#auth-password').autocomplete = authMode === 'signup' ? 'new-password' : 'current-password';
  setMessage('');
};

const showToast = (text, tone = 'info') => {
  statusToast.textContent = text;
  statusToast.dataset.tone = tone;
  statusToast.classList.add('visible');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => statusToast.classList.remove('visible'), 5000);
};

const setMessage = (text, tone = 'info') => {
  message.textContent = text;
  message.dataset.tone = tone;
};

const setBusy = (busy) => {
  dialog.querySelectorAll('button, input').forEach((element) => {
    element.disabled = busy;
  });
};

const updateAuthUI = (session, profile = currentProfile) => {
  currentSession = session;
  const user = session?.user;
  if (!user) {
    currentProfile = null;
    currentProfileUserId = null;
    currentAcademyAccess = false;
  }
  const activeProfile = user && currentProfileUserId === user.id ? profile : null;
  const hasAcademyAccess = Boolean(user && currentAcademyAccess);
  const memberDestination = hasAcademyAccess ? '/accueil' : '/#offres';
  const fullName = activeProfile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const avatarUrl = activeProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const firstName = activeProfile?.first_name || user?.user_metadata?.first_name || fullName.trim().split(/\s+/)[0];

  document.querySelectorAll('[data-auth-link]').forEach((link) => {
    link.href = user ? memberDestination : '#connexion';
    const label = user ? `Bonjour ${firstName || 'membre'}` : 'Connexion';
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.replaceChildren(document.createTextNode(`${label} `), arrow);
    link.setAttribute('aria-label', user ? (hasAcademyAccess ? 'Ouvrir mon académie' : 'Découvrir les offres STOA') : 'Se connecter à STOA');
  });

  document.querySelectorAll('[data-member-academy-link]').forEach((link) => {
    link.hidden = !hasAcademyAccess;
    link.href = '/accueil';
  });
  document.querySelectorAll('[data-member-coaching-link]').forEach((link) => {
    link.hidden = !hasAcademyAccess;
  });

  document.querySelectorAll('[data-auth-avatar]').forEach((avatar) => {
    const initial = (fullName || user?.email || 'S').trim().charAt(0).toUpperCase();
    avatar.textContent = avatarUrl ? '' : initial;
    avatar.style.backgroundImage = avatarUrl ? `url("${avatarUrl.replace(/"/g, '%22')}")` : '';
    avatar.classList.toggle('has-image', Boolean(avatarUrl));
    avatar.href = user ? '/profil' : '#connexion';
    avatar.title = user ? fullName || user.email : 'Se connecter';
    avatar.setAttribute('aria-label', user ? 'Ouvrir mon profil' : 'Se connecter à STOA');
  });

  document.querySelectorAll('[data-user-first-name]').forEach((element) => {
    element.textContent = firstName || 'membre';
  });

};

const hydrateAuthUI = async (session) => {
  updateAuthUI(session);
  const user = session?.user;
  if (!user) return;

  let [{ data }, { data: academyAccess }] = await Promise.all([
    supabase.from('profiles').select('full_name, first_name, avatar_url, department, role').eq('id', user.id).maybeSingle(),
    supabase.rpc('has_active_academy_access'),
  ]);

  if (!data && currentSession?.user?.id === user.id) {
    await supabase.rpc('ensure_my_profile');
    data=(await supabase.from('profiles').select('full_name, first_name, avatar_url, department, role').eq('id', user.id).maybeSingle()).data;
  }
  if (!data || currentSession?.user?.id !== user.id) return;
  currentProfile = data;
  currentProfileUserId = user.id;
  currentAcademyAccess = Boolean(academyAccess);
  updateAuthUI(session, data);
};

const showRecovery = () => {
  dialog.querySelector('.auth-guest-view').hidden = true;
  dialog.querySelector('.auth-recovery-view').hidden = false;
  dialog.querySelector('#auth-title').textContent = 'Créer un nouveau mot de passe';
  dialog.querySelector('.auth-intro').textContent = 'Votre lien de récupération a été validé.';
  setMessage('');
  if (!dialog.open) dialog.showModal();
};

const generateGoogleNonce = async () => {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { nonce, hashedNonce };
};

const handleGoogleCredential = async (response) => {
  if (!response?.credential || !googleNonce) return;
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
    nonce: googleNonce,
  });
  if (error) {
    setMessage('La connexion rapide avec Google a échoué. Réessayez depuis le bouton Google.', 'error');
    return;
  }
  await hydrateAuthUI(data.session);
  if (dialog.open) dialog.close();
  showToast('Connexion Google réussie. Bienvenue dans STOA.', 'success');
  location.assign(authenticatedDestination());
};

const loadGoogleIdentity = async () => {
  if (!googleClientId || currentSession || googleIdentityReady) return;
  if (!globalThis.google?.accounts?.id) {
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-identity]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.dataset.googleIdentity = '';
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    });
  }
  const { nonce, hashedNonce } = await generateGoogleNonce();
  googleNonce = nonce;
  globalThis.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleCredential,
    nonce: hashedNonce,
    context: 'signin',
    auto_select: true,
    cancel_on_tap_outside: true,
    itp_support: true,
    use_fedcm_for_prompt: true,
  });
  googleIdentityReady = true;
  if (location.pathname === '/' && !sessionStorage.getItem('stoa-google-one-tap-dismissed')) {
    globalThis.google.accounts.id.prompt((notification) => {
      if (notification.isDismissedMoment?.()) sessionStorage.setItem('stoa-google-one-tap-dismissed', '1');
    });
  }
};

const openDialog = () => {
  if (currentSession) {
    location.assign(authenticatedDestination());
    return;
  }
  setMessage('');
  updateAuthUI(currentSession);
  document.querySelectorAll('dialog[open]').forEach((openDialogElement) => {
    if (openDialogElement !== dialog) openDialogElement.close();
  });
  if (!dialog.open) dialog.showModal();
};

const redirectTo = new URL('/', siteUrl).href;

const initializeAuth = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  await hydrateAuthUI(sessionData.session);
  if (!sessionData.session) loadGoogleIdentity().catch(() => {});
  window.dispatchEvent(new CustomEvent('stoa:auth-ready',{detail:{session:sessionData.session}}));
  if (document.body.classList.contains('member-page') && !sessionData.session) {
    location.replace('/#connexion');
    return;
  }
  supabase.auth.onAuthStateChange((authEvent, session) => {
    if (authEvent === 'PASSWORD_RECOVERY') showRecovery();
    updateAuthUI(session);
    window.setTimeout(async()=>{await hydrateAuthUI(session);window.dispatchEvent(new CustomEvent('stoa:auth-ready',{detail:{session}}));}, 0);
  });

  document.addEventListener('click', (event) => {
    const authLink = event.target.closest('[data-auth-link]');
    const avatar = event.target.closest('[data-auth-avatar]');
    if ((authLink && !currentSession) || (avatar && !currentSession)) {
      event.preventDefault();
      openDialog();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    if (!email || password.length < 8) {
      setMessage('Renseignez un email valide et un mot de passe d’au moins 8 caractères.', 'error');
      return;
    }

    if (authMode === 'signup') {
      const firstName = String(data.get('firstName') || '').trim();
      const lastName = String(data.get('lastName') || '').trim();
      if (!firstName || !lastName) {
        setMessage('Ajoutez votre prénom et votre nom.', 'error');
        return;
      }
      setBusy(true);
      const fullName = `${firstName} ${lastName}`;
      const { data: authData, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, first_name: firstName, last_name: lastName }, emailRedirectTo: redirectTo } });
      setBusy(false);
      if (error) { setMessage(error.message, 'error'); return; }
      if (authData.session) { updateAuthUI(authData.session); dialog.close(); showToast('Votre compte STOA est créé.', 'success'); }
      else setMessage('Compte créé. Consultez votre boîte mail pour confirmer votre adresse.', 'success');
      return;
    }

    setBusy(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage('Email ou mot de passe incorrect.', 'error');
      return;
    }

    await hydrateAuthUI(authData.session);
    dialog.close();
    showToast('Connexion réussie. Bienvenue dans STOA.', 'success');
    location.assign(authenticatedDestination());
  });

  dialog.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));

  dialog.querySelector('[data-auth-action="google"]').addEventListener('click', async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });
    if (error) {
      setBusy(false);
      setMessage('Connexion Google indisponible. Réessayez dans un instant.', 'error');
    }
  });

  dialog.querySelector('[data-auth-action="magic-link"]').addEventListener('click', async () => {
    const email = String(new FormData(form).get('email') || '').trim();
    if (!email) {
      setMessage('Saisissez d’abord votre adresse email.', 'error');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    setMessage(error ? error.message : 'Lien envoyé. Consultez votre boîte mail.', error ? 'error' : 'success');
  });

  dialog.querySelector('[data-auth-action="forgot-password"]').addEventListener('click', async () => {
    const email = String(new FormData(form).get('email') || '').trim();
    if (!email) { setMessage('Saisissez votre adresse email avant de demander un nouveau mot de passe.', 'error'); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: new URL('/?recovery=1', siteUrl).href });
    setBusy(false);
    setMessage(error ? 'Le lien de récupération n’a pas pu être envoyé.' : 'Un lien de récupération vient de vous être envoyé.', error ? 'error' : 'success');
  });

  dialog.querySelector('.auth-recovery-view').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget), password = String(values.get('newPassword') || ''), confirmation = String(values.get('confirmPassword') || '');
    if (password.length < 8 || password !== confirmation) { setMessage('Les deux mots de passe doivent être identiques et contenir au moins 8 caractères.', 'error'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage('Le mot de passe n’a pas pu être modifié. Demandez un nouveau lien.', 'error'); return; }
    history.replaceState({}, '', '/');
    setMessage('Votre mot de passe a été modifié.', 'success');
    window.setTimeout(() => location.assign('/profil'), 700);
  });

  dialog.querySelector('[data-auth-action="discord"]').addEventListener('click', async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo } });
    if (error) {
      setBusy(false);
      setMessage('Connexion Discord indisponible. Vérifiez la configuration du fournisseur.', 'error');
    }
  });

  if (new URLSearchParams(location.search).get('recovery') === '1' || location.hash.includes('type=recovery')) showRecovery();
  else if (location.hash === '#connexion' && !currentSession) openDialog();
};

dialog.querySelector('.auth-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});

initializeAuth();
