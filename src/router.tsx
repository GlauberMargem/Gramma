import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Accessibility } from './screens/Accessibility';
import { Achievements } from './screens/Achievements';
import { Calendar } from './screens/Calendar';
import { End } from './screens/End';
import { Game } from './screens/Game';
import { HowToPlay } from './screens/HowToPlay';
import { Intro } from './screens/Intro';
import { Menu } from './screens/Menu';
import { ModeHub } from './screens/ModeHub';
import { Stats } from './screens/Stats';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/modo" element={<ModeHub />} />
      <Route path="/jogo/:dia" element={<Game />} />
      <Route path="/fim/:dia" element={<End />} />
      <Route path="/calendario" element={<Calendar />} />
      <Route path="/estatisticas" element={<Stats />} />
      <Route path="/conquistas" element={<Achievements />} />
      <Route path="/acessibilidade" element={<Accessibility />} />
      <Route path="/como-jogar" element={<HowToPlay />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
