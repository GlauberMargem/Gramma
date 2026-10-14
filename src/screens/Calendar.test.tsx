import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import type { HistoryEntry, StudyType } from '../domain/types';
import { Calendar } from './Calendar';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={['/calendario']}>
      <Routes>
        <Route path="/calendario" element={<Calendar />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

function entry(dayId: number, studyType: StudyType, correct: boolean): HistoryEntry {
  return {
    day_id: dayId,
    study_type: studyType,
    correct,
    points: 10,
    base: 10,
    bonus: 0,
    is_milestone: false,
    streak_after: 1,
    time_ms: 1000,
    is_archive: false,
  };
}

// O nome do dia é "<número>, <situação>[, hoje]".
const dayButton = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n},`) });

describe('Calendar', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 6, 19)); // dia 3
    userStore.update(() => createDefaultUserData());
  });
  afterEach(() => vi.useRealTimers());

  it('abre no mês do dia atual, em maiúsculas', () => {
    renderCalendar();
    expect(screen.getByText('JULHO 2026')).toBeInTheDocument();
  });

  it('prev desabilitado no mês inicial e habilitado depois de avançar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCalendar();
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('AGOSTO 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeEnabled();
  });

  it('next desabilitado no mês final', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCalendar();
    const next = screen.getByRole('button', { name: 'Próximo mês' });
    for (let i = 0; i < 12; i++) await user.click(next);
    expect(screen.getByText('JULHO 2027')).toBeInTheDocument();
    expect(next).toBeDisabled();
  });

  it('status: dias futuros desabilitados, jogados won/lost só do modo atual', () => {
    userStore.update((d) => ({
      ...d,
      history: {
        '1:morphology': entry(1, 'morphology', true),
        '2:morphology': entry(2, 'morphology', false),
        '3:syntax': entry(3, 'syntax', true),
      },
    }));
    renderCalendar();
    expect(dayButton(17)).toHaveClass('status-won');
    expect(dayButton(18)).toHaveClass('status-lost');
    expect(dayButton(19)).toHaveClass('status-available', 'is-today');
    expect(dayButton(19)).toHaveAccessibleName('19, disponível, hoje');
    expect(dayButton(17)).toHaveAccessibleName('17, acertou');
    expect(dayButton(20)).toHaveClass('status-future');
    expect(dayButton(20)).toBeDisabled();
    expect(dayButton(16)).toHaveClass('status-future');
  });

  it('clicar em dia disponível navega ao jogo', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCalendar();
    await user.click(dayButton(18));
    expect(screen.getByTestId('where')).toHaveTextContent('/jogo/2');
  });

  it('fechar volta ao hub de modo', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCalendar();
    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/modo');
  });
});
