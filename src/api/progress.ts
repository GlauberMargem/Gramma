import { apiRequest } from './client';
import type { ProgressDTO } from './types';

/** Progresso salvo na conta do usuário logado. */
export function getProgress(token: string): Promise<ProgressDTO> {
  return apiRequest<ProgressDTO>('/me/progress', { token });
}

/** Grava o snapshot do progresso (idempotente no backend). */
export function putProgress(token: string, progress: ProgressDTO): Promise<void> {
  return apiRequest<void>('/me/progress', { method: 'PUT', json: progress, token });
}
