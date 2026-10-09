import { DATABASE } from './database.js';

let indexByDay = null;

function buildIndex() {
  indexByDay = new Map();
  for (const entry of DATABASE) {
    indexByDay.set(entry.day_id, entry);
  }
}

function ensureHighlighted(entry) {
  if (entry.sentence.includes('<span>')) return entry;
  const highlighted = entry.sentence.replace(entry.target_word, `<span>${entry.target_word}</span>`);
  return { ...entry, sentence: highlighted };
}

export class DataStore {
  static getTotalDays() {
    return DATABASE.length;
  }

  static getDay(dayId) {
    if (!indexByDay) buildIndex();
    const entry = indexByDay.get(dayId);
    return entry ? ensureHighlighted(entry) : null;
  }
}
