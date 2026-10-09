import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion, registerScreen } from '../hooks/useAnimatedNavigate';

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
    return () => registerScreen(null);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
