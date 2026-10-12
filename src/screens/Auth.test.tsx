import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserPublic } from '../api/types';
import { authStore } from '../state/authStore';
import { Auth } from './Auth';

const USER: UserPublic = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'jogador@example.com',
  is_active: true,
  is_superuser: false,
  full_name: null,
  created_at: null,
};

const mockFetch = vi.fn();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={['/entrar']}>
      <Routes>
        <Route path="/" element={<p>menu</p>} />
        <Route path="/entrar" element={<Auth />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Auth', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.logout();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('faz login e vai para o menu', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/login/access-token')) return Promise.resolve(response({ access_token: 't', token_type: 'bearer' }));
      if (url.includes('/users/me')) return Promise.resolve(response(USER));
      return Promise.resolve(response({ detail: 'nope' }, 404));
    });

    renderAuth();
    await userEvent.type(screen.getByLabelText('E-mail'), 'jogador@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar na conta' }));

    expect(await screen.findByText('menu')).toBeInTheDocument();
    expect(authStore.getSnapshot().status).toBe('authenticated');
  });

  it('cria conta e entra em seguida', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/users/signup')) return Promise.resolve(response(USER, 200));
      if (url.includes('/login/access-token')) return Promise.resolve(response({ access_token: 't2', token_type: 'bearer' }));
      if (url.includes('/users/me')) return Promise.resolve(response(USER));
      return Promise.resolve(response({ detail: 'nope' }, 404));
    });

    renderAuth();
    await userEvent.click(screen.getByRole('tab', { name: 'Criar conta' }));
    await userEvent.type(screen.getByLabelText('Nome (opcional)'), 'Jogador');
    await userEvent.type(screen.getByLabelText('E-mail'), 'jogador@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('menu')).toBeInTheDocument();
    expect(authStore.getToken()).toBe('t2');
  });

  it('mostra a mensagem de erro devolvida pelo backend', async () => {
    mockFetch.mockResolvedValue(response({ detail: 'Incorrect email or password' }, 400));

    renderAuth();
    await userEvent.type(screen.getByLabelText('E-mail'), 'jogador@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar na conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
    expect(authStore.getSnapshot().status).toBe('guest');
  });

  it('redireciona quem já está autenticado', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/login/access-token')) return Promise.resolve(response({ access_token: 't', token_type: 'bearer' }));
      if (url.includes('/users/me')) return Promise.resolve(response(USER));
      return Promise.resolve(response({}, 200));
    });
    await authStore.login('jogador@example.com', 'segredo123');

    renderAuth();

    await waitFor(() => expect(screen.getByText('menu')).toBeInTheDocument());
  });
});
