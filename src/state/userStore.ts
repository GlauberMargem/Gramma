import type { UserData } from '../domain/types';
import { parseStored } from './userData';

export const USER_DATA_KEY = 'gramma_user_data';

export interface UserStore {
  getSnapshot(): UserData;
  subscribe(listener: () => void): () => void;
  update(fn: (data: UserData) => UserData): void;
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(USER_DATA_KEY);
  } catch (err) {
    console.error('Falha ao ler localStorage.', err);
    return null;
  }
}

export function createUserStore(): UserStore {
  let cache: UserData | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());
  const getSnapshot = () => (cache ??= parseStored(readRaw()));

  // Outras abas: descarta o cache para reler do storage (key null = storage limpo).
  window.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== USER_DATA_KEY) return;
    cache = null;
    notify();
  });

  return {
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(fn) {
      cache = fn(getSnapshot());
      try {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(cache));
      } catch (err) {
        console.error('Falha ao gravar no localStorage.', err);
      }
      notify();
    },
  };
}

export const userStore = createUserStore();
