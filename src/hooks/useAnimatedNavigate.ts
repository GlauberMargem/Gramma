import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavigateOptions, To } from 'react-router-dom';
import gsap from 'gsap';

let currentScreen: HTMLElement | null = null;

/** Chamado pelo ScreenTransition: informa qual elemento é a tela visível. */
export function registerScreen(el: HTMLElement | null): void {
  currentScreen = el;
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Como `navigate`, mas anima a saída da tela atual (0,14 s) antes de navegar. */
export function useAnimatedNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: To, options?: NavigateOptions) => {
      const el = currentScreen;
      if (!el || prefersReducedMotion()) {
        navigate(to, options);
        return;
      }
      gsap.to(el, {
        opacity: 0,
        y: -8,
        duration: 0.14,
        ease: 'power1.in',
        onComplete: () => navigate(to, options),
      });
    },
    [navigate],
  );
}
