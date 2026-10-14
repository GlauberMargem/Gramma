import type { MonthCell } from '../domain/calendar';

export type DayStatus = 'won' | 'lost' | 'available' | 'future';

// A cor do dia não chega ao leitor de tela: a situação vai no nome do botão.
const STATUS_LABEL: Record<DayStatus, string> = {
  won: 'acertou',
  lost: 'errou',
  available: 'disponível',
  future: 'ainda bloqueado',
};

interface CalendarGridProps {
  cells: (MonthCell | null)[];
  todayDayId: number;
  getStatus: (dayId: number) => DayStatus;
  onSelectDay: (dayId: number) => void;
}

export function CalendarGrid({ cells, todayDayId, getStatus, onSelectDay }: CalendarGridProps) {
  return (
    <div id="calendar-grid" className="calendar-grid">
      {cells.map((cell, index) => {
        if (!cell) return <div key={`empty-${index}`} className="calendar-day is-empty" aria-hidden="true" />;

        const status = getStatus(cell.dayId);
        const classes = ['calendar-day', `status-${status}`];
        if (cell.dayId === todayDayId) classes.push('is-today');

        return (
          <button
            key={cell.dayId}
            type="button"
            className={classes.join(' ')}
            disabled={status === 'future'}
            aria-label={`${cell.dayOfMonth}, ${STATUS_LABEL[status]}${cell.dayId === todayDayId ? ', hoje' : ''}`}
            onClick={() => onSelectDay(cell.dayId)}
          >
            {cell.dayOfMonth}
          </button>
        );
      })}
    </div>
  );
}
