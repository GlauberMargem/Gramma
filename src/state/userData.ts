import type { Settings, Stats, UserData } from '../domain/types';

function prefersDarkByDefault(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

// crypto.randomUUID exige contexto seguro; fora dele cai no getRandomValues/Math.random.
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createDefaultUserData(): UserData {
  return {
    uuid: generateUuid(),
    settings: {
      dark_mode: prefersDarkByDefault(),
      study_type: 'morphology',
      font_scale_index: 1,
      dyslexia_font: false,
    },
    stats: {
      current_streak: 0,
      max_streak: 0,
      last_streak_day: 0,
      games_played: 0,
      total_score: 0,
      morph_correct_streak: 0,
      morph_correct_streak_max: 0,
      syntax_correct_streak: 0,
      syntax_correct_streak_max: 0,
      synonyms_correct_streak: 0,
      synonyms_correct_streak_max: 0,
      total_correct_morph: 0,
      total_correct_syntax: 0,
      total_correct_synonyms: 0,
      unlocked_achievements: [],
    },
    history: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Lê o JSON do storage mesclando com os defaults (igual ao StorageService.load legado). */
export function parseStored(raw: string | null): UserData {
  if (!raw) return createDefaultUserData();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return createDefaultUserData();
    const defaults = createDefaultUserData();
    return {
      ...defaults,
      ...(parsed as Partial<UserData>),
      settings: { ...defaults.settings, ...(isRecord(parsed.settings) ? (parsed.settings as Partial<Settings>) : {}) },
      stats: { ...defaults.stats, ...(isRecord(parsed.stats) ? (parsed.stats as Partial<Stats>) : {}) },
    };
  } catch (err) {
    console.error('Falha ao ler localStorage, reiniciando dados.', err);
    return createDefaultUserData();
  }
}
