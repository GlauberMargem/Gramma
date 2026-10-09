import { DataStore } from './dataStore.js';
import { GameEngine, getCurrentDayId, dateForDay, dayIdForDate } from './gameEngine.js';
import { StorageService } from './storageService.js';
import { STUDY_TYPES } from './scoreEngine.js';
import { initTheme, toggleTheme } from './theme.js';
import { initAccessibility, changeFontScale } from './accessibility.js';
import * as UI from './uiController.js';

const PHASE_TRANSITION_DELAY_MS = 900;
const INTRO_SESSION_KEY = 'gramma_intro_seen';

const STUDY_TYPE_LABEL_TITLE = {
  [STUDY_TYPES.MORPHOLOGY]: 'Morfologia',
  [STUDY_TYPES.SYNTAX]: 'Sintaxe',
  [STUDY_TYPES.SYNONYMS]: 'Sinônimos',
};

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
];

let calendarViewDate = null;

function getRequestedDayFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const day = parseInt(params.get('day'), 10);
  return Number.isInteger(day) && day > 0 ? day : null;
}

function getSelectedStudyType() {
  return StorageService.load().settings.study_type;
}

function goToMenu() {
  const userData = StorageService.load();
  UI.renderMenu({
    streakDays: userData.stats.current_streak,
    studyType: userData.settings.study_type,
  });
  UI.showScreen('screen-menu');
}

function openModeHub() {
  const userData = StorageService.load();
  const currentDay = getCurrentDayId();
  const studyType = userData.settings.study_type;
  const alreadyPlayed = Boolean(userData.history[`${currentDay}:${studyType}`]);

  UI.renderModeHub({
    studyType,
    currentDay,
    playIcon: alreadyPlayed ? 'check_circle' : 'play_arrow',
    playLabel: alreadyPlayed ? 'VER RESULTADO' : `JOGAR DIA ${currentDay}`,
  });
  UI.showScreen('screen-mode-hub');
}

function selectStudyType(studyType) {
  StorageService.setStudyType(studyType);
  openModeHub();
}

function showEndScreenFromSavedResult(entry) {
  UI.renderEnd({
    correct: entry.correct,
    studyType: entry.study_type,
    score: { base: entry.base, bonus: entry.bonus, total: entry.points, isMilestone: entry.is_milestone },
    streak: entry.streak_after,
    newlyUnlocked: [],
  });
  window.currentShareData = {
    dayId: entry.day_id,
    studyType: entry.study_type,
    correct: entry.correct,
    score: entry.points,
  };
  UI.showScreen('screen-end');
}

function playDay(dayId) {
  if (dayId < 1 || dayId > DataStore.getTotalDays()) {
    goToMenu();
    return;
  }

  const studyType = getSelectedStudyType();
  const engine = new GameEngine({ dayId, studyType });

  const savedResult = engine.hasBeenPlayed() && !engine.isArchive ? engine.getSavedResult() : null;
  if (savedResult) {
    showEndScreenFromSavedResult(savedResult);
    return;
  }

  engine.start();
  runQuestionPhase(engine);
}

function runQuestionPhase(engine) {
  UI.renderQuestion({
    dayId: engine.dayId,
    totalDays: DataStore.getTotalDays(),
    isArchive: engine.isArchive,
    studyType: engine.studyType,
    sentenceHtml: engine.promptHtml,
    options: engine.options,
    correctAnswer: engine.correctAnswer,
    onSelect: (isCorrect) => {
      engine.answer(isCorrect);
      setTimeout(() => {
        const result = engine.finish();
        UI.renderEnd({
          correct: result.correct,
          studyType: engine.studyType,
          score: result.score,
          streak: result.streak,
          newlyUnlocked: result.newlyUnlocked,
        });
        window.currentShareData = {
          dayId: engine.dayId,
          studyType: engine.studyType,
          correct: result.correct,
          score: result.score.total,
        };
        UI.showScreen('screen-end');
      }, PHASE_TRANSITION_DELAY_MS);
    },
  });
  UI.showScreen('screen-game');
}

function buildMonthCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
    cells.push({ dayOfMonth, dayId: dayIdForDate(new Date(year, month, dayOfMonth)) });
  }
  return cells;
}

function renderCalendarScreen() {
  const currentDay = getCurrentDayId();
  const maxReachableDay = Math.min(currentDay, DataStore.getTotalDays());
  const studyType = getSelectedStudyType();

  const firstMonth = dateForDay(1);
  const lastMonth = dateForDay(DataStore.getTotalDays());
  const canGoPrev = calendarViewDate.getFullYear() > firstMonth.getFullYear()
    || calendarViewDate.getMonth() > firstMonth.getMonth();
  const canGoNext = calendarViewDate.getFullYear() < lastMonth.getFullYear()
    || calendarViewDate.getMonth() < lastMonth.getMonth();

  UI.renderCalendar({
    monthLabel: `${MONTH_NAMES[calendarViewDate.getMonth()]} ${calendarViewDate.getFullYear()}`,
    cells: buildMonthCells(calendarViewDate),
    todayDayId: currentDay,
    canGoPrev,
    canGoNext,
    getStatus: (dayId) => {
      if (dayId < 1 || dayId > maxReachableDay) return 'future';
      const entry = StorageService.getEntry(dayId, studyType);
      if (!entry) return 'available';
      return entry.correct ? 'won' : 'lost';
    },
    onSelectDay: (dayId) => playDay(dayId),
  });
}

