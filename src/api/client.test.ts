import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockFetch = vi.fn();

function lastCall(): [string, RequestInit] {
  return mockFetch.mock.calls[0] as [string, RequestInit];
}

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    mockFetch.mockReset();
  });

  it('faz GET e devolve o JSON tipado', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({ message: 'ok' }));

    const result = await apiRequest<{ message: string }>('/utils/health-check/');

    expect(result).toEqual({ message: 'ok' });
    const [url, init] = lastCall();
    expect(url).toBe('/api/v1/utils/health-check/');
    expect(init.method).toBe('GET');
  });

  it('usa VITE_API_URL como prefixo quando definida', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({}));

    await apiRequest('/users/me', { token: 'abc' });

    const [url] = lastCall();
    expect(url).toBe('https://api.example.com/api/v1/users/me');
  });

  it('envia o header Authorization quando há token', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({}));

    await apiRequest('/users/me', { token: 'secret' });

    const [, init] = lastCall();
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret');
  });

  it('serializa corpo JSON', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({}));

    await apiRequest('/users/signup', { method: 'POST', json: { email: 'a@b.com' } });

    const [, init] = lastCall();
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ email: 'a@b.com' }));
  });

  it('serializa corpo de formulário (login OAuth2)', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({ access_token: 't' }));

    await apiRequest('/login/access-token', {
      method: 'POST',
      form: new URLSearchParams({ username: 'a@b.com', password: 'segredo' }),
    });

    const [, init] = lastCall();
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(init.body).toBe('username=a%40b.com&password=segredo');
  });

  it('lança ApiError com o status e o detail do backend', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({ detail: 'Incorrect email or password' }, 400));

    await expect(apiRequest('/login/access-token', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Incorrect email or password',
    });
  });

  it('extrai a mensagem de erro de validação (422)', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: [{ loc: ['body', 'email'], msg: 'value is not a valid email' }] }, 422),
    );

    await expect(apiRequest('/users/signup', { method: 'POST' })).rejects.toThrow(
      'value is not a valid email',
    );
  });

  it('cai na mensagem genérica quando o corpo de erro não é JSON', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(new Response('boom', { status: 500 }));

    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe('Erro 500');
  });

  it('converte falha de rede em ApiError 0', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockRejectedValue(new TypeError('failed to fetch'));

    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });

  it('devolve undefined para respostas 204', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
