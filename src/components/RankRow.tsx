import type { RankingEntry } from '../api/types';
import { MaterialIcon } from './MaterialIcon';

export function RankRow({ entry }: { entry: RankingEntry }) {
  return (
    <li className={entry.is_me ? 'rank-row is-me' : 'rank-row'} aria-current={entry.is_me ? 'true' : undefined}>
      <span className="rank-position">
        {entry.rank}º<span className="sr-only"> lugar:</span>
      </span>
      <span className="rank-name">
        {entry.display_name}
        {entry.is_me && <span className="rank-me-tag"> (você)</span>}
      </span>
      {entry.streak > 0 && (
        <span className="rank-streak">
          <MaterialIcon name="local_fire_department" />
          {entry.streak}
          <span className="sr-only"> dia(s) de ofensiva,</span>
        </span>
      )}
      <span className="rank-score">{entry.score} pts</span>
    </li>
  );
}
