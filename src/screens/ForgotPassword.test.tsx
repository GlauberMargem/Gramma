import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPassword } from './ForgotPassword';

const mockFetch = vi.fn();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/recuperar-senha']}>
      <Routes>
        <Route path="/entrar" element={<p>entrar</p>} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('chama o endpoint de recuperação com o e-mail', async () => {
    mockFetch.mockResolvedValue(response({ message: 'ok' }));

    renderScreen();
    await userEvent.type(screen.getByLabelText('E-mail'), 'jogador@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/password-recovery/jogador%40example.com'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('mostra o erro devolvido pelo backend', async () => {
    mockFetch.mockResolvedValue(response({ detail: 'SMTP desligado' }, 500));

    renderScreen();
    await userEvent.type(screen.getByLabelText('E-mail'), 'jogador@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('SMTP desligado');
  });
});