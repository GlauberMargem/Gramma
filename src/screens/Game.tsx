import { useState } from 'react';
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

const LETTERS = ['A', 'B', 'C', 'D'];

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

  const stateOf = (option: string): AnswerState => {
    if (selected === null) return 'idle';
    if (option === question.answer) return 'correct';
    return option === selected ? 'wrong' : 'idle';
  };

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <span className="day-counter">{badge}</span>
          <IconButton icon="close" label="Fechar" onClick={() => go('/modo')} />
        </header>

        <div className="question-card">
          <MaterialIcon name="quiz" className="icon-question" />
          <p className="sentence">
            {question.prompt.map((part, i) => (part.highlight ? <span key={i}>{part.text}</span> : part.text))}
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

        <div className="answers-grid">
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
