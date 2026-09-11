import { DataStore } from './dataStore.js';
import { SynonymStore } from './synonymStore.js';
import { StorageService } from './storageService.js';
import { STUDY_TYPES } from './scoreEngine.js';

function buildPrompt(studyType, dayId) {
  if (studyType === STUDY_TYPES.SYNONYMS) {
    const entry = SynonymStore.getDay(dayId);
    return {
      promptHtml: `Qual é o sinônimo de <span>${entry.word}</span>?`,
      options: entry.options,
      answer: entry.answer,
    };
  }

  const entry = DataStore.getDay(dayId);
  return {
    promptHtml: entry.sentence,
    options: entry[studyType].options,
    answer: entry[studyType].answer,
  };
}

export const STATES = Object.freeze({
  INIT: 'INIT',
  QUESTION_PHASE: 'QUESTION_PHASE',
  END_SCREEN: 'END_SCREEN',
});

// 17 de julho de 2026 (60 dias antes do lançamento "oficial", só para ter
// dias passados jogáveis em teste). Data local, sem hora, para casar
// exatamente com a grade de calendário (mês/semana) exibida na tela.
const START_DATE = new Date(2026, 6, 17);
const DAY_MS = 1000 * 60 * 60 * 24;

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getCurrentDayId() {
  const diffDays = Math.round((dateOnly(new Date()) - START_DATE) / DAY_MS);
  return Math.max(1, diffDays + 1);
}

/** Converte um day_id (1-based) na data de calendário correspondente. */
export function dateForDay(dayId) {
  const date = new Date(START_DATE);
  date.setDate(date.getDate() + (dayId - 1));
  return date;
}

/** Converte uma data de calendário no day_id correspondente (pode ser < 1 ou > total). */
export function dayIdForDate(date) {
  const diffDays = Math.round((dateOnly(date) - START_DATE) / DAY_MS);
  return diffDays + 1;
}

export class GameEngine {
  constructor({ dayId, studyType }) {
    const currentDay = getCurrentDayId();
    const totalDays = DataStore.getTotalDays();

    this.dayId = Math.min(dayId > 0 ? dayId : currentDay, currentDay, totalDays);
    this.isArchive = Boolean(dayId) && this.dayId !== currentDay;
    this.studyType = studyType;

    const { promptHtml, options, answer } = buildPrompt(studyType, this.dayId);
    this.promptHtml = promptHtml;
    this.options = options;
    this.correctAnswer = answer;

    this.state = STATES.INIT;
    this.correct = null;
    this.startTime = null;
  }

  hasBeenPlayed() {
    return Boolean(StorageService.getEntry(this.dayId, this.studyType));
  }

  getSavedResult() {
    return StorageService.getEntry(this.dayId, this.studyType);
  }

  start() {
    this.startTime = performance.now();
    this.state = STATES.QUESTION_PHASE;
    return this.state;
  }

  /** Uma única tentativa. Certo ou errado, o resultado é final. */
  answer(isCorrect) {
    if (this.state !== STATES.QUESTION_PHASE) return null;
    this.correct = isCorrect;
    return this.correct;
  }

  finish() {
    const timeMs = Math.round(performance.now() - this.startTime);
    const { userData, score, streak, newlyUnlocked } = StorageService.recordResult(
      this.dayId,
      this.studyType,
      this.correct,
      timeMs,
      { isArchive: this.isArchive },
    );

    this.state = STATES.END_SCREEN;

    return {
      correct: this.correct,
      score,
      streak,
      newlyUnlocked,
      userData,
      timeMs,
    };
  }
}
