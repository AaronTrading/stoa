import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const authSource = await readFile(new URL('../dist/auth.js', import.meta.url), 'utf8');
const envSource = await readFile(new URL('../dist/env.js', import.meta.url), 'utf8');

test('Google OAuth is available from the shared authentication panel', () => {
  assert.match(authSource, /data-auth-action="google"/);
  assert.match(authSource, /provider:\s*'google'/);
  assert.match(authSource, /signInWithOAuth/);
});

test('Google One Tap exchanges a nonce-bound ID token with Supabase', () => {
  assert.match(authSource, /accounts\.google\.com\/gsi\/client/);
  assert.match(authSource, /signInWithIdToken/);
  assert.match(authSource, /use_fedcm_for_prompt:\s*true/);
  assert.match(authSource, /nonce:\s*googleNonce/);
  assert.match(authSource, /crypto\.subtle\.digest\('SHA-256'/);
});

test('the public Google client ID is available to the static frontend', () => {
  assert.match(envSource, /GOOGLE_CLIENT_ID:\s*'439569333078-[^']+\.apps\.googleusercontent\.com'/);
});
