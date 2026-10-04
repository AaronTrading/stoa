import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';

// Recover magic links generated while the redirect still contained #offres.
// A URL can only have one fragment, so expose Supabase's auth fragment first.
const legacyAuthMarker = location.hash.indexOf('#access_token=');
if (legacyAuthMarker > 0) {
  history.replaceState(null, '', `${location.pathname}${location.search}${location.hash.slice(legacyAuthMarker)}`);
}

const runtimeEnv = globalThis.__STOA_ENV__ ?? {};
const supabaseUrl = runtimeEnv.SUPABASE_URL;
const supabaseKey = runtimeEnv.SUPABASE_PUBLISHABLE_KEY ?? runtimeEnv.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configuration Supabase manquante.');
}

export const siteUrl = runtimeEnv.SITE_URL || location.origin;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
