(() => {
  'use strict';

  const MEMBER_ROUTES = new Set([
    '/accueil', '/academie', '/module', '/parcours', '/profil', '/communaute',
    '/posts', '/boutique', '/carte', '/scanner', '/liens', '/coaching',
    '/coaching-coach', '/coaching-onboarding', '/decouvrir-coaching', '/email-center',
    '/entrainement',
  ]);
  const path = location.pathname.replace(/\.html$/, '') || '/';
  const isLessonRoute = path === '/module';
  const RENDER_MODE = globalThis.STOA_SECURITY_RENDER_MODE === 'canvas' ? 'canvas' : 'dom';
  const nativeConsoleLog = console.log.bind(console);
  let consoleProbeTriggered = false;
  const consoleProbe = new Image();
  Object.defineProperty(consoleProbe, 'id', {
    get() {
      consoleProbeTriggered = true;
      return 'stoa-security-probe';
    },
  });
  const ALLOWED_SELECTOR = '[data-allow-select],input,textarea,select,[contenteditable="true"]';
  const state = {
    disabled: !isLessonRoute,
    lesson: null,
    hiddenReasons: new Set(),
    devtoolsOpen: false,
    emptied: false,
    printTimer: 0,
  };

  if (isLessonRoute) document.documentElement.classList.add('stoa-security-pending');

  const normalizeKey = (event) => String(event.key || '').toLowerCase();
  const allowed = (target) => target instanceof Element && Boolean(target.closest(ALLOWED_SELECTOR));
  const lessonElement = () => state.lesson || document.querySelector('#lesson-content');
  const inLesson = (target) => {
    const lesson = lessonElement();
    return Boolean(lesson && target instanceof Node && lesson.contains(target));
  };
  const selectionInLesson = () => {
    const selection = getSelection();
    return Boolean(selection && (inLesson(selection.anchorNode) || inLesson(selection.focusNode)));
  };
  const shouldBlock = (target) => !state.disabled && inLesson(target) && !allowed(target);

  const showNotice = (text) => {
    document.querySelector('.stoa-security-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'stoa-security-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = text;
    (document.body || document.documentElement).append(toast);
    setTimeout(() => toast.remove(), 2200);
  };

  const prevent = (event, message = 'Ce contenu est réservé aux membres STOA.') => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showNotice(message);
  };

  const setHidden = (reason, hidden) => {
    if (hidden) state.hiddenReasons.add(reason);
    else state.hiddenReasons.delete(reason);
    const obscured = !state.disabled && state.hiddenReasons.size > 0;
    lessonElement()?.classList.toggle('stoa-security-obscured', obscured);
    document.documentElement.classList.toggle('stoa-security-screen-hidden', obscured);
  };

  const neutralClipboard = (event) => {
    if (!shouldBlock(event.target) && !selectionInLesson()) return;
    event.clipboardData?.setData('text/plain', 'Contenu réservé aux membres STOA.');
    prevent(event);
  };

  // Installed synchronously in <head>, before lesson markup is parsed.
  document.addEventListener('contextmenu', (event) => {
    if (shouldBlock(event.target)) prevent(event);
  }, true);
  document.addEventListener('selectstart', (event) => {
    if (shouldBlock(event.target)) prevent(event);
  }, true);
  document.addEventListener('selectionchange', () => {
    if (!state.disabled && selectionInLesson()) getSelection()?.removeAllRanges();
  }, true);
  document.addEventListener('copy', neutralClipboard, true);
  document.addEventListener('cut', neutralClipboard, true);
  document.addEventListener('dragstart', (event) => {
    if (shouldBlock(event.target)) prevent(event);
  }, true);
  document.addEventListener('mousedown', (event) => {
    if (event.detail > 1 && shouldBlock(event.target)) prevent(event);
  }, true);
  document.addEventListener('gesturestart', (event) => {
    if (shouldBlock(event.target)) prevent(event);
  }, { capture: true, passive: false });
  document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1 && shouldBlock(event.target)) event.preventDefault();
  }, { capture: true, passive: false });
  document.addEventListener('keydown', (event) => {
    if (state.disabled || allowed(event.target)) return;
    const key = normalizeKey(event);
    const modifier = event.ctrlKey || event.metaKey;
    const protectedSelection = inLesson(event.target) || selectionInLesson();
    const contentShortcut = protectedSelection && modifier && ['a', 'c', 'x'].includes(key);
    const browserShortcut = modifier && ['p', 's', 'u'].includes(key);
    const developerShortcut = event.key === 'F12' || (modifier && event.shiftKey && ['c', 'i', 'j'].includes(key));
    if (contentShortcut || browserShortcut || developerShortcut || event.key === 'F7') prevent(event);
    if (event.key === 'PrintScreen') {
      navigator.clipboard?.writeText('').catch(() => {});
      setHidden('printscreen', true);
      showNotice('Les captures du contenu de l’Académie ne sont pas autorisées.');
      clearTimeout(state.printTimer);
      state.printTimer = setTimeout(() => setHidden('printscreen', false), 2800);
    }
  }, true);
  document.addEventListener('keyup', (event) => {
    if (state.disabled || event.key !== 'PrintScreen') return;
    navigator.clipboard?.writeText('').catch(() => {});
    setHidden('printscreen', true);
    clearTimeout(state.printTimer);
    state.printTimer = setTimeout(() => setHidden('printscreen', false), 2800);
  }, true);

  const restoreForeground = () => {
    if (document.hidden || !document.hasFocus()) return;
    setTimeout(() => {
      if (!document.hidden && document.hasFocus()) {
        setHidden('visibility', false);
        setHidden('focus', false);
        setHidden('pagehide', false);
      }
    }, 250);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setHidden('visibility', true);
    else restoreForeground();
  }, true);
  window.addEventListener('blur', () => setHidden('focus', true), true);
  window.addEventListener('focus', restoreForeground, true);
  window.addEventListener('pagehide', () => setHidden('pagehide', true), true);
  window.addEventListener('pageshow', restoreForeground, true);
  window.addEventListener('beforeprint', () => setHidden('print', true), true);
  window.addEventListener('afterprint', () => setHidden('print', false), true);
  setInterval(() => {
    if (!state.disabled && (!document.hasFocus() || document.hidden)) setHidden('focus-poll', true);
    else setHidden('focus-poll', false);
  }, 300);

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
      const encoded = session.access_token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
      const payload = JSON.parse(atob(encoded));
      return payload.session_id || session.user.id;
    } catch {
      return session.user.id;
    }
  };

  const enforceSingleSession = async (supabase, session) => {
    const marker = `stoa-session-enforced:${sessionIdentifier(session)}`;
    if (sessionStorage.getItem(marker)) return;
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (!error) sessionStorage.setItem(marker, '1');
  };

  const secureMedia = (root = lessonElement()) => {
    if (!root) return;
    const images = root.matches?.('img') ? [root] : root.querySelectorAll?.('img') || [];
    images.forEach((image) => {
      image.draggable = false;
      image.setAttribute('draggable', 'false');
    });
    const videos = root.matches?.('video') ? [root] : root.querySelectorAll?.('video') || [];
    videos.forEach((video) => {
      video.controlsList = 'nodownload noremoteplayback';
      video.disablePictureInPicture = true;
      video.setAttribute('controlsList', 'nodownload noremoteplayback');
      video.setAttribute('disablePictureInPicture', '');
      video.addEventListener('contextmenu', prevent, true);
    });
  };

  const drawCanvasText = (canvas, text) => {
    const width = Math.max(280, Math.floor(canvas.parentElement?.clientWidth || 720));
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const fontSize = width < 520 ? 16 : 17;
    const lineHeight = Math.round(fontSize * 1.75);
    const padding = width < 520 ? 8 : 16;
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = `${fontSize}px Jost, Segoe UI, sans-serif`;
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (probe.measureText(candidate).width > width - padding * 2 && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
    });
    if (line) lines.push(line);
    const height = Math.max(120, padding * 2 + lines.length * lineHeight);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    const dark = document.documentElement.classList.contains('stoa-dark');
    context.fillStyle = dark ? '#f1f0ea' : '#34372f';
    context.font = `${fontSize}px Jost, Segoe UI, sans-serif`;
    context.textBaseline = 'top';
    lines.forEach((item, index) => context.fillText(item, padding, padding + index * lineHeight));
  };

  const renderCanvasMode = () => {
    if (RENDER_MODE !== 'canvas' || state.disabled) return;
    const copy = document.querySelector('#lesson-copy');
    if (!copy || copy.dataset.canvasRendered === 'true') return;
    const text = copy.innerText;
    if (!text.trim()) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'stoa-lesson-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Contenu pédagogique de la leçon STOA');
    copy.replaceChildren(canvas);
    copy.dataset.canvasRendered = 'true';
    drawCanvasText(canvas, text);
    window.addEventListener('resize', () => drawCanvasText(canvas, text), { passive: true });
  };

  const clearLessonDom = () => {
    if (state.emptied || state.disabled) return;
    state.emptied = true;
    const copy = document.querySelector('#lesson-copy');
    const artwork = document.querySelector('#lesson-artwork');
    if (copy) copy.replaceChildren();
    if (artwork) artwork.removeAttribute('src');
    document.querySelector('#lesson-title')?.replaceChildren();
    document.querySelector('#lesson-kicker')?.replaceChildren();
    const neutral = document.createElement('div');
    neutral.className = 'stoa-security-neutral';
    neutral.textContent = 'Le contenu est temporairement masqué.';
    copy?.append(neutral);
  };

  const protectLesson = (lesson, user, profile) => {
    state.lesson = lesson;
    state.disabled = false;
    document.documentElement.classList.remove('stoa-security-pending');
    document.documentElement.classList.add('stoa-security-active');
    lesson.classList.add('stoa-protected-lesson');
    lesson.dataset.protectionMark = `${profile?.username ? `@${profile.username}` : user.email || 'Membre'} · STOA`;
    secureMedia(lesson);
    new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) secureMedia(node);
    }))).observe(lesson, { childList: true, subtree: true });
    window.addEventListener('stoa:lesson-ready', () => {
      secureMedia(lesson);
      renderCanvasMode();
    });
    renderCanvasMode();

    let positiveDetections = 0;
    const detectDevtools = () => {
      const dimensionGap = innerWidth >= 700 && (outerWidth - innerWidth > 200 || outerHeight - innerHeight > 200);
      consoleProbeTriggered = false;
      nativeConsoleLog(consoleProbe);
      const startedAt = performance.now();
      debugger;
      const debuggerDelay = performance.now() - startedAt > 140;
      positiveDetections = dimensionGap || debuggerDelay || consoleProbeTriggered ? positiveDetections + 1 : 0;
      const detected = positiveDetections >= 2;
      if (detected && !state.devtoolsOpen) {
        state.devtoolsOpen = true;
        setHidden('devtools', true);
        clearLessonDom();
        showNotice('Le contenu est masqué pendant l’ouverture des outils de développement.');
      } else if (!detected && state.devtoolsOpen) {
        location.reload();
      }
    };
    detectDevtools();
    setInterval(detectDevtools, 1000);
  };

  const silenceProductionConsole = () => {
    if (['localhost', '127.0.0.1'].includes(location.hostname)) return;
    ['log', 'debug', 'info', 'table', 'dir', 'trace'].forEach((method) => {
      try { console[method] = () => {}; } catch {}
    });
  };

  const initializeSecurity = async () => {
    if (!MEMBER_ROUTES.has(path)) return;
    ensureNoIndex();
    silenceProductionConsole();
    const { supabase } = await import('./supabase.js');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    enforceSingleSession(supabase, session).catch(() => {});
    if (!isLessonRoute) return;
    const lesson = document.querySelector('#lesson-content');
    if (!lesson) return;
    const { data: profile } = await supabase.from('profiles').select('role,username').eq('id', session.user.id).maybeSingle();
    if (profile?.role === 'admin') {
      state.disabled = true;
      document.documentElement.classList.remove('stoa-security-pending');
      document.documentElement.classList.add('stoa-security-admin');
      return;
    }
    protectLesson(lesson, session.user, profile);
  };

  globalThis.__STOA_SECURITY__ = { RENDER_MODE, state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSecurity, { once: true });
  else initializeSecurity();
})();
