# GRAMMA

**Vision:** Desafio diário de língua portuguesa no estilo Wordle/Termo, com três modos: Morfologia, Sintaxe e Sinônimos.
**For:** Estudantes e entusiastas de gramática (projeto da disciplina de Jogos Digitais, UniRios).
**Solves:** Estudo gramatical diário e leve, com ofensiva, pontuação e conquistas para manter o hábito.

## Goals

- Portar 100% das funções atuais para React + TypeScript, com checklist de paridade (`spec.md`) toda verde.
- Nenhum jogador perde progresso: dados antigos de `gramma_user_data` carregam sem alteração (teste automatizado com fixture).
- Domínio (pontuação, conquistas, calendário, streaks) com testes automatizados, cobertura de linhas ≥ 90% nesses módulos.
- Publicar no GitHub Pages por CI a cada push na `main`.

## Tech Stack

**Core:**

- Framework: React 18/19 + React Router (HashRouter)
- Language: TypeScript (`strict`)
- Build: Vite

**Key dependencies:** `gsap` + `@gsap/react`, `vitest`, `@testing-library/react`, ESLint.

## Scope

**v1 (este port) inclui:**

- Todas as telas e regras do app atual (menu, modos, jogo, resultado, calendário, estatísticas, conquistas, acessibilidade, como jogar, intro)
- Tema claro/escuro, escala de fonte, leitura em voz alta, compartilhar resultado, `?day=N`
- Substituição total do código legado (HTML/JS puro)

**Explicitamente fora de escopo:**

- Novas mecânicas, novo conteúdo, novo design visual
- PWA/manifest, mascote, camada Canvas/WebGL (ver ROADMAP, M2)
- Backend, contas ou ranking online

## Constraints

- Técnico: GitHub Pages (sem fallback de SPA, daí o `HashRouter`; `base` = `/Gramma/`)
- Técnico: formato e chave do `localStorage` (`gramma_user_data`) são contrato com jogadores existentes
- Técnico: `START_DATE` fixo em 17/07/2026; comportamento de dia atual preservado
