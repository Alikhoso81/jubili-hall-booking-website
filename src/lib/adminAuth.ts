import { AdminUser } from './types';

const SESSION_KEY = 'jublii_admin_session';
const SESSION_EXPIRY_HOURS = 8;

interface AdminSession {
  admin: AdminUser;
  loginTime: number;
}

export function saveAdminSession(admin: AdminUser): void {
  const session: AdminSession = { admin, loginTime: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session: AdminSession = JSON.parse(raw);
    const elapsedHours = (Date.now() - session.loginTime) / (1000 * 60 * 60);
    if (elapsedHours > SESSION_EXPIRY_HOURS) {
      clearAdminSession();
      return null;
    }
    return session.admin;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
