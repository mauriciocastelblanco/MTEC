import { requireSession, signOut } from './auth-guard.js';

const session = await requireSession();
if (!session) {
  // requireSession already triggered a redirect; stop executing.
  throw new Error('Not authenticated');
}

// Wire optional UI elements that may not exist on every page.
const userChip  = document.querySelector('[data-user-chip]');
const userEmail = document.querySelector('[data-user-email]');
const logoutBtn = document.querySelector('[data-logout]');

if (userChip) {
  const initial = (session.user.email || '?').trim().charAt(0).toUpperCase();
  userChip.textContent = initial;
  userChip.title = session.user.email || '';
}
if (userEmail) {
  userEmail.textContent = session.user.email || '';
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signOut();
  });
}