function changeCalendarMonth(offset) {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1);
  renderCalendarScreen();
}

function openCalendar() {
  calendarViewDate = dateForDay(getCurrentDayId());
  calendarViewDate.setDate(1);
  renderCalendarScreen();
  UI.showScreen('screen-calendar');
}

function openStats() {
  const userData = StorageService.load();
  UI.renderStats(userData.stats);
  UI.showScreen('screen-stats');
}

function openAchievements() {
  const userData = StorageService.load();
  UI.renderAchievements(userData.stats.unlocked_achievements);
  UI.showScreen('screen-achievements');
}

function openAccessibility() {
  UI.showScreen('screen-accessibility');
}

function openHowToPlay() {
  UI.showScreen('screen-how-to-play');
}

/** Lê a frase/pergunta atual em voz alta (recurso de acessibilidade). */
function speakCurrentSentence() {
  if (!window.speechSynthesis) return;
  const text = document.getElementById('game-sentence').textContent.trim();
  if (!text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  window.speechSynthesis.speak(utterance);
}

function initSpeechSupport() {
  const btn = document.getElementById('btn-listen');
  if (window.speechSynthesis) return;
  btn.disabled = true;
  btn.title = 'Leitura em voz alta não é suportada neste navegador';
}

async function shareResult() {
  const data = window.currentShareData;
  if (!data) return;

  const resultEmoji = data.correct ? '🟩' : '🟥';
  const typeLabel = STUDY_TYPE_LABEL_TITLE[data.studyType];
  const text = `GRAMMA — Dia ${data.dayId} (${typeLabel}): ${resultEmoji} — ${data.score} pts`;

  try {
    await navigator.clipboard.writeText(text);
    alert('Resultado copiado para a área de transferência!');
  } catch {
    alert(text);
  }
}

function wireEvents() {
  document.getElementById('btn-play').addEventListener('click', () => playDay(getCurrentDayId()));
  document.getElementById('btn-open-calendar').addEventListener('click', openCalendar);
  document.getElementById('btn-calendar-prev').addEventListener('click', () => changeCalendarMonth(-1));
  document.getElementById('btn-calendar-next').addEventListener('click', () => changeCalendarMonth(1));
  document.getElementById('btn-open-stats').addEventListener('click', openStats);
  document.getElementById('btn-open-achievements').addEventListener('click', openAchievements);
  document.getElementById('btn-open-accessibility').addEventListener('click', openAccessibility);
  document.getElementById('btn-open-how-to-play').addEventListener('click', openHowToPlay);

  document.getElementById('study-type-toggle').addEventListener('click', (event) => {
    const btn = event.target.closest('.study-type-btn');
    if (!btn) return;
    selectStudyType(btn.dataset.studyType);
  });

  document.getElementById('btn-mode-hub-back').addEventListener('click', goToMenu);
  document.getElementById('btn-back-menu').addEventListener('click', openModeHub);
  document.getElementById('btn-end-menu').addEventListener('click', openModeHub);
  document.getElementById('btn-calendar-back').addEventListener('click', openModeHub);
  document.getElementById('btn-stats-back').addEventListener('click', openModeHub);
  document.getElementById('btn-achievements-back').addEventListener('click', goToMenu);
  document.getElementById('btn-accessibility-back').addEventListener('click', goToMenu);
  document.getElementById('btn-how-to-play-back').addEventListener('click', goToMenu);
  document.getElementById('btn-share').addEventListener('click', shareResult);
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('btn-listen').addEventListener('click', speakCurrentSentence);

  document.getElementById('btn-font-decrease').addEventListener('click', () => changeFontScale(-1));
  document.getElementById('btn-font-increase').addEventListener('click', () => changeFontScale(1));
}

function playIntro() {
  let alreadySeen = false;
  try {
    alreadySeen = Boolean(sessionStorage.getItem(INTRO_SESSION_KEY));
  } catch {
    alreadySeen = false;
  }

  if (alreadySeen || typeof window.gsap === 'undefined') {
    goToMenu();
    return;
  }

  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  } catch {
    // Sem localStorage/sessionStorage disponível: a cutscene simplesmente
    // pode aparecer de novo na próxima carga, o que é inofensivo.
  }

  UI.showScreen('screen-intro');

  const finishIntro = () => {
    tl.kill();
    goToMenu();
  };

  document.getElementById('btn-intro-skip').addEventListener('click', finishIntro, { once: true });

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: goToMenu });

  tl.set(['#intro-eyebrow', '#intro-logo', '#intro-title', '#intro-subtitle'], { opacity: 0 })
    .set('#intro-logo', { scale: 0.7, y: 10 })
    .set('#intro-title', { y: 20 })
    .to('#intro-eyebrow', { opacity: 1, duration: 0.5 })
    .to('#intro-logo', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }, '-=0.1')
    .to({}, { duration: 0.7 })
    .to(['#intro-logo', '#intro-eyebrow'], { opacity: 0, y: -10, duration: 0.45 })
    .to('#intro-title', { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.6)' })
    .to('#intro-subtitle', { opacity: 1, duration: 0.5 }, '-=0.2')
    .to('#screen-intro', { opacity: 0, duration: 0.6 }, '+=1');
}

function init() {
  initTheme();
  initAccessibility();
  initSpeechSupport();
  wireEvents();

  const requestedDay = getRequestedDayFromUrl();
  if (requestedDay) {
    playDay(requestedDay);
  } else {
    playIntro();
  }
}

init();
