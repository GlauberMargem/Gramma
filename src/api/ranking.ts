import { apiRequest } from './client';
import type { RankingDTO, RankingPeriod } from './types';
import type { StudyType } from '../domain/types';

export interface RankingQuery {
  period: RankingPeriod;
  studyType: StudyType | null;
  limit?: number;
}

/** Ranking público; com token, o backend marca a linha do usuário (`is_me`/`me`). */
export function getRanking(
  { period, studyType, limit = 50 }: RankingQuery,
  token: string | null,
  signal?: AbortSignal,
): Promise<RankingDTO> {
  const params = new URLSearchParams({ period, limit: String(limit) });
  if (studyType) params.set('study_type', studyType);
  return apiRequest<RankingDTO>(`/ranking/?${params.toString()}`, { token, signal });
}
