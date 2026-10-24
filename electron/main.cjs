const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PRODUCT_NAME = 'STOA Académie';
const STOA_ORIGIN = 'https://stoa-coaching.fr';
const START_URL = `${STOA_ORIGIN}/accueil`;
const OFFLINE_URL = pathToFileURL(path.join(__dirname, 'offline.html')).href;
const AUTH_ORIGINS = new Set([
  'https://xriaekbrswqmosecjmhm.supabase.co',
  'https://accounts.google.com',
  'https://discord.com',
]);
const ACADEMY_PATHS = [
  '/accueil',
  '/academie',
  '/module',
  '/parcours',
  '/posts',
  '/communaute',
  '/profil',
  '/carte',
  '/scanner',
  '/boutique',
  '/coaching',
  '/coaching-onboarding',
  '/coaching-coach',
  '/decouvrir-coaching',
  '/email-center',
  '/rendez-vous',
  '/abonnement-success',
];
const DESKTOP_CSS = `
  html[data-stoa-desktop] body:has(> dialog.auth-dialog[open]) > :not(dialog.auth-dialog):not(.auth-status) {
    visibility: hidden !important;
  }
  html[data-stoa-desktop] body:has(> dialog.auth-dialog[open]) {
    overflow: hidden !important;
  }
  html[data-stoa-desktop] dialog.auth-dialog::backdrop {
    background: #1d241c !important;
    backdrop-filter: none !important;
  }
  html[data-stoa-desktop] dialog.auth-dialog {
    max-height: calc(100vh - 64px) !important;
  }
  html[data-stoa-desktop] dialog.auth-dialog .auth-close {
    display: none !important;
  }
`;

let mainWindow = null;

function parseUrl(value) {
  try { return new URL(value); } catch { return null; }
}
function isAcademyUrl(value) {
  const url = parseUrl(value);
  if (!url || url.origin !== STOA_ORIGIN) return false;
  if (url.pathname === '/') return true;
  return ACADEMY_PATHS.some(route => url.pathname === route || url.pathname.startsWith(`${route}/`));
}

function isAuthenticationUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && AUTH_ORIGINS.has(url.origin));
}

function isLocalAppUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && url.href === OFFLINE_URL);
}

function isSafeExternalUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && ['https:', 'mailto:'].includes(url.protocol));
}

function windowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function readWindowState() {
  try {
    const saved = JSON.parse(readFileSync(windowStatePath(), 'utf8'));
    const width = Math.max(960, Number(saved.width) || 1440);
    const height = Math.max(680, Number(saved.height) || 920);
    return { width, height, maximized: Boolean(saved.maximized) };
  } catch {
    return { width: 1440, height: 920, maximized: false };
  }
}

function saveWindowState(window) {
  if (!window || window.isDestroyed()) return;
  const bounds = window.isMaximized() ? window.getNormalBounds() : window.getBounds();
  try {
    writeFileSync(windowStatePath(), JSON.stringify({ ...bounds, maximized: window.isMaximized() }));
  } catch {
    // The app remains usable when the operating system refuses persistence.
  }
}

function openOutsideApp(value) {
  if (isSafeExternalUrl(value)) shell.openExternal(value).catch(() => {});
}

function secureWebPreferences() {
  return {
    preload: path.join(__dirname, 'preload.cjs'),
    partition: 'persist:stoa-academie',
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInSubFrames: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    spellcheck: true,
  };
}

function installNavigationPolicy(contents, ownerWindow) {
  contents.on('will-navigate', (event, value) => {
    if (isAcademyUrl(value) || isAuthenticationUrl(value) || isLocalAppUrl(value)) return;
    event.preventDefault();
    openOutsideApp(value);
  });

  contents.setWindowOpenHandler(({ url }) => {
    if (isAuthenticationUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: ownerWindow,
          width: 560,
          height: 760,
          autoHideMenuBar: true,
          backgroundColor: '#1d241c',
          webPreferences: secureWebPreferences(),
        },
      };
    }
    if (isAcademyUrl(url)) ownerWindow.loadURL(url).catch(() => {});
    else openOutsideApp(url);
    return { action: 'deny' };
  });
}

function reinforceAcademyScope(contents) {
  contents.insertCSS(DESKTOP_CSS, { cssOrigin: 'user' }).catch(() => {});
  contents.executeJavaScript(`(() => {
    document.documentElement.dataset.stoaDesktop = 'true';
    const authDialog = document.querySelector('dialog.auth-dialog');
    if (authDialog?.open) requestAnimationFrame(() => { authDialog.scrollTop = 0; });
    if (location.origin !== ${JSON.stringify(STOA_ORIGIN)} || location.pathname !== '/') return;
    if (/access_token=|refresh_token=|type=(?:magiclink|recovery)/.test(location.hash)) return;
    setTimeout(() => {
      const hasSession = Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token') && localStorage.getItem(key));
      if (hasSession) location.replace('/accueil');
    }, 900);
  })()`, true).catch(() => {});
}

function createWindow() {
  const saved = readWindowState();
  const window = new BrowserWindow({
    title: PRODUCT_NAME,
    width: saved.width,
    height: saved.height,
    minWidth: 960,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1d241c',
    icon: path.join(__dirname, '..', 'dist', 'assets', 'branding', 'stoa-mark-400.png'),
    webPreferences: secureWebPreferences(),
  });

  mainWindow = window;
  if (saved.maximized) window.maximize();
  installNavigationPolicy(window.webContents, window);

  window.on('page-title-updated', event => {
    event.preventDefault();
    window.setTitle(PRODUCT_NAME);
  });
  window.webContents.on('did-finish-load', () => reinforceAcademyScope(window.webContents));
  window.webContents.on('did-fail-load', (_event, code, _description, failedUrl, isMainFrame) => {
    if (!isMainFrame || code === -3 || !failedUrl.startsWith(STOA_ORIGIN)) return;
    window.loadFile(path.join(__dirname, 'offline.html')).catch(() => {});
  });
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const control = input.control || input.meta;
    if (input.key === 'F5' || (control && input.key.toLowerCase() === 'r')) {
      event.preventDefault();
      window.webContents.reload();
    } else if (input.alt && input.key === 'Left') {
      event.preventDefault();
      if (window.webContents.canGoBack()) window.webContents.goBack();
    } else if (input.alt && input.key === 'Right') {
      event.preventDefault();
      if (window.webContents.canGoForward()) window.webContents.goForward();
    }
  });

  window.once('ready-to-show', () => window.show());
  window.on('close', () => saveWindowState(window));
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });
  window.loadURL(START_URL).catch(() => window.loadFile(path.join(__dirname, 'offline.html')).catch(() => {}));
  return window;
}

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  app.setName(PRODUCT_NAME);
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    app.setAppUserModelId('fr.stoa.academie');
    Menu.setApplicationMenu(null);
    ipcMain.on('stoa:retry', () => mainWindow?.loadURL(START_URL));
    createWindow();
  });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

