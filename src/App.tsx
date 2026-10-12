import { useEffect } from 'react';
import { AppRouter } from './router';
import { authStore } from './state/authStore';
import { useFontScale, useTheme } from './state/hooks';

// Aplica tema e escala de fonte salvos em todas as telas, não só onde há controle.
function Preferences() {
  useTheme();
  useFontScale();
  return null;
}

// Revalida o token salvo contra o backend ao abrir o app (quando há sessão).
function Session() {
  useEffect(() => {
    void authStore.refresh();
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <Preferences />
      <Session />
      <AppRouter />
    </>
  );
}
