# Plano de port: GRAMMA para React + TypeScript

## Objetivo (atualizado)

Substituir a implementação atual do GRAMMA (HTML, CSS e JS puro com ES Modules)
por uma aplicação **React + TypeScript** (Vite), mantendo:

- **paridade funcional**: três modos (Morfologia, Sintaxe, Sinônimos), calendário
  com arquivo, pontuação com bônus de sequência, streaks, 17 conquistas,
  estatísticas, tema claro/escuro, escala de fonte, leitura em voz alta,
  compartilhamento, intro animada e `?day=N`;
- **paridade visual**: mesmo design system (`style.css`) e animações em **GSAP**;
- **compatibilidade de dados do jogador**: mesma chave `gramma_user_data` e mesmo
  formato, para ninguém perder progresso;
- **publicação** no GitHub Pages;
- **ganhos do port**: tipagem de ponta a ponta, domínio testado (Vitest), fonte
  única dos dados (JSON importado direto, sem `build-data.js` nem `.js` gerados).

O código legado é removido ao final (decisão: o projeto novo *substitui* o atual).

## Decisões

| Tema | Decisão |
|---|---|
| Linguagem | TypeScript (`strict`) |
| Build | Vite + `@vitejs/plugin-react` |
| Rotas | React Router com `HashRouter` (GitHub Pages não tem fallback de SPA) |
| Estado do jogador | Store externa (`useSyncExternalStore`) sobre `localStorage`, mesmo formato atual |
| Animação | GSAP + `@gsap/react` (`useGSAP`), pacote npm no lugar do `vendor/` |
| CSS | `style.css` reaproveitado como global no início; sem reescrita de estilo |
| Testes | Vitest (domínio e hooks) + Testing Library (telas críticas) |
| Deploy | GitHub Actions, build do Vite publicado no Pages |

## Estrutura alvo

```
src/
  domain/      types.ts, scoreEngine.ts, achievements.ts, calendar.ts, game.ts
  data/        database_completo_365.json, database_sinonimos.json, stores.ts
  state/       userStore.ts, useUserData.ts, theme.ts, fontScale.ts
  hooks/       useSpeech.ts, useTodayDay.ts
  components/  AnswerButton, CalendarGrid, AchievementCard, Sparkles, ScreenTransition, TopBar
  screens/     Intro, Menu, ModeHub, Game, End, Calendar, Stats, Achievements, Accessibility, HowToPlay
  App.tsx, main.tsx, router.tsx
public/        favicon.svg, img/
```

## Fases e commits

Cada item é um commit atômico (Conventional Commits em pt-BR, como no histórico).
Ao fim de cada fase o app deve compilar (`tsc --noEmit`) e os testes passar.

### Fase 0: Preparação
1. `chore: move o app legado para legacy/ durante o port`
   Mantém o legado consultável para comparação; é apagado na Fase 8.
2. `chore: inicializa Vite + React + TypeScript (strict)`
   `package.json`, `tsconfig`, `vite.config.ts` com `base: '/Gramma/'`, `.gitignore`.
3. `chore: configura Vitest, ESLint e scripts npm`

### Fase 1: Domínio e dados (sem React)
4. `feat(domain): tipos centrais (StudyType, UserData, Stats, HistoryEntry)`
5. `feat(domain): scoreEngine em TS com testes`
   Bases 100/200/150 e bônus de 10% a cada 5 acertos seguidos.
6. `feat(domain): conquistas em TS com testes`
7. `feat(domain): calendário (getCurrentDayId, dateForDay, dayIdForDate) com relógio injetável e testes`
   Torna o `new Date()` testável e cobre virada de mês e dia fora do intervalo.
8. `feat(data): importa os JSON direto e cria DataStore/SynonymStore tipados`
   Remove a necessidade de `database.js`, `synonymsDatabase.js` e `build-data.js`.
9. `feat(domain): lógica de partida (buildPrompt, shuffle, resolução de dia/arquivo) com testes`
   Frase vira partes `{antes, destaque, depois}` em vez de HTML com `<span>`.

