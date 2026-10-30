import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const auth = read('dist/auth.js');
const callback = read('dist/auth-callback.js');
const callbackPage = read('dist/auth-callback.html');
const landing = read('dist/app.js');

test('les inscriptions et fournisseurs reviennent par un callback dédié', () => {
  assert.match(auth, /new URL\('\/auth-callback', siteUrl\)/);
  assert.match(auth, /emailRedirectTo: authRedirectTo\(\)/);
  assert.match(auth, /redirectTo: authRedirectTo\(\)/);
  assert.match(callbackPage, /src="\/auth-callback\.js"/);
});

test('le callback accepte les trois formats de retour Supabase', () => {
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /setSession/);
  assert.match(callback, /verifyOtp/);
  assert.match(callback, /if \(!session\) throw new Error/);
});

test('la page racine sait aussi récupérer un ancien lien de confirmation', () => {
  assert.match(auth, /recoverReturnedSession/);
  assert.match(auth, /exchangeCodeForSession/);
  assert.match(auth, /setSession/);
});

test('le panneau de connexion est branché avant les appels réseau de session', () => {
  const bindPosition = auth.indexOf('bindAuthInteractions();');
  const initializePosition = auth.indexOf('initializeAuth().catch');
  assert.ok(bindPosition >= 0 && initializePosition > bindPosition);
  assert.match(auth, /if \(location\.hash === '#connexion'\) openDialog\(\);/);
  assert.match(auth, /window\.addEventListener\('hashchange'/);
});

test('le choix Académie survit à l’ouverture du mail dans un nouvel onglet', () => {
  assert.match(landing, /localStorage\.setItem\(pendingCheckoutKey/);
  assert.match(landing, /hasPendingAcademyCheckout/);
  assert.match(callback, /requestedOffer === 'academy'/);
  assert.match(callback, /location\.replace\('\/\?auth=confirmed#offres'\)/);
});
