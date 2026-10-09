import { describe, expect, it } from 'vitest';
import { recordResult } from './recordResult';
import { createDefaultUserData } from '../state/userData';
import type { UserData } from './types';

const base = (): UserData => createDefaultUserData();
const play = (data: UserData, over: Partial<Parameters<typeof recordResult>[1]> = {}) =>
  recordResult(data, { dayId: 1, type: 'morphology', correct: true, timeMs: 1234, isArchive: false, ...over });

describe('recordResult', () => {
  it('acerto incrementa streak, total e máximo', () => {
    const r = play(base());
    expect(r.data.stats.morph_correct_streak).toBe(1);
    expect(r.data.stats.total_correct_morph).toBe(1);
    expect(r.data.stats.morph_correct_streak_max).toBe(1);
    expect(r.streak).toBe(1);
    expect(r.data.stats.games_played).toBe(1);
    expect(r.data.stats.total_score).toBe(100);
  });

  it('erro zera o streak do modo, mas mantém máximo e total', () => {
    const r1 = play(base());
    const r2 = play(r1.data, { dayId: 2, correct: false });
    expect(r2.data.stats.morph_correct_streak).toBe(0);
    expect(r2.data.stats.morph_correct_streak_max).toBe(1);
    expect(r2.data.stats.total_correct_morph).toBe(1);
    expect(r2.score.total).toBe(0);
  });

  it('usa as chaves do modo correto', () => {
    const r = play(base(), { type: 'syntax' });
    expect(r.data.stats.syntax_correct_streak).toBe(1);
    expect(r.data.stats.total_correct_syntax).toBe(1);
    const s = play(base(), { type: 'synonyms' });
    expect(s.data.stats.synonyms_correct_streak_max).toBe(1);
  });

  it('grava history com todos os campos', () => {
    const r = play(base(), { dayId: 7, type: 'syntax', timeMs: 500 });
    expect(r.data.history['7:syntax']).toEqual({
      day_id: 7,
      study_type: 'syntax',
      correct: true,
      points: 200,
      base: 200,
      bonus: 0,
      is_milestone: false,
      streak_after: 1,
      time_ms: 500,
      is_archive: false,
    });
  });

  it('bônus de marco no 5o acerto', () => {
    const d = base();
    d.stats.morph_correct_streak = 4;
    const r = play(d);
    expect(r.score).toEqual({ base: 100, bonus: 10, total: 110, isMilestone: true });
    expect(r.data.history['1:morphology'].is_milestone).toBe(true);
  });

  describe('ofensiva', () => {
    it('primeiro jogo', () => {
      const r = play(base(), { dayId: 50 });
      expect(r.data.stats.current_streak).toBe(1);
      expect(r.data.stats.last_streak_day).toBe(50);
      expect(r.data.stats.max_streak).toBe(1);
    });
    it('dia consecutivo', () => {
      const r = play(play(base(), { dayId: 5 }).data, { dayId: 6, type: 'syntax' });
      expect(r.data.stats.current_streak).toBe(2);
      expect(r.data.stats.max_streak).toBe(2);
    });
    it('salto de dias volta a 1, preservando o máximo', () => {
      const r = play(play(play(base(), { dayId: 5 }).data, { dayId: 6 }).data, { dayId: 9 });
      expect(r.data.stats.current_streak).toBe(1);
      expect(r.data.stats.max_streak).toBe(2);
      expect(r.data.stats.last_streak_day).toBe(9);
    });
    it('mesmo dia não muda', () => {
      const r1 = play(base(), { dayId: 5 });
      const r2 = play(r1.data, { dayId: 5, type: 'syntax' });
      expect(r2.data.stats.current_streak).toBe(1);
      expect(r2.data.stats.last_streak_day).toBe(5);
    });
  });

  it('arquivo não altera current_streak/last_streak_day', () => {
    const r = play(base(), { dayId: 3, isArchive: true });
    expect(r.data.stats.current_streak).toBe(0);
    expect(r.data.stats.last_streak_day).toBe(0);
    expect(r.data.stats.max_streak).toBe(0);
    expect(r.data.history['3:morphology'].is_archive).toBe(true);
    expect(r.data.stats.games_played).toBe(1);
  });

  it('newlyUnlocked só traz ids novos', () => {
    const r1 = play(base());
    expect(r1.newlyUnlocked.length).toBeGreaterThan(0);
    expect(r1.data.stats.unlocked_achievements).toEqual(expect.arrayContaining(r1.newlyUnlocked));
    const r2 = play(r1.data, { dayId: 1, type: 'syntax' });
    for (const id of r1.newlyUnlocked) expect(r2.newlyUnlocked).not.toContain(id);
  });

  it('não muta a entrada', () => {
    const d = base();
    const snapshot = structuredClone(d);
    play(d);
    expect(d).toEqual(snapshot);
  });
});
