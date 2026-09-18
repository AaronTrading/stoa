import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const runtimeEnv = globalThis.__STOA_ENV__ ?? {};
const supabaseUrl = runtimeEnv.SUPABASE_URL;
const supabaseKey = runtimeEnv.SUPABASE_PUBLISHABLE_KEY ?? runtimeEnv.SUPABASE_ANON_KEY;
const googleClientId = runtimeEnv.GOOGLE_CLIENT_ID;

const status = document.createElement('div');
status.className = 'auth-status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
document.body.append(status);

const showStatus = (message, tone = 'info') => {
  status.textContent = message;
  status.dataset.tone = tone;
  status.classList.add('visible');
  window.clearTimeout(showStatus.timeout);
  showStatus.timeout = window.setTimeout(() => status.classList.remove('visible'), 5000);
};

const updateAuthUI = (session) => {
  const user = session?.user;
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const firstName = fullName.trim().split(/\s+/)[0];

  document.querySelectorAll('[data-auth-link]').forEach((link) => {
    link.href = 'academie.html';
    if (user) {
      link.innerHTML = `${firstName ? `Bonjour ${firstName}` : 'Mon académie'} <span>↗</span>`;
      link.setAttribute('aria-label', firstName ? `Ouvrir l’académie de ${firstName}` : 'Ouvrir mon académie');
    }
  });

  document.querySelectorAll('[data-auth-avatar]').forEach((avatar) => {
    const initial = (fullName || user?.email || 'S').trim().charAt(0).toUpperCase();
    avatar.textContent = initial;
    avatar.title = user ? fullName || user.email : 'Espace membre';
  });
};

const loadGoogleIdentity = () => new Promise((resolve, reject) => {
  if (globalThis.google?.accounts?.id) {
    resolve();
    return;
  }

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

const generateNonce = async () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...randomBytes));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hash = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { nonce, hashedNonce };
};

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

  supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
    if (session) globalThis.google?.accounts?.id?.cancel();
  });

  if (sessionData.session || !googleClientId) return;

  try {
    await loadGoogleIdentity();
    const { nonce, hashedNonce } = await generateNonce();

    globalThis.google.accounts.id.initialize({
      client_id: googleClientId,
      context: 'signin',
      callback: async (response) => {
        if (!response?.credential) {
          showStatus('Google n’a pas transmis de justificatif de connexion.', 'error');
          return;
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          nonce,
        });

        if (error) {
          console.error('Google One Tap:', error.message);
          showStatus('Connexion Google impossible. Réessayez dans un instant.', 'error');
          return;
        }

        updateAuthUI(data.session);
        showStatus('Connexion réussie. Bienvenue dans STOA.', 'success');
        if (location.pathname.endsWith('/index.html') || location.pathname.endsWith('/')) {
          window.setTimeout(() => location.assign('academie.html'), 700);
        }
      },
      nonce: hashedNonce,
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
      use_fedcm_for_prompt: true,
    });

    globalThis.google.accounts.id.prompt();
  } catch (error) {
    console.error('Initialisation Google One Tap:', error);
  }
};

initializeAuth();
