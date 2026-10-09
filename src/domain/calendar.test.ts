import { describe, expect, it } from 'vitest';
import {
  buildMonthCells,
  canNavigate,
  dateForDay,
  dayIdForDate,
  getCurrentDayId,
} from './calendar';

describe('getCurrentDayId', () => {
  it('17/07/2026 é o dia 1', () => {
    expect(getCurrentDayId(new Date(2026, 6, 17))).toBe(1);
  });

  it('ignora a hora do dia', () => {
    expect(getCurrentDayId(new Date(2026, 6, 18, 23, 59))).toBe(2);
  });

  it('antes de START faz clamp em 1', () => {
    expect(getCurrentDayId(new Date(2026, 0, 1))).toBe(1);
  });

  it('16/07/2027 é o dia 365', () => {
    expect(getCurrentDayId(new Date(2027, 6, 16))).toBe(365);
  });
});

describe('dateForDay / dayIdForDate', () => {
  it('são inversas e dia 1 é 17/07/2026', () => {
    const d = dateForDay(1);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 6, 17]);
    expect(dayIdForDate(dateForDay(100))).toBe(100);
  });

  it('dayIdForDate pode ser < 1', () => {
    expect(dayIdForDate(new Date(2026, 6, 16))).toBe(0);
  });
});

describe('buildMonthCells', () => {
  it('julho/2026 começa na quarta (1º/jul/2026), com 3 células nulas', () => {
    const cells = buildMonthCells(new Date(2026, 6, 1));
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toEqual({ dayOfMonth: 1, dayId: -15 });
    expect(cells).toHaveLength(3 + 31);
    expect(cells[3 + 16]).toEqual({ dayOfMonth: 17, dayId: 1 });
  });
});

describe('canNavigate', () => {
  it('mês do dia 1: sem anterior, com próximo', () => {
    expect(canNavigate(new Date(2026, 6, 1), 365)).toEqual({ prev: false, next: true });
  });

  it('mês do dia 365: com anterior, sem próximo', () => {
    expect(canNavigate(new Date(2027, 6, 1), 365)).toEqual({ prev: true, next: false });
  });

  it('meio do intervalo permite os dois', () => {
    expect(canNavigate(new Date(2026, 11, 1), 365)).toEqual({ prev: true, next: true });
    expect(canNavigate(new Date(2027, 0, 1), 365)).toEqual({ prev: true, next: true });
  });
});
