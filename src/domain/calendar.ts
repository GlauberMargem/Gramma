// 17 de julho de 2026. Data local, sem hora, para casar com a grade do calendário.
const START_DATE = new Date(2026, 6, 17);
const DAY_MS = 1000 * 60 * 60 * 24;

export interface MonthCell {
  dayOfMonth: number;
  dayId: number;
}

function dateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getCurrentDayId(now: Date = new Date()): number {
  const diffDays = Math.round((dateOnly(now).getTime() - START_DATE.getTime()) / DAY_MS);
  return Math.max(1, diffDays + 1);
}

/** Converte um day_id (1-based) na data de calendário correspondente. */
export function dateForDay(dayId: number): Date {
  const date = new Date(START_DATE);
  date.setDate(date.getDate() + (dayId - 1));
  return date;
}

/** Converte uma data no day_id correspondente (pode ser < 1 ou > total). */
export function dayIdForDate(date: Date): number {
  const diffDays = Math.round((dateOnly(date).getTime() - START_DATE.getTime()) / DAY_MS);
  return diffDays + 1;
}

export function buildMonthCells(viewDate: Date): (MonthCell | null)[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (MonthCell | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
    cells.push({ dayOfMonth, dayId: dayIdForDate(new Date(year, month, dayOfMonth)) });
  }
  return cells;
}

// Mesma regra do legado (comparação ano/mês separada), mantida por paridade.
export function canNavigate(
  viewDate: Date,
  totalDays: number,
): { prev: boolean; next: boolean } {
  const firstMonth = dateForDay(1);
  const lastMonth = dateForDay(totalDays);
  const prev =
    viewDate.getFullYear() > firstMonth.getFullYear() ||
    viewDate.getMonth() > firstMonth.getMonth();
  const next =
    viewDate.getFullYear() < lastMonth.getFullYear() ||
    viewDate.getMonth() < lastMonth.getMonth();
  return { prev, next };
}
