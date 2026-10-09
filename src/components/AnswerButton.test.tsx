import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerButton } from './AnswerButton';

describe('AnswerButton', () => {
  it('idle: letra e texto, sem ícone nem classes de resultado', () => {
    render(<AnswerButton letter="A" text="casa" onSelect={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('answer-btn');
    expect(btn).not.toHaveClass('is-correct');
    expect(btn).not.toHaveClass('is-wrong');
    expect(btn).toHaveTextContent('Acasa');
    expect(btn.querySelector('.result-icon')).toBeNull();
  });

  it('correct: is-correct e ícone check_circle', () => {
    render(<AnswerButton letter="B" text="x" state="correct" disabled onSelect={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('is-correct');
    expect(btn.querySelector('.result-icon')).toHaveTextContent('check_circle');
    expect(btn).toBeDisabled();
  });

  it('wrong: is-wrong e ícone cancel', () => {
    render(<AnswerButton letter="C" text="x" state="wrong" onSelect={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('is-wrong');
    expect(btn.querySelector('.result-icon')).toHaveTextContent('cancel');
  });

  it('chama onSelect no clique e não quando desabilitado', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<AnswerButton letter="A" text="x" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    rerender(<AnswerButton letter="A" text="x" disabled onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
