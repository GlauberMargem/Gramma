import type { Score, StudyType } from './types';

export const BASE_POINTS: Record<StudyType, number> = {
  morphology: 100,
  syntax: 200,
  synonyms: 150,
  antonyms: 150,
  enem: 250,
  random: 175,
};

const STREAK_MILESTONE_STEP = 5;
const STREAK_MILESTONE_BONUS = 0.1;

/** Errou = 0. Acertou = base do modo; a cada 5 acertos seguidos no modo, +10%. */
export function calculatePoints(type: StudyType, isCorrect: boolean, streakAfter: number): Score {
  if (!isCorrect) {
    return { base: 0, bonus: 0, total: 0, isMilestone: false };
  }

  const base = BASE_POINTS[type];
  const isMilestone = streakAfter > 0 && streakAfter % STREAK_MILESTONE_STEP === 0;
  const bonus = isMilestone ? Math.round(base * STREAK_MILESTONE_BONUS) : 0;

  return { base, bonus, total: base + bonus, isMilestone };
}
