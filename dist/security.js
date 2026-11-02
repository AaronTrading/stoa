import { supabase } from './supabase.js';

const MEMBER_ROUTES = new Set([
  '/accueil', '/academie', '/module', '/parcours', '/profil', '/communaute',
  '/posts', '/boutique', '/carte', '/scanner', '/liens', '/coaching',
  '/coaching-coach', '/coaching-onboarding', '/decouvrir-coaching', '/email-center',
]);
const path = location.pathname.replace(/\.html$/, '') || '/';
const normalizeKey = (event) => String(event.key || '').toLowerCase();
const isEditable = (target) => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));

const ensureNoIndex = () => {
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.name = 'robots';
    document.head.append(robots);
  }
  robots.content = 'noindex,nofollow,noarchive,nosnippet,noimageindex';
};

const sessionIdentifier = (session) => {
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')));
    return payload.session_id || session.user.id;
  } catch {
    return session.user.id;
  }
};

const enforceSingleSession = async (session) => {
  const marker = `stoa-session-enforced:${sessionIdentifier(session)}`;
  if (sessionStorage.getItem(marker)) return;
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (!error) sessionStorage.setItem(marker, '1');
};

const protectLesson = (lesson, user, profile) => {
  document.documentElement.classList.add('stoa-security-active');
  lesson.classList.add('stoa-protected-lesson');
  lesson.dataset.protectionMark = `${profile?.username ? `@${profile.username}` : user.email || 'Membre'} · STOA`;

  const hiddenReasons = new Set();
  let toast;
  let foregroundTimer;
  let devtoolsOpen = false;
  const inLesson = (target) => target instanceof Node && lesson.contains(target);
  const setHidden = (reason, hidden) => {
    if (hidden) hiddenReasons.add(reason);
    else hiddenReasons.delete(reason);
    lesson.classList.toggle('stoa-security-obscured', hiddenReasons.size > 0);
    document.documentElement.classList.toggle('stoa-security-screen-hidden', hiddenReasons.size > 0);
  };
  const notify = (text) => {
    toast?.remove();
    toast = document.createElement('div');
    toast.className = 'stoa-security-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = text;
    document.body.append(toast);
    window.setTimeout(() => toast?.remove(), 2200);
  };
  const block = (event, message = 'Ce contenu est réservé aux membres STOA.') => {
    event.preventDefault();
    event.stopPropagation();
    notify(message);
  };
  const restoreForeground = () => {
    clearTimeout(foregroundTimer);
    if (document.hidden || !document.hasFocus()) return;
    foregroundTimer = window.setTimeout(() => {
      setHidden('visibility', false);
      setHidden('focus', false);
    }, 350);
  };

  document.addEventListener('contextmenu', (event) => {
    if (inLesson(event.target) && !isEditable(event.target)) block(event);
  }, true);
  ['selectstart', 'copy', 'cut', 'dragstart'].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      const selectionNode = getSelection()?.anchorNode;
      if ((inLesson(event.target) || inLesson(selectionNode)) && !isEditable(event.target)) block(event);
    }, true);
  });
  document.addEventListener('keydown', (event) => {
    const key = normalizeKey(event);
    const modifier = event.ctrlKey || event.metaKey;
    const browserShortcut = modifier && ['s', 'p', 'u'].includes(key);
    const developerShortcut = event.key === 'F12' || (modifier && event.shiftKey && ['i', 'j', 'c'].includes(key));
    const contentShortcut = modifier && ['c', 'x', 'a'].includes(key) && inLesson(event.target) && !isEditable(event.target);
    if (browserShortcut || developerShortcut || contentShortcut) block(event);
    if (event.key === 'PrintScreen') {
      navigator.clipboard?.writeText('').catch(() => {});
      setHidden('printscreen', true);
      notify('Les captures du contenu de l’Académie ne sont pas autorisées.');
      window.setTimeout(() => setHidden('printscreen', false), 2500);
    }
  }, true);
  document.addEventListener('keyup', (event) => {
    if (event.key !== 'PrintScreen') return;
    navigator.clipboard?.writeText('').catch(() => {});
    setHidden('printscreen', true);
    window.setTimeout(() => setHidden('printscreen', false), 2500);
  }, true);
  document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1 && inLesson(event.target) && !isEditable(event.target)) event.preventDefault();
  }, { passive: false, capture: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setHidden('visibility', true);
    else restoreForeground();
  });
  window.addEventListener('blur', () => setHidden('focus', true));
  window.addEventListener('focus', restoreForeground);
  window.addEventListener('pageshow', restoreForeground);
  if (document.hidden) setHidden('visibility', true);
  if (!document.hasFocus()) setHidden('focus', true);

  const secureMedia = (root = lesson) => {
    root.querySelectorAll?.('img').forEach((image) => {
      image.draggable = false;
      image.setAttribute('draggable', 'false');
    });
    root.querySelectorAll?.('video').forEach((video) => {
      video.controlsList = 'nodownload noremoteplayback';
      video.disablePictureInPicture = true;
      video.setAttribute('controlsList', 'nodownload noremoteplayback');
      video.setAttribute('disablePictureInPicture', '');
      video.addEventListener('contextmenu', (event) => block(event), true);
    });
  };
  secureMedia();
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node instanceof Element) secureMedia(node.matches('img,video') ? node.parentElement : node);
  }))).observe(lesson, { childList: true, subtree: true });

  const detectDevtools = () => {
    const dimensionGap = window.innerWidth >= 700 && (window.outerWidth - window.innerWidth > 180 || window.outerHeight - window.innerHeight > 180);
    const startedAt = performance.now();
    debugger;
    const debuggerDelay = performance.now() - startedAt > 120;
    const detected = dimensionGap || debuggerDelay;
    if (detected !== devtoolsOpen) {
      devtoolsOpen = detected;
      setHidden('devtools', detected);
      if (detected) notify('Le contenu est masqué pendant l’ouverture des outils de développement.');
    }
  };
  detectDevtools();
  window.setInterval(detectDevtools, 1200);
};

const initializeSecurity = async () => {
  if (!MEMBER_ROUTES.has(path)) return;
  ensureNoIndex();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  enforceSingleSession(session).catch(() => {});
  if (path !== '/module') return;

  const lesson = document.querySelector('#lesson-content');
  if (!lesson) return;
  const { data: profile } = await supabase.from('profiles').select('role,username').eq('id', session.user.id).maybeSingle();
  if (profile?.role === 'admin') return;
  protectLesson(lesson, session.user, profile);
};

initializeSecurity();
