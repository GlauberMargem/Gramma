import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProgressDTO } from '../api/types';

vi.mock('../api/progress', () => ({ getProgress: vi.fn(), putProgress: vi.fn() }));
vi.mock('../api/ranking', () => ({ getRanking: vi.fn() }));

import { getProgress, putProgress } from '../api/progress';
import { getRanking } from '../api/ranking';
import { DataStore } from '../data/stores';
import { AppRoutes } from '../router';
import { authStore } from '../state/authStore';
import { progressSync, toProgressDTO } from '../state/sync';
import { AUTH_KEY } from '../state/tokenStorage';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';

const getProgressMock = vi.mocked(getProgress);
const putProgressMock = vi.mocked(putProgress);
const getRankingMock = vi.mocked(getRanking);

const day3 = DataStore.getDay(3)!;

function signIn(token: string) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      token,
      user: { id: '1', email: 'eu@example.com', is_active: true, is_superuser: false, full_name: 'Eu', created_at: null },
    }),
  );
  window.dispatchEvent(new StorageEvent('storage', { key: AUTH_KEY }));
}

describe('fluxo com conta (API mockada)', () => {
  let cloud: ProgressDTO;
  let stop: () => void;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date(2026, 6, 19)); // dia 3
    localStorage.clear();
    authStore.logout();
    userStore.update(() => createDefaultUserData());

    // Conta com uma ofensiva de 2 dias feita em outro aparelho (dias 1 e 2).
    const other = createDefaultUserData();
    other.stats = { ...other.stats, current_streak: 2, max_streak: 2, last_streak_day: 2, games_played: 2 };
    cloud = toProgressDTO(other);
    getProgressMock.mockReset().mockImplementation(async () => cloud);
    putProgressMock.mockReset().mockImplementation(async (_token, progress) => {
      cloud = progress;
    });
    getRankingMock.mockReset();
    stop = progressSync.start();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it('login adota a ofensiva da conta; jogar sobe a jogada e continua a ofensiva', async () => {
    signIn('tok');
    await vi.waitFor(() => expect(putProgressMock).toHaveBeenCalledTimes(1));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    // O foguinho do Menu mostra a ofensiva vinda da conta.
    expect(screen.getByText('Ofensiva atual: 2 dia(s)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Morfologia/ }));
    fireEvent.click(screen.getByRole('button', { name: /JOGAR DIA 3/ }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${day3.morphology.answer}$`) }));
    await act(() => vi.advanceTimersByTimeAsync(900));
    expect(screen.getByText('Resposta certa!')).toBeInTheDocument();

    await vi.waitFor(() => expect(putProgressMock).toHaveBeenCalledTimes(2));
    expect(cloud.history).toEqual([expect.objectContaining({ day_id: 3, study_type: 'morphology', correct: true })]);
    expect(cloud.stats).toMatchObject({ current_streak: 3, last_streak_day: 3, games_played: 3 });
    expect(progressSync.hasPending()).toBe(false);
  });

  it('o ranking mostra a linha do usuário logado', async () => {
    signIn('tok');
    getRankingMock.mockResolvedValue({
      period: 'daily',
      study_type: null,
      start_date: '2026-07-19',
      end_date: '2026-07-19',
      entries: [{ rank: 1, display_name: 'Eu', score: 120, streak: 3, is_me: true }],
      me: { rank: 1, display_name: 'Eu', score: 120, streak: 3, is_me: true },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ranking/ }));
    await act(() => vi.advanceTimersByTimeAsync(1000));

    await vi.waitFor(() => expect(screen.getByText('(você)')).toBeInTheDocument());
    expect(getRankingMock).toHaveBeenCalledWith({ period: 'daily', studyType: null }, 'tok', expect.any(AbortSignal));
  });
});
