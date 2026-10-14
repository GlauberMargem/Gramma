import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from '../components/TopBar';
import { DataStore } from '../data/stores';
import type { UserData } from '../domain/types';
import { AppRoutes } from '../router';
import legacy from '../state/__fixtures__/legacy-user-data.json';
import { createDefaultUserData } from '../state/userData';
import { USER_DATA_KEY, userStore } from '../state/userStore';

const day3 = DataStore.getDay(3)!;
const right = day3.morphology.answer;
const wrong = day3.morphology.options.find((o) => o !== right)!;

function app(path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
      <AppRoutes />
    </MemoryRouter>
  );
}

const byOption = (text: string) =>
  screen.getByRole('button', {
    name: (name) => /^[ABCD]/.test(name) && name.replace(/^[ABCD]\s*/, '').replace(/\s*\(.+\)$/, '') === text,
  });
const press = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }));
const stored = (): UserData => JSON.parse(localStorage.getItem(USER_DATA_KEY)!) as UserData;
const settle = () => act(() => vi.advanceTimersByTimeAsync(900));

describe('fluxos de tela (store real)', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date(2026, 6, 19)); // dia 3
    localStorage.clear();
    userStore.update(() => createDefaultUserData());
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('--font-scale');
  });
  afterEach(() => vi.useRealTimers());

  it('jogar e acertar: Menu → modo → JOGAR → resposta certa → fim, com dados gravados', async () => {
    render(app('/'));
    press(/Morfologia/);
    press(/JOGAR DIA 3/);
    expect(screen.getByText('DIA 3 / 365')).toBeInTheDocument();

    fireEvent.click(byOption(right));
    await act(() => vi.advanceTimersByTimeAsync(899));
    expect(screen.getByText('DIA 3 / 365')).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(screen.getByText('Resposta certa!')).toBeInTheDocument();
    const entry = stored().history['3:morphology'];
    expect(entry).toMatchObject({ correct: true, is_archive: false, day_id: 3 });
    expect(screen.getByRole('heading', { name: `${entry.points} pts` })).toBeInTheDocument();
    expect(entry.points).toBeGreaterThan(0);
    const s = stored().stats;
    expect(s).toMatchObject({ games_played: 1, current_streak: 1, last_streak_day: 3, morph_correct_streak: 1 });
    expect(s.total_score).toBe(entry.points);
  });

  it('jogar e errar: 0 pts, ofensiva do modo zerada e a certa destacada antes de navegar', async () => {
    userStore.update((d) => ({ ...d, stats: { ...d.stats, morph_correct_streak: 3 } }));
    render(app('/jogo/3'));
    fireEvent.click(byOption(wrong));
    expect(byOption(right)).toHaveClass('is-correct');
    expect(byOption(wrong)).toHaveClass('is-wrong');
    await settle();

    expect(screen.getByText('Não foi dessa vez')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '0 pts' })).toBeInTheDocument();
    expect(stored().stats.morph_correct_streak).toBe(0);
    expect(stored().history['3:morphology']).toMatchObject({ correct: false, points: 0 });
  });

  it('marco de 5 acertos: bônus de +10, sparkles e is-perfect', async () => {
    userStore.update((d) => ({ ...d, stats: { ...d.stats, morph_correct_streak: 4 } }));
    const { container } = render(app('/jogo/3'));
    fireEvent.click(byOption(right));
    await settle();

    expect(stored().history['3:morphology']).toMatchObject({ is_milestone: true, bonus: 10, streak_after: 5 });
    expect(screen.getByText('+10 pts')).toBeInTheDocument();
    expect(container.querySelector('.end-screen')).toHaveClass('is-perfect');
    expect(container.querySelectorAll('.sparkle').length).toBeGreaterThan(0);
  });

  it('dia de arquivo não altera current_streak nem last_streak_day', async () => {
    userStore.update((d) => ({ ...d, stats: { ...d.stats, current_streak: 2, max_streak: 2, last_streak_day: 2 } }));
    render(app('/jogo/1'));
    expect(screen.getByText('DIA 1 (ARQUIVO)')).toBeInTheDocument();
    fireEvent.click(byOption(DataStore.getDay(1)!.morphology.answer));
    await settle();

    expect(screen.getByText('Resposta certa!')).toBeInTheDocument();
    expect(stored().history['1:morphology'].is_archive).toBe(true);
    expect(stored().stats).toMatchObject({ games_played: 1, current_streak: 2, max_streak: 2, last_streak_day: 2 });
  });

  it('tema e fonte são aplicados e persistidos', () => {
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: false } }));
    render(app('/'));

    press('Alternar tema claro/escuro');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(stored().settings.dark_mode).toBe(true);
    press('Alternar tema claro/escuro');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(stored().settings.dark_mode).toBe(false);

    press('Acessibilidade');
    press('Aumentar fonte');
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1.15');
    expect(screen.getByText('Grande')).toBeInTheDocument();
    expect(stored().settings.font_scale_index).toBe(2);
    press('Aumentar fonte');
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1.3');
    expect(stored().settings.font_scale_index).toBe(3);
  });

  it('fixture legada gravada antes da leitura abre Estatísticas com os valores e preserva uuid/history', () => {
    // A store já existe; o evento "storage" é o caminho real de releitura do localStorage.
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(legacy));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: USER_DATA_KEY }));
    });
    render(app('/'));
    expect(screen.getByText('Ofensiva atual: 3 dia(s)')).toBeInTheDocument();

    press(/Sintaxe/);
    press(/Estatísticas/);
    const row = (label: string) => screen.getByText(label).closest('.stat-row')!.textContent;
    expect(row('Pontuação total')).toContain('410 pts');
    expect(row('Desafios completados')).toContain('7');
    expect(row('Ofensiva atual')).toContain('3 dia(s)');
    expect(row('Maior ofensiva')).toContain('5 dia(s)');
    expect(row('Recorde de acertos seguidos (Morfologia)')).toContain('4');
    expect(row('Total de acertos (Morfologia)')).toContain('5');
    expect(row('Conquistas desbloqueadas')).toContain('1 /');

    const data = userStore.getSnapshot();
    expect(data.uuid).toBe(legacy.uuid);
    expect(data.history).toEqual(legacy.history);
    expect(data.stats.synonyms_correct_streak).toBe(0); // ausente na fixture: recebe o default
  });

  it('dia de hoje já jogado volta direto ao resultado', () => {
    userStore.update((d) => ({
      ...d,
      history: {
        '3:morphology': {
          day_id: 3,
          study_type: 'morphology',
          correct: true,
          points: 100,
          base: 100,
          bonus: 0,
          is_milestone: false,
          streak_after: 1,
          time_ms: 1000,
          is_archive: false,
        },
      },
    }));
    render(app('/modo'));
    press(/VER RESULTADO/);
    expect(screen.getByText('Resposta certa!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '100 pts' })).toBeInTheDocument();
  });
});
