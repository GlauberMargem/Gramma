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

export function useTheme(): { isDark: boolean; toggle: () => void } {
  const isDark = Boolean(useUserData().settings.dark_mode);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const toggle = () =>
    userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode: !d.settings.dark_mode } }));

  return { isDark, toggle };
}

export function useFontScale(): { index: number; label: string; change: (direction: number) => void } {
  const stored = useUserData().settings.font_scale_index;
  // Índice fora da faixa (dados corrompidos) cai em Normal, como no legado.
  const scale = FONT_SCALES[stored] ?? FONT_SCALES[1];

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(scale.value));
  }, [scale]);

  const change = (direction: number) =>
    userStore.update((d) => {
      const index = Math.min(FONT_SCALES.length - 1, Math.max(0, d.settings.font_scale_index + direction));
      return { ...d, settings: { ...d.settings, font_scale_index: index } };
    });

  return { index: stored, label: scale.label, change };
}
