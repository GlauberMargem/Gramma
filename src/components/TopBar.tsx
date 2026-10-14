import { useLocation } from 'react-router-dom';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useAuth } from '../state/authStore';
import { IconButton } from './IconButton';
import { ThemeToggle } from './ThemeToggle';

/** Auto-oculta fora de `/`: o legado só mostra a barra no Menu. */
export function TopBar() {
  const { pathname } = useLocation();
  const go = useAnimatedNavigate();
  const { status, user } = useAuth();

  if (pathname !== '/') return null;

  const isAuthed = status === 'authenticated';
  const label = isAuthed ? (user?.full_name?.trim() || user?.email || 'Conta') : 'Entrar';

  return (
    <nav id="top-bar" className="top-bar" aria-label="Conta e preferências">
      <IconButton
        icon={isAuthed ? 'account_circle' : 'login'}
        label={label}
        onClick={() => go(isAuthed ? '/perfil' : '/entrar')}
      />
      <ThemeToggle />
      <IconButton icon="accessibility_new" label="Acessibilidade" onClick={() => go('/acessibilidade')} />
    </nav>
  );
}
