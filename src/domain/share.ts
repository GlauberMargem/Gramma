import type { HistoryEntry, StudyType } from './types';

const STUDY_TYPE_LABEL_TITLE: Record<StudyType, string> = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
};

/** Texto de compartilhamento (paridade com `shareResult` do legado). */
export function shareResult(entry: HistoryEntry): string {
  const emoji = entry.correct ? '🟩' : '🟥';
  const label = STUDY_TYPE_LABEL_TITLE[entry.study_type];
  return `GRAMMA — Dia ${entry.day_id} (${label}): ${emoji} — ${entry.points} pts`;
}
