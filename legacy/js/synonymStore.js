import { SYNONYMS_DATABASE } from './synonymsDatabase.js';

/**
 * O banco de sinônimos tem menos entradas do que os 365 dias do jogo
 * (são palavras difíceis, curadas à mão — melhor um banco menor e bom
 * do que 365 forçados e repetitivos). Por isso ele repete em ciclo:
 * dia 1 usa a palavra 1, dia 101 usa a palavra 1 de novo, etc.
 */
export class SynonymStore {
  static getPoolSize() {
    return SYNONYMS_DATABASE.length;
  }

  static getDay(dayId) {
    const index = (dayId - 1) % SYNONYMS_DATABASE.length;
    return SYNONYMS_DATABASE[index];
  }
}
