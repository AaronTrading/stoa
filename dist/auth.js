import { siteUrl, supabase } from './supabase.js';
import { attachDepartmentPicker, departmentCode } from './departments.js';

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
  <p class="auth-intro">Retrouvez votre parcours avec votre adresse email ou votre compte Discord.</p>
  <div class="auth-guest-view">
    <div class="auth-mode-tabs" role="tablist" aria-label="Connexion ou inscription"><button type="button" role="tab" data-auth-mode="login" aria-selected="true">Se connecter</button><button type="button" role="tab" data-auth-mode="signup" aria-selected="false">S’inscrire</button></div>
    <form class="auth-form" novalidate>
      <div class="auth-signup-fields" hidden>
        <div><label for="auth-first-name">Prénom</label><input id="auth-first-name" name="firstName" type="text" autocomplete="given-name" placeholder="Votre prénom"></div>
        <div><label for="auth-last-name">Nom</label><input id="auth-last-name" name="lastName" type="text" autocomplete="family-name" placeholder="Votre nom"></div>
        <div><label for="auth-department">Département</label><input id="auth-department" name="department" type="text" inputmode="text" autocomplete="address-level2" placeholder="Numéro ou nom du département"></div>
      </div>
      <label for="auth-email">Adresse email</label>
      <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="vous@exemple.fr" required>
      <label for="auth-password">Mot de passe</label>
      <input id="auth-password" name="password" type="password" autocomplete="current-password" minlength="8" placeholder="8 caractères minimum" required>
      <button class="button dark auth-submit" type="submit">Se connecter <span>↗</span></button>
    </form>
    <div class="auth-separator"><span>ou</span></div>
    <button class="auth-provider" type="button" data-auth-action="magic-link"><span aria-hidden="true">✉</span> Recevoir un lien magique</button>
    <button class="auth-provider discord" type="button" data-auth-action="discord"><img src="assets/branding/discord.svg" alt="" aria-hidden="true"> Continuer avec Discord</button>
  </div>
  <div class="auth-member-view" hidden>
    <p>Vous êtes connecté avec <strong data-auth-email></strong>.</p>
    <a class="button dark" href="/accueil">Ouvrir mon espace <span>↗</span></a>
    <a class="button profile-button" href="/profil">Gérer mon profil <span>↗</span></a>
    <button class="auth-secondary" type="button" data-auth-action="signout">Se déconnecter</button>
  </div>
  <p class="auth-message" role="status" aria-live="polite"></p>
`;
document.body.append(dialog);
attachDepartmentPicker(dialog.querySelector('#auth-department'));

const form = dialog.querySelector('.auth-form');
const message = dialog.querySelector('.auth-message');
const guestView = dialog.querySelector('.auth-guest-view');
const memberView = dialog.querySelector('.auth-member-view');
let currentSession = null;
let currentProfile = null;
let currentProfileUserId = null;
let authMode = 'login';

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
  }
  const activeProfile = user && currentProfileUserId === user.id ? profile : null;
  const hasAcademyAccess = Boolean(user && ['member', 'coaching', 'admin'].includes(activeProfile?.role));
  const memberDestination = hasAcademyAccess ? '/accueil' : '/#offres';
  const fullName = activeProfile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const avatarUrl = activeProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const firstName = activeProfile?.first_name || user?.user_metadata?.first_name || fullName.trim().split(/\s+/)[0];

  document.querySelectorAll('[data-auth-link]').forEach((link) => {
    link.href = user ? memberDestination : '#connexion';
    const label = user ? (hasAcademyAccess ? 'Mon espace' : 'Rejoindre STOA') : 'Connexion';
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.replaceChildren(document.createTextNode(`${label} `), arrow);
    link.setAttribute('aria-label', user ? (hasAcademyAccess ? 'Ouvrir mon académie' : 'Découvrir l’abonnement STOA') : 'Se connecter à STOA');
  });

  document.querySelectorAll('[data-member-academy-link]').forEach((link) => {
    link.hidden = !hasAcademyAccess;
    link.href = '/accueil';
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
  const memberButton = memberView.querySelector('.button.dark');
  if (memberButton) {
    memberButton.href = memberDestination;
    memberButton.innerHTML = `${hasAcademyAccess ? 'Ouvrir mon espace' : 'Rejoindre l’Académie'} <span>↗</span>`;
  }
};

const hydrateAuthUI = async (session) => {
  updateAuthUI(session);
  const user = session?.user;
  if (!user) return;

  const { data } = await supabase
    .from('profiles')
    .select('full_name, first_name, avatar_url, department, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!data || currentSession?.user?.id !== user.id) return;
  currentProfile = data;
  currentProfileUserId = user.id;
  updateAuthUI(session, data);
  if (user.app_metadata?.provider === 'discord' && !data.department && location.pathname !== '/profil') {
    location.replace('/profil?nouveau=1');
  }
};

const openDialog = () => {
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
  window.dispatchEvent(new CustomEvent('stoa:auth-ready',{detail:{session:sessionData.session}}));
  if (document.body.classList.contains('member-page') && !sessionData.session) {
    location.replace('/#connexion');
    return;
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
    window.setTimeout(async()=>{await hydrateAuthUI(session);window.dispatchEvent(new CustomEvent('stoa:auth-ready',{detail:{session}}));}, 0);
  });

  document.addEventListener('click', (event) => {
    const authLink = event.target.closest('[data-auth-link]');
    const avatar = event.target.closest('[data-auth-avatar]');
    if (authLink || (avatar && !currentSession)) {
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
      const department = departmentCode(data.get('department'));
      if (!firstName || !lastName || !department) {
        setMessage('Ajoutez votre prénom, votre nom et votre département.', 'error');
        return;
      }
      setBusy(true);
      const fullName = `${firstName} ${lastName}`;
      const { data: authData, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, first_name: firstName, last_name: lastName, department }, emailRedirectTo: redirectTo } });
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

    updateAuthUI(authData.session);
    dialog.close();
    showToast('Connexion réussie. Bienvenue dans STOA.', 'success');
  });

  dialog.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));

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

  memberView.querySelector('.button.dark')?.addEventListener('click', async (event) => {
    if (!currentSession || ['member', 'coaching', 'admin'].includes(currentProfile?.role)) return;
    event.preventDefault();
    const button = event.currentTarget;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Ouverture du paiement…';
    const { data, error } = await supabase.functions.invoke('create-checkout', { body: { offer: 'academy' } });
    if (error || !data?.url) {
      button.removeAttribute('aria-busy');
      button.innerHTML = 'Rejoindre l’Académie <span>↗</span>';
      setMessage(data?.error || error?.message || 'Le paiement ne peut pas être ouvert pour le moment.', 'error');
      return;
    }
    location.assign(data.url);
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
