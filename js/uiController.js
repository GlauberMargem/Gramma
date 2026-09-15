import { ACHIEVEMENTS } from './achievements.js';

const el = (id) => document.getElementById(id);

const SCREENS = [
  'screen-menu', 'screen-mode-hub', 'screen-game', 'screen-end', 'screen-calendar',
  'screen-stats', 'screen-achievements', 'screen-accessibility', 'screen-how-to-play',
];

export function showScreen(screenId) {
  for (const id of SCREENS) {
    el(id).hidden = id !== screenId;
  }
  // Nas telas com cabeçalho próprio (botão "✕"), esconde a barra de ícones
  // flutuante para não colidir com ele em telas estreitas.
  el('top-bar').hidden = screenId !== 'screen-menu';
}

const STUDY_TYPE_LABEL = {
  morphology: 'Morfologia',
  syntax: 'Sintaxe',
  synonyms: 'Sinônimos',
};

const STUDY_TYPE_ICON = {
  morphology: 'psychology',
  syntax: 'account_tree',
  synonyms: 'sync_alt',
};

const PHASE_LABEL = {
  morphology: 'MORFOLOGIA — CLASSE GRAMATICAL',
  syntax: 'SINTAXE — FUNÇÃO SINTÁTICA',
  synonyms: 'SINÔNIMOS — ESCOLHA O EQUIVALENTE',
};

export function renderMenu({ streakDays, studyType }) {
  el('menu-streak').hidden = streakDays <= 0;
  if (streakDays > 0) {
    el('menu-streak-text').textContent = `Ofensiva atual: ${streakDays} dia(s)`;
  }
  setActiveStudyType(studyType);
}

export function setActiveStudyType(studyType) {
  document.querySelectorAll('.study-type-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.studyType === studyType);
  });
}

export function renderModeHub({ studyType, currentDay, playIcon, playLabel }) {
  el('mode-hub-icon').textContent = STUDY_TYPE_ICON[studyType];
  el('mode-hub-title').textContent = STUDY_TYPE_LABEL[studyType];
  el('mode-hub-badge').textContent = `DIA ${currentDay}`;
  el('btn-play-icon').textContent = playIcon;
  el('btn-play-label').textContent = playLabel;
}

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Renderiza a frase + grade de opções para o tipo de estudo escolhido.
 * onSelect(isCorrect) é chamado uma única vez, na primeira escolha do jogador.
 */
export function renderQuestion({ dayId, totalDays, isArchive, studyType, sentenceHtml, options, correctAnswer, onSelect }) {
  el('game-badge').textContent = isArchive ? `DIA ${dayId} (ARQUIVO)` : `DIA ${dayId} / ${totalDays}`;
  el('game-sentence').innerHTML = sentenceHtml;
  el('game-phase-label').textContent = PHASE_LABEL[studyType];

  const container = el('game-answers');
  container.innerHTML = '';

  options.forEach((optionText, index) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.dataset.option = optionText;
    btn.innerHTML = `<span class="option-letter">${LETTERS[index]}</span><span>${optionText}</span>`;
    container.appendChild(btn);
  });

  let answered = false;
  container.onclick = (event) => {
    const btn = event.target.closest('.answer-btn');
    if (!btn || answered) return;
    answered = true;

    const selected = btn.dataset.option;
    const isCorrect = selected === correctAnswer;
    btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

    if (!isCorrect) {
      const correctBtn = [...container.children].find((c) => c.dataset.option === correctAnswer);
      correctBtn?.classList.add('is-correct');
    }

    [...container.children].forEach((c) => (c.disabled = true));

    onSelect(isCorrect);
  };
}

export function renderEnd({ correct, studyType, score, streak, newlyUnlocked }) {
  const screen = el('screen-end');
  const isMilestone = score.isMilestone;
  screen.classList.toggle('is-perfect', isMilestone);

  el('end-title').textContent = correct ? 'Resposta certa!' : 'Não foi dessa vez';
  el('end-score').textContent = `${score.total} pts`;

  const rows = [[STUDY_TYPE_LABEL[studyType], `${score.base} pts`]];
  if (score.bonus > 0) rows.push(['Bônus de sequência (+10%)', `+${score.bonus} pts`]);

  el('end-breakdown').innerHTML = rows
    .map(([label, value]) => `<div class="row${label.includes('Bônus') ? ' bonus' : ''}"><span>${label}</span><span>${value}</span></div>`)
    .join('');

  const streakLine = el('end-streak-line');
  if (correct && streak > 0) {
    streakLine.hidden = false;
    streakLine.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">local_fire_department</span> ${streak} acerto(s) seguido(s) em ${STUDY_TYPE_LABEL[studyType]}`;
  } else {
    streakLine.hidden = true;
    streakLine.innerHTML = '';
  }

  const achievementsContainer = el('end-achievements');
  achievementsContainer.innerHTML = '';
  for (const id of newlyUnlocked) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) continue;
    achievementsContainer.appendChild(buildAchievementToast(achievement));
  }

  if (isMilestone || newlyUnlocked.length > 0) spawnSparkles();
}

