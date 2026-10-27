import { describe, expect, it } from 'vitest';
import { AntonymStore, DataStore, EnemStore, GameModeStore, SynonymStore } from './stores';

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

describe('AntonymStore', () => {
  it('expõe o tamanho do pool', () => {
    expect(AntonymStore.getPoolSize()).toBeGreaterThan(0);
  });

  it('o dia pool+1 repete o dia 1 (ciclo)', () => {
    const pool = AntonymStore.getPoolSize();
    expect(AntonymStore.getDay(pool + 1)).toEqual(AntonymStore.getDay(1));
  });

  it('valida 4 opções, sem repetição, e answer entre as opções', () => {
    for (let id = 1; id <= AntonymStore.getPoolSize(); id++) {
      const entry = AntonymStore.getDay(id);
      expect(entry.options).toHaveLength(4);
      expect(new Set(entry.options).size).toBe(4);
      expect(entry.options).toContain(entry.answer);
      expect(entry.answer).not.toBe(entry.word);
    }
  });

  it('busca pelo word_id', () => {
    const entry = AntonymStore.getDay(1);
    expect(AntonymStore.getById(entry.word_id ?? 1)).toEqual(entry);
    expect(AntonymStore.getById(-1)).toBeNull();
  });
});

describe('EnemStore', () => {
  it('tem questões e expõe o tamanho do pool', () => {
    expect(EnemStore.getPoolSize()).toBeGreaterThan(0);
  });

  it('valida 5 opções, answer entre as opções e texto-base limpo', () => {
    for (let id = 1; id <= EnemStore.getPoolSize(); id++) {
      const entry = EnemStore.getDay(id);
      expect(entry.options).toHaveLength(5);
      expect(new Set(entry.options).size).toBe(5);
      expect(entry.options).toContain(entry.answer);
      expect(entry.question).not.toContain('![');
    }
  });

  it('sorteia um day_id dentro do pool', () => {
    expect(EnemStore.getRandomDayId(() => 0)).toBe(1);
    expect(EnemStore.getRandomDayId(() => 0.999999)).toBe(EnemStore.getPoolSize());
    const id = EnemStore.getRandomDayId();
    expect(id).toBeGreaterThanOrEqual(1);
    expect(id).toBeLessThanOrEqual(EnemStore.getPoolSize());
  });

  it('busca pelo day_id', () => {
    const entry = EnemStore.getDay(1);
    expect(EnemStore.getById(1)).toEqual(entry);
    expect(EnemStore.getById(-1)).toBeNull();
  });
});

describe('GameModeStore', () => {
  it('sinaliza que antônimos e ENEM estão disponíveis', () => {
    expect(GameModeStore.hasAntonyms()).toBe(true);
    expect(GameModeStore.hasEnem()).toBe(true);
  });
});
