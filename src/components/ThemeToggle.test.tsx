import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../state/hooks';
import { userStore, USER_DATA_KEY } from '../state/userStore';
import { ThemeToggle } from './ThemeToggle';

interface FakeTimeline {
  calls: Array<[string, ...unknown[]]>;
  onCall?: () => void;
  to: (...a: unknown[]) => FakeTimeline;
  call: (fn: () => void) => FakeTimeline;
  set: (...a: unknown[]) => FakeTimeline;
  kill: () => void;
}

function fakeTimeline(): FakeTimeline {
  const tl: FakeTimeline = {
    calls: [],
    to: (...a) => (tl.calls.push(['to', ...a]), tl),
    call: (fn) => ((tl.onCall = fn), tl.calls.push(['call']), tl),
    set: (...a) => (tl.calls.push(['set', ...a]), tl),
    kill: vi.fn(),
  };
  return tl;
}

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

// Reproduz o App: useTheme montado fora do botão reage ao estado.
function Harness() {
  useTheme();
  return <ThemeToggle />;
}

const BTN = { name: 'Alternar tema claro/escuro' };

describe('ThemeToggle', () => {
  let timelines: FakeTimeline[];

  beforeEach(() => {
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: false } }));
    document.documentElement.dataset.theme = 'light';
    mockReducedMotion(false);
    timelines = [];
    vi.spyOn(gsap, 'timeline').mockImplementation(() => {
      const tl = fakeTimeline();
      timelines.push(tl);
      return tl as unknown as gsap.core.Timeline;
    });
    vi.spyOn(gsap, 'set').mockImplementation(() => ({}) as gsap.core.Tween);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('monta a timeline com durações e easings do legado', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', BTN));
    const btn = screen.getByRole('button', BTN);
    expect(timelines[0].calls).toEqual([
      ['to', btn, { scaleX: 0, duration: 0.14, ease: 'power1.in' }],
      ['call'],
      ['to', btn, { scaleX: 1, duration: 0.24, ease: 'back.out(2.4)' }],
      ['set', btn, { clearProps: 'transform' }],
    ]);
  });

  it('persiste no clique mas troca data-theme e ícone só no ponto fechado', async () => {
    render(<Harness />);
    const btn = screen.getByRole('button', BTN);
    expect(btn.textContent).toBe('dark_mode');
    await userEvent.click(btn);

    const saved = JSON.parse(localStorage.getItem(USER_DATA_KEY) ?? '{}');
    expect(saved.settings.dark_mode).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(btn.textContent).toBe('dark_mode');

    timelines[0].onCall?.();
    await vi.waitFor(() => expect(btn.textContent).toBe('light_mode'));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('reduced-motion aplica direto, sem timeline', async () => {
    mockReducedMotion(true);
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', BTN));
    expect(timelines).toHaveLength(0);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', BTN).textContent).toBe('light_mode');
  });

  it('clique rápido mata a timeline anterior, limpa a escala e aplica o alvo pendente', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', BTN));
    await userEvent.click(screen.getByRole('button', BTN));
    const btn = screen.getByRole('button', BTN);

    expect(timelines[0].kill).toHaveBeenCalled();
    expect(gsap.set).toHaveBeenLastCalledWith(btn, { clearProps: 'transform' });
    expect(timelines).toHaveLength(2);
    // alvo do primeiro clique (dark) foi aplicado ao interromper; o segundo volta a claro no ponto fechado
    expect(JSON.parse(localStorage.getItem(USER_DATA_KEY) ?? '{}').settings.dark_mode).toBe(false);
    timelines[1].onCall?.();
    await vi.waitFor(() => expect(btn.textContent).toBe('dark_mode'));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
