import type { MonthCell } from '../domain/calendar';

export type DayStatus = 'won' | 'lost' | 'available' | 'future';

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
        if (!cell) return <button key={`empty-${index}`} type="button" className="calendar-day is-empty" />;

        const status = getStatus(cell.dayId);
        const classes = ['calendar-day', `status-${status}`];
        if (cell.dayId === todayDayId) classes.push('is-today');

        return (
          <button
            key={cell.dayId}
            type="button"
            className={classes.join(' ')}
            disabled={status === 'future'}
            onClick={() => onSelectDay(cell.dayId)}
          >
            {cell.dayOfMonth}
          </button>
        );
      })}
    </div>
  );
}
