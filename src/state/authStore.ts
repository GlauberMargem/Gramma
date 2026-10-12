import { useSyncExternalStore } from 'react';
import { getMe, login as apiLogin, register as apiRegister } from '../api/auth';
import { ApiError } from '../api/client';
import type { RegisterInput, UserPublic } from '../api/types';
import { AUTH_KEY, clearSession, readSession, writeSession } from './tokenStorage';

export type AuthStatus = 'guest' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: UserPublic | null;
}

export interface AuthStore {
  getSnapshot(): AuthState;
  subscribe(listener: () => void): () => void;
  getToken(): string | null;
  login(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): void;
  /** Revalida o token salvo contra `/users/me` (silencioso quando offline). */
  refresh(): Promise<void>;
}

const GUEST: AuthState = { status: 'guest', token: null, user: null };

function toState(session: { token: string; user: UserPublic } | null): AuthState {
  return session ? { status: 'authenticated', token: session.token, user: session.user } : GUEST;
}

export function createAuthStore(): AuthStore {
  let cache: AuthState | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const setState = (state: AuthState) => {
    cache = state;
    if (state.token && state.user) writeSession({ token: state.token, user: state.user });
    else clearSession();
    notify();
  };

  // Hidrata de forma síncrona do storage; revalida depois com `refresh()`.
  const getSnapshot = (): AuthState => (cache ??= toState(readSession()));

  // Outras abas: descarta o cache para reler do storage (key null = storage limpo).
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== AUTH_KEY) return;
    cache = null;
    notify();
  });

  const store: AuthStore = {
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getToken: () => getSnapshot().token,
    async login(email, password) {
      const { access_token } = await apiLogin(email, password);
      const user = await getMe(access_token);
      setState({ status: 'authenticated', token: access_token, user });
    },
    async register(input) {
      await apiRegister(input);
      await store.login(input.email, input.password);
    },
    logout() {
      setState(GUEST);
    },
    async refresh() {
      const token = getSnapshot().token;
      if (!token) return;
      try {
        const user = await getMe(token);
        setState({ status: 'authenticated', token, user });
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setState(GUEST);
        }
      }
    },
  };

  return store;
}

export const authStore = createAuthStore();

export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
