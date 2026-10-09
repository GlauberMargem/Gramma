import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import type { HistoryEntry, StudyType } from '../domain/types';
import { ModeHub } from './ModeHub';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/modo']}>
      <Routes>
        <Route path="/modo" element={<ModeHub />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

function entry(dayId: number, studyType: StudyType): HistoryEntry {
  return {
    day_id: dayId,
    study_type: studyType,
    correct: true,
    points: 10,
    base: 10,
    bonus: 0,
    is_milestone: false,
    streak_after: 1,
    time_ms: 1000,
    is_archive: false,
  };
}

describe('ModeHub', () => {
  beforeEach(() => {
    // Sem animação: a navegação acontece de imediato.
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 6, 19)); // dia 3
    userStore.update(() => createDefaultUserData());
  });
  afterEach(() => vi.useRealTimers());

  it('mostra JOGAR DIA N e ícone play quando o dia não foi jogado', () => {
    renderHub();
    expect(screen.getByText('DIA 3')).toBeInTheDocument();
    expect(screen.getByText('Morfologia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JOGAR DIA 3/ })).toHaveTextContent('play_arrow');
  });

  it('mostra VER RESULTADO e ícone check quando o dia do modo já foi jogado', () => {
    userStore.update((d) => ({ ...d, history: { '3:morphology': entry(3, 'morphology') } }));
    renderHub();
    expect(screen.getByRole('button', { name: /VER RESULTADO/ })).toHaveTextContent('check_circle');
  });

  it('considera só o modo escolhido', () => {
    userStore.update((d) => ({
      ...d,
      settings: { ...d.settings, study_type: 'syntax' },
      history: { '3:morphology': entry(3, 'morphology') },
    }));
    renderHub();
    expect(screen.getByText('Sintaxe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JOGAR DIA 3/ })).toBeInTheDocument();
  });

  it('navega para jogo, calendário, estatísticas e menu', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHub();
    await user.click(screen.getByRole('button', { name: /JOGAR DIA 3/ }));
    expect(screen.getByTestId('where')).toHaveTextContent('/jogo/3');
  });

  it.each([
    [/Dias anteriores/, '/calendario'],
    [/Estatísticas/, '/estatisticas'],
    [/Trocar modo/, '/'],
  ])('botão %s leva a %s', async (name, path) => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHub();
    await user.click(screen.getByRole('button', { name }));
    expect(screen.getByTestId('where')).toHaveTextContent(path);
  });
});
