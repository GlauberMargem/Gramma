import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreenTransition } from './ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

function Go({ to, label }: { to: string; label: string }) {
  const go = useAnimatedNavigate();
  return (
    <ScreenTransition>
      <p>{label}</p>
      <button onClick={() => go(to)}>ir</button>
    </ScreenTransition>
  );
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/a']}>
      <Routes>
        <Route path="/a" element={<Go to="/b" label="tela A" />} />
        <Route path="/b" element={<Go to="/a" label="tela B" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ScreenTransition', () => {
  beforeEach(() => mockReducedMotion(false));
  afterEach(() => vi.restoreAllMocks());

  it('anima a entrada com os parâmetros do legado', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo');
    renderApp();
    expect(fromTo).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 0, y: 10 }),
      expect.objectContaining({ opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }),
    );
  });

  it('com reduced-motion não anima e navega direto', () => {
    mockReducedMotion(true);
    const fromTo = vi.spyOn(gsap, 'fromTo');
    const to = vi.spyOn(gsap, 'to');
    renderApp();
    act(() => screen.getByText('ir').click());
    expect(fromTo).not.toHaveBeenCalled();
    expect(to).not.toHaveBeenCalled();
    expect(screen.getByText('tela B')).toBeInTheDocument();
  });

  it('anima a saída e só então navega (nunca duas telas)', () => {
    let finish: () => void = () => {};
    const to = vi.spyOn(gsap, 'to').mockImplementation(((_t: unknown, vars: gsap.TweenVars) => {
      finish = () => vars.onComplete?.();
      return {} as gsap.core.Tween;
    }) as typeof gsap.to);
    renderApp();
    act(() => screen.getByText('ir').click());
    expect(to).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 0, y: -8, duration: 0.14, ease: 'power1.in' }),
    );
    expect(screen.getByText('tela A')).toBeInTheDocument();
    act(() => finish());
    expect(screen.queryByText('tela A')).not.toBeInTheDocument();
    expect(screen.getByText('tela B')).toBeInTheDocument();
  });

  it('não deixa timeline pendente ao desmontar', () => {
    const { container, unmount } = renderApp();
    const el = container.firstElementChild as HTMLElement;
    expect(gsap.getTweensOf(el).length).toBeGreaterThan(0);
    unmount();
    expect(gsap.getTweensOf(el)).toHaveLength(0);
  });
});
