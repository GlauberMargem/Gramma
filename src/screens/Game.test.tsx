import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataStore } from '../data/stores';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import { Game } from './Game';

function Where() {
  const loc = useLocation();
  return (
    <p data-testid="where">
      {loc.pathname} {JSON.stringify(loc.state)}
    </p>
  );
}

function tree(path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/jogo/:dia" element={<Game />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );
}

const day3 = DataStore.getDay(3)!;
const right = day3.morphology.answer;
const wrong = day3.morphology.options.find((o) => o !== right)!;
const optionButtons = () => screen.getAllByRole('button', { name: /^[ABCD]/ });
const byOption = (text: string) => screen.getByRole('button', { name: new RegExp(`${text}$`) });

describe('Game', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 19)); // dia 3
    userStore.update(() => createDefaultUserData());
  });
  afterEach(() => vi.useRealTimers());

  const click = (text: string) => fireEvent.click(byOption(text));

  it('mostra badge, rótulo da fase e opções com letras', () => {
    render(tree('/jogo/3'));
    expect(screen.getByText('DIA 3 / 365')).toBeInTheDocument();
    expect(screen.getByText('MORFOLOGIA — CLASSE GRAMATICAL')).toBeInTheDocument();
    expect(optionButtons()).toHaveLength(day3.morphology.options.length);
  });

  it('renderiza a frase com a palavra-alvo destacada, sem HTML cru', () => {
    const { container } = render(tree('/jogo/3'));
    expect(container.querySelector('.sentence')?.textContent).toBe(day3.sentence.replace(/<\/?span>/g, ''));
    expect(container.querySelector('.sentence span')).not.toBeNull();
  });

  it('não reembaralha as opções em re-render', () => {
    const { rerender } = render(tree('/jogo/3'));
    const before = optionButtons().map((b) => b.textContent);
    rerender(tree('/jogo/3'));
    expect(optionButtons().map((b) => b.textContent)).toEqual(before);
  });

  it('dia de arquivo mostra DIA N (ARQUIVO)', () => {
    render(tree('/jogo/2'));
    expect(screen.getByText('DIA 2 (ARQUIVO)')).toBeInTheDocument();
  });

  it('erro marca a escolhida como errada e destaca a certa', async () => {
    render(tree('/jogo/3'));
    click(wrong);
    expect(byOption(wrong)).toHaveClass('is-wrong');
    expect(byOption(right)).toHaveClass('is-correct');
    optionButtons().forEach((b) => expect(b).toBeDisabled());
  });

  it('segundo clique é ignorado', async () => {
    render(tree('/jogo/3'));
    click(wrong);
    click(right);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(userStore.getSnapshot().history['3:morphology']?.correct).toBe(false);
    expect(userStore.getSnapshot().stats.games_played).toBe(1);
  });

  it('nada acontece antes de 900 ms; depois registra e navega ao fim com as conquistas', async () => {
    render(tree('/jogo/3'));
    click(right);
    await act(() => vi.advanceTimersByTimeAsync(899));
    expect(userStore.getSnapshot().stats.games_played).toBe(0);
    expect(screen.queryByTestId('where')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(userStore.getSnapshot().history['3:morphology']?.correct).toBe(true);
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/fim\/3 \{"newlyUnlocked":\[.*\]\}$/);
  });

  it('registra o resultado uma única vez em StrictMode', async () => {
    render(<StrictMode>{tree('/jogo/3')}</StrictMode>);
    click(right);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(userStore.getSnapshot().stats.games_played).toBe(1);
  });

  it('dia inválido redireciona para /', () => {
    render(tree('/jogo/abc'));
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/ /);
  });

  it('dia futuro cai no dia atual', () => {
    render(tree('/jogo/50'));
    expect(screen.getByText('DIA 3 / 365')).toBeInTheDocument();
  });
});
