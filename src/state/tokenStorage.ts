import type { UserPublic } from '../api/types';

export const AUTH_KEY = 'gramma_auth';

export interface StoredSession {
  token: string;
  user: UserPublic;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStoredSession(value: unknown): value is StoredSession {
  if (!isRecord(value)) return false;
  if (typeof value.token !== 'string') return false;
  const user = value.user;
  return isRecord(user) && typeof user.email === 'string';
}

/** Lê a sessão persistida (ou `null` se ausente/corrompida). */
export function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  } catch {
    // Sem storage a sessão vale só em memória; inofensivo.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignora storage indisponível.
  }
}
