import { describe, expect, it } from 'vitest';
import { AntonymStore, DataStore, EnemStore, SynonymStore } from '../data/stores';
import { buildQuestion, pickRandomMode, resolveDay, shuffle, splitHighlight } from './game';

describe('splitHighlight', () => {
  it('usa o <span> existente', () => {
    expect(splitHighlight('Ele <span>chegou</span> cedo.', 'outra')).toEqual({
      before: 'Ele ',
      highlight: 'chegou',
      after: ' cedo.',
    });
  });

  it('sem span, destaca a primeira ocorrência de target_word', () => {
    expect(splitHighlight('A leitura da leitura.', 'leitura')).toEqual({
      before: 'A ',
      highlight: 'leitura',
      after: ' da leitura.',
    });
  });

  it('sem span e sem ocorrência, não destaca nada', () => {
    expect(splitHighlight('Frase simples.', 'ausente')).toEqual({
      before: 'Frase simples.',
      highlight: '',
      after: '',
    });
    expect(splitHighlight('Frase simples.')).toEqual({
      before: 'Frase simples.',
      highlight: '',
      after: '',
    });
  });
});

describe('resolveDay', () => {
  it('dia futuro vira o atual, sem arquivo', () => {
    expect(resolveDay(50, 10, 365)).toEqual({ dayId: 10, isArchive: false });
  });
  it('dia passado é arquivo', () => {
    expect(resolveDay(3, 10, 365)).toEqual({ dayId: 3, isArchive: true });
  });
  it('dia pedido igual ao atual não é arquivo', () => {
    expect(resolveDay(10, 10, 365)).toEqual({ dayId: 10, isArchive: false });
  });
  it('sem dia pedido usa o atual', () => {
    expect(resolveDay(0, 10, 365)).toEqual({ dayId: 10, isArchive: false });
  });
  it('clamp pelo total', () => {
    expect(resolveDay(400, 500, 365)).toEqual({ dayId: 365, isArchive: true });
    // paridade com o legado: sem dia pedido nunca é arquivo
    expect(resolveDay(0, 500, 365)).toEqual({ dayId: 365, isArchive: false });
  });
});

describe('shuffle', () => {
  it('não muta e preserva os itens', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual(input);
  });
  it('rng fixo é determinístico', () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual(shuffle([1, 2, 3, 4], () => 0));
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});

describe('buildQuestion', () => {
  it('morfologia: mantém opções, contém a resposta e destaca a palavra', () => {
    const day = DataStore.getDay(1)!;
    const q = buildQuestion('morphology', 1, () => 0.3);
    expect([...q.options].sort()).toEqual([...day.morphology.options].sort());
    expect(q.options).toContain(q.answer);
    expect(q.answer).toBe(day.morphology.answer);
    expect(q.prompt.filter((p) => p.highlight).map((p) => p.text)).toEqual(['leitura']);
    expect(q.prompt.map((p) => p.text).join('')).toBe(day.sentence);
  });

  it('sintaxe usa as opções de syntax', () => {
    const day = DataStore.getDay(1)!;
    const q = buildQuestion('syntax', 1);
    expect(q.answer).toBe(day.syntax.answer);
  });

  it('rng fixo é determinístico', () => {
    expect(buildQuestion('syntax', 2, () => 0.5)).toEqual(buildQuestion('syntax', 2, () => 0.5));
  });

  it('sinônimos: prompt "Qual é o sinônimo de X?"', () => {
    const entry = SynonymStore.getDay(1);
    const q = buildQuestion('synonyms', 1);
    expect(q.prompt).toEqual([
      { text: 'Qual é o sinônimo de ' },
      { text: entry.word, highlight: true },
      { text: '?' },
    ]);
    expect([...q.options].sort()).toEqual([...entry.options].sort());
    expect(q.answer).toBe(entry.answer);
  });

  it('antônimos: prompt "Qual é o antônimo de X?"', () => {
    const entry = AntonymStore.getDay(1);
    const q = buildQuestion('antonyms', 1);
    expect(q.prompt).toEqual([
      { text: 'Qual é o antônimo de ' },
      { text: entry.word, highlight: true },
      { text: '?' },
    ]);
    expect([...q.options].sort()).toEqual([...entry.options].sort());
    expect(q.answer).toBe(entry.answer);
  });

  it('ENEM: junta texto-base e enunciado, com 5 alternativas', () => {
    const entry = EnemStore.getDay(1);
    const q = buildQuestion('enem', 1);
    expect(q.prompt).toHaveLength(1);
    expect(q.prompt[0].text).toContain(entry.question);
    expect(q.prompt[0].text).toContain(entry.statement ?? '');
    expect(q.options).toHaveLength(5);
    expect([...q.options].sort()).toEqual([...entry.options].sort());
    expect(q.answer).toBe(entry.answer);
  });
});

describe('pickRandomMode', () => {
  it('sorteia entre os modos com banco disponível', () => {
    expect(pickRandomMode(() => 0)).toBe('morphology');
    expect(pickRandomMode(() => 0.999999)).toBe('antonyms');
  });
});
