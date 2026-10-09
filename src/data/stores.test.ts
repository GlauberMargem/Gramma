import { describe, expect, it } from 'vitest';
import { DataStore, SynonymStore } from './stores';

describe('DataStore', () => {
  it('tem 365 dias', () => {
    expect(DataStore.getTotalDays()).toBe(365);
  });

  it('retorna o dia pedido e null fora do intervalo', () => {
    expect(DataStore.getDay(1)?.day_id).toBe(1);
    expect(DataStore.getDay(365)?.day_id).toBe(365);
    expect(DataStore.getDay(366)).toBeNull();
    expect(DataStore.getDay(0)).toBeNull();
  });

  it('valida 4 opções e answer entre as opções em todos os dias', () => {
    for (let id = 1; id <= DataStore.getTotalDays(); id++) {
      const day = DataStore.getDay(id);
      expect(day).not.toBeNull();
      for (const q of [day!.morphology, day!.syntax]) {
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.answer);
      }
    }
  });
});

describe('SynonymStore', () => {
  it('expõe o tamanho do pool', () => {
    expect(SynonymStore.getPoolSize()).toBe(100);
  });

  it('o dia pool+1 repete o dia 1 (ciclo)', () => {
    const pool = SynonymStore.getPoolSize();
    expect(SynonymStore.getDay(pool + 1)).toEqual(SynonymStore.getDay(1));
    expect(SynonymStore.getDay(pool)).not.toEqual(SynonymStore.getDay(1));
  });

  it('valida 4 opções e answer entre as opções', () => {
    for (let id = 1; id <= SynonymStore.getPoolSize(); id++) {
      const entry = SynonymStore.getDay(id);
      expect(entry.options).toHaveLength(4);
      expect(entry.options).toContain(entry.answer);
    }
  });
});
