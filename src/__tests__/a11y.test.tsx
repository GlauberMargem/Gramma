import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PHASE_TRANSITION_DELAY_MS } from '../screens/useQuestionSession';
import { Accessibility } from '../screens/Accessibility';
import { Achievements } from '../screens/Achievements';
import { Calendar } from '../screens/Calendar';
import { End } from '../screens/End';
import { Game } from '../screens/Game';
import { HowToPlay } from '../screens/HowToPlay';
import { Menu } from '../screens/Menu';
import { ModeHub } from '../screens/ModeHub';
import { Stats } from '../screens/Stats';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';

expect.extend(toHaveNoViolations);

// color-contrast não é avaliável em jsdom (sem layout/estilos computados reais).
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

function app(path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/modo" element={<ModeHub />} />
        <Route path="/jogo/:dia" element={<Game />} />
        <Route path="/fim/:dia" element={<End />} />
        <Route path="/calendario" element={<Calendar />} />
        <Route path="/estatisticas" element={<Stats />} />
        <Route path="/conquistas" element={<Achievements />} />
        <Route path="/acessibilidade" element={<Accessibility />} />
        <Route path="/como-jogar" element={<HowToPlay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('acessibilidade', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 6, 19)); // dia 3
    userStore.update(() => createDefaultUserData());
  });
  afterEach(() => vi.useRealTimers());

  const screens: [string, string][] = [
    ['Menu', '/'],
    ['ModeHub', '/modo'],
    ['Game', '/jogo/3'],
    ['Calendar', '/calendario'],
    ['Stats', '/estatisticas'],
    ['Achievements', '/conquistas'],
    ['Accessibility', '/acessibilidade'],
    ['HowToPlay', '/como-jogar'],
  ];

  it.each(screens)('%s sem violações do axe', async (_name, path) => {
    const { container } = render(app(path));
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('End sem violações do axe', async () => {
    userStore.update((d) => ({
      ...d,
      history: {
        '3:morphology': {
          day_id: 3, study_type: 'morphology', correct: true, base: 10, bonus: 1, points: 11,
          streak_after: 2, is_milestone: false, time_ms: 1000, is_archive: false,
        },
      },
    }));
    const { container } = render(app('/fim/3'));
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Menu → Jogo → Resultado operável só com teclado', async () => {
    const user = userEvent.setup({ delay: null });
    render(app('/'));

    // Tab: Morfologia, Sintaxe, Sinônimos, Como Jogar, Conquistas
    await user.tab();
    expect(screen.getByRole('button', { name: 'Morfologia' })).toHaveFocus();
    await user.keyboard('{Enter}');

    // ModeHub: Fechar, Jogar, Dias anteriores, Estatísticas
    await user.tab();
    expect(screen.getByRole('button', { name: 'Trocar modo' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /JOGAR DIA 3/ })).toHaveFocus();
    await user.keyboard('{Enter}');

    // Jogo: Fechar, Ouvir (se suportado), respostas A..D
    const options = screen.getAllByRole('button', { name: /^[ABCD]/ });
    expect(options).toHaveLength(4);
    options[0].focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: / pts$/ }, { timeout: PHASE_TRANSITION_DELAY_MS + 1000 })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: /Compartilhar/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /Menu/ })).toHaveFocus();
  });
});