### Fase 2: Persistência e estado
10. `feat(state): userStore com load/save/migração de defaults e testes`
    Mantém a chave `gramma_user_data` e o merge com defaults.
11. `feat(state): recordResult (pontos, streaks, ofensiva diária, conquistas) com testes`
    Casos: arquivo não conta ofensiva, dia consecutivo, quebra de sequência.
12. `feat(state): useUserData, tema e escala de fonte aplicados no <html>`

### Fase 3: Esqueleto da aplicação
13. `feat: copia style.css, fontes e assets para o app React`
14. `feat: router (HashRouter), layout base e TopBar`
    Rotas: `/`, `/modo`, `/jogo/:dia?`, `/fim`, `/calendario`, `/estatisticas`,
    `/conquistas`, `/acessibilidade`, `/como-jogar`. Suporte a `?day=N`.
15. `feat: transição de tela com GSAP (entrada/saída)`
    Componente `ScreenTransition` com `useGSAP`, equivalente ao `showScreen`.

### Fase 4: Telas simples
16. `feat(screens): Menu com seletor de modo e badge de ofensiva`
17. `feat(screens): ModeHub (jogar / ver resultado)`
18. `feat(screens): Estatísticas`
19. `feat(screens): Conquistas`
20. `feat(screens): Acessibilidade (fonte) e Como jogar`
21. `feat: alternância de tema com flip em GSAP`

### Fase 5: Núcleo do jogo
22. `feat(screens): Game com frase destacada e opções embaralhadas (useMemo)`
23. `feat(screens): resposta única, feedback certo/errado e ícones de resultado`
24. `feat(screens): leitura em voz alta (useSpeech) com fallback desabilitado`
25. `feat(screens): tela End com pontuação, bônus, streak e conquistas novas`
26. `feat: Sparkles e compartilhar resultado (clipboard + toast no lugar de alert)`
27. `feat: reabrir resultado salvo ao jogar dia já concluído`

### Fase 6: Calendário
28. `feat(components): CalendarGrid com status won/lost/available/future`
29. `feat(screens): Calendário com navegação de mês e limites`

### Fase 7: Intro e acabamento
30. `feat(screens): Intro animada com timeline GSAP e botão pular`
    Exibida uma vez por sessão (`sessionStorage`), pulada com `?day=N`.
31. `fix: foco, aria-labels e navegação por teclado revisados`
32. `test: fluxos de tela (jogar e acertar, jogar e errar, arquivo, tema)`

### Fase 8: Substituição e entrega
33. `ci: workflow de build e deploy no GitHub Pages`
34. `refactor: remove legacy/ e scripts obsoletos`
35. `docs: atualiza README, CHANGELOG e estrutura do projeto`
    Novas instruções (`npm run dev`, `build`, `test`) e a nota de que não há mais
    "sem build step".

## Critérios de aceite

- [ ] Jogar um dia em cada modo e ver o mesmo resultado, pontos e streak do legado.
- [ ] Dados salvos pela versão antiga carregam sem perda na nova.
- [ ] Opções embaralham uma vez por pergunta, sem re-embaralhar a cada render.
- [ ] Calendário bloqueia o futuro; arquivo não altera a ofensiva diária.
- [ ] Tema, fonte e modo escolhido persistem entre sessões.
- [ ] `tsc --noEmit`, lint e testes passam; deploy no Pages funciona com `base` correto.
- [ ] Comparação visual com `docs/screenshot-*.png` sem regressões.

## Riscos

| Risco | Mitigação |
|---|---|
| Perder o progresso de quem já joga | Manter chave e formato; teste que carrega um JSON legado |
| Re-render embaralhando opções | `useMemo`/`useState` inicial por `(dia, modo)` |
| Fuso e virada de dia nos testes | Relógio injetável no módulo de calendário |
| Rotas quebrando no Pages | `HashRouter` e `base` do Vite |
| Intro GSAP vazando timeline | `useGSAP` com cleanup automático |
