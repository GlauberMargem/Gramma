import { useCallback, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { AchievementToast } from '../components/AchievementToast';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { Sparkles } from '../components/Sparkles';
import { Toast } from '../components/Toast';
import { getAchievement } from '../domain/achievements';
import { shareResult } from '../domain/share';
import type { Achievement, HistoryEntry, StudyType } from '../domain/types';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useUserData } from '../state/hooks';

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
};

export function End() {
  const { dia } = useParams();
  const location = useLocation();
  const navigate = useAnimatedNavigate();
  const { settings, history } = useUserData();

  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const studyType = settings.study_type;
  const entry = history[`${Number(dia)}:${studyType}`];
  if (!entry) return <Navigate to="/" replace />;

  const state = location.state as { newlyUnlocked?: string[] } | null;
  const newlyUnlocked = state?.newlyUnlocked ?? [];
  const achievements = newlyUnlocked
    .map((id) => getAchievement(id))
    .filter((a): a is Achievement => a !== null);
  const label = STUDY_TYPE_LABEL[entry.study_type];

  async function share(e: HistoryEntry) {
    const text = shareResult(e);
    try {
      await navigator.clipboard.writeText(text);
      setToast('Resultado copiado para a área de transferência!');
    } catch {
      // clipboard ausente (undefined) também cai aqui via TypeError
      setToast(text);
    }
  }

  return (
    <ScreenTransition className="game-container">
      <section className={`end-screen${entry.is_milestone ? ' is-perfect' : ''}`}>
        {(entry.is_milestone || newlyUnlocked.length > 0) && <Sparkles />}
        <h1 className="screen-title">{entry.correct ? 'Resposta certa!' : 'Não foi dessa vez'}</h1>
        <h2 className="score-total" aria-live="polite">{entry.points} pts</h2>
        <div className="score-breakdown">
          <div className="row">
            <span>{label}</span>
            <span>{entry.base} pts</span>
          </div>
          {entry.bonus > 0 && (
            <div className="row bonus">
              <span>Bônus de sequência (+10%)</span>
              <span>+{entry.bonus} pts</span>
            </div>
          )}
        </div>
        {entry.correct && entry.streak_after > 0 && (
          <p className="streak-line">
            <MaterialIcon name="local_fire_department" /> {entry.streak_after} acerto(s) seguido(s) em {label}
          </p>
        )}
        <div className="new-achievements">
          {achievements.map((a) => (
            <AchievementToast key={a.id} achievement={a} />
          ))}
        </div>
        {toast && <Toast message={toast} onDismiss={dismissToast} />}
        <div className="secondary-actions">
          <button type="button" className="secondary-btn" onClick={() => void share(entry)}>
            <MaterialIcon name="share" />
            Compartilhar
          </button>
          <button type="button" className="secondary-btn" onClick={() => navigate('/modo')}>
            <MaterialIcon name="home" />
            Menu
          </button>
        </div>
      </section>
    </ScreenTransition>
  );
}
