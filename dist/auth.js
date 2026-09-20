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
    <button class="auth-provider discord" type="button" data-auth-action="discord"><img src="assets/branding/discord.svg" alt="" aria-hidden="true"> Continuer avec Discord</button>
  </div>
  <div class="auth-member-view" hidden>
    <p>Vous êtes connecté avec <strong data-auth-email></strong>.</p>
    <a class="button dark" href="/academie">Ouvrir mon académie <span>↗</span></a>
    <a class="button profile-button" href="/profil">Gérer mon profil <span>↗</span></a>
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
let currentProfile = null;
let currentProfileUserId = null;

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
  }
  const activeProfile = user && currentProfileUserId === user.id ? profile : null;
  const fullName = activeProfile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const avatarUrl = activeProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const firstName = activeProfile?.first_name || user?.user_metadata?.first_name || fullName.trim().split(/\s+/)[0];

  document.querySelectorAll('[data-auth-link]').forEach((link) => {
    link.href = user ? '/academie' : '#connexion';
    const label = user ? (firstName ? `Bonjour ${firstName}` : 'Mon académie') : 'Espace membre';
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.replaceChildren(document.createTextNode(`${label} `), arrow);
    link.setAttribute('aria-label', user ? 'Ouvrir mon académie' : 'Se connecter à STOA');
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

  guestView.hidden = Boolean(user);
  memberView.hidden = !user;
  dialog.querySelector('[data-auth-email]').textContent = user?.email || '';
};

const hydrateAuthUI = async (session) => {
  updateAuthUI(session);
  const user = session?.user;
  if (!user) return;

  const { data } = await supabase
    .from('profiles')
    .select('full_name, first_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!data || currentSession?.user?.id !== user.id) return;
  currentProfile = data;
  currentProfileUserId = user.id;
  updateAuthUI(session, data);
};

const openDialog = () => {
  setMessage('');
  updateAuthUI(currentSession);
  document.querySelectorAll('dialog[open]').forEach((openDialogElement) => {
    if (openDialogElement !== dialog) openDialogElement.close();
  });
  if (!dialog.open) dialog.showModal();
};

const redirectTo = new URL('/academie', siteUrl).href;

const initializeAuth = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  await hydrateAuthUI(sessionData.session);
  if (document.body.classList.contains('member-page') && !sessionData.session) {
    location.replace('/#connexion');
    return;
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
    window.setTimeout(() => hydrateAuthUI(session), 0);
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
    if (location.pathname === '/' || location.pathname === '/index') location.assign('/academie');
  });

  dialog.querySelector('[data-auth-action="signup"]').addEventListener('click', async () => {
    const data = new FormData(form);
    const fullName = String(data.get('fullName') || '').trim();
    const [firstName, ...lastNameParts] = fullName.split(/\s+/);
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
      options: {
        data: { full_name: fullName, first_name: firstName, last_name: lastNameParts.join(' ') || null },
        emailRedirectTo: redirectTo,
      },
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

  if (location.hash === '#connexion' && !currentSession) openDialog();
};

dialog.querySelector('.auth-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});

initializeAuth();
