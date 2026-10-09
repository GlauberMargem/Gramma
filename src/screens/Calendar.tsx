import { useState } from 'react';
import { CalendarGrid } from '../components/CalendarGrid';
import type { DayStatus } from '../components/CalendarGrid';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { buildMonthCells, canNavigate, dateForDay, getCurrentDayId } from '../domain/calendar';
import { DataStore } from '../data/stores';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useUserData } from '../state/hooks';

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
];

function firstOfCurrentMonth(): Date {
  const date = dateForDay(getCurrentDayId());
  date.setDate(1);
  return date;
}

export function Calendar() {
  const go = useAnimatedNavigate();
  const { settings, history } = useUserData();
  const [viewDate, setViewDate] = useState(firstOfCurrentMonth);

  const totalDays = DataStore.getTotalDays();
  const currentDay = getCurrentDayId();
  const maxReachableDay = Math.min(currentDay, totalDays);
  const { prev, next } = canNavigate(viewDate, totalDays);

  const getStatus = (dayId: number): DayStatus => {
    if (dayId < 1 || dayId > maxReachableDay) return 'future';
    const entry = history[`${dayId}:${settings.study_type}`];
    if (!entry) return 'available';
    return entry.correct ? 'won' : 'lost';
  };

  const changeMonth = (offset: number) =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + offset, 1));

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <p className="screen-title">
            <MaterialIcon name="calendar_month" />
            Arquivo
          </p>
          <IconButton icon="close" label="Fechar" onClick={() => go('/modo')} />
        </header>

        <p className="calendar-note">Dias arquivados não alteram sua ofensiva atual.</p>

        <div className="calendar-month-nav">
          <IconButton icon="chevron_left" label="Mês anterior" disabled={!prev} onClick={() => changeMonth(-1)} />
          <span className="calendar-month-label">{`${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}</span>
          <IconButton icon="chevron_right" label="Próximo mês" disabled={!next} onClick={() => changeMonth(1)} />
        </div>

        <div className="calendar-weekdays">
          <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
        </div>

        <CalendarGrid
          cells={buildMonthCells(viewDate)}
          todayDayId={currentDay}
          getStatus={getStatus}
          onSelectDay={(dayId) => go(`/jogo/${dayId}`)}
        />

        <div className="calendar-legend">
          <span className="legend-item"><span className="legend-swatch status-won"></span> Ganhou</span>
          <span className="legend-item"><span className="legend-swatch status-lost"></span> Perdeu</span>
          <span className="legend-item"><span className="legend-swatch status-available"></span> Disponível</span>
        </div>
      </section>
    </ScreenTransition>
  );
}
