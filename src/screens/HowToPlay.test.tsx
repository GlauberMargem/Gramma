import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HowToPlay } from './HowToPlay';

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/como-jogar']}>
      <Routes>
        <Route path="/como-jogar" element={<HowToPlay />} />
        <Route path="/" element={<p>menu</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HowToPlay', () => {
  beforeEach(() => {
    // reduced-motion: navegação imediata, sem animação GSAP
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
  });

  it('mostra o título e os seis tópicos do legado', () => {
    renderScreen();
    expect(screen.getByText('Como Jogar')).toBeInTheDocument();
    for (const name of [
      'Escolha seu modo',
      'Uma pergunta por dia',
      'Pontuação',
      'Bônus de sequência',
      'Conquistas',
      'Arquivo',
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText(/Morfologia vale 100 pts, Sinônimos 150 pts e Sintaxe 200 pts/)).toBeInTheDocument();
  });

  it('o botão Fechar volta ao Menu', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(await screen.findByText('menu')).toBeInTheDocument();
  });
});
