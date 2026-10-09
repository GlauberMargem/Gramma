import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../domain/achievements';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import { Stats } from './Stats';

function setup() {
  return render(
    <MemoryRouter initialEntries={['/estatisticas']}>
      <Routes>
        <Route path="/estatisticas" element={<Stats />} />
        <Route path="/modo" element={<p>modo</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Stats', () => {
  beforeEach(() => {
    userStore.update(() => createDefaultUserData());
  });

  it('renderiza 14 linhas e conquistas n / total', () => {
    const { container } = setup();
    expect(container.querySelectorAll('.stat-row')).toHaveLength(14);
    expect(screen.getByText(`0 / ${ACHIEVEMENTS.length}`)).toBeInTheDocument();
    expect(screen.getByText('0 / 17')).toBeInTheDocument();
  });

  it('formata valores a partir das estatísticas', () => {
    userStore.update((d) => ({
      ...d,
      stats: { ...d.stats, total_score: 120, current_streak: 3, max_streak: 5, unlocked_achievements: [ACHIEVEMENTS[0].id] },
    }));
    setup();
    expect(screen.getByText('120 pts')).toBeInTheDocument();
    expect(screen.getByText('3 dia(s)')).toBeInTheDocument();
    expect(screen.getByText('5 dia(s)')).toBeInTheDocument();
    expect(screen.getByText('1 / 17')).toBeInTheDocument();
  });

  it('fechar volta para o hub de modos', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.getByText('modo')).toBeInTheDocument());
  });
});
