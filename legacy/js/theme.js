import { StorageService } from './storageService.js';

function applyTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

export function initTheme() {
  const userData = StorageService.load();
  applyTheme(Boolean(userData.settings.dark_mode));
}

export function toggleTheme() {
  const userData = StorageService.load();
  userData.settings.dark_mode = !userData.settings.dark_mode;
  StorageService.save(userData);

  const btn = document.getElementById('btn-theme-toggle');
  const gsap = window.gsap;

  if (!gsap || !btn) {
    applyTheme(userData.settings.dark_mode);
    return;
  }

  // "Flip" no botão: encolhe até a borda (ícone de perfil), troca o tema e o
  // glifo exatamente nesse ponto invisível, depois desdobra de volta.
  gsap.timeline()
    .to(btn, { scaleX: 0, duration: 0.14, ease: 'power1.in' })
    .call(() => applyTheme(userData.settings.dark_mode))
    .to(btn, { scaleX: 1, duration: 0.24, ease: 'back.out(2.4)' })
    .set(btn, { clearProps: 'transform' });
}
