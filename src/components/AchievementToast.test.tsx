import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getAchievement } from '../domain/achievements';
import { AchievementToast } from './AchievementToast';

describe('AchievementToast', () => {
  it('mostra nome e descrição da conquista', () => {
    const a = getAchievement('first_step');
    if (!a) throw new Error('conquista ausente');
    render(<AchievementToast achievement={a} />);
    expect(screen.getByText('Conquista: Primeiro Passo')).toBeInTheDocument();
    expect(screen.getByText('Complete seu primeiro desafio.')).toBeInTheDocument();
    expect(screen.getByText('flag')).toHaveAttribute('aria-hidden', 'true');
  });
});
