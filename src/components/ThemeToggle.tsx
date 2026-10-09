import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../hooks/useAnimatedNavigate';
import { holdThemeApply, useUserData } from '../state/hooks';
import { userStore } from '../state/userStore';
import { IconButton } from './IconButton';

function applyTheme(isDark: boolean): void {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
}

/** Persiste `dark_mode` no clique; ícone e `data-theme` só mudam no ponto fechado (scaleX 0) do flip. */
export function ThemeToggle() {
  const stored = Boolean(useUserData().settings.dark_mode);
  const [shown, setShown] = useState(stored);
  const wrapper = useRef<HTMLSpanElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const pending = useRef<boolean | null>(null);

  const show = (isDark: boolean) => {
    pending.current = null;
    applyTheme(isDark);
    setShown(isDark);
  };

  // Mudança externa (outra aba) sem flip em andamento: sincroniza direto.
  useEffect(() => {
    if (pending.current === null) setShown(stored);
  }, [stored]);

  useEffect(
    () => () => {
      timeline.current?.kill();
      // Desmontou no meio do flip: não deixar o tema salvo sem ser aplicado.
      if (pending.current !== null) applyTheme(pending.current);
      holdThemeApply(false);
    },
    [],
  );

  const onClick = () => {
    const btn = wrapper.current?.querySelector('button') ?? null;
    // Interrompe o flip anterior: aplica o alvo pendente e devolve a escala a 1.
    timeline.current?.kill();
    timeline.current = null;
    if (pending.current !== null) show(pending.current);
    if (btn) gsap.set(btn, { clearProps: 'transform' });

    const next = !userStore.getSnapshot().settings.dark_mode;
    holdThemeApply(true);
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: next } }));

    if (!btn || prefersReducedMotion()) {
      show(next);
      holdThemeApply(false);
      return;
    }

    pending.current = next;
    timeline.current = gsap
      .timeline()
      .to(btn, { scaleX: 0, duration: 0.14, ease: 'power1.in' })
      .call(() => {
        show(next);
        holdThemeApply(false);
      })
      .to(btn, { scaleX: 1, duration: 0.24, ease: 'back.out(2.4)' })
      .set(btn, { clearProps: 'transform' });
  };

  return (
    <span ref={wrapper} style={{ display: 'contents' }}>
      <IconButton icon={shown ? 'light_mode' : 'dark_mode'} label="Alternar tema claro/escuro" onClick={onClick} />
    </span>
  );
}
