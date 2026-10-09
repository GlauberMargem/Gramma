import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements, getAchievement } from './achievements';
import type { Stats } from './types';

const baseStats = (): Stats => ({
  current_streak: 0,
  max_streak: 0,
  last_streak_day: 0,
  games_played: 0,
  total_score: 0,
  morph_correct_streak: 0,
  morph_correct_streak_max: 0,
  syntax_correct_streak: 0,
  syntax_correct_streak_max: 0,
  synonyms_correct_streak: 0,
  synonyms_correct_streak_max: 0,
  total_correct_morph: 0,
  total_correct_syntax: 0,
  total_correct_synonyms: 0,
  unlocked_achievements: [],
});

const thresholds: [string, keyof Stats, number][] = [
  ['first_step', 'games_played', 1],
  ['morphologicador_10', 'morph_correct_streak_max', 10],
  ['morphologicador_20', 'morph_correct_streak_max', 20],
  ['morphologicador_50', 'morph_correct_streak_max', 50],
  ['sintaticista_10', 'syntax_correct_streak_max', 10],
  ['sintaticista_20', 'syntax_correct_streak_max', 20],
  ['sintaticista_50', 'syntax_correct_streak_max', 50],
  ['sinonimista_10', 'synonyms_correct_streak_max', 10],
  ['sinonimista_20', 'synonyms_correct_streak_max', 20],
  ['sinonimista_50', 'synonyms_correct_streak_max', 50],
  ['streak_7', 'max_streak', 7],
  ['streak_30', 'max_streak', 30],
  ['games_50', 'games_played', 50],
  ['games_100', 'games_played', 100],
  ['score_5000', 'total_score', 5000],
  ['score_20000', 'total_score', 20000],
];

describe('catálogo', () => {
  it('tem 17 ids únicos', () => {
    expect(ACHIEVEMENTS).toHaveLength(17);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(17);
  });

  it('nada desbloqueado com stats zeradas', () => {
    expect(evaluateAchievements(baseStats())).toEqual([]);
  });
});

describe.each(thresholds)('%s', (id, field, n) => {
  it(`não desbloqueia com ${n - 1}`, () => {
    expect(evaluateAchievements({ ...baseStats(), [field]: n - 1 })).not.toContain(id);
  });
  it(`desbloqueia com ${n}`, () => {
    expect(evaluateAchievements({ ...baseStats(), [field]: n })).toContain(id);
  });
});

describe('equilibrado', () => {
  const eq = (m: number, s: number, y: number) =>
    evaluateAchievements({
      ...baseStats(),
      total_correct_morph: m,
      total_correct_syntax: s,
      total_correct_synonyms: y,
    }).includes('equilibrado');

  it('exige 10 de cada tipo', () => {
    expect(eq(10, 10, 10)).toBe(true);
    expect(eq(9, 10, 10)).toBe(false);
    expect(eq(10, 9, 10)).toBe(false);
    expect(eq(10, 10, 9)).toBe(false);
  });
});

describe('getAchievement', () => {
  it('retorna a conquista pelo id', () => {
    expect(getAchievement('first_step')?.name).toBe('Primeiro Passo');
  });
  it('retorna null se não existe', () => {
    expect(getAchievement('nope')).toBeNull();
  });
});
