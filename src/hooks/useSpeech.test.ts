import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpeech } from './useSpeech';

class FakeUtterance {
  lang = '';
  constructor(public text: string) {}
}

function installSpeech() {
  const calls: string[] = [];
  const synth = {
    cancel: vi.fn(() => calls.push('cancel')),
    speak: vi.fn((utterance: FakeUtterance) => calls.push(`speak:${utterance.lang}:${utterance.text}`)),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true });
  return { synth, calls };
}

describe('useSpeech', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance');
  });

  it('fala o texto em pt-BR, cancelando antes', () => {
    const { calls } = installSpeech();
    const { result } = renderHook(() => useSpeech('O gato dorme.'));
    expect(result.current.supported).toBe(true);
    act(() => result.current.speak());
    expect(calls).toEqual(['cancel', 'speak:pt-BR:O gato dorme.']);
  });

  it('não fala texto vazio', () => {
    const { synth } = installSpeech();
    const { result } = renderHook(() => useSpeech('   '));
    act(() => result.current.speak());
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('sem suporte: supported=false e speak é no-op', () => {
    const { result } = renderHook(() => useSpeech('oi'));
    expect(result.current.supported).toBe(false);
    expect(() => act(() => result.current.speak())).not.toThrow();
  });
});
