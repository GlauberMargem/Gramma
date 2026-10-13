import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { ProgressDTO, UserPublic } from '../api/types';
import { recordResult } from '../domain/recordResult';
import type { UserData } from '../domain/types';
import legacyFixture from './__fixtures__/legacy-user-data.json';
import { createAuthStore } from './authStore';
import { createProgressSync, SYNC_OUTBOX_KEY, toProgressDTO, type ProgressApi } from './sync';
import { AUTH_KEY } from './tokenStorage';
import { createDefaultUserData } from './userData';
import { createUserStore, USER_DATA_KEY } from './userStore';

const USER: UserPublic = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'jogador@example.com',
  is_active: true,
  is_superuser: false,
  full_name: 'Jogador',
  created_at: '2026-10-10T00:00:00Z',
};

function play(data: UserData, dayId: number, correct = true): UserData {
  return recordResult(data, { dayId, type: 'morphology', correct, timeMs: 1000, isArchive: false }).data;
}

function fakeApi(cloud: ProgressDTO = toProgressDTO(createDefaultUserData())) {
  const state = { cloud };
  const api = {
    getProgress: vi.fn<ProgressApi['getProgress']>(async () => state.cloud),
    putProgress: vi.fn(async (_token: string, progress: ProgressDTO) => {
      state.cloud = progress;
    }),
  } satisfies ProgressApi;
  return { api, state };
}

function login(token = 'token-1') {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user: USER }));
}

function setup(local: UserData, api: ProgressApi) {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(local));
  const auth = createAuthStore();
  const users = createUserStore();
  return { auth, users, sync: createProgressSync(auth, users, api) };
}

describe('progressSync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('convidado: não chama a API nem marca pendência', async () => {
    const { api } = fakeApi();
    const { sync } = setup(play(createDefaultUserData(), 1), api);

    sync.recordPlayed();
    expect(await sync.sync()).toBe(false);

    expect(api.getProgress).not.toHaveBeenCalled();
    expect(localStorage.getItem(SYNC_OUTBOX_KEY)).toBeNull();
  });

  it('conta vazia: sobe o progresso local sem alterá-lo', async () => {
    login();
    const local = play(play(createDefaultUserData(), 1), 2);
    const { api, state } = fakeApi();
    const { sync, users } = setup(local, api);

    expect(await sync.sync()).toBe(true);

    expect(api.putProgress).toHaveBeenCalledWith('token-1', toProgressDTO(local));
    expect(users.getSnapshot()).toEqual(local);
    expect(state.cloud.stats.current_streak).toBe(2);
  });

  it('conta com dados: mescla, adota localmente e sobe o resultado', async () => {
    login();
    const cloudData = play(play(play(createDefaultUserData(), 3), 4), 5);
    const { api, state } = fakeApi(toProgressDTO(cloudData));
    const { sync, users } = setup(play(createDefaultUserData(), 1), api);

    await sync.sync();

    const adopted = users.getSnapshot();
    expect(Object.keys(adopted.history).sort()).toEqual(['1:morphology', '3:morphology', '4:morphology', '5:morphology']);
    // A ofensiva da conta (3 dias até o dia 5) passa a valer neste aparelho.
    expect(adopted.stats.current_streak).toBe(3);
    expect(adopted.stats.last_streak_day).toBe(5);
    expect(state.cloud).toEqual(toProgressDTO(adopted));
  });

  it('nenhum dado local é perdido (fixture do formato legado)', async () => {
    login();
    const legacy = legacyFixture as unknown as UserData;
    const { api } = fakeApi(toProgressDTO(play(createDefaultUserData(), 200)));
    const { sync, users } = setup(legacy, api);

    await sync.sync();

    const adopted = users.getSnapshot();
    for (const key of Object.keys(legacy.history)) {
      expect(adopted.history).toHaveProperty(key);
    }
    expect(adopted.stats.games_played).toBeGreaterThanOrEqual(legacy.stats.games_played);
    expect(adopted.stats.total_score).toBeGreaterThanOrEqual(legacy.stats.total_score);
    expect(adopted.stats.max_streak).toBeGreaterThanOrEqual(legacy.stats.max_streak);
    expect(adopted.settings).toEqual({ ...createDefaultUserData().settings, ...legacy.settings });
  });

  it('offline: a jogada fica pendente e sobe quando a rede volta', async () => {
    login();
    const { api, state } = fakeApi();
    const network = { online: false };
    const cloudGet = api.getProgress.getMockImplementation()!;
    api.getProgress.mockImplementation(async (token: string) => {
      if (!network.online) throw new ApiError(0, 'offline');
      return cloudGet(token);
    });
    const { sync, users } = setup(createDefaultUserData(), api);
    const stop = sync.start(); // sync inicial falha (offline)

    users.update((d) => play(d, 1));
    sync.recordPlayed();
    expect(await sync.sync()).toBe(false);
    expect(sync.hasPending()).toBe(true);
    expect(api.putProgress).not.toHaveBeenCalled();

    network.online = true;
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(sync.hasPending()).toBe(false));
    expect(state.cloud.history).toHaveLength(1);
    stop();
  });

  it('401: encerra a sessão e mantém o progresso local', async () => {
    login();
    const local = play(createDefaultUserData(), 1);
    const { api } = fakeApi();
    api.getProgress.mockRejectedValueOnce(new ApiError(401, 'expirado'));
    const { sync, auth, users } = setup(local, api);

    expect(await sync.sync()).toBe(false);

    expect(auth.getSnapshot().status).toBe('guest');
    expect(users.getSnapshot()).toEqual(local);
  });

  it('start: sincroniza ao abrir logado e quando a sessão muda', async () => {
    const { api } = fakeApi();
    const { sync, auth } = setup(createDefaultUserData(), api);
    const stop = sync.start();
    expect(api.getProgress).not.toHaveBeenCalled();

    // Simula o login de outra aba: o authStore relê o storage e notifica.
    login('token-2');
    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_KEY }));
    expect(auth.getToken()).toBe('token-2');
    await vi.waitFor(() => expect(api.getProgress).toHaveBeenCalledWith('token-2'));
    stop();
  });
});
