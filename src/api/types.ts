// Contratos espelhados dos schemas do backend (backend/app/models.py).

import type { HistoryEntry, Stats, StudyType } from '../domain/types';

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserPublic {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  full_name: string | null;
  created_at: string | null;
}

export interface Message {
  message: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name?: string;
}

/** Snapshot do progresso em `GET/PUT /me/progress` (history em lista). */
export interface ProgressDTO {
  stats: Stats;
  history: HistoryEntry[];
}

export type RankingPeriod = 'daily' | 'weekly' | 'monthly';

export interface RankingEntry {
  rank: number;
  display_name: string;
  score: number;
  streak: number;
  is_me: boolean;
}

/** Resposta de `GET /ranking/`; `me` vem só com token e se o usuário pontuou. */
export interface RankingDTO {
  period: RankingPeriod;
  study_type: StudyType | null;
  start_date: string;
  end_date: string;
  entries: RankingEntry[];
  me: RankingEntry | null;
}
