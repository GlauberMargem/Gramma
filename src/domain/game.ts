import { DataStore, SynonymStore } from '../data/stores';
import type { PromptPart, Question, StudyType } from './types';

/**
 * As opções vêm do banco sempre na mesma ordem (a resposta certa cai em B na
 * grande maioria dos dias); embaralhar evita que a posição entregue a resposta.
 */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const SPAN = /<span>(.*?)<\/span>/;

/** Usa o <span> existente; senão destaca a primeira ocorrência de `target`. */
export function splitHighlight(
  sentence: string,
  target?: string,
): { before: string; highlight: string; after: string } {
  const span = SPAN.exec(sentence);
  if (span) {
    return {
      before: sentence.slice(0, span.index),
      highlight: span[1],
      after: sentence.slice(span.index + span[0].length),
    };
  }
  const at = target ? sentence.indexOf(target) : -1;
  if (!target || at < 0) return { before: sentence, highlight: '', after: '' };
  return {
    before: sentence.slice(0, at),
    highlight: target,
    after: sentence.slice(at + target.length),
  };
}

export function resolveDay(
  requested: number,
  current: number,
  total: number,
): { dayId: number; isArchive: boolean } {
  const dayId = Math.min(requested > 0 ? requested : current, current, total);
  return { dayId, isArchive: requested > 0 && dayId !== current };
}

export function buildQuestion(
  type: StudyType,
  dayId: number,
  rng: () => number = Math.random,
): Question {
  if (type === 'synonyms') {
    const entry = SynonymStore.getDay(dayId);
    return {
      prompt: [
        { text: 'Qual é o sinônimo de ' },
        { text: entry.word, highlight: true },
        { text: '?' },
      ],
      options: shuffle(entry.options, rng),
      answer: entry.answer,
    };
  }

  const entry = DataStore.getDay(dayId);
  if (!entry) throw new Error(`Dia ${dayId} não encontrado`);
  const { before, highlight, after } = splitHighlight(entry.sentence, entry.target_word);
  const prompt: PromptPart[] = [];
  if (before) prompt.push({ text: before });
  if (highlight) prompt.push({ text: highlight, highlight: true });
  if (after) prompt.push({ text: after });
  return {
    prompt,
    options: shuffle(entry[type].options, rng),
    answer: entry[type].answer,
  };
}
