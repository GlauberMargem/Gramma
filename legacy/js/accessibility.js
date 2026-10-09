import { StorageService } from './storageService.js';

export const FONT_SCALES = [
  { value: 0.85, label: 'Pequena' },
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'Grande' },
  { value: 1.3, label: 'Extra Grande' },
];

function applyFontScale(index) {
  const scale = FONT_SCALES[index] || FONT_SCALES[1];
  document.documentElement.style.setProperty('--font-scale', scale.value);
  const label = document.getElementById('font-size-value');
  if (label) label.textContent = scale.label;
}

export function initAccessibility() {
  const { settings } = StorageService.load();
  applyFontScale(settings.font_scale_index);
}

export function changeFontScale(direction) {
  const data = StorageService.load();
  const nextIndex = Math.min(
    FONT_SCALES.length - 1,
    Math.max(0, data.settings.font_scale_index + direction),
  );
  data.settings.font_scale_index = nextIndex;
  StorageService.save(data);
  applyFontScale(nextIndex);
}
