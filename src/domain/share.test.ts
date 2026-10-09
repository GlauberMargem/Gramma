import { describe, expect, it } from 'vitest';
import type { HistoryEntry, StudyType } from './types';
import { shareResult } from './share';

function entry(study_type: StudyType, correct: boolean): HistoryEntry {
  return {
    day_id: 7,
    study_type,
    correct,
    points: correct ? 110 : 0,
    base: 100,
    bonus: 10,
    is_milestone: false,
    streak_after: 1,
    time_ms: 1000,
    is_archive: false,
  };
}

const MODES = [
  ['morphology', 'Morfologia'],
  ['syntax', 'Sintaxe'],
  ['synonyms', 'Sinônimos'],
] as const;

describe('shareResult', () => {
  it.each(MODES)('acerto em %s', (mode, label) => {
    expect(shareResult(entry(mode, true))).toBe(`GRAMMA — Dia 7 (${label}): 🟩 — 110 pts`);
  });

  it.each(MODES)('erro em %s', (mode, label) => {
    expect(shareResult(entry(mode, false))).toBe(`GRAMMA — Dia 7 (${label}): 🟥 — 0 pts`);
  });
});
