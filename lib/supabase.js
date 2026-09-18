import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const runtimeEnv = globalThis.__STOA_ENV__ ?? {};
const supabaseUrl = runtimeEnv.SUPABASE_URL;
const supabasePublishableKey = runtimeEnv.SUPABASE_PUBLISHABLE_KEY ?? runtimeEnv.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Configuration Supabase manquante. Définissez SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY dans window.__STOA_ENV__.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
