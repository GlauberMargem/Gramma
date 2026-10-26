import type { ProgressDTO } from '../api/types';
import { evaluateAchievements } from './achievements';
import type { HistoryEntry, Stats, StudyType, UserData } from './types';

type HistoryKey = `${number}:${StudyType}`;

const MODE_KEYS = {
  morphology: { streak: 'morph_correct_streak', streakMax: 'morph_correct_streak_max', totalCorrect: 'total_correct_morph' },
  syntax: { streak: 'syntax_correct_streak', streakMax: 'syntax_correct_streak_max', totalCorrect: 'total_correct_syntax' },
  synonyms: { streak: 'synonyms_correct_streak', streakMax: 'synonyms_correct_streak_max', totalCorrect: 'total_correct_synonyms' },
  antonyms: { streak: 'synonyms_correct_streak', streakMax: 'synonyms_correct_streak_max', totalCorrect: 'total_correct_synonyms' },
  enem: { streak: 'syntax_correct_streak', streakMax: 'syntax_correct_streak_max', totalCorrect: 'total_correct_syntax' },
  random: { streak: 'morph_correct_streak', streakMax: 'morph_correct_streak_max', totalCorrect: 'total_correct_morph' },
} as const;

/** Mesma regra do backend: mais pontos; empate → menos tempo. */
function isBetter(candidate: HistoryEntry, current: HistoryEntry): boolean {
  if (candidate.points !== current.points) return candidate.points > current.points;
  return candidate.time_ms < current.time_ms;
}

function mergeHistory(local: UserData['history'], cloud: HistoryEntry[]): UserData['history'] {
  const merged: UserData['history'] = { ...local };
  for (const entry of cloud) {
    const key: HistoryKey = `${entry.day_id}:${entry.study_type}`;
    const current = merged[key];
    if (!current || isBetter(entry, current)) merged[key] = { ...entry };
  }
  return merged;
}

/**
 * Mescla o progresso local com o da conta (link device). Pura e determinística.
 *
 * - history: união por `dia:modo`, mantendo a melhor jogada;
 * - contadores (jogos, pontos, acertos por modo): o maior entre local, nuvem e o
 *   recalculado do histórico mesclado — nunca diminuem (o rejogo de arquivo
 *   infla `games_played` sem nova entrada no histórico);
 * - ofensiva: `current_streak`/`last_streak_day` do lado com o dia mais recente
 *   (empate → maior ofensiva); `max_streak` = maior;
 * - streak atual por modo: `streak_after` da jogada de maior `day_id` do modo
 *   (limite: não sabe a ordem real das jogadas de arquivo);
 * - conquistas: união dos dois lados + as que os stats mesclados destravam;
 * - uuid e settings: sempre locais (a nuvem não guarda preferências).
 */
export function mergeProgress(local: UserData, cloud: ProgressDTO): UserData {
  const a = local.stats;
  const b = cloud.stats;
  const history = mergeHistory(local.history, cloud.history);
  const entries = Object.values(history);

  const recomputedScore = entries.reduce((sum, e) => sum + e.points, 0);
  const cloudIsNewer =
    b.last_streak_day > a.last_streak_day ||
    (b.last_streak_day === a.last_streak_day && b.current_streak > a.current_streak);
  const streakSide = cloudIsNewer ? b : a;

  const stats: Stats = {
    ...a,
    current_streak: streakSide.current_streak,
    last_streak_day: streakSide.last_streak_day,
    max_streak: Math.max(a.max_streak, b.max_streak, streakSide.current_streak),
    games_played: Math.max(a.games_played, b.games_played, entries.length),
    total_score: Math.max(a.total_score, b.total_score, recomputedScore),
    unlocked_achievements: [],
  };

  for (const type of Object.keys(MODE_KEYS) as StudyType[]) {
    const keys = MODE_KEYS[type];
    const ofMode = entries.filter((e) => e.study_type === type);
    const correct = ofMode.filter((e) => e.correct).length;
    stats[keys.totalCorrect] = Math.max(a[keys.totalCorrect], b[keys.totalCorrect], correct);
    const localLatest = Object.values(local.history)
      .filter((e) => e.study_type === type)
      .reduce<HistoryEntry | null>((best, e) => (!best || e.day_id > best.day_id ? e : best), null);
    const cloudLatest = cloud.history
      .filter((e) => e.study_type === type)
      .reduce<HistoryEntry | null>((best, e) => (!best || e.day_id > best.day_id ? e : best), null);
    const candidates = [localLatest, cloudLatest].filter((e): e is HistoryEntry => Boolean(e));
    const chosen =
      candidates.length === 0
        ? null
        : candidates.reduce<HistoryEntry>((best, e) => (e.day_id > best.day_id ? e : best), candidates[0]);
    stats[keys.streak] = chosen ? chosen.streak_after : a[keys.streak];
    stats[keys.streakMax] = Math.max(a[keys.streakMax], b[keys.streakMax], stats[keys.streak]);
  }

  const unlocked = new Set([...a.unlocked_achievements, ...b.unlocked_achievements, ...evaluateAchievements(stats)]);
  stats.unlocked_achievements = [...unlocked].sort();

  return { ...local, settings: { ...local.settings }, stats, history };
}
