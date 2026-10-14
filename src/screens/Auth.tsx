import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { authStore, useAuth } from '../state/authStore';

type Mode = 'login' | 'register';

const COPY: Record<Mode, { title: string; submit: string; hint: string }> = {
  login: {
    title: 'Entrar',
    submit: 'Entrar na conta',
    hint: 'Use o e-mail e a senha cadastrados para sincronizar seu progresso.',
  },
  register: {
    title: 'Criar conta',
    submit: 'Cadastrar',
    hint: 'A conta guarda seu progresso na nuvem. Jogar como convidado continua disponível.',
  },
};

export function Auth() {
  const go = useAnimatedNavigate();
  const { status } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const copy = COPY[mode];

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await authStore.login(email.trim(), password);
      } else {
        const name = fullName.trim();
        await authStore.register({ email: email.trim(), password, full_name: name || undefined });
      }
      go('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha inesperada. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <h1 className="screen-title">
            <MaterialIcon name="account_circle" />
            {copy.title}
          </h1>
          <IconButton icon="close" label="Fechar" onClick={() => go('/')} />
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'auth-tab is-active' : 'auth-tab'}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'auth-tab is-active' : 'auth-tab'}
            onClick={() => switchMode('register')}
          >
            Criar conta
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {mode === 'register' && (
            <label className="form-field" htmlFor="auth-name">
              <span className="form-label">Nome (opcional)</span>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          )}

          <label className="form-field" htmlFor="auth-email">
            <span className="form-label">E-mail</span>
            <input
              id="auth-email"
              className="form-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="form-field" htmlFor="auth-password">
            <span className="form-label">Senha</span>
            <input
              id="auth-password"
              className="form-input"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              <MaterialIcon name="error" />
              {error}
            </p>
          )}

          <p className="auth-hint">{copy.hint}</p>

          <button type="submit" className="cta-btn" disabled={busy}>
            <MaterialIcon name={busy ? 'hourglass_top' : 'login'} />
            <span>{busy ? 'Aguarde…' : copy.submit}</span>
          </button>
        </form>

        <button type="button" className="auth-link-btn" onClick={() => go('/recuperar-senha')}>
          Esqueci minha senha
        </button>
      </section>
    </ScreenTransition>
  );
}
