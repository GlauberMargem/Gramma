import { getProgress, putProgress } from '../api/progress';
import { ApiError } from '../api/client';
import type { ProgressDTO } from '../api/types';
import { mergeProgress } from '../domain/mergeProgress';
import type { UserData } from '../domain/types';
import { authStore, type AuthStore } from './authStore';
import { userStore, type UserStore } from './userStore';

/** Marca de jogada ainda não enviada à conta (fila offline). */
export const SYNC_OUTBOX_KEY = 'gramma_sync_outbox';

export interface ProgressApi {
  getProgress(token: string): Promise<ProgressDTO>;
  putProgress(token: string, progress: ProgressDTO): Promise<void>;
}

export interface ProgressSync {
  /** Baixa, mescla, adota localmente e sobe o progresso. `false` se falhou. */
  sync(): Promise<boolean>;
  /** Chamar após gravar uma jogada: marca pendência e tenta enviar. */
  recordPlayed(): void;
  hasPending(): boolean;
  /** Sincroniza agora (se logado), no login e ao voltar a ficar online. */
  start(): () => void;
}

export function toProgressDTO(data: UserData): ProgressDTO {
  return { stats: data.stats, history: Object.values(data.history) };
}

function isEmpty(progress: ProgressDTO): boolean {
  return progress.history.length === 0 && progress.stats.games_played === 0;
}

function setPending(pending: boolean): void {
  try {
    if (pending) localStorage.setItem(SYNC_OUTBOX_KEY, '1');
    else localStorage.removeItem(SYNC_OUTBOX_KEY);
  } catch {
    // Sem storage a pendência vale só até recarregar; o próximo login sincroniza.
  }
}

export function createProgressSync(
  auth: AuthStore,
  users: UserStore,
  api: ProgressApi = { getProgress, putProgress },
): ProgressSync {
  // Uma sincronização por vez, na ordem em que foram pedidas.
  let queue: Promise<boolean> = Promise.resolve(true);

  const run = async (): Promise<boolean> => {
    const token = auth.getToken();
    if (!token) return false;
    try {
      const cloud = await api.getProgress(token);
      let data = users.getSnapshot();
      if (!isEmpty(cloud)) {
        data = mergeProgress(data, cloud);
        const merged = data;
        users.update(() => merged);
      }
      await api.putProgress(token, toProgressDTO(data));
      setPending(false);
      return true;
    } catch (err) {
      // Sessão inválida: volta a convidado. Rede/servidor: fica pendente.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) auth.logout();
      return false;
    }
  };

  const sync = () => (queue = queue.then(run, run));

  const hasPending = () => {
    try {
      return localStorage.getItem(SYNC_OUTBOX_KEY) !== null;
    } catch {
      return false;
    }
  };

  return {
    sync,
    hasPending,
    recordPlayed() {
      if (!auth.getToken()) return; // Convidado: 100% local.
      setPending(true);
      void sync();
    },
    start() {
      let lastToken = auth.getToken();
      if (lastToken) void sync();

      const unsubscribe = auth.subscribe(() => {
        const token = auth.getToken();
        if (token && token !== lastToken) void sync();
        lastToken = token;
      });
      const onOnline = () => {
        if (hasPending()) void sync();
      };
      window.addEventListener('online', onOnline);

      return () => {
        unsubscribe();
        window.removeEventListener('online', onOnline);
      };
    },
  };
}

export const progressSync = createProgressSync(authStore, userStore);
