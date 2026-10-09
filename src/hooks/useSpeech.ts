import { useCallback } from 'react';

export function useSpeech(text: string) {
  const supported = typeof window !== 'undefined' && Boolean(window.speechSynthesis);

  const speak = useCallback(() => {
    if (!supported) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  }, [supported, text]);

  return { supported, speak };
}
