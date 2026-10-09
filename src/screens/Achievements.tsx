import { AchievementCard } from '../components/AchievementCard';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { ACHIEVEMENTS } from '../domain/achievements';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useUserData } from '../state/hooks';

export function Achievements() {
  const navigate = useAnimatedNavigate();
  const unlocked = new Set(useUserData().stats.unlocked_achievements);

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <p className="screen-title">
            <MaterialIcon name="emoji_events" />
            Conquistas
          </p>
          <IconButton icon="close" label="Fechar" onClick={() => navigate('/')} />
        </header>
        <div className="achievements-list">
          {ACHIEVEMENTS.map((a) => (
            <AchievementCard key={a.id} achievement={a} unlocked={unlocked.has(a.id)} />
          ))}
        </div>
      </section>
    </ScreenTransition>
  );
}
