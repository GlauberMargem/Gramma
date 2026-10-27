import { useCallback, useEffect, useState } from 'react';

export function useSpeech(text: string) {
  const supported = typeof window !== 'undefined' && Boolean(window.speechSynthesis);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(() => {
    if (!supported) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = 'pt-BR';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [supported, text]);

  /**
   * Usado pelo botão: se já está lendo, para; senão, começa.
   * Consulta também o estado real do navegador, pois o onend/onerror pode
   * disparar antes do áudio terminar em alguns navegadores.
   */
  const toggle = useCallback(() => {
    if (!supported) return;
    const synthesis = window.speechSynthesis;
    if (speaking || synthesis.speaking || synthesis.pending) {
      stop();
    } else {
      speak();
    }
  }, [supported, speaking, stop, speak]);

  // Interrompe a leitura ao sair da tela (antes falava até o fim após navegar).
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { supported, speaking, speak, stop, toggle };
}
