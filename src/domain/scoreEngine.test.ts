import { describe, expect, it } from 'vitest';
import { BASE_POINTS, calculatePoints } from './scoreEngine';
import type { StudyType } from './types';

describe('calculatePoints', () => {
  it('errou zera tudo, mesmo em múltiplo de 5', () => {
    expect(calculatePoints('syntax', false, 5)).toEqual({ base: 0, bonus: 0, total: 0, isMilestone: false });
  });

  it('bases por modo', () => {
    expect(BASE_POINTS).toEqual({
      morphology: 100,
      syntax: 200,
      synonyms: 150,
      antonyms: 150,
      enem: 250,
      random: 175,
    });
    expect(calculatePoints('morphology', true, 1).total).toBe(100);
    expect(calculatePoints('syntax', true, 1).total).toBe(200);
    expect(calculatePoints('synonyms', true, 1).total).toBe(150);
    expect(calculatePoints('antonyms', true, 1).total).toBe(150);
    expect(calculatePoints('enem', true, 1).total).toBe(250);
    expect(calculatePoints('random', true, 1).total).toBe(175);
  });

  it.each([5, 10, 15])('marco em %i', (streak) => {
    expect(calculatePoints('morphology', true, streak)).toEqual({ base: 100, bonus: 10, total: 110, isMilestone: true });
  });

  it.each<[StudyType, number]>([
    ['morphology', 10],
    ['syntax', 20],
    ['synonyms', 15],
  ])('bônus de %s = %i', (type, bonus) => {
    const r = calculatePoints(type, true, 5);
    expect(r.bonus).toBe(bonus);
    expect(r.total).toBe(BASE_POINTS[type] + bonus);
  });

  it('streak 0 e não múltiplos não são marco', () => {
    expect(calculatePoints('syntax', true, 0).isMilestone).toBe(false);
    expect(calculatePoints('syntax', true, 4).isMilestone).toBe(false);
    expect(calculatePoints('syntax', true, 6)).toEqual({ base: 200, bonus: 0, total: 200, isMilestone: false });
  });
});
