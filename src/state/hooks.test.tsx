import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useFontScale, useTheme, useUserData } from './hooks';
import { USER_DATA_KEY, userStore } from './userStore';

function resetSettings(dark_mode: boolean, font_scale_index: number) {
  userStore.update((d) => ({ ...d, settings: { ...d.settings, dark_mode, font_scale_index } }));
}

describe('hooks de estado', () => {
  beforeEach(() => {
    resetSettings(false, 1);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('--font-scale');
  });

  it('useUserData reflete o snapshot do store', () => {
    const { result } = renderHook(() => useUserData());
    expect(result.current).toBe(userStore.getSnapshot());
    act(() => userStore.update((d) => ({ ...d, stats: { ...d.stats, games_played: 3 } })));
    expect(result.current.stats.games_played).toBe(3);
  });

  it('useTheme alterna data-theme e persiste', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => result.current.toggle());
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const saved = JSON.parse(localStorage.getItem(USER_DATA_KEY) ?? '{}');
    expect(saved.settings.dark_mode).toBe(true);
  });

  it('useFontScale aplica --font-scale e rótulo', () => {
    const { result } = renderHook(() => useFontScale());
    expect(result.current).toMatchObject({ index: 1, label: 'Normal' });
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1');
    act(() => result.current.change(1));
    expect(result.current).toMatchObject({ index: 2, label: 'Grande' });
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1.15');
  });

  it('useFontScale não passa de 0..3', () => {
    const { result } = renderHook(() => useFontScale());
    act(() => result.current.change(10));
    expect(result.current).toMatchObject({ index: 3, label: 'Extra Grande' });
    act(() => result.current.change(-10));
    expect(result.current).toMatchObject({ index: 0, label: 'Pequena' });
    expect(JSON.parse(localStorage.getItem(USER_DATA_KEY) ?? '{}').settings.font_scale_index).toBe(0);
  });

  it('índice inválido salvo cai em Normal', () => {
    resetSettings(false, 99);
    const { result } = renderHook(() => useFontScale());
    expect(result.current.label).toBe('Normal');
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1');
  });
});
