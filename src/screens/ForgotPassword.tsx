import { useState } from 'react';
import type { FormEvent } from 'react';
import { recoverPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';

export function ForgotPassword() {
  const go = useAnimatedNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await recoverPassword(email.trim());
      setSent(true);
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
            <MaterialIcon name="key" />
            Esqueci a senha
          </p>
          <IconButton icon="close" label="Fechar" onClick={() => go('/entrar')} />
        </header>

        {sent ? (
          <div className="auth-form">
            <p className="auth-hint" role="status">
              Se existir uma conta com este e-mail, enviamos um link de redefinição. Confira sua caixa de entrada.
            </p>
            <button type="button" className="cta-btn" onClick={() => go('/entrar')}>
              <MaterialIcon name="login" />
              <span>Voltar para Entrar</span>
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label className="form-field" htmlFor="recover-email">
              <span className="form-label">E-mail</span>
              <input
                id="recover-email"
                className="form-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {error && (
              <p className="auth-error" role="alert">
                <MaterialIcon name="error" />
                {error}
              </p>
            )}

            <button type="submit" className="cta-btn" disabled={busy}>
              <MaterialIcon name={busy ? 'hourglass_top' : 'mail'} />
              <span>{busy ? 'Enviando…' : 'Enviar link de redefinição'}</span>
            </button>
          </form>
        )}
      </section>
    </ScreenTransition>
  );
}