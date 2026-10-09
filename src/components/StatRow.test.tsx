import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatRow } from './StatRow';

describe('StatRow', () => {
  it('renderiza rótulo e valor com as classes do legado', () => {
    const { container } = render(<StatRow label="Pontuação total" value="10 pts" />);
    expect(container.querySelector('.stat-row')).not.toBeNull();
    expect(screen.getByText('Pontuação total')).toHaveClass('label');
    expect(screen.getByText('10 pts')).toBeInTheDocument();
  });

  it('aceita número como valor', () => {
    render(<StatRow label="Desafios completados" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
