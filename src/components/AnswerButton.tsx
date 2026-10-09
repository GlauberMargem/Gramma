export type AnswerState = 'idle' | 'correct' | 'wrong';

interface AnswerButtonProps {
  letter: string;
  text: string;
  state?: AnswerState;
  disabled?: boolean;
  onSelect: () => void;
}

export function AnswerButton({ letter, text, state = 'idle', disabled = false, onSelect }: AnswerButtonProps) {
  const className = state === 'idle' ? 'answer-btn' : `answer-btn is-${state}`;
  return (
    <button type="button" className={className} disabled={disabled} onClick={onSelect}>
      <span className="option-letter">{letter}</span>
      <span>{text}</span>
      {state !== 'idle' && (
        <span className="material-symbols-outlined result-icon" aria-hidden="true">
          {state === 'correct' ? 'check_circle' : 'cancel'}
        </span>
      )}
    </button>
  );
}
