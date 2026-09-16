import { StorageService } from './storageService.js';

export const FONT_SCALES = [
  { value: 0.85, label: 'Pequena' },
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'Grande' },
  { value: 1.3, label: 'Extra Grande' },
];

const VOLUME_STEP = 10;

function applyFontScale(index) {
  const scale = FONT_SCALES[index] || FONT_SCALES[1];
  document.documentElement.style.setProperty('--font-scale', scale.value);
  const label = document.getElementById('font-size-value');
  if (label) label.textContent = scale.label;
}

function musicIconFor(volume) {
  if (volume <= 0) return 'volume_off';
  if (volume < 50) return 'volume_down';
  return 'volume_up';
}

function applyMusicVolume(volume) {
  const music = document.getElementById('bg-music');
  if (music) music.volume = volume / 100;

  const valueLabel = document.getElementById('music-volume-value');
  if (valueLabel) valueLabel.textContent = `${volume}%`;

  const icon = document.getElementById('music-volume-icon');
  if (icon) icon.textContent = musicIconFor(volume);
}

export function initAccessibility() {
  const { settings } = StorageService.load();
  applyFontScale(settings.font_scale_index);
  applyMusicVolume(settings.music_volume);
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

export function changeMusicVolume(direction) {
  const data = StorageService.load();
  const nextVolume = Math.min(100, Math.max(0, data.settings.music_volume + direction * VOLUME_STEP));
  data.settings.music_volume = nextVolume;
  StorageService.save(data);
  applyMusicVolume(nextVolume);
}
