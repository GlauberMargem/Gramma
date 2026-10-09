import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AchievementCard } from '../components/AchievementCard';
import { ACHIEVEMENTS } from '../domain/achievements';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import { Achievements } from './Achievements';

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/achievements']}>
      <Routes>
        <Route path="/" element={<p>menu</p>} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AchievementCard', () => {
  it('bloqueado recebe is-locked; desbloqueado não', () => {
    const { container, rerender } = render(<AchievementCard achievement={ACHIEVEMENTS[0]} unlocked={false} />);
    expect(container.firstChild).toHaveClass('is-locked');
    rerender(<AchievementCard achievement={ACHIEVEMENTS[0]} unlocked />);
    expect(container.firstChild).not.toHaveClass('is-locked');
    expect(screen.getByText(ACHIEVEMENTS[0].name)).toBeInTheDocument();
  });
});

describe('Achievements', () => {
  beforeEach(() => {
    userStore.update(() => createDefaultUserData());
  });

  it('renderiza 17 cards, todos bloqueados por padrão', () => {
    const { container } = renderScreen();
    expect(container.querySelectorAll('.achievement-card')).toHaveLength(17);
    expect(container.querySelectorAll('.achievement-card.is-locked')).toHaveLength(17);
  });

  it('só os ids desbloqueados ficam sem is-locked', () => {
    userStore.update((d) => ({ ...d, stats: { ...d.stats, unlocked_achievements: ['first_step'] } }));
    const { container } = renderScreen();
    const open = container.querySelectorAll('.achievement-card:not(.is-locked)');
    expect(open).toHaveLength(1);
    expect(open[0]).toHaveTextContent('Primeiro Passo');
  });

  it('botão Fechar volta ao Menu', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(await screen.findByText('menu')).toBeInTheDocument();
  });
});
