#!/usr/bin/env node
/**
 * Regenera os modulos JS embutidos (js/database.js e js/synonymsDatabase.js)
 * a partir dos JSON que sao a fonte oficial dos dados do jogo
 * (database_completo_365.json e database_sinonimos.json).
 *
 * O jogo importa os modulos .js diretamente (sem fetch, sem build step),
 * entao toda edicao feita nos arquivos .json so passa a valer dentro do
 * jogo depois de rodar este script e commitar os .js atualizados junto.
 *
 * Uso: node scripts/build-data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function buildGrammarDatabase() {
  const jsonPath = path.join(ROOT, 'database_completo_365.json');
  const outPath = path.join(ROOT, 'js', 'database.js');

  const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const body = JSON.stringify(entries, null, 2);
  fs.writeFileSync(outPath, `export const DATABASE = ${body};\n`);

  console.log(`js/database.js atualizado (${entries.length} dias).`);
}

function formatSynonymEntry(entry) {
  const options = entry.options.map((option) => JSON.stringify(option)).join(', ');
  return `  { "word_id": ${entry.word_id}, "word": ${JSON.stringify(entry.word)}, `
    + `"answer": ${JSON.stringify(entry.answer)}, "options": [${options}] }`;
}

function buildSynonymsDatabase() {
  const jsonPath = path.join(ROOT, 'database_sinonimos.json');
  const outPath = path.join(ROOT, 'js', 'synonymsDatabase.js');

  const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const lines = entries.map(formatSynonymEntry);
  fs.writeFileSync(outPath, `export const SYNONYMS_DATABASE = [\n${lines.join(',\n')}\n];\n`);

  console.log(`js/synonymsDatabase.js atualizado (${entries.length} palavras).`);
}

buildGrammarDatabase();
buildSynonymsDatabase();
