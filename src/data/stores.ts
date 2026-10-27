import type { AntonymEntry, EnemEntry, GrammarDay, SynonymEntry } from '../domain/types';
import antonyms from './antonyms.json';
import enem from './enem.json';
import grammarDays from './grammar-days.json';
import synonyms from './synonyms.json';

// O cast é seguro: stores.test.ts valida o formato dos JSON contra os tipos.
const DAYS = grammarDays as GrammarDay[];
const SYNONYMS = synonyms as SynonymEntry[];
const ANTONYMS = antonyms as AntonymEntry[];
const ENEM = enem as EnemEntry[];

const indexByDay = new Map<number, GrammarDay>(DAYS.map((entry) => [entry.day_id, entry]));
const antonymsById = new Map<number, AntonymEntry>(
  ANTONYMS.map((entry, i) => [entry.day_id ?? entry.word_id ?? i + 1, entry]),
);
const enemById = new Map<number, EnemEntry>(
  ENEM.map((entry, i) => [entry.day_id ?? entry.question_id ?? i + 1, entry]),
);

export const DataStore = {
  getTotalDays(): number {
    return DAYS.length;
  },

  getDay(dayId: number): GrammarDay | null {
    return indexByDay.get(dayId) ?? null;
  },
};

/**
 * O banco de sinônimos tem menos entradas que os 365 dias do jogo, então
 * repete em ciclo: dia pool+1 volta à palavra 1.
 */
export const SynonymStore = {
  getPoolSize(): number {
    return SYNONYMS.length;
  },

  getDay(dayId: number): SynonymEntry {
    if (SYNONYMS.length === 0) {
      throw new Error('Banco de sinônimos não disponível');
    }
    return SYNONYMS[(dayId - 1) % SYNONYMS.length];
  },
};

/**
 * Banco de antônimos - repete em ciclo se menor que 365 dias.
 */
export const AntonymStore = {
  getPoolSize(): number {
    return ANTONYMS.length;
  },

  getDay(dayId: number): AntonymEntry {
    if (ANTONYMS.length === 0) {
      throw new Error('Banco de antônimos não disponível');
    }
    return ANTONYMS[(dayId - 1) % ANTONYMS.length];
  },

  getById(id: number): AntonymEntry | null {
    return antonymsById.get(id) ?? null;
  },
};

/**
 * Banco ENEM - modo livre (fora do desafio diário).
 */
export const EnemStore = {
  getPoolSize(): number {
    return ENEM.length;
  },

  getDay(dayId: number): EnemEntry {
    if (ENEM.length === 0) {
      throw new Error('Banco ENEM não disponível');
    }
    return ENEM[(dayId - 1) % ENEM.length];
  },

  getById(id: number): EnemEntry | null {
    return enemById.get(id) ?? null;
  },

  /** Sorteia um `dayId` válido (1..pool) para o modo livre. */
  getRandomDayId(rng: () => number = Math.random): number {
    if (ENEM.length === 0) return 1;
    return Math.floor(rng() * ENEM.length) + 1;
  },
};

export const GameModeStore = {
  hasAntonyms(): boolean {
    return ANTONYMS.length > 0;
  },
  hasEnem(): boolean {
    return ENEM.length > 0;
  },
};
