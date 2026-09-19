import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const runtimeEnv = globalThis.__STOA_ENV__ ?? {};
const supabaseUrl = runtimeEnv.SUPABASE_URL;
const supabaseKey = runtimeEnv.SUPABASE_PUBLISHABLE_KEY ?? runtimeEnv.SUPABASE_ANON_KEY;

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
  <div class="auth-mark" aria-hidden="true">Π</div>
  <span class="eyebrow">ENTRER DANS STOA</span>
  <h2 id="auth-title">Votre espace membre</h2>
  <p class="auth-intro">Retrouvez votre parcours avec votre adresse email ou votre compte Discord.</p>
  <div class="auth-guest-view">
    <form class="auth-form" novalidate>
      <label for="auth-name">Nom complet <span>pour créer un compte</span></label>
      <input id="auth-name" name="fullName" type="text" autocomplete="name" placeholder="Votre nom">
      <label for="auth-email">Adresse email</label>
      <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="vous@exemple.fr" required>
      <label for="auth-password">Mot de passe</label>
      <input id="auth-password" name="password" type="password" autocomplete="current-password" minlength="8" placeholder="8 caractères minimum" required>
      <button class="button dark auth-submit" type="submit">Se connecter <span>↗</span></button>
      <button class="auth-secondary" type="button" data-auth-action="signup">Créer mon compte</button>
    </form>
    <div class="auth-separator"><span>ou</span></div>
    <button class="auth-provider" type="button" data-auth-action="magic-link"><span aria-hidden="true">✉</span> Recevoir un lien magique</button>
    <button class="auth-provider discord" type="button" data-auth-action="discord"><span aria-hidden="true">◉</span> Continuer avec Discord</button>
  </div>
  <div class="auth-member-view" hidden>
    <p>Vous êtes connecté avec <strong data-auth-email></strong>.</p>
    <a class="button dark" href="academie.html">Ouvrir mon académie <span>↗</span></a>
    <button class="auth-secondary" type="button" data-auth-action="signout">Se déconnecter</button>
  </div>
  <p class="auth-message" role="status" aria-live="polite"></p>
`;
document.body.append(dialog);

const form = dialog.querySelector('.auth-form');
const message = dialog.querySelector('.auth-message');
const guestView = dialog.querySelector('.auth-guest-view');
const memberView = dialog.querySelector('.auth-member-view');
let currentSession = null;

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

const updateAuthUI = (session) => {
  currentSession = session;
  const user = session?.user;
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const firstName = fullName.trim().split(/\s+/)[0];

  document.querySelectorAll('[data-auth-link]').forEach((link) => {
    link.href = user ? 'academie.html' : '#connexion';
    const label = user ? (firstName ? `Bonjour ${firstName}` : 'Mon académie') : 'Espace membre';
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.replaceChildren(document.createTextNode(`${label} `), arrow);
    link.setAttribute('aria-label', user ? 'Ouvrir mon académie' : 'Se connecter à STOA');
  });

  document.querySelectorAll('[data-auth-avatar]').forEach((avatar) => {
    avatar.textContent = (fullName || user?.email || 'S').trim().charAt(0).toUpperCase();
    avatar.title = user ? fullName || user.email : 'Se connecter';
    avatar.setAttribute('aria-label', user ? 'Ouvrir les options du compte' : 'Se connecter à STOA');
  });

  guestView.hidden = Boolean(user);
  memberView.hidden = !user;
  dialog.querySelector('[data-auth-email]').textContent = user?.email || '';
};

const openDialog = () => {
  setMessage('');
  updateAuthUI(currentSession);
  if (!dialog.open) dialog.showModal();
};

const canonicalSiteUrl = runtimeEnv.SITE_URL || location.origin;
const redirectTo = new URL('/academie.html', canonicalSiteUrl).href;

const initializeAuth = async () => {
  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const { data: sessionData } = await supabase.auth.getSession();
  updateAuthUI(sessionData.session);
  supabase.auth.onAuthStateChange((_event, session) => updateAuthUI(session));

  document.addEventListener('click', (event) => {
    const authLink = event.target.closest('[data-auth-link]');
    const avatar = event.target.closest('[data-auth-avatar]');
    if ((authLink && !currentSession) || avatar) {
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

    setBusy(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage('Email ou mot de passe incorrect.', 'error');
      return;
    }

    updateAuthUI(authData.session);
    dialog.close();
    showToast('Connexion réussie. Bienvenue dans STOA.', 'success');
    if (location.pathname.endsWith('/index.html') || location.pathname.endsWith('/')) location.assign('academie.html');
  });

  dialog.querySelector('[data-auth-action="signup"]').addEventListener('click', async () => {
    const data = new FormData(form);
    const fullName = String(data.get('fullName') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    if (!fullName || !email || password.length < 8) {
      setMessage('Ajoutez votre nom, un email valide et un mot de passe d’au moins 8 caractères.', 'error');
      return;
    }

    setBusy(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) {
      setMessage(error.message, 'error');
      return;
    }

    if (authData.session) {
      updateAuthUI(authData.session);
      dialog.close();
      showToast('Votre compte STOA est créé.', 'success');
    } else {
      setMessage('Compte créé. Consultez votre boîte mail pour confirmer votre adresse.', 'success');
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

  dialog.querySelector('[data-auth-action="discord"]').addEventListener('click', async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo } });
    if (error) {
      setBusy(false);
      setMessage('Connexion Discord indisponible. Vérifiez la configuration du fournisseur.', 'error');
    }
  });

  dialog.querySelector('[data-auth-action="signout"]').addEventListener('click', async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) {
      setMessage(error.message, 'error');
      return;
    }
    dialog.close();
    showToast('Vous êtes déconnecté.', 'success');
  });
};

dialog.querySelector('.auth-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});

initializeAuth();
