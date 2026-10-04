import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const authSource = await readFile(new URL('../dist/auth.js', import.meta.url), 'utf8');
const envSource = await readFile(new URL('../dist/env.js', import.meta.url), 'utf8');
const profileSource = await readFile(new URL('../dist/profile.js', import.meta.url), 'utf8');
const profileMarkup = await readFile(new URL('../dist/profil.html', import.meta.url), 'utf8');
const preserveProfileMigration = await readFile(new URL('../supabase/migrations/202610040047_preserve_profile_on_oauth_login.sql', import.meta.url), 'utf8');

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

test('signed-in visitors can revisit the public site without an intermediate account panel', () => {
  assert.doesNotMatch(authSource, /auth-member-view/);
  assert.match(authSource, /const authenticatedDestination/);
  assert.doesNotMatch(authSource, /if \(location\.pathname === '\/'\) location\.replace\(authenticatedDestination/);
});

test('Google can be linked from the profile like Discord', () => {
  assert.match(profileMarkup, /id="google-link-button"/);
  assert.match(profileMarkup, /assets\/branding\/google\.svg/);
  assert.match(profileSource, /linkIdentity\(\{\s*provider: 'google'/);
  assert.match(profileSource, /linkedProviders\.has\('google'\)/);
});

test('OAuth reconnects cannot overwrite a member profile', () => {
  assert.match(preserveProfileMigration, /drop trigger if exists sync_discord_identity_profile on auth\.identities/i);
  assert.doesNotMatch(preserveProfileMigration, /update public\.profiles/i);
});
