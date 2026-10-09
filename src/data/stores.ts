import type { GrammarDay, SynonymEntry } from '../domain/types';
import grammarDays from './grammar-days.json';
import synonyms from './synonyms.json';

// O cast é seguro: stores.test.ts valida o formato dos JSON contra os tipos.
const DAYS = grammarDays as GrammarDay[];
const SYNONYMS = synonyms as SynonymEntry[];

const indexByDay = new Map<number, GrammarDay>(DAYS.map((entry) => [entry.day_id, entry]));

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
    return SYNONYMS[(dayId - 1) % SYNONYMS.length];
  },
};
