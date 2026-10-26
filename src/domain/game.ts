import { AntonymStore, DataStore, EnemStore, SynonymStore } from '../data/stores';
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

const RANDOM_MODES: StudyType[] = ['morphology', 'syntax', 'synonyms', 'antonyms'];

export function pickRandomMode(rng: () => number = Math.random): StudyType {
  const modes = RANDOM_MODES.filter((mode) => {
    if (mode === 'antonyms') {
      try {
        return AntonymStore.getPoolSize() > 0;
      } catch {
        return false;
      }
    }
    return true;
  });
  if (modes.length === 0) return 'morphology';
  return modes[Math.floor(rng() * modes.length)];
}

export function buildQuestion(
  type: StudyType,
  dayId: number,
  rng: () => number = Math.random,
): Question {
  const effectiveType = type === 'random' ? pickRandomMode(rng) : type;

  if (effectiveType === 'synonyms') {
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

  if (effectiveType === 'antonyms') {
    const entry = AntonymStore.getDay(dayId);
    return {
      prompt: [
        { text: 'Qual é o antônimo de ' },
        { text: entry.word, highlight: true },
        { text: '?' },
      ],
      options: shuffle(entry.options, rng),
      answer: entry.answer,
    };
  }

  if (effectiveType === 'enem') {
    const entry = EnemStore.getDay(dayId);
    // O contexto (texto/base) e o enunciado são exibidos juntos; sem isso a
    // questão fica sem o trecho a que as alternativas se referem.
    const text = [entry.question, entry.statement].filter(Boolean).join('\n\n').trim();
    return {
      prompt: [{ text: text || 'Selecione a alternativa correta:' }],
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
  if (effectiveType !== 'morphology' && effectiveType !== 'syntax') {
    throw new Error(`Tipo de questão não suportado: ${effectiveType}`);
  }
  return {
    prompt,
    options: shuffle(entry[effectiveType].options, rng),
    answer: entry[effectiveType].answer,
  };
}
