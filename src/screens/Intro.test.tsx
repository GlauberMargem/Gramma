import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Intro } from './Intro';
import { INTRO_SESSION_KEY } from '../boot';

function renderIntro() {
  return render(
    <MemoryRouter initialEntries={['/intro']}>
      <Routes>
        <Route path="/" element={<p>menu</p>} />
        <Route path="/intro" element={<Intro />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Intro', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('mostra a marcação da intro e a marca como vista', () => {
    renderIntro();
    expect(screen.getByText('Trabalho da disciplina de Jogos Digitais')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Logo UniRios' })).toHaveAttribute('src', expect.stringContaining('unirios-logo.png'));
    expect(screen.getByRole('heading', { name: /GRAMMA/ })).toBeInTheDocument();
    expect(sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('1');
  });

  it('Pular mata a timeline e vai para /', async () => {
    const timeline = vi.spyOn(gsap, 'timeline');
    renderIntro();
    const tl = timeline.mock.results[0]?.value as gsap.core.Timeline;
    const kill = vi.spyOn(tl, 'kill');
    await userEvent.click(screen.getByRole('button', { name: /Pular/ }));
    expect(kill).toHaveBeenCalled();
    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('ao terminar a timeline vai para /', () => {
    const timeline = vi.spyOn(gsap, 'timeline');
    renderIntro();
    const tl = timeline.mock.results[0]?.value as gsap.core.Timeline;
    act(() => {
      tl.progress(1);
    });
    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('kill da timeline ao desmontar', () => {
    const timeline = vi.spyOn(gsap, 'timeline');
    const { unmount } = renderIntro();
    const tl = timeline.mock.results[0]?.value as gsap.core.Timeline;
    const kill = vi.spyOn(tl, 'kill');
    unmount();
    expect(kill).toHaveBeenCalled();
  });
});
