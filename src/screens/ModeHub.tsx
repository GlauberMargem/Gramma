import { MaterialIcon } from '../components/MaterialIcon';
import { IconButton } from '../components/IconButton';
import { ScreenTransition } from '../components/ScreenTransition';
import { getCurrentDayId } from '../domain/calendar';
import type { StudyType } from '../domain/types';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useUserData } from '../state/hooks';

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
};

const STUDY_TYPE_ICON: Record<StudyType, string> = {
  morphology: 'psychology',
  syntax: 'account_tree',
  synonyms: 'sync_alt',
};

export function ModeHub() {
  const go = useAnimatedNavigate();
  const { settings, history } = useUserData();
  const studyType = settings.study_type;
  const day = getCurrentDayId();
  const alreadyPlayed = Boolean(history[`${day}:${studyType}`]);

  return (
    <ScreenTransition className="game-container">
      <section className="mode-hub-screen">
        <header className="header">
          <span className="day-counter">{`DIA ${day}`}</span>
          <IconButton icon="close" label="Trocar modo" onClick={() => go('/')} />
        </header>

        <MaterialIcon name={STUDY_TYPE_ICON[studyType]} className="mode-hub-icon" />
        <h1 className="mode-hub-title">{STUDY_TYPE_LABEL[studyType]}</h1>

        <button type="button" className="cta-btn" onClick={() => go(`/jogo/${day}`)}>
          <MaterialIcon name={alreadyPlayed ? 'check_circle' : 'play_arrow'} />
          <span>{alreadyPlayed ? 'VER RESULTADO' : `JOGAR DIA ${day}`}</span>
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
