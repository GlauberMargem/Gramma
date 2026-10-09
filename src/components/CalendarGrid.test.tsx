import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CalendarGrid } from './CalendarGrid';
import type { DayStatus } from './CalendarGrid';

const cells = [null, { dayOfMonth: 1, dayId: 1 }, { dayOfMonth: 2, dayId: 2 }, { dayOfMonth: 3, dayId: 3 }, { dayOfMonth: 4, dayId: 4 }];
const statuses: Record<number, DayStatus> = { 1: 'won', 2: 'lost', 3: 'available', 4: 'future' };

function setup() {
  const onSelectDay = vi.fn();
  const { container } = render(
    <CalendarGrid cells={cells} todayDayId={3} getStatus={(id) => statuses[id]} onSelectDay={onSelectDay} />,
  );
  return { onSelectDay, container };
}

describe('CalendarGrid', () => {
  it('aplica a classe de status em cada dia', () => {
    setup();
    expect(screen.getByRole('button', { name: '1' })).toHaveClass('status-won');
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('status-lost');
    expect(screen.getByRole('button', { name: '3' })).toHaveClass('status-available');
    expect(screen.getByRole('button', { name: '4' })).toHaveClass('status-future');
  });

  it('renderiza células vazias antes do dia 1', () => {
    const { container } = setup();
    expect(container.querySelectorAll('.calendar-day.is-empty')).toHaveLength(1);
  });

  it('marca somente hoje com is-today', () => {
    const { container } = setup();
    expect(screen.getByRole('button', { name: '3' })).toHaveClass('is-today');
    expect(container.querySelectorAll('.is-today')).toHaveLength(1);
  });

  it('desabilita dias futuros e não dispara clique', async () => {
    const { onSelectDay } = setup();
    const future = screen.getByRole('button', { name: '4' });
    expect(future).toBeDisabled();
    await userEvent.click(future);
    expect(onSelectDay).not.toHaveBeenCalled();
  });

  it('chama onSelectDay com o dayId ao clicar em dia liberado', async () => {
    const { onSelectDay } = setup();
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onSelectDay).toHaveBeenCalledWith(2);
  });
});
