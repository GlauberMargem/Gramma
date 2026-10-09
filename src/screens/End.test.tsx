import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoryEntry, StudyType } from '../domain/types';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import { End } from './End';

function entry(over: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    day_id: 3,
    study_type: 'morphology',
    correct: true,
    points: 110,
    base: 100,
    bonus: 10,
    is_milestone: false,
    streak_after: 2,
    time_ms: 1000,
    is_archive: false,
    ...over,
  };
}

function seed(e: HistoryEntry | null, mode: StudyType = 'morphology') {
  userStore.update(() => {
    const d = createDefaultUserData();
    d.settings.study_type = mode;
    if (e) d.history[`3:${mode}`] = e;
    return d;
  });
}

function renderEnd(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/fim/3', state }]}>
      <Routes>
        <Route path="/" element={<p>menu</p>} />
        <Route path="/modo" element={<p>hub</p>} />
        <Route path="/fim/:dia" element={<End />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('End', () => {
  beforeEach(() => {
    userStore.update(() => createDefaultUserData());
  });

  it('sem entrada redireciona para /', () => {
    seed(null);
    renderEnd();
    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('acerto mostra título, pontos, bônus e streak', () => {
    seed(entry());
    renderEnd();
    expect(screen.getByText('Resposta certa!')).toBeInTheDocument();
    expect(screen.getByText('110 pts')).toBeInTheDocument();
    expect(screen.getByText('Bônus de sequência (+10%)')).toBeInTheDocument();
    expect(screen.getByText('+10 pts')).toBeInTheDocument();
    expect(screen.getByText(/2 acerto\(s\) seguido\(s\) em Morfologia/)).toBeInTheDocument();
  });

  it('erro sem bônus: sem linha de bônus nem de streak', () => {
    seed(entry({ correct: false, points: 0, base: 0, bonus: 0, streak_after: 0 }), 'syntax');
    const { container } = renderEnd();
    expect(screen.getByText('Não foi dessa vez')).toBeInTheDocument();
    expect(screen.queryByText(/Bônus/)).toBeNull();
    expect(container.querySelector('.streak-line')).toBeNull();
  });

  it('erro nunca mostra streak, mesmo com streak_after > 0', () => {
    seed(entry({ correct: false, streak_after: 3 }));
    const { container } = renderEnd();
    expect(container.querySelector('.streak-line')).toBeNull();
  });

  it('marco: is-perfect e sparkles', () => {
    seed(entry({ is_milestone: true }));
    const { container } = renderEnd();
    expect(container.querySelector('.end-screen')).toHaveClass('is-perfect');
    expect(container.querySelector('.sparkles')).not.toBeNull();
  });

  it('sem marco e sem conquista: sem sparkles', () => {
    seed(entry());
    const { container } = renderEnd();
    expect(container.querySelector('.end-screen')).not.toHaveClass('is-perfect');
    expect(container.querySelector('.sparkles')).toBeNull();
  });

  it('conquistas novas mostram toasts e sparkles; ids inválidos são ignorados', () => {
    seed(entry());
    const { container } = renderEnd({ newlyUnlocked: ['first_step', 'nao_existe'] });
    expect(container.querySelectorAll('.achievement-toast')).toHaveLength(1);
    expect(screen.getByText(/Conquista: Primeiro Passo/)).toBeInTheDocument();
    expect(container.querySelector('.sparkles')).not.toBeNull();
  });

  it('recarregar (sem state) mostra o resultado sem toasts', () => {
    seed(entry());
    const { container } = renderEnd();
    expect(screen.getByText('110 pts')).toBeInTheDocument();
    expect(container.querySelectorAll('.achievement-toast')).toHaveLength(0);
  });

  it('Compartilhar copia o texto e mostra toast de sucesso', async () => {
    seed(entry());
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderEnd();
    await userEvent.click(screen.getByRole('button', { name: /Compartilhar/ }));
    expect(writeText).toHaveBeenCalledWith('GRAMMA — Dia 3 (Morfologia): 🟩 — 110 pts');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Resultado copiado para a área de transferência!',
    );
    vi.unstubAllGlobals();
  });

  it('Compartilhar com clipboard rejeitado mostra o texto no toast', async () => {
    seed(entry({ correct: false, points: 0, study_type: 'syntax' }), 'syntax');
    const writeText = vi.fn().mockRejectedValue(new Error('negado'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderEnd();
    await userEvent.click(screen.getByRole('button', { name: /Compartilhar/ }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'GRAMMA — Dia 3 (Sintaxe): 🟥 — 0 pts',
    );
    vi.unstubAllGlobals();
  });

  it('Compartilhar sem navigator.clipboard mostra o texto no toast', async () => {
    seed(entry());
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    renderEnd();
    await userEvent.click(screen.getByRole('button', { name: /Compartilhar/ }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'GRAMMA — Dia 3 (Morfologia): 🟩 — 110 pts',
    );
    vi.unstubAllGlobals();
  });

  it('Menu vai para /modo', async () => {
    seed(entry());
    renderEnd();
    await userEvent.click(screen.getByRole('button', { name: /Menu/ }));
    expect(await screen.findByText('hub')).toBeInTheDocument();
  });
});
