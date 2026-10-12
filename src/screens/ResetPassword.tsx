import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';

export function ResetPassword() {
  const go = useAnimatedNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) return <Navigate to="/recuperar-senha" replace />;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
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
          <p className="screen-title">
            <MaterialIcon name="lock_reset" />
            Redefinir senha
          </p>
          <IconButton icon="close" label="Fechar" onClick={() => go('/entrar')} />
        </header>

        {done ? (
          <div className="auth-form">
            <p className="auth-hint" role="status">
              Senha atualizada com sucesso. Já pode entrar com a nova senha.
            </p>
            <button type="button" className="cta-btn" onClick={() => go('/entrar')}>
              <MaterialIcon name="login" />
              <span>Entrar</span>
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label className="form-field" htmlFor="reset-password">
              <span className="form-label">Nova senha</span>
              <input
                id="reset-password"
                className="form-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="form-field" htmlFor="reset-confirm">
              <span className="form-label">Confirmar senha</span>
              <input
                id="reset-confirm"
                className="form-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>

            {error && (
              <p className="auth-error" role="alert">
                <MaterialIcon name="error" />
                {error}
              </p>
            )}

            <button type="submit" className="cta-btn" disabled={busy}>
              <MaterialIcon name={busy ? 'hourglass_top' : 'lock_reset'} />
              <span>{busy ? 'Aguarde…' : 'Redefinir senha'}</span>
            </button>
          </form>
        )}
      </section>
    </ScreenTransition>
  );
}