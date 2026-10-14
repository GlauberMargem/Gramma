import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { StatRow } from '../components/StatRow';
import { ACHIEVEMENTS } from '../domain/achievements';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useUserData } from '../state/hooks';

export function Stats() {
  const go = useAnimatedNavigate();
  const { stats } = useUserData();

  const rows: [string, string | number][] = [
    ['Pontuação total', `${stats.total_score} pts`],
    ['Desafios completados', stats.games_played],
    ['Ofensiva atual', `${stats.current_streak} dia(s)`],
    ['Maior ofensiva', `${stats.max_streak} dia(s)`],
    ['Acertos seguidos (Morfologia)', stats.morph_correct_streak],
    ['Recorde de acertos seguidos (Morfologia)', stats.morph_correct_streak_max],
    ['Acertos seguidos (Sintaxe)', stats.syntax_correct_streak],
    ['Recorde de acertos seguidos (Sintaxe)', stats.syntax_correct_streak_max],
    ['Acertos seguidos (Sinônimos)', stats.synonyms_correct_streak],
    ['Recorde de acertos seguidos (Sinônimos)', stats.synonyms_correct_streak_max],
    ['Total de acertos (Morfologia)', stats.total_correct_morph],
    ['Total de acertos (Sintaxe)', stats.total_correct_syntax],
    ['Total de acertos (Sinônimos)', stats.total_correct_synonyms],
    ['Conquistas desbloqueadas', `${stats.unlocked_achievements.length} / ${ACHIEVEMENTS.length}`],
  ];

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <h1 className="screen-title">
            <MaterialIcon name="query_stats" />
            Estatísticas
          </h1>
          <IconButton icon="close" label="Fechar" onClick={() => go('/modo')} />
        </header>
        <div className="stats-list">
          {rows.map(([label, value]) => (
            <StatRow key={label} label={label} value={value} />
          ))}
        </div>
      </section>
    </ScreenTransition>
  );
}
