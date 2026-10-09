import { useEffect, useRef, useState } from 'react';
import { buildQuestion } from '../domain/game';
import { recordResult } from '../domain/recordResult';
import type { Question, StudyType } from '../domain/types';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { userStore } from '../state/userStore';

export const PHASE_TRANSITION_DELAY_MS = 900;

interface SessionInput {
  dayId: number;
  type: StudyType;
  isArchive: boolean;
}

/**
 * Uma pergunta por montagem: o componente que usa este hook deve receber
 * `key={dia-modo}` para que a pergunta (e o embaralhamento) mude só aí.
 * Navega com `useAnimatedNavigate` (mesma transição de saída das outras telas).
 */
export function useQuestionSession({ dayId, type, isArchive }: SessionInput): {
  question: Question;
  selected: string | null;
  select: (option: string) => void;
} {
  const go = useAnimatedNavigate();
  const [question] = useState(() => buildQuestion(type, dayId));
  const [selected, setSelected] = useState<string | null>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = performance.now();
  }, []);
  const recorded = useRef(false);

  const select = (option: string) => {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === question.answer;

    setTimeout(() => {
      // Guard contra duplo disparo (StrictMode): não duplicar games_played.
      if (recorded.current) return;
      recorded.current = true;
      // Como no legado, o tempo é medido em finish(), já incluindo o atraso de 900 ms.
      const timeMs = Math.round(performance.now() - startedAt.current);
      const result = recordResult(userStore.getSnapshot(), { dayId, type, correct, timeMs, isArchive });
      userStore.update(() => result.data);
      go(`/fim/${dayId}`, { state: { newlyUnlocked: result.newlyUnlocked } });
    }, PHASE_TRANSITION_DELAY_MS);
  };

  return { question, selected, select };
}
