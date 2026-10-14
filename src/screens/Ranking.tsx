import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getRanking } from '../api/ranking';
import type { RankingDTO, RankingPeriod } from '../api/types';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { RankRow } from '../components/RankRow';
import { ScreenTransition } from '../components/ScreenTransition';
import type { StudyType } from '../domain/types';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useAuth } from '../state/authStore';

const PERIODS: { period: RankingPeriod; label: string }[] = [
  { period: 'daily', label: 'Hoje' },
  { period: 'weekly', label: '7 dias' },
  { period: 'monthly', label: '30 dias' },
];

const MODES: { value: StudyType | ''; label: string }[] = [
  { value: '', label: 'Todos os modos' },
  { value: 'morphology', label: 'Morfologia' },
  { value: 'syntax', label: 'Sintaxe' },
  { value: 'synonyms', label: 'Sinônimos' },
];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ranking: RankingDTO };

/** Resultado da última consulta, marcado com a chave que o gerou. */
type Loaded = { key: string } & Exclude<LoadState, { status: 'loading' }>;

export function Ranking() {
  const go = useAnimatedNavigate();
  const { status: authStatus, token } = useAuth();
  const [period, setPeriod] = useState<RankingPeriod>('daily');
  const [studyType, setStudyType] = useState<StudyType | ''>('');
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // Enquanto a consulta atual não responde, a tela fica em "carregando".
  const key = `${period}|${studyType}|${token ?? ''}|${attempt}`;
  const state: LoadState = loaded?.key === key ? loaded : { status: 'loading' };

  useEffect(() => {
    const controller = new AbortController();
    getRanking({ period, studyType: studyType || null }, token, controller.signal)
      .then((ranking) => setLoaded({ key, status: 'ready', ranking }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof ApiError ? err.message : 'Não foi possível carregar o ranking.';
        setLoaded({ key, status: 'error', message });
      });
    return () => controller.abort();
  }, [key, period, studyType, token]);

  const ranking = state.status === 'ready' ? state.ranking : null;
  const meOutsideList = ranking?.me && !ranking.entries.some((e) => e.is_me) ? ranking.me : null;

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <h1 className="screen-title">
            <MaterialIcon name="leaderboard" />
            Ranking
          </h1>
          <IconButton icon="close" label="Fechar" onClick={() => go('/')} />
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Período do ranking">
          {PERIODS.map(({ period: value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={period === value}
              className={period === value ? 'auth-tab is-active' : 'auth-tab'}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="form-field ranking-filter">
          <span className="form-label">Modo</span>
          <select
            className="form-input"
            value={studyType}
            onChange={(e) => setStudyType(e.target.value as StudyType | '')}
          >
            {MODES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {state.status === 'loading' && (
          <p className="auth-hint" role="status">
            Carregando ranking…
          </p>
        )}

        {state.status === 'error' && (
          <div className="ranking-feedback">
            <p className="auth-error" role="alert">
              <MaterialIcon name="cloud_off" />
              {state.message}
            </p>
            <button type="button" className="secondary-btn" onClick={() => setAttempt((n) => n + 1)}>
              <MaterialIcon name="refresh" />
              Tentar de novo
            </button>
          </div>
        )}

        {ranking && ranking.entries.length === 0 && (
          <p className="auth-hint" role="status">
            Ninguém pontuou neste período ainda. Jogue o desafio de hoje e seja o primeiro!
          </p>
        )}

        {ranking && ranking.entries.length > 0 && (
          <ol className="ranking-list" aria-label="Classificação">
            {ranking.entries.map((entry, index) => (
              <RankRow key={index} entry={entry} />
            ))}
          </ol>
        )}

        {meOutsideList && (
          <ol className="ranking-list ranking-me" aria-label="Sua posição">
            <RankRow entry={meOutsideList} />
          </ol>
        )}

        {authStatus !== 'authenticated' && (
          <button type="button" className="auth-link-btn" onClick={() => go('/entrar')}>
            Entre na sua conta para aparecer no ranking
          </button>
        )}

        <p className="auth-hint">Dias jogados pelo calendário (arquivo) não contam pontos no ranking.</p>
      </section>
    </ScreenTransition>
  );
}
