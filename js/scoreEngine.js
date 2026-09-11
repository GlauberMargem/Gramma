export const STUDY_TYPES = Object.freeze({
  MORPHOLOGY: 'morphology',
  SYNTAX: 'syntax',
  SYNONYMS: 'synonyms',
});

export const BASE_POINTS = {
  [STUDY_TYPES.MORPHOLOGY]: 100,
  [STUDY_TYPES.SYNTAX]: 200,
  [STUDY_TYPES.SYNONYMS]: 150,
};

const STREAK_MILESTONE_STEP = 5;
const STREAK_MILESTONE_BONUS = 0.10;

/**
 * Errou = 0 pontos. Acertou = pontos base do tipo de estudo.
 * A cada marco de 5 acertos seguidos (naquele tipo), ganha +10% de bônus
 * e a tela comemora com o efeito de brilho.
 */
export function calculatePoints(studyType, isCorrect, streakAfter) {
  if (!isCorrect) {
    return { base: 0, bonus: 0, total: 0, isMilestone: false };
  }

  const base = BASE_POINTS[studyType];
  const isMilestone = streakAfter > 0 && streakAfter % STREAK_MILESTONE_STEP === 0;
  const bonus = isMilestone ? Math.round(base * STREAK_MILESTONE_BONUS) : 0;

  return { base, bonus, total: base + bonus, isMilestone };
}
