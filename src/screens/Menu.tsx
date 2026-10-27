import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import type { StudyType } from '../domain/types';
import { useUserData } from '../state/hooks';
import { userStore } from '../state/userStore';

const STUDY_TYPES: { type: StudyType; icon: string; label: string }[] = [
  { type: 'morphology', icon: 'psychology', label: 'Morfologia' },
  { type: 'syntax', icon: 'account_tree', label: 'Sintaxe' },
  { type: 'synonyms', icon: 'sync_alt', label: 'Sinônimos' },
  { type: 'antonyms', icon: 'swap_horiz', label: 'Antônimos' },
  { type: 'random', icon: 'shuffle', label: 'Aleatório' },
  { type: 'enem', icon: 'school', label: 'ENEM' },
];

export function Menu() {
  const data = useUserData();
  const go = useAnimatedNavigate();
  const streak = data.stats.current_streak;

  const selectStudyType = (studyType: StudyType) => {
    userStore.update((d) => ({ ...d, settings: { ...d.settings, study_type: studyType } }));
    go('/modo');
  };

  return (
    <ScreenTransition className="game-container">
      <section className="menu-screen">
        <h1 className="menu-title">
          <MaterialIcon name="psychology" />
          GRAMMA
        </h1>
        <p className="menu-subtitle">Desafio Gramatical &amp; Sintático Diário</p>
        {streak > 0 && (
          <p className="streak-badge">
            <MaterialIcon name="local_fire_department" />
            <span>Ofensiva atual: {streak} dia(s)</span>
          </p>
        )}

        <div className="study-type-toggle">
          {STUDY_TYPES.map(({ type, icon, label }) => (
            <button
              key={type}
              type="button"
              className={data.settings.study_type === type ? 'study-type-btn is-active' : 'study-type-btn'}
              onClick={() => selectStudyType(type)}
            >
              <MaterialIcon name={icon} />
              {label}
            </button>
          ))}
        </div>

        <div className="secondary-actions">
          <button type="button" className="secondary-btn" onClick={() => go('/como-jogar')}>
            <MaterialIcon name="help" />
            Como Jogar
          </button>
          <button type="button" className="secondary-btn" onClick={() => go('/conquistas')}>
            <MaterialIcon name="emoji_events" />
            Conquistas
          </button>
        </div>
      </section>
    </ScreenTransition>
  );
}
