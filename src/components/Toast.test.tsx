import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('mostra a mensagem em região de status polida', () => {
    render(<Toast message="Olá" onDismiss={() => {}} />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Olá');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('chama onDismiss após a duração', () => {
    const onDismiss = vi.fn();
    render(<Toast message="x" onDismiss={onDismiss} durationMs={1000} />);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
