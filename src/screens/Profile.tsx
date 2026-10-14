import { Navigate } from 'react-router-dom';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { authStore, useAuth } from '../state/authStore';

function memberSince(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function Profile() {
  const go = useAnimatedNavigate();
  const { status, user } = useAuth();

  if (status !== 'authenticated' || !user) return <Navigate to="/entrar" replace />;

  const since = memberSince(user.created_at);
  const displayName = user.full_name?.trim() || user.email;

  const signOut = () => {
    authStore.logout();
    go('/');
  };

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <p className="screen-title">
            <MaterialIcon name="account_circle" />
            Conta
          </p>
          <IconButton icon="close" label="Fechar" onClick={() => go('/')} />
        </header>

        <div className="profile-card">
          <div className="profile-avatar">
            <MaterialIcon name="person" />
          </div>
          <p className="profile-name">{displayName}</p>
          {user.full_name?.trim() && <p className="profile-email">{user.email}</p>}
          {since && <p className="profile-since">Conta desde {since}</p>}
        </div>

        <button type="button" className="secondary-btn" onClick={() => go('/ranking')}>
          <MaterialIcon name="leaderboard" />
          Ver ranking
        </button>

        <button type="button" className="secondary-btn" onClick={signOut}>
          <MaterialIcon name="logout" />
          Sair
        </button>
      </section>
    </ScreenTransition>
  );
}
