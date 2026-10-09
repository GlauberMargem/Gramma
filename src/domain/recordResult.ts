import { evaluateAchievements } from './achievements';
import { calculatePoints } from './scoreEngine';
import type { Score, Stats, StudyType, UserData } from './types';

export interface RecordResultInput {
  dayId: number;
  type: StudyType;
  correct: boolean;
  timeMs: number;
  isArchive: boolean;
}

export interface RecordResultOutput {
  data: UserData;
  score: Score;
  streak: number;
  newlyUnlocked: string[];
}

type NumericStatKey = Exclude<keyof Stats, 'unlocked_achievements'>;

const STAT_KEYS: Record<StudyType, { streak: NumericStatKey; streakMax: NumericStatKey; totalCorrect: NumericStatKey }> = {
  morphology: { streak: 'morph_correct_streak', streakMax: 'morph_correct_streak_max', totalCorrect: 'total_correct_morph' },
  syntax: { streak: 'syntax_correct_streak', streakMax: 'syntax_correct_streak_max', totalCorrect: 'total_correct_syntax' },
  synonyms: { streak: 'synonyms_correct_streak', streakMax: 'synonyms_correct_streak_max', totalCorrect: 'total_correct_synonyms' },
};

/**
 * Registra o resultado de uma jogada (um modo por vez). Pura: devolve um novo
 * UserData sem tocar no storage nem na entrada.
 */
export function recordResult(data: UserData, input: RecordResultInput): RecordResultOutput {
  const { dayId, type, correct, timeMs, isArchive } = input;
  const stats: Stats = { ...data.stats, unlocked_achievements: [...data.stats.unlocked_achievements] };
  const keys = STAT_KEYS[type];

  if (correct) {
    stats[keys.streak] += 1;
    stats[keys.totalCorrect] += 1;
    stats[keys.streakMax] = Math.max(stats[keys.streakMax], stats[keys.streak]);
  } else {
    stats[keys.streak] = 0;
  }

  const streak = stats[keys.streak];
  const score = calculatePoints(type, correct, streak);

  const history: UserData['history'] = {
    ...data.history,
    [`${dayId}:${type}`]: {
      day_id: dayId,
      study_type: type,
      correct,
      points: score.total,
      base: score.base,
      bonus: score.bonus,
      is_milestone: score.isMilestone,
      streak_after: streak,
      time_ms: timeMs,
      is_archive: isArchive,
    },
  };

  stats.games_played += 1;
  stats.total_score += score.total;

  // Quirk legado: last_streak_day === 0 sempre inicia a ofensiva, qualquer que seja o dia.
  if (!isArchive && dayId !== stats.last_streak_day) {
    if (dayId === stats.last_streak_day + 1 || stats.last_streak_day === 0) {
      stats.current_streak += 1;
    } else {
      stats.current_streak = 1;
    }
    stats.last_streak_day = dayId;
    stats.max_streak = Math.max(stats.max_streak, stats.current_streak);
  }

  const unlockedBefore = new Set(data.stats.unlocked_achievements);
  const unlockedNow = evaluateAchievements(stats);
  const newlyUnlocked = unlockedNow.filter((id) => !unlockedBefore.has(id));
  stats.unlocked_achievements = unlockedNow;

  return { data: { ...data, settings: { ...data.settings }, stats, history }, score, streak, newlyUnlocked };
}
