import { afterEach, describe, expect, it, vi } from 'vitest';
import legacy from './__fixtures__/legacy-user-data.json';
import { createDefaultUserData, parseStored } from './userData';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createDefaultUserData', () => {
  it('gera valores iniciais zerados', () => {
    const d = createDefaultUserData();
    expect(d.uuid).toBeTruthy();
    expect(d.settings.study_type).toBe('morphology');
    expect(d.settings.font_scale_index).toBe(1);
    expect(d.settings.dyslexia_font).toBe(false);
    expect(d.stats.games_played).toBe(0);
    expect(d.stats.unlocked_achievements).toEqual([]);
    expect(d.history).toEqual({});
  });

  it('usa o tema do sistema', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(createDefaultUserData().settings.dark_mode).toBe(false);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(createDefaultUserData().settings.dark_mode).toBe(true);
  });

  it('assume tema escuro sem matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(createDefaultUserData().settings.dark_mode).toBe(true);
  });

  it('usa fallback de uuid sem crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {});
    const a = createDefaultUserData().uuid;
    const b = createDefaultUserData().uuid;
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });
});

describe('parseStored', () => {
  it('carrega a fixture legada preservando history e uuid', () => {
    const d = parseStored(JSON.stringify(legacy));
    expect(d.uuid).toBe(legacy.uuid);
    expect(d.history).toEqual(legacy.history);
    expect(d.settings).toEqual({ ...legacy.settings, dyslexia_font: false });
    expect(d.stats.total_score).toBe(410);
  });

  it('null, vazio e JSON inválido viram defaults', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const raw of [null, '', '{nope', 'null', '42']) {
      const d = parseStored(raw);
      expect(d.history).toEqual({});
      expect(d.stats.games_played).toBe(0);
    }
  });

  it('campo novo ausente em stats recebe default', () => {
    const d = parseStored(JSON.stringify(legacy));
    expect(d.stats.synonyms_correct_streak).toBe(0);
    expect(d.stats.synonyms_correct_streak_max).toBe(0);
    expect(d.stats.total_correct_synonyms).toBe(0);
  });

  it('settings ausentes recebem default', () => {
    const d = parseStored(JSON.stringify({ uuid: 'x' }));
    expect(d.uuid).toBe('x');
    expect(d.settings.font_scale_index).toBe(1);
  });
});
