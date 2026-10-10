import { apiRequest } from './client';
import type { Message, RegisterInput, Token, UserPublic } from './types';

/** Login OAuth2 (form `username`/`password`) — o backend usa o e-mail como username. */
export function login(email: string, password: string): Promise<Token> {
  return apiRequest<Token>('/login/access-token', {
    method: 'POST',
    form: new URLSearchParams({ username: email, password }),
  });
}

/** Cadastro de novo usuário (não devolve token; faça login em seguida). */
export function register(input: RegisterInput): Promise<UserPublic> {
  return apiRequest<UserPublic>('/users/signup', { method: 'POST', json: input });
}

/** Usuário da sessão atual (valida o token). */
export function getMe(token: string): Promise<UserPublic> {
  return apiRequest<UserPublic>('/users/me', { token });
}

/** Dispara o e-mail de recuperação de senha. */
export function recoverPassword(email: string): Promise<Message> {
  return apiRequest<Message>(`/password-recovery/${encodeURIComponent(email)}`, { method: 'POST' });
}

/** Troca a senha usando o token enviado por e-mail. */
export function resetPassword(token: string, newPassword: string): Promise<Message> {
  return apiRequest<Message>('/reset-password/', {
    method: 'POST',
    json: { token, new_password: newPassword },
  });
}
