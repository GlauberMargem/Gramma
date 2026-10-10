// Cliente HTTP tipado para o backend FastAPI.
//
// A URL base vem de `VITE_API_URL`. Em desenvolvimento ela pode ficar vazia:
// o Vite faz proxy de `/api` para o backend (veja `vite.config.ts`). Em
// produção, aponte `VITE_API_URL` para a origem publicada do backend.

const API_PREFIX = '/api/v1';

function baseUrl(): string {
  const raw = import.meta.env.VITE_API_URL ?? '';
  return raw.replace(/\/+$/, '');
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  json?: unknown;
  form?: URLSearchParams;
  token?: string | null;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (isRecord(data)) {
      const detail = data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const first = detail[0];
        if (isRecord(first) && typeof first.msg === 'string') return first.msg;
      }
    }
  } catch {
    // Resposta sem corpo JSON: cai na mensagem genérica.
  }
  return `Erro ${res.status}`;
}

/** Faz uma requisição à API e devolve o corpo tipado, ou lança `ApiError`. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', json, form, token, signal } = options;
  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = form.toString();
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${API_PREFIX}${path}`, { method, headers, body, signal });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res));
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}
