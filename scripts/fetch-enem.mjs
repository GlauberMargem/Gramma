#!/usr/bin/env node
// Gera `src/data/enem.json` a partir da API pública https://api.enem.dev.
//
// A API limita a 1 requisição por segundo. Este script faz as chamadas em
// série com uma pequena pausa e mantém apenas questões de Linguagens em
// português que possam ser exibidas em texto (sem imagens), no formato aceito
// por `EnemEntry`.
//
// Uso: npm run data:enem

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API = 'https://api.enem.dev/v1';
const PAGE_SIZE = 50;
const REQUEST_DELAY_MS = 1100;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'src', 'data', 'enem.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, attempt = 0) {
  const res = await fetch(url);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after')) || REQUEST_DELAY_MS;
    if (attempt >= 5) throw new Error(`Rate limit persistente em ${url}`);
    await sleep(retryAfter + 250);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Falha ${res.status} ao buscar ${url}`);
  }
  return res.json();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function cleanMarkdown(raw) {
  if (!raw) return '';
  let text = raw;
  // Links/imagens em Markdown: mantém apenas o texto visível.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Ênfase, código e títulos.
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Quebras de linha e HTML simples.
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeEntities(text);
  // Normaliza espaços especiais (NBSP, zero-width) e espaços em branco sem
  // destruir parágrafos.
  text = text.replace(/\u00a0|\u200b|\u200c|\u200d|\ufeff/g, ' ');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function hasImage(question) {
  if (question.files?.length) return true;
  const fields = [question.context, question.alternativesIntroduction];
  for (const alt of question.alternatives ?? []) {
    if (alt.file) return true;
    fields.push(alt.text);
  }
  return fields.some((value) => typeof value === 'string' && (value.includes('![') || /<img\b/i.test(value)));
}

function normalize(question, index) {
  const alternatives = question.alternatives ?? [];
  if (alternatives.length !== 5) return null;

  const correct = alternatives.find((alt) => alt.letter === question.correctAlternative);
  if (!correct) return null;

  const options = alternatives.map((alt) => cleanMarkdown(alt.text)).filter(Boolean);
  const answer = cleanMarkdown(correct.text);
  if (options.length !== 5 || !answer || !options.includes(answer)) return null;

  const context = cleanMarkdown(question.context);
  const statement = cleanMarkdown(question.alternativesIntroduction);
  if (!context && !statement) return null;

  return {
    day_id: index,
    question_id: Number(`${question.year}${String(question.index).padStart(3, '0')}`),
    year: question.year,
    index: question.index,
    discipline: question.discipline,
    question: context,
    statement,
    answer,
    options,
  };
}

async function fetchYear(year) {
  const questions = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${API}/exams/${year}/questions?limit=${PAGE_SIZE}&offset=${offset}`;
    const data = await getJson(url);
    questions.push(...(data.questions ?? []));
    hasMore = Boolean(data.metadata?.hasMore);
    offset += PAGE_SIZE;
    if (hasMore) await sleep(REQUEST_DELAY_MS);
  }

  return questions;
}

async function main() {
  console.log('Buscando lista de provas...');
  const exams = await getJson(`${API}/exams`);
  const years = [...new Set(exams.map((exam) => exam.year))].sort((a, b) => a - b);
  console.log(`Anos disponíveis: ${years.join(', ')}`);

  const entries = [];
  const seen = new Set();
  for (const year of years) {
    await sleep(REQUEST_DELAY_MS);
    process.stdout.write(`Buscando ${year}... `);
    const questions = await fetchYear(year);
    const usable = questions.filter(
      (question) =>
        question.discipline === 'linguagens' &&
        !question.language &&
        !hasImage(question),
    );
    for (const question of usable) {
      const entry = normalize(question, entries.length + 1);
      if (!entry) continue;
      const key = `${entry.question}\n${entry.statement}\n${entry.answer}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }
    console.log(`${usable.length} de linguagens (${questions.length} na prova)`);
  }

  // Reatribui day_id sequencial depois dos filtros, para que o sorteio do modo
  // livre cubra todo o pool sem buracos.
  entries.forEach((entry, i) => {
    entry.day_id = i + 1;
  });

  await writeFile(OUTPUT, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`\nOK: ${entries.length} questões gravadas em ${path.relative(ROOT, OUTPUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
