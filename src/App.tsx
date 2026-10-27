import { useEffect } from 'react';
import { AppRouter } from './router';
import { authStore } from './state/authStore';
import { useAccessibility, useFontScale, useTheme } from './state/hooks';
import { progressSync } from './state/sync';

// Aplica tema, escala de fonte e opções de acessibilidade salvos em todas as
// telas, não só onde há controle (antes o alto contraste/fonte para dislexia
// só valia enquanto a tela de Acessibilidade estava montada).
function Preferences() {
  useTheme();
  useFontScale();
  useAccessibility();
  return null;
}

// Revalida o token salvo e sincroniza o progresso com a conta (quando há sessão).
function Session() {
  useEffect(() => {
    void authStore.refresh();
    return progressSync.start();
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
