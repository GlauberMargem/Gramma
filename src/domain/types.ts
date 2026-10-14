export type StudyType = 'morphology' | 'syntax' | 'synonyms';

export interface Settings {
  dark_mode: boolean;
  study_type: StudyType;
  font_scale_index: number;
  dyslexia_font: boolean;
  high_contrast: boolean;
}

export interface Stats {
  current_streak: number;
  max_streak: number;
  last_streak_day: number;
  games_played: number;
  total_score: number;
  morph_correct_streak: number;
  morph_correct_streak_max: number;
  syntax_correct_streak: number;
  syntax_correct_streak_max: number;
  synonyms_correct_streak: number;
  synonyms_correct_streak_max: number;
  total_correct_morph: number;
  total_correct_syntax: number;
  total_correct_synonyms: number;
  unlocked_achievements: string[];
}

export interface HistoryEntry {
  day_id: number;
  study_type: StudyType;
  correct: boolean;
  points: number;
  base: number;
  bonus: number;
  is_milestone: boolean;
  streak_after: number;
  time_ms: number;
  is_archive: boolean;
}

export interface UserData {
  uuid: string;
  settings: Settings;
  stats: Stats;
  history: Record<`${number}:${StudyType}`, HistoryEntry>;
}

export interface Score {
  base: number;
  bonus: number;
  total: number;
  isMilestone: boolean;
}

export interface GrammarDay {
  day_id: number;
  sentence: string;
  target_word: string;
  morphology: { answer: string; options: string[] };
  syntax: { answer: string; options: string[] };
}

export interface SynonymEntry {
  word_id: number;
  word: string;
  answer: string;
  options: string[];
}

export type PromptPart = { text: string; highlight?: boolean };

export interface Question {
  prompt: PromptPart[];
  options: string[];
  answer: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: (stats: Stats) => boolean;
}