function buildAchievementToast(achievement) {
  const wrapper = document.createElement('div');
  wrapper.className = 'achievement-toast';
  wrapper.innerHTML = `
    <span class="achievement-icon material-symbols-outlined" aria-hidden="true">${achievement.icon}</span>
    <span>
      <span class="achievement-name" style="display:block">Conquista: ${achievement.name}</span>
      <span class="achievement-desc">${achievement.description}</span>
    </span>
  `;
  return wrapper;
}

function spawnSparkles() {
  const container = el('end-sparkles');
  container.innerHTML = '';
  const icons = ['auto_awesome', 'star', 'stars'];

  for (let i = 0; i < 16; i++) {
    const span = document.createElement('span');
    span.className = 'material-symbols-outlined sparkle';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = icons[i % icons.length];
    span.style.left = `${Math.random() * 100}%`;
    span.style.top = `${Math.random() * 100}%`;
    span.style.animationDelay = `${Math.random() * 0.4}s`;
    container.appendChild(span);
  }
}

/**
 * cells: array (semanas completas) onde cada posição é `null` (preenchimento
 * antes do dia 1 / depois do último dia do mês) ou { dayOfMonth, dayId }.
 */
export function renderCalendar({ monthLabel, cells, todayDayId, canGoPrev, canGoNext, getStatus, onSelectDay }) {
  el('calendar-month-label').textContent = monthLabel;
  el('btn-calendar-prev').disabled = !canGoPrev;
  el('btn-calendar-next').disabled = !canGoNext;

  const grid = el('calendar-grid');
  grid.innerHTML = '';

  for (const cell of cells) {
    const btn = document.createElement('button');
    btn.className = 'calendar-day';

    if (!cell) {
      btn.classList.add('is-empty');
      grid.appendChild(btn);
      continue;
    }

    btn.textContent = cell.dayOfMonth;
    const status = getStatus(cell.dayId);
    btn.classList.add(`status-${status}`);
    if (cell.dayId === todayDayId) btn.classList.add('is-today');

    if (status === 'future') {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => onSelectDay(cell.dayId));
    }

    grid.appendChild(btn);
  }
}

export function renderStats(stats) {
  const rows = [
    ['Pontuação total', `${stats.total_score} pts`],
    ['Desafios completados', stats.games_played],
    ['Ofensiva atual', `${stats.current_streak} dia(s)`],
    ['Maior ofensiva', `${stats.max_streak} dia(s)`],
    ['Acertos seguidos (Morfologia)', stats.morph_correct_streak],
    ['Recorde de acertos seguidos (Morfologia)', stats.morph_correct_streak_max],
    ['Acertos seguidos (Sintaxe)', stats.syntax_correct_streak],
    ['Recorde de acertos seguidos (Sintaxe)', stats.syntax_correct_streak_max],
    ['Acertos seguidos (Sinônimos)', stats.synonyms_correct_streak],
    ['Recorde de acertos seguidos (Sinônimos)', stats.synonyms_correct_streak_max],
    ['Total de acertos (Morfologia)', stats.total_correct_morph],
    ['Total de acertos (Sintaxe)', stats.total_correct_syntax],
    ['Total de acertos (Sinônimos)', stats.total_correct_synonyms],
    ['Conquistas desbloqueadas', `${stats.unlocked_achievements.length} / ${ACHIEVEMENTS.length}`],
  ];

  el('stats-list').innerHTML = rows
    .map(([label, value]) => `<div class="stat-row"><span class="label">${label}</span><span>${value}</span></div>`)
    .join('');
}

export function renderAchievements(unlockedIds) {
  const unlockedSet = new Set(unlockedIds);
  const container = el('achievements-list');
  container.innerHTML = '';

  for (const achievement of ACHIEVEMENTS) {
    const isUnlocked = unlockedSet.has(achievement.id);
    const card = document.createElement('div');
    card.className = `achievement-card${isUnlocked ? '' : ' is-locked'}`;
    card.innerHTML = `
      <span class="achievement-icon material-symbols-outlined" aria-hidden="true">${achievement.icon}</span>
      <span>
        <span class="achievement-name" style="display:block">${achievement.name}</span>
        <span class="achievement-desc">${achievement.description}</span>
      </span>
    `;
    container.appendChild(card);
  }
}
