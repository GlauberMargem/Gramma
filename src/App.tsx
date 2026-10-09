import { AppRouter } from './router';
import { useFontScale, useTheme } from './state/hooks';

// Aplica tema e escala de fonte salvos em todas as telas, não só onde há controle.
function Preferences() {
  useTheme();
  useFontScale();
  return null;
}

export default function App() {
  return (
    <>
      <Preferences />
      <AppRouter />
    </>
  );
}
