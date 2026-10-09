export const ACHIEVEMENTS = [
  {
    id: 'first_step',
    name: 'Primeiro Passo',
    description: 'Complete seu primeiro desafio.',
    icon: 'flag',
    isUnlocked: (stats) => stats.games_played >= 1,
  },
  {
    id: 'morphologicador_10',
    name: 'Morfologicador',
    description: '10 acertos seguidos em Morfologia.',
    icon: 'psychology',
    isUnlocked: (stats) => stats.morph_correct_streak_max >= 10,
  },
  {
    id: 'morphologicador_20',
    name: 'Morfologicador de Elite',
    description: '20 acertos seguidos em Morfologia.',
    icon: 'psychology_alt',
    isUnlocked: (stats) => stats.morph_correct_streak_max >= 20,
  },
  {
    id: 'morphologicador_50',
    name: 'Morfologicador Supremo',
    description: '50 acertos seguidos em Morfologia.',
    icon: 'neurology',
    isUnlocked: (stats) => stats.morph_correct_streak_max >= 50,
  },
  {
    id: 'sintaticista_10',
    name: 'Sintaticista',
    description: '10 acertos seguidos em Sintaxe.',
    icon: 'account_tree',
    isUnlocked: (stats) => stats.syntax_correct_streak_max >= 10,
  },
  {
    id: 'sintaticista_20',
    name: 'Sintaticista de Elite',
    description: '20 acertos seguidos em Sintaxe.',
    icon: 'hub',
    isUnlocked: (stats) => stats.syntax_correct_streak_max >= 20,
  },
  {
    id: 'sintaticista_50',
    name: 'Mestre da Sintaxe',
    description: '50 acertos seguidos em Sintaxe.',
    icon: 'schema',
    isUnlocked: (stats) => stats.syntax_correct_streak_max >= 50,
  },
  {
    id: 'sinonimista_10',
    name: 'Sinonimista',
    description: '10 acertos seguidos em Sinônimos.',
    icon: 'sync_alt',
    isUnlocked: (stats) => stats.synonyms_correct_streak_max >= 10,
  },
  {
    id: 'sinonimista_20',
    name: 'Sinonimista de Elite',
    description: '20 acertos seguidos em Sinônimos.',
    icon: 'compare_arrows',
    isUnlocked: (stats) => stats.synonyms_correct_streak_max >= 20,
  },
  {
    id: 'sinonimista_50',
    name: 'Mestre dos Sinônimos',
    description: '50 acertos seguidos em Sinônimos.',
    icon: 'auto_stories',
    isUnlocked: (stats) => stats.synonyms_correct_streak_max >= 50,
  },
  {
    id: 'equilibrado',
    name: 'Equilibrado',
    description: 'Acerte pelo menos 10 questões de cada tipo (Morfologia, Sintaxe e Sinônimos).',
    icon: 'balance',
    isUnlocked: (stats) => stats.total_correct_morph >= 10
      && stats.total_correct_syntax >= 10
      && stats.total_correct_synonyms >= 10,
  },
  {
    id: 'streak_7',
    name: 'Ofensiva de Ferro',
    description: '7 dias seguidos jogando.',
    icon: 'local_fire_department',
    isUnlocked: (stats) => stats.max_streak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Ofensiva Lendária',
    description: '30 dias seguidos jogando.',
    icon: 'whatshot',
    isUnlocked: (stats) => stats.max_streak >= 30,
  },
  {
    id: 'games_50',
    name: 'Veterano',
    description: '50 desafios completados.',
    icon: 'military_tech',
    isUnlocked: (stats) => stats.games_played >= 50,
  },
  {
    id: 'games_100',
    name: 'Centurião',
    description: '100 desafios completados.',
    icon: 'workspace_premium',
    isUnlocked: (stats) => stats.games_played >= 100,
  },
  {
    id: 'score_5000',
    name: 'Pontuador',
    description: '5.000 pontos acumulados.',
    icon: 'trending_up',
    isUnlocked: (stats) => stats.total_score >= 5000,
  },
  {
    id: 'score_20000',
    name: 'Milionário Gramatical',
    description: '20.000 pontos acumulados.',
    icon: 'diamond',
    isUnlocked: (stats) => stats.total_score >= 20000,
  },
];

export function evaluateAchievements(stats) {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(stats)).map((a) => a.id);
}

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
