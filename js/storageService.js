import { calculatePoints, STUDY_TYPES } from './scoreEngine.js';
import { evaluateAchievements } from './achievements.js';

const STORAGE_KEY = 'gramma_user_data';

const STAT_KEYS_BY_STUDY_TYPE = {
  [STUDY_TYPES.MORPHOLOGY]: {
    streak: 'morph_correct_streak',
    streakMax: 'morph_correct_streak_max',
    totalCorrect: 'total_correct_morph',
  },
  [STUDY_TYPES.SYNTAX]: {
    streak: 'syntax_correct_streak',
    streakMax: 'syntax_correct_streak_max',
    totalCorrect: 'total_correct_syntax',
  },
  [STUDY_TYPES.SYNONYMS]: {
    streak: 'synonyms_correct_streak',
    streakMax: 'synonyms_correct_streak_max',
    totalCorrect: 'total_correct_synonyms',
  },
};

function prefersDarkByDefault() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

function createDefaultUserData() {
  return {
    uuid: crypto.randomUUID(),
    settings: {
      dark_mode: prefersDarkByDefault(),
      study_type: STUDY_TYPES.MORPHOLOGY,
      font_scale_index: 1,
      music_volume: 50,
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

function historyKey(dayId, studyType) {
  return `${dayId}:${studyType}`;
}

export class StorageService {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultUserData();
      const parsed = JSON.parse(raw);
      const defaults = createDefaultUserData();
      return {
        ...defaults,
        ...parsed,
        settings: { ...defaults.settings, ...parsed.settings },
        stats: { ...defaults.stats, ...parsed.stats },
      };
    } catch (err) {
      console.error('Falha ao ler localStorage, reiniciando dados.', err);
      return createDefaultUserData();
    }
  }

  static save(userData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (err) {
      console.error('Falha ao salvar no localStorage.', err);
    }
  }

  static getEntry(dayId, studyType) {
    const data = StorageService.load();
    return data.history[historyKey(dayId, studyType)] || null;
  }

  /**
   * Registra o resultado de uma jogada (um único tipo de estudo por vez).
   * Calcula pontos (com bônus de marco de streak), atualiza streaks por tipo,
   * a ofensiva diária e as conquistas. Retorna tudo que a UI precisa mostrar.
   */
  static recordResult(dayId, studyType, isCorrect, timeMs, { isArchive = false } = {}) {
    const data = StorageService.load();

    const { streak: streakKey, streakMax: streakMaxKey, totalCorrect: totalCorrectKey } = STAT_KEYS_BY_STUDY_TYPE[studyType];

    if (isCorrect) {
      data.stats[streakKey] += 1;
      data.stats[totalCorrectKey] += 1;
      data.stats[streakMaxKey] = Math.max(data.stats[streakMaxKey], data.stats[streakKey]);
    } else {
      data.stats[streakKey] = 0;
    }

    const score = calculatePoints(studyType, isCorrect, data.stats[streakKey]);

    data.history[historyKey(dayId, studyType)] = {
      day_id: dayId,
      study_type: studyType,
      correct: isCorrect,
      points: score.total,
      base: score.base,
      bonus: score.bonus,
      is_milestone: score.isMilestone,
      streak_after: data.stats[streakKey],
      time_ms: timeMs,
      is_archive: isArchive,
    };

    data.stats.games_played += 1;
    data.stats.total_score += score.total;

    if (!isArchive && dayId !== data.stats.last_streak_day) {
      if (dayId === data.stats.last_streak_day + 1 || data.stats.last_streak_day === 0) {
        data.stats.current_streak += 1;
      } else {
        data.stats.current_streak = 1;
      }
      data.stats.last_streak_day = dayId;
      data.stats.max_streak = Math.max(data.stats.max_streak, data.stats.current_streak);
    }

    const unlockedBefore = new Set(data.stats.unlocked_achievements);
    const unlockedNow = evaluateAchievements(data.stats);
    const newlyUnlocked = unlockedNow.filter((id) => !unlockedBefore.has(id));
    data.stats.unlocked_achievements = unlockedNow;

    StorageService.save(data);

    return {
      userData: data,
      score,
      streak: data.stats[streakKey],
      newlyUnlocked,
    };
  }

  static setStudyType(studyType) {
    const data = StorageService.load();
    data.settings.study_type = studyType;
    StorageService.save(data);
    return data;
  }
}
