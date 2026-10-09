import type { Achievement } from '../domain/types';

/** Aviso de conquista nova na tela de resultado (paridade com `buildAchievementToast`). */
export function AchievementToast({ achievement }: { achievement: Achievement }) {
  return (
    <div className="achievement-toast" role="status">
      <span className="achievement-icon material-symbols-outlined" aria-hidden="true">
        {achievement.icon}
      </span>
      <span>
        <span className="achievement-name" style={{ display: 'block' }}>
          Conquista: {achievement.name}
        </span>
        <span className="achievement-desc">{achievement.description}</span>
      </span>
    </div>
  );
}
