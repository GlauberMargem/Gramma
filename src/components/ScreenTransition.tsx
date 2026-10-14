import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion, registerScreen } from '../hooks/useAnimatedNavigate';

export const BASE_TITLE = 'GRAMMA — Desafio Gramatical & Sintático Diário';

/** Texto do título como o leitor de tela lê (sem os ícones `aria-hidden`). */
function accessibleText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Leitores de tela não percebem a troca de tela numa SPA: leva o foco ao <h1>
 * da tela nova (que é anunciado) e atualiza o título da aba.
 */
function focusScreenHeading(container: HTMLElement | null): void {
  const heading = container?.querySelector<HTMLElement>('h1');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  const text = accessibleText(heading);
  document.title = text && text !== 'GRAMMA' ? `${text} · GRAMMA` : BASE_TITLE;
}

/** Envolve o conteúdo de uma tela e anima a entrada (paridade com `showScreen`). */
export function ScreenTransition({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const tween = gsap.fromTo(ref.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
      // revert() do contexto só devolve o estilo; kill() tira o tween da timeline global
      return () => {
        tween.kill();
      };
    },
    { scope: ref },
  );

  useEffect(() => {
    registerScreen(ref.current);
    focusScreenHeading(ref.current);
    return () => registerScreen(null);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
