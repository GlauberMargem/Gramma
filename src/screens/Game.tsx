import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AnswerButton } from '../components/AnswerButton';
import type { AnswerState } from '../components/AnswerButton';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { getCurrentDayId } from '../domain/calendar';
import { resolveDay } from '../domain/game';
import type { StudyType } from '../domain/types';
import { DataStore } from '../data/stores';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useSpeech } from '../hooks/useSpeech';
import { useUserData } from '../state/hooks';
import { userStore } from '../state/userStore';
import { useQuestionSession } from './useQuestionSession';

const PHASE_LABEL: Record<StudyType, string> = {
  morphology: 'MORFOLOGIA — CLASSE GRAMATICAL',
  syntax: 'SINTAXE — FUNÇÃO SINTÁTICA',
  synonyms: 'SINÔNIMOS — ESCOLHA O EQUIVALENTE',
};

const PHASE_TITLE: Record<StudyType, string> = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
};

const LETTERS = ['A', 'B', 'C', 'D'];

/** Índice da alternativa para a tecla (A–D ou 1–4), ou null. */
export function keyToOption(key: string): number | null {
  const letter = LETTERS.indexOf(key.toUpperCase());
  if (letter >= 0) return letter;
  const digit = Number(key);
  return Number.isInteger(digit) && digit >= 1 && digit <= LETTERS.length ? digit - 1 : null;
}

interface SessionProps {
  dayId: number;
  type: StudyType;
  isArchive: boolean;
}

function GameSession({ dayId, type, isArchive }: SessionProps) {
  const go = useAnimatedNavigate();
  const { question, selected, select } = useQuestionSession({ dayId, type, isArchive });
  const { supported, speak } = useSpeech(question.prompt.map((part) => part.text).join(''));
  const badge = isArchive ? `DIA ${dayId} (ARQUIVO)` : `DIA ${dayId} / ${DataStore.getTotalDays()}`;

  // Atalhos: A–D ou 1–4 escolhem a alternativa (sem modificadores).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const index = keyToOption(event.key);
      const option = index === null ? undefined : question.options[index];
      if (option === undefined) return;
      event.preventDefault();
      select(option);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [question.options, select]);

  const announcement =
    selected === null
      ? ''
      : selected === question.answer
        ? 'Resposta certa!'
        : `Resposta errada. A resposta certa é ${question.answer}.`;

  const stateOf = (option: string): AnswerState => {
    if (selected === null) return 'idle';
    if (option === question.answer) return 'correct';
    return option === selected ? 'wrong' : 'idle';
  };

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <h1 className="sr-only">{`${PHASE_TITLE[type]}, dia ${dayId}${isArchive ? ', arquivo' : ''}`}</h1>
        <header className="header">
          <span className="day-counter">{badge}</span>
          <IconButton icon="close" label="Fechar" onClick={() => go('/modo')} />
        </header>

        <div className="question-card">
          <MaterialIcon name="quiz" className="icon-question" />
          <p className="sentence">
            {question.prompt.map((part, i) =>
              part.highlight ? (
                <mark key={i} className="target-word">
                  {part.text}
                  <span className="sr-only"> (palavra destacada)</span>
                </mark>
              ) : (
                part.text
              ),
            )}
          </p>
          <IconButton
            icon="volume_up"
            label="Ouvir a frase em voz alta"
            className="listen-btn"
            onClick={speak}
            disabled={!supported}
            title={supported ? undefined : 'Leitura em voz alta não é suportada neste navegador'}
          />
        </div>

        <p className="phase-label">{PHASE_LABEL[type]}</p>

        <p className="keyboard-hint" id="keyboard-hint">
          Atalhos: teclas A a D ou 1 a 4
        </p>

        <div className="answers-grid" aria-describedby="keyboard-hint">
          {question.options.map((option, i) => (
            <AnswerButton
              key={option}
              letter={LETTERS[i]}
              text={option}
              state={stateOf(option)}
              disabled={selected !== null}
              onSelect={() => select(option)}
            />
          ))}
        </div>
        <p className="sr-only" role="alert">
          {announcement}
        </p>
      </section>
    </ScreenTransition>
  );
}

/**
 * A decisão de redirecionar é tomada uma vez, na montagem: depois que o jogador
 * responde e o resultado é gravado, a sessão já montada não deve se redirecionar
 * (a navegação para /fim com state é do hook).
 */
function GameDay({ dayId, type, isArchive }: SessionProps) {
  const [alreadyPlayed] = useState(() => !isArchive && userStore.getSnapshot().history[`${dayId}:${type}`] !== undefined);
  if (alreadyPlayed) return <Navigate to={`/fim/${dayId}`} replace />;
  return <GameSession dayId={dayId} type={type} isArchive={isArchive} />;
}

export function Game() {
  const { dia } = useParams();
  const { settings } = useUserData();
  const requested = Number(dia);

  if (!Number.isInteger(requested) || requested < 1) return <Navigate to="/" replace />;
  const { dayId, isArchive } = resolveDay(requested, getCurrentDayId(), DataStore.getTotalDays());

  return (
    <GameDay key={`${dayId}-${settings.study_type}`} dayId={dayId} type={settings.study_type} isArchive={isArchive} />
  );
}
