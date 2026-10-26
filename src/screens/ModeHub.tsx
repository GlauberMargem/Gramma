import { MaterialIcon } from '../components/MaterialIcon';
import { IconButton } from '../components/IconButton';
import { ScreenTransition } from '../components/ScreenTransition';
import { getCurrentDayId } from '../domain/calendar';
import type { StudyType } from '../domain/types';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useUserData } from '../state/hooks';
import { DataStore, EnemStore, GameModeStore } from '../data/stores';

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
  antonyms: 'Antônimos',
  enem: 'ENEM',
  random: 'Aleatório',
};

const STUDY_TYPE_ICON: Record<StudyType, string> = {
  morphology: 'psychology',
  syntax: 'account_tree',
  synonyms: 'sync_alt',
  antonyms: 'swap_horiz',
  enem: 'school',
  random: 'shuffle',
};

export function ModeHub() {
  const go = useAnimatedNavigate();
  const { settings, history } = useUserData();
  const studyType = settings.study_type;
  const day = getCurrentDayId();
  const isDaily = studyType !== 'enem' && studyType !== 'random';
  const alreadyPlayed = isDaily ? Boolean(history[`${day}:${studyType}`]) : false;

  const hasAntonyms = GameModeStore.hasAntonyms();
  const hasEnem = GameModeStore.hasEnem();

  const canPlay = () => {
    if (studyType === 'antonyms' && !hasAntonyms) return false;
    if (studyType === 'enem' && !hasEnem) return false;
    return true;
  };

  const playLabel = () => {
    if (!canPlay()) return 'EM BREVE';
    if (studyType === 'enem') return 'JOGAR ENEM (LIVRE)';
    if (studyType === 'random') return 'JOGAR ALEATÓRIO';
    if (alreadyPlayed) return 'VER RESULTADO';
    return `JOGAR DIA ${day}`;
  };

  const playIcon = () => {
    if (!canPlay()) return 'hourglass_empty';
    if (studyType === 'enem' || studyType === 'random') return 'play_arrow';
    return alreadyPlayed ? 'check_circle' : 'play_arrow';
  };

  const handlePlay = () => {
    if (!canPlay()) return;
    if (studyType === 'enem') {
      go(`/jogo/enem-${EnemStore.getRandomDayId()}`);
      return;
    }
    if (studyType === 'random') {
      const id = Math.floor(Math.random() * DataStore.getTotalDays()) + 1;
      go(`/jogo/random-${id}`);
      return;
    }
    go(`/jogo/${day}`);
  };

  return (
    <ScreenTransition className="game-container">
      <section className="mode-hub-screen">
        <header className="header">
          <span className="day-counter">{isDaily ? `DIA ${day}` : studyType === 'enem' ? 'MODO LIVRE' : 'MODO MISTO'}</span>
          <IconButton icon="close" label="Trocar modo" onClick={() => go('/')} />
        </header>

        <MaterialIcon name={STUDY_TYPE_ICON[studyType]} className="mode-hub-icon" />
        <p className="mode-hub-title">{STUDY_TYPE_LABEL[studyType]}</p>

        <button type="button" className="cta-btn" disabled={!canPlay()} onClick={handlePlay}>
          <MaterialIcon name={playIcon()} />
          <span>{playLabel()}</span>
        </button>
        <div className="secondary-actions">
          <button type="button" className="secondary-btn" onClick={() => go('/calendario')}>
            <MaterialIcon name="calendar_month" />
            Dias anteriores
          </button>
          <button type="button" className="secondary-btn" onClick={() => go('/estatisticas')}>
            <MaterialIcon name="query_stats" />
            Estatísticas
          </button>
        </div>
      </section>
    </ScreenTransition>
  );
}
