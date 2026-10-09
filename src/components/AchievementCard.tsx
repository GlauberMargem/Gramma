import type { Achievement } from '../domain/types';
import { MaterialIcon } from './MaterialIcon';

export function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  return (
    <div className={unlocked ? 'achievement-card' : 'achievement-card is-locked'}>
      <MaterialIcon name={achievement.icon} className="achievement-icon" />
      <span>
        <span className="achievement-name" style={{ display: 'block' }}>
          {achievement.name}
        </span>
        <span className="achievement-desc">{achievement.description}</span>
      </span>
    </div>
  );
}
