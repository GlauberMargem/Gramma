import { describe, expect, it } from 'vitest';
import type { ProgressDTO } from '../api/types';
import { createDefaultUserData } from '../state/userData';
import { mergeProgress } from './mergeProgress';
import { recordResult } from './recordResult';
import type { HistoryEntry, StudyType, UserData } from './types';

type Play = { dayId: number; type?: StudyType; correct?: boolean; timeMs?: number; isArchive?: boolean };

function playAll(plays: Play[], data: UserData = createDefaultUserData()): UserData {
  return plays.reduce(
    (acc, p) =>
      recordResult(acc, {
        dayId: p.dayId,
        type: p.type ?? 'morphology',
        correct: p.correct ?? true,
        timeMs: p.timeMs ?? 1000,
        isArchive: p.isArchive ?? false,
      }).data,
    data,
  );
}

function toCloud(data: UserData): ProgressDTO {
  return { stats: data.stats, history: Object.values(data.history) as HistoryEntry[] };
}

const emptyCloud = (): ProgressDTO => toCloud(createDefaultUserData());

describe('mergeProgress', () => {
  it('só local: mantém tudo o que é local', () => {
    const local = playAll([{ dayId: 1 }, { dayId: 2 }]);
    const merged = mergeProgress(local, emptyCloud());
    expect(merged.history).toEqual(local.history);
    expect(merged.stats).toEqual(local.stats);
  });

  it('só nuvem: adota histórico, stats e ofensiva da conta', () => {
    const cloud = playAll([{ dayId: 1 }, { dayId: 2 }, { dayId: 3 }]);
    const merged = mergeProgress(createDefaultUserData(), toCloud(cloud));
    expect(merged.history).toEqual(cloud.history);
    expect(merged.stats.current_streak).toBe(3);
    expect(merged.stats.last_streak_day).toBe(3);
    expect(merged.stats.max_streak).toBe(3);
    expect(merged.stats.games_played).toBe(3);
  });

  it('mantém uuid e preferências locais', () => {
    const local = createDefaultUserData();
    local.settings = { dark_mode: false, study_type: 'syntax', font_scale_index: 3, dyslexia_font: true, high_contrast: true };
    const merged = mergeProgress(local, toCloud(playAll([{ dayId: 1 }])));
    expect(merged.uuid).toBe(local.uuid);
    expect(merged.settings).toEqual(local.settings);
  });

  it('conflito na mesma jogada: maior pontuação; empate → menor tempo', () => {
    const local = playAll([{ dayId: 1, correct: false }, { dayId: 2, timeMs: 5000 }]);
    const cloud = playAll([{ dayId: 1 }, { dayId: 2, timeMs: 800 }]);
    const merged = mergeProgress(local, toCloud(cloud));
    expect(merged.history['1:morphology'].correct).toBe(true);
    expect(merged.history['2:morphology'].time_ms).toBe(800);
  });

  it('jogadas diferentes nos dois lados somam no histórico e nos totais', () => {
    const local = playAll([{ dayId: 1 }, { dayId: 1, type: 'syntax' }]);
    const cloud = playAll([{ dayId: 2, type: 'synonyms' }]);
    const merged = mergeProgress(local, toCloud(cloud));
    expect(Object.keys(merged.history).sort()).toEqual(['1:morphology', '1:syntax', '2:synonyms']);
    expect(merged.stats.games_played).toBe(3);
    expect(merged.stats.total_correct_morph).toBe(1);
    expect(merged.stats.total_correct_syntax).toBe(1);
    expect(merged.stats.total_correct_synonyms).toBe(1);
    expect(merged.stats.total_score).toBe(
      Object.values(merged.history).reduce((sum, e) => sum + e.points, 0),
    );
  });

  it('nunca reduz contadores locais (rejogo de arquivo infla games_played)', () => {
    const local = playAll([{ dayId: 1 }, { dayId: 1, isArchive: true }]);
    expect(local.stats.games_played).toBe(2);
    const merged = mergeProgress(local, emptyCloud());
    expect(merged.stats.games_played).toBe(2);
  });

  it('ofensiva: vence o lado com o dia mais recente', () => {
    const local = playAll([{ dayId: 1 }, { dayId: 2 }]);
    const cloud = playAll([{ dayId: 5 }]);
    const merged = mergeProgress(local, toCloud(cloud));
    expect(merged.stats.last_streak_day).toBe(5);
    expect(merged.stats.current_streak).toBe(1);
    expect(merged.stats.max_streak).toBe(2);
  });

  it('ofensiva: empate no dia fica com a maior', () => {
    const local = playAll([{ dayId: 4 }]);
    const cloud = playAll([{ dayId: 3 }, { dayId: 4 }]);
    const merged = mergeProgress(local, toCloud(cloud));
    expect(merged.stats.current_streak).toBe(2);
  });

  it('streak por modo: máximos pelo maior; atual pela jogada mais recente do modo', () => {
    const local = playAll([{ dayId: 1 }, { dayId: 2 }, { dayId: 3 }]);
    const cloud = playAll([{ dayId: 4, correct: false }]);
    const merged = mergeProgress(local, toCloud(cloud));
    expect(merged.stats.morph_correct_streak_max).toBe(3);
    expect(merged.stats.morph_correct_streak).toBe(0);
  });

  it('conquistas: união dos dois lados mais as que o merge destrava', () => {
    const local = createDefaultUserData();
    local.stats.unlocked_achievements = ['local_only'];
    const cloud = emptyCloud();
    cloud.stats.unlocked_achievements = ['cloud_only'];
    const merged = mergeProgress(local, cloud);
    expect(merged.stats.unlocked_achievements).toEqual(
      expect.arrayContaining(['local_only', 'cloud_only']),
    );

    const played = mergeProgress(createDefaultUserData(), toCloud(playAll([{ dayId: 1 }])));
    expect(played.stats.unlocked_achievements).toEqual(playAll([{ dayId: 1 }]).stats.unlocked_achievements);
  });

  it('é determinística e não altera as entradas', () => {
    const local = playAll([{ dayId: 1 }]);
    const cloud = toCloud(playAll([{ dayId: 2 }]));
    const snapshot = JSON.stringify({ local, cloud });
    expect(mergeProgress(local, cloud)).toEqual(mergeProgress(local, cloud));
    expect(JSON.stringify({ local, cloud })).toBe(snapshot);
  });
});
