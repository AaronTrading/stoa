import { supabase } from './supabase.js';

export const signUpWithPassword = (email, password, fullName) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

export const signInWithPassword = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const sendMagicLink = (email, redirectTo = `${location.origin}/academie.html`) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });

export const signInWithProvider = (provider, redirectTo = `${location.origin}/academie.html`) => {
  if (provider !== 'discord') {
    throw new Error('Fournisseur OAuth non pris en charge.');
  }
  return supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
};

export const signOut = () => supabase.auth.signOut();
