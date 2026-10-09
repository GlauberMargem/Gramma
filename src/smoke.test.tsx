import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppRoutes } from './router';
import { userStore } from './state/userStore';

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

  it('aplica tema e fonte salvos ao montar o App', () => {
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: true, font_scale_index: 3 } }));
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1.3');
    localStorage.clear();
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: false, font_scale_index: 1 } }));
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
