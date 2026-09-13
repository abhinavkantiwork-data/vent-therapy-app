import { supabase } from './supabaseClient';
import { clearSession, persistToken } from '../utils/authStorage';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiUser {
  id: string;
  email: string;
}

export function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      if (!data.session || !data.user) throw new Error('Login requires email confirmation.');
      persistToken(data.session.access_token, true);
      return { user: { id: data.user.id, email: data.user.email ?? email }, token: data.session.access_token };
    });
}

export function signup(email: string, password: string) {
  return supabase.auth.signUp({ email: email.trim().toLowerCase(), password })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Unable to create the account.');
      if (!data.session) throw new Error('Check your email to confirm your account, then log in.');
      persistToken(data.session.access_token, true);
      return { user: { id: data.user.id, email: data.user.email ?? email }, token: data.session.access_token };
    });
}

export async function restoreSession(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Session expired.');
  return { user: { id: data.user.id, email: data.user.email ?? '' } };
}

export async function logout(token: string) {
  void token;
  await supabase.auth.signOut();
  clearSession();
}
