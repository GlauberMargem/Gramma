import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppRoutes } from './router';

const placeholders: [string, string][] = [
  ['/', 'Menu'],
  ['/modo', 'ModeHub'],
  ['/jogo/3', 'Game'],
  ['/fim/3', 'End'],
  ['/calendario', 'Calendar'],
  ['/estatisticas', 'Stats'],
  ['/conquistas', 'Achievements'],
  ['/acessibilidade', 'Accessibility'],
  ['/como-jogar', 'HowToPlay'],
  ['/intro', 'Intro'],
  ['/rota-inexistente', 'Menu'],
];

describe('smoke', () => {
  it('renderiza o App na rota raiz', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument();
  });

  it.each(placeholders)('rota %s resolve para %s', (path, name) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  });
});
