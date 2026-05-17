import { supabase } from './supabase-client.js';

const LOGIN_PATH = 'login.html';

export async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const here = location.pathname.split('/').pop() || 'index.html';
    location.replace(`${LOGIN_PATH}?next=${encodeURIComponent(here)}`);
    return null;
  }
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  location.replace(LOGIN_PATH);
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    location.replace(LOGIN_PATH);
  }
});
