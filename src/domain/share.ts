import type { HistoryEntry, StudyType } from './types';

const STUDY_TYPE_LABEL_TITLE: Record<StudyType, string> = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
  antonyms: 'Antônimos',
  enem: 'ENEM',
  random: 'Aleatório',
};

/** Texto de compartilhamento (paridade com `shareResult` do legado). */
export function shareResult(entry: HistoryEntry): string {
  const emoji = entry.correct ? '🟩' : '🟥';
  const label = STUDY_TYPE_LABEL_TITLE[entry.study_type];
  if (entry.study_type === 'enem' || entry.study_type === 'random') {
    return `GRAMMA — ${label}: ${emoji} — ${entry.points} pts`;
  }
  return `GRAMMA — Dia ${entry.day_id} (${label}): ${emoji} — ${entry.points} pts`;
}
