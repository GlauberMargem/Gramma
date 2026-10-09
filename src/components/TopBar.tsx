import { useLocation } from 'react-router-dom';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { useTheme } from '../state/hooks';
import { IconButton } from './IconButton';

/** Auto-oculta fora de `/`: o legado só mostra a barra no Menu. */
export function TopBar() {
  const { pathname } = useLocation();
  const { isDark, toggle } = useTheme();
  const go = useAnimatedNavigate();

  if (pathname !== '/') return null;

  return (
    <div id="top-bar" className="top-bar">
      <IconButton icon={isDark ? 'light_mode' : 'dark_mode'} label="Alternar tema claro/escuro" onClick={toggle} />
      <IconButton icon="accessibility_new" label="Acessibilidade" onClick={() => go('/acessibilidade')} />
    </div>
  );
}
