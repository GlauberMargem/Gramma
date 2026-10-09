import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppRoutes } from './router';
import { userStore } from './state/userStore';

const placeholders: [string, string][] = [
  ['/', 'Desafio Gramatical & Sintático Diário'],
  ['/modo', 'Dias anteriores'],
  ['/jogo/1', 'MORFOLOGIA — CLASSE GRAMATICAL'],
  ['/fim/3', 'Desafio Gramatical & Sintático Diário'],
  ['/calendario', 'Arquivo'],
  ['/estatisticas', 'Estatísticas'],
  ['/conquistas', 'Conquistas'],
  ['/acessibilidade', 'Tamanho da fonte'],
  ['/como-jogar', 'Escolha seu modo'],
  ['/intro', 'Trabalho da disciplina de Jogos Digitais'],
  ['/rota-inexistente', 'Desafio Gramatical & Sintático Diário'],
];

describe('smoke', () => {
  it('renderiza o App na rota raiz', () => {
    render(<App />);
    expect(screen.getByText('Desafio Gramatical & Sintático Diário')).toBeInTheDocument();
  });

  it('aplica tema e fonte salvos ao montar o App', () => {
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: true, font_scale_index: 3 } }));
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1.3');
    localStorage.clear();
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: false, font_scale_index: 1 } }));
  });

  it.each(placeholders)('rota %s mostra %s', (path, name) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText(name)).toBeInTheDocument();
  });
});
