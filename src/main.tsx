import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyBoot } from './boot';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import './styles/style.css';

applyBoot();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
