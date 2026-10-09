import { useLocation } from 'react-router-dom';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { IconButton } from './IconButton';
import { ThemeToggle } from './ThemeToggle';

/** Auto-oculta fora de `/`: o legado só mostra a barra no Menu. */
export function TopBar() {
  const { pathname } = useLocation();
  const go = useAnimatedNavigate();

  if (pathname !== '/') return null;

  return (
    <div id="top-bar" className="top-bar">
      <ThemeToggle />
      <IconButton icon="accessibility_new" label="Acessibilidade" onClick={() => go('/acessibilidade')} />
    </div>
  );
}
