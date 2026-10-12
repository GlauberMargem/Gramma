import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { UserPublic } from '../api/types';

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
  recoverPassword: vi.fn(),
}));

import { getMe, login as apiLogin, register as apiRegister } from '../api/auth';
import { createAuthStore } from './authStore';
import { AUTH_KEY, readSession } from './tokenStorage';

const apiLoginMock = vi.mocked(apiLogin);
const apiRegisterMock = vi.mocked(apiRegister);
const getMeMock = vi.mocked(getMe);

const USER: UserPublic = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'jogador@example.com',
  is_active: true,
  is_superuser: false,
  full_name: 'Jogador',
  created_at: '2026-10-10T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('começa como convidado', () => {
    expect(createAuthStore().getSnapshot()).toEqual({ status: 'guest', token: null, user: null });
  });

  it('hidrata a sessão persistida do storage', () => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 't', user: USER }));
    const store = createAuthStore();
    expect(store.getSnapshot().status).toBe('authenticated');
    expect(store.getToken()).toBe('t');
    expect(store.getSnapshot().user?.email).toBe(USER.email);
  });

  it('login autentica e persiste a sessão', async () => {
    apiLoginMock.mockResolvedValue({ access_token: 'token-1', token_type: 'bearer' });
    getMeMock.mockResolvedValue(USER);
    const store = createAuthStore();

    await store.login('jogador@example.com', 'segredo123');

    expect(apiLoginMock).toHaveBeenCalledWith('jogador@example.com', 'segredo123');
    expect(getMeMock).toHaveBeenCalledWith('token-1');
    expect(store.getSnapshot()).toEqual({ status: 'authenticated', token: 'token-1', user: USER });
    expect(readSession()).toEqual({ token: 'token-1', user: USER });
  });

  it('propaga erro do login e continua convidado', async () => {
    apiLoginMock.mockRejectedValue(new ApiError(400, 'Incorrect email or password'));
    const store = createAuthStore();

    await expect(store.login('x@y.com', 'senhaerrada')).rejects.toThrow('Incorrect email or password');
    expect(store.getSnapshot().status).toBe('guest');
    expect(readSession()).toBeNull();
  });

  it('register cria a conta e faz login em seguida', async () => {
    apiRegisterMock.mockResolvedValue(USER);
    apiLoginMock.mockResolvedValue({ access_token: 'token-2', token_type: 'bearer' });
    getMeMock.mockResolvedValue(USER);
    const store = createAuthStore();

    await store.register({ email: 'jogador@example.com', password: 'segredo123', full_name: 'Jogador' });

    expect(apiRegisterMock).toHaveBeenCalledWith({
      email: 'jogador@example.com',
      password: 'segredo123',
      full_name: 'Jogador',
    });
    expect(store.getSnapshot().status).toBe('authenticated');
    expect(store.getToken()).toBe('token-2');
  });

  it('logout limpa o estado e o storage', async () => {
    apiLoginMock.mockResolvedValue({ access_token: 'token-1', token_type: 'bearer' });
    getMeMock.mockResolvedValue(USER);
    const store = createAuthStore();
    await store.login('jogador@example.com', 'segredo123');

    store.logout();

    expect(store.getSnapshot().status).toBe('guest');
    expect(readSession()).toBeNull();
  });

  it('refresh troca os dados do usuário quando o token é válido', async () => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 't', user: USER }));
    const updated = { ...USER, full_name: 'Nome Novo' };
    getMeMock.mockResolvedValue(updated);
    const store = createAuthStore();

    await store.refresh();

    expect(getMeMock).toHaveBeenCalledWith('t');
    expect(store.getSnapshot().user?.full_name).toBe('Nome Novo');
  });

  it('refresh desloga quando o token é inválido (401)', async () => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 't', user: USER }));
    getMeMock.mockRejectedValue(new ApiError(401, 'Could not validate credentials'));
    const store = createAuthStore();

    await store.refresh();

    expect(store.getSnapshot().status).toBe('guest');
    expect(readSession()).toBeNull();
  });

  it('refresh mantém a sessão quando o backend está offline', async () => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 't', user: USER }));
    getMeMock.mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'));
    const store = createAuthStore();

    await store.refresh();

    expect(store.getSnapshot().status).toBe('authenticated');
    expect(store.getSnapshot().user?.email).toBe(USER.email);
  });

  it('evento storage de outra aba recarrega a sessão', () => {
    const store = createAuthStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.getSnapshot().status).toBe('guest');

    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 't', user: USER }));
    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe('authenticated');
  });

  it('ignora eventos storage de outras chaves', () => {
    const store = createAuthStore();
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(new StorageEvent('storage', { key: 'outra' }));

    expect(listener).not.toHaveBeenCalled();
  });
});
