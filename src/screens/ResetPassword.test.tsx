import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPassword } from './ResetPassword';

const mockFetch = vi.fn();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderScreen(initial = '/redefinir-senha?token=abc') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/recuperar-senha" element={<p>recuperar</p>} />
        <Route path="/entrar" element={<p>entrar</p>} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResetPassword', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sem token, leva para a tela de recuperação', () => {
    renderScreen('/redefinir-senha');
    expect(screen.getByText('recuperar')).toBeInTheDocument();
  });

  it('envia o token e a nova senha', async () => {
    mockFetch.mockResolvedValue(response({ message: 'Password updated successfully' }));

    renderScreen();
    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'novaSenha123');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/reset-password/'),
      expect.objectContaining({ method: 'POST' }),
    );
    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      token: 'abc',
      new_password: 'novaSenha123',
    });
  });

  it('avisa quando as senhas não coincidem', async () => {
    renderScreen();
    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'diferente123');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('As senhas não coincidem.');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('mostra o erro devolvido pelo backend', async () => {
    mockFetch.mockResolvedValue(response({ detail: 'Invalid token' }, 400));

    renderScreen();
    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'novaSenha123');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid token');
  });
});