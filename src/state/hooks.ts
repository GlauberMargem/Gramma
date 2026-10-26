import { useEffect, useSyncExternalStore } from 'react';
import type { UserData } from '../domain/types';
import { userStore } from './userStore';

export const FONT_SCALES = [
  { value: 0.85, label: 'Pequena' },
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'Grande' },
  { value: 1.3, label: 'Extra Grande' },
] as const;

export function useUserData(): UserData {
  return useSyncExternalStore(userStore.subscribe, userStore.getSnapshot);
}

let themeApplyHeld = false;

/** O ThemeToggle segura a aplicação de `data-theme` até o ponto fechado do flip. */
export function holdThemeApply(held: boolean): void {
  themeApplyHeld = held;
}

export function useTheme(): { isDark: boolean; toggle: () => void } {
  const isDark = Boolean(useUserData().settings.dark_mode);

  useEffect(() => {
    if (themeApplyHeld) return;
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const toggle = () =>
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: !d.settings.dark_mode } }));

  return { isDark, toggle };
}

export function useFontScale(): { index: number; label: string; change: (direction: number) => void } {
  const stored = useUserData().settings.font_scale_index ?? 1;
  // Índice fora da faixa (dados corrompidos) cai em Normal, como no legado.
  const scale = FONT_SCALES[stored] ?? FONT_SCALES[1];

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(scale.value));
  }, [scale]);

  const change = (direction: number) =>
    userStore.update((d) => {
      const currentIndex = typeof d.settings.font_scale_index === 'number' ? d.settings.font_scale_index : 1;
      const index = Math.min(FONT_SCALES.length - 1, Math.max(0, currentIndex + direction));
      return { ...d, settings: { ...d.settings, font_scale_index: index } };
    });

  return { index: stored, label: scale.label, change };
}

export function useAccessibility(): {
  dyslexiaFont: boolean;
  highContrast: boolean;
  toggleDyslexiaFont: () => void;
  toggleHighContrast: () => void;
} {
  const dyslexiaFont = Boolean(useUserData().settings.dyslexia_font);
  const highContrast = Boolean(useUserData().settings.high_contrast);

  useEffect(() => {
    document.documentElement.classList.toggle('dyslexia-font', dyslexiaFont);
  }, [dyslexiaFont]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  const toggleDyslexiaFont = () =>
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dyslexia_font: !d.settings.dyslexia_font } }));

  const toggleHighContrast = () =>
    userStore.update((d) => ({ ...d, settings: { ...d.settings, high_contrast: !d.settings.high_contrast } }));

  return { dyslexiaFont, highContrast, toggleDyslexiaFont, toggleHighContrast };
}
