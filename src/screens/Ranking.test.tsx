import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { RankingDTO, RankingEntry } from '../api/types';

vi.mock('../api/ranking', () => ({ getRanking: vi.fn() }));

import { getRanking } from '../api/ranking';
import { authStore } from '../state/authStore';
import { AUTH_KEY } from '../state/tokenStorage';
import { Ranking } from './Ranking';

expect.extend(toHaveNoViolations);

const getRankingMock = vi.mocked(getRanking);

const entry = (over: Partial<RankingEntry> = {}): RankingEntry => ({
  rank: 1,
  display_name: 'Ana',
  score: 300,
  streak: 4,
  is_me: false,
  ...over,
});

const ranking = (over: Partial<RankingDTO> = {}): RankingDTO => ({
  period: 'daily',
  study_type: null,
  start_date: '2026-10-13',
  end_date: '2026-10-13',
  entries: [entry(), entry({ rank: 2, display_name: 'Bia', score: 200, streak: 0 })],
  me: null,
  ...over,
});

function setup() {
  return render(
    <MemoryRouter initialEntries={['/ranking']}>
      <Routes>
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/" element={<p>menu</p>} />
        <Route path="/entrar" element={<p>entrar</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function signIn(token = 'tok') {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ token, user: { id: '1', email: 'eu@example.com', is_active: true, is_superuser: false, full_name: 'Eu', created_at: null } }),
  );
  window.dispatchEvent(new StorageEvent('storage', { key: AUTH_KEY }));
}

describe('Ranking', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.logout();
    getRankingMock.mockReset();
    getRankingMock.mockResolvedValue(ranking());
  });

  it('carrega o ranking diário geral e lista as posições', async () => {
    setup();
    const list = await screen.findByRole('list', { name: 'Classificação' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Ana')).toBeInTheDocument();
    expect(within(list).getByText('300 pts')).toBeInTheDocument();
    expect(getRankingMock).toHaveBeenCalledWith({ period: 'daily', studyType: null }, null, expect.any(AbortSignal));
  });

  it('abas e filtro de modo chamam o endpoint certo', async () => {
    setup();
    await screen.findByRole('list', { name: 'Classificação' });

    await userEvent.click(screen.getByRole('tab', { name: '7 dias' }));
    expect(screen.getByRole('tab', { name: '7 dias' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() =>
      expect(getRankingMock).toHaveBeenLastCalledWith({ period: 'weekly', studyType: null }, null, expect.any(AbortSignal)),
    );

    await userEvent.selectOptions(screen.getByLabelText('Modo'), 'syntax');
    await waitFor(() =>
      expect(getRankingMock).toHaveBeenLastCalledWith({ period: 'weekly', studyType: 'syntax' }, null, expect.any(AbortSignal)),
    );

    await userEvent.click(screen.getByRole('tab', { name: '30 dias' }));
    await waitFor(() =>
      expect(getRankingMock).toHaveBeenLastCalledWith({ period: 'monthly', studyType: 'syntax' }, null, expect.any(AbortSignal)),
    );
  });

  it('logado: envia o token e destaca a própria linha', async () => {
    signIn('meu-token');
    getRankingMock.mockResolvedValue(
      ranking({ entries: [entry(), entry({ rank: 2, display_name: 'Eu', is_me: true })], me: entry({ rank: 2, display_name: 'Eu', is_me: true }) }),
    );
    setup();

    const mine = await screen.findByText('(você)');
    expect(mine.closest('li')).toHaveAttribute('aria-current', 'true');
    expect(mine.closest('li')).toHaveClass('is-me');
    expect(getRankingMock).toHaveBeenCalledWith(expect.anything(), 'meu-token', expect.any(AbortSignal));
    expect(screen.queryByRole('list', { name: 'Sua posição' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Entre na sua conta/)).not.toBeInTheDocument();
  });

  it('mostra a posição do usuário quando ele está fora do top', async () => {
    signIn();
    getRankingMock.mockResolvedValue(ranking({ me: entry({ rank: 57, display_name: 'Eu', score: 10, is_me: true }) }));
    setup();

    const mine = await screen.findByRole('list', { name: 'Sua posição' });
    expect(within(mine).getByText('Eu')).toBeInTheDocument();
    expect(within(mine).getByText(/57º/)).toBeInTheDocument();
  });

  it('estado vazio', async () => {
    getRankingMock.mockResolvedValue(ranking({ entries: [] }));
    setup();
    expect(await screen.findByText(/Ninguém pontuou neste período/)).toBeInTheDocument();
  });

  it('erro mostra a mensagem e permite tentar de novo', async () => {
    getRankingMock.mockRejectedValueOnce(new ApiError(0, 'Não foi possível conectar ao servidor.'));
    setup();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.');
    await userEvent.click(screen.getByRole('button', { name: /Tentar de novo/ }));
    expect(await screen.findByRole('list', { name: 'Classificação' })).toBeInTheDocument();
  });

  it('convidado vê o convite para entrar', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: /Entre na sua conta/ }));
    await waitFor(() => expect(screen.getByText('entrar')).toBeInTheDocument());
  });

  it('sem violações de acessibilidade (axe)', async () => {
    signIn();
    getRankingMock.mockResolvedValue(ranking({ me: entry({ rank: 9, display_name: 'Eu', is_me: true }) }));
    const { container } = setup();
    await screen.findByRole('list', { name: 'Sua posição' });
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
