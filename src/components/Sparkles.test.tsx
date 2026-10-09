import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkles } from './Sparkles';

describe('Sparkles', () => {
  it('renderiza 16 sparkles aria-hidden com ícones rotativos', () => {
    const { container } = render(<Sparkles />);
    const items = container.querySelectorAll('.sparkle');
    expect(items).toHaveLength(16);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect([...items].slice(0, 4).map((e) => e.textContent)).toEqual(['auto_awesome', 'star', 'stars', 'auto_awesome']);
  });

  it('respeita count e rng injetado, e não muda no re-render', () => {
    const { container, rerender } = render(<Sparkles count={3} rng={() => 0.5} />);
    const first = container.querySelectorAll<HTMLElement>('.sparkle');
    expect(first).toHaveLength(3);
    expect(first[0].style.left).toBe('50%');
    expect(first[0].style.animationDelay).toBe('0.2s');
    rerender(<Sparkles count={3} rng={() => 0.1} />);
    expect(container.querySelector<HTMLElement>('.sparkle')?.style.left).toBe('50%');
  });
});
