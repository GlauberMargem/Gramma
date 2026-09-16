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
  applyTheme(userData.settings.dark_mode);
}
