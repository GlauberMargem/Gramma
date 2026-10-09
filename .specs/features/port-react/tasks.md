# Port para React + TypeScript: Tasks

**Design**: `.specs/features/port-react/design.md`
**Status**: Em execução (emendas E1–E6 aplicadas)

Convenções: 1 task = 1 commit (Conventional Commits em pt-BR). Gates em todo commit a partir da T3: `npm run typecheck && npm run lint && npm test`. `legacy/` fica consultável até a T40. Tools: MCP nenhum; Skills: `tdd` nas tasks de domínio/estado, `frontend-design` não é necessário (paridade visual). Execução paralela com agentes: ver `EXECUTION.md` (ondas, regras e emendas E1–E6, que prevalecem sobre T2/T3/T14/T15/T26/T27/T31 abaixo).

---

## Execution Plan

```
Fase 0 (seq):   T1 → T2 → T3
Fase 1:         T3 → T4 → ┬ T5 [P]
                          ├ T6 [P]
                          ├ T7 [P]
                          └ T8 [P] → T9
Fase 2 (seq):   T4 → T10 → T11(T5,T6) → T12 → T13
Fase 3:         T3 → T14 → T15 → T16 → T17
Fase 4:         T13,T17 → ┬ T18 [P]
                          ├ T19 [P]
                          ├ T20 [P]
                          ├ T21 [P]
                          ├ T22 [P]
                          ├ T23 [P]
                          └ T24 (após T17, T22)
Fase 5 (seq):   T9,T13,T19 → T25 → T26 → T27 → T28 → T29 → T30 → T31
Fase 6:         T7,T13,T19 → T32 → T33
Fase 7:         T33,T31 → T34 → T35 → T36
Fase 8 (seq):   T36 → T37 → T38 → T39 → T40
```

Ondas de execução (EXECUTION.md): A=T1–T3 · B=T4 · C=T5,T6,T7,T8,T10,T14 · D=T9,T11,T12,T15 · E=T13,T16 · F=T17,T25,T28,T32 · G=T18–T23 · H=T24,T26,T29,T33 · I=T27,T30 · J=T31 · K=T34–T36 · L=T37–T40.

Marcos verificáveis: **M-A** (fim da Fase 2): domínio+estado 100% testados. **M-B** (fim da Fase 4): navegar por todas as telas simples. **M-C** (fim da Fase 5): jogar e ver resultado. **M-D** (fim da Fase 7): paridade completa. **M-E** (Fase 8): publicado e legado removido.

---

## Fase 0: Preparação

### ✅ T1: Mover o app legado para `legacy/`
**What**: `git mv` de `index.html`, `css/`, `js/`, `scripts/`, `favicon.svg`, `img/`, `database_*.json` para `legacy/`. Mantém `docs/`, `README.md`, `CHANGELOG.md`, `*.md` e `.specs/` na raiz.
**Where**: raiz → `legacy/`
**Depends on**: -
**Reqs**: OPS-02 (preparação)
**Done when**:
- [x] `legacy/index.html` abre com `python -m http.server` dentro de `legacy/`
- [x] Nenhum arquivo fora do escopo foi movido
**Verify**: `git status --short | head`; `cd legacy && python -m http.server 8000` e abrir a página
**Commit**: `chore: move o app legado para legacy/ durante o port`

### ✅ T2: Inicializar Vite + React + TypeScript
**What**: `package.json`, `tsconfig.json` (`strict`, `resolveJsonModule`), `vite.config.ts` (`base: '/Gramma/'`), `index.html` mínimo, `src/main.tsx`, `src/App.tsx` com placeholder, `.gitignore` (`node_modules`, `dist`; `package-lock.json` passa a ser versionado, necessário para `npm ci`).
**Emenda E1**: instalar já aqui **todas** as dependências: `react`, `react-dom`, `react-router-dom`, `gsap`, `@gsap/react`, `vitest`, `jsdom`, `@testing-library/{react,user-event,jest-dom}`, `jest-axe`, `typescript-eslint`, `eslint-plugin-react-hooks`. Depois da T3 nenhum agente edita `package.json`.
**Where**: raiz
**Depends on**: T1
**Reqs**: -
**Done when**:
- [x] `npm run dev` serve o placeholder
- [x] `npm run build` gera `dist/`
**Verify**: `npm ci && npm run build` → exit 0
**Commit**: `chore: inicializa Vite + React + TypeScript (strict)`

### ✅ T3: Vitest, ESLint e scripts
**What**: Vitest (`jsdom`), Testing Library, ESLint (typescript-eslint + react-hooks), scripts `typecheck`, `lint`, `test`, `test:cov`. Um teste de fumaça.
**Emenda E1**: as dependências já vêm da T2; a T3 só configura. Depois dela, `package.json` é proibido para agentes.
**Where**: `package.json`, `vitest.config.ts`, `eslint.config.js`, `src/setupTests.ts`
**Depends on**: T2
**Done when**:
- [x] Os quatro scripts rodam e passam
**Verify**: `npm run typecheck && npm run lint && npm test`
**Commit**: `chore: configura Vitest, ESLint e scripts npm`

---

## Fase 1: Domínio e dados

### ✅ T4: Tipos centrais
**What**: `StudyType`, `Settings`, `Stats`, `HistoryEntry`, `UserData`, `Score`, `GrammarDay`, `SynonymEntry`, `PromptPart`, `Question`, `Achievement` (conforme design).
**Where**: `src/domain/types.ts`
**Depends on**: T3
**Reqs**: STO-01
**Done when**:
- [x] Compila em `strict`
**Verify**: `npm run typecheck`
**Commit**: `feat(domain): tipos centrais (StudyType, UserData, Stats, HistoryEntry)`

### ✅ T5: scoreEngine [P]
**What**: Portar `legacy/js/scoreEngine.js`.
**Where**: `src/domain/scoreEngine.ts` + `.test.ts`
**Depends on**: T4 · **Reuses**: `legacy/js/scoreEngine.js` · **Reqs**: DOM-01
**Done when**:
- [x] Errou = `{0,0,0,false}`; bases 100/200/150
- [x] Marcos em 5, 10, 15; bônus 10/20/15 por modo; streak 0 não é marco
**Verify**: `npm test -- scoreEngine`
**Commit**: `feat(domain): scoreEngine em TS com testes`

### ✅ T6: achievements [P]
**What**: Portar o catálogo (17) e `evaluateAchievements`/`getAchievement`.
**Where**: `src/domain/achievements.ts` + `.test.ts`
**Depends on**: T4 · **Reuses**: `legacy/js/achievements.js` · **Reqs**: DOM-02
**Done when**:
- [x] 17 ids únicos
- [x] Teste de limiar por conquista (borda: n−1 não, n sim); `equilibrado` exige 10 de cada
**Verify**: `npm test -- achievements`
**Commit**: `feat(domain): conquistas em TS com testes`

### ✅ T7: calendar [P]
**What**: `getCurrentDayId(now?)`, `dateForDay`, `dayIdForDate`, `buildMonthCells`, `canNavigate`.
**Where**: `src/domain/calendar.ts` + `.test.ts`
**Depends on**: T4 · **Reuses**: `legacy/js/gameEngine.js`, `legacy/js/main.js` (`buildMonthCells`, limites) · **Reqs**: DOM-03, CAL-01, CAL-02, CAL-04
**Done when**:
- [x] 17/07/2026 → dia 1; antes de START → dia 1 (clamp `max(1,…)`)
- [x] Grade de julho/2026 começa na quarta (3 células nulas, domingo primeiro); células nulas de preenchimento
- [x] Limites de navegação nos meses do dia 1 e do dia 365
**Verify**: `npm test -- calendar`
**Commit**: `feat(domain): calendário com relógio injetável e testes`

### ✅ T8: Dados e stores [P]
**What**: Copiar os JSON de `legacy/` para `src/data/`, criar `DataStore` (`getTotalDays`, `getDay`) e `SynonymStore` (`getPoolSize`, `getDay` com ciclo).
**Where**: `src/data/*.json`, `src/data/stores.ts` + `.test.ts`
**Depends on**: T4 · **Reuses**: `legacy/js/dataStore.js`, `synonymStore.js` · **Reqs**: DOM-04
**Done when**:
- [x] 365 dias; `getDay(366)` → `null`
- [x] Sinônimo do dia `pool+1` = dia 1
- [x] JSON validado contra os tipos (4 opções, `answer` ∈ `options`)
**Verify**: `npm test -- stores`
**Commit**: `feat(data): importa os JSON e cria stores tipadas`

### ✅ T9: Lógica da partida
**What**: `shuffle(rng)`, `splitHighlight`, `resolveDay`, `buildQuestion`.
**Where**: `src/domain/game.ts` + `.test.ts`
**Depends on**: T8 · **Reuses**: `legacy/js/gameEngine.js`, `dataStore.ensureHighlighted` · **Reqs**: DOM-05, DOM-04, GAME-03
**Done when**:
- [x] `splitHighlight` usa `<span>` existente ou a primeira ocorrência de `target_word`
- [x] `resolveDay`: dia > atual vira atual, `isArchive` correto; clamp pelo total
- [x] `buildQuestion` mantém o conjunto das opções e contém `answer`; `rng` fixo é determinístico
- [x] Sinônimos: prompt "Qual é o sinônimo de **X**?"
**Verify**: `npm test -- game`
**Commit**: `feat(domain): montagem da pergunta, shuffle e resolução de dia`

---

## Fase 2: Persistência e estado

### ✅ T10: Defaults e parse do storage
**What**: `createDefaultUserData()` (uuid com fallback, tema por `prefers-color-scheme`) e `parseStored(raw)` com merge de `settings`/`stats`. Fixture `legacy-user-data.json` com dados reais do formato antigo.
**Where**: `src/state/userData.ts`, `src/state/__fixtures__/legacy-user-data.json` + `.test.ts`
**Depends on**: T4 · **Reuses**: `legacy/js/storageService.js` · **Reqs**: STO-01
**Done when**:
- [x] Fixture legada carrega com `history` e `uuid` preservados
- [x] `null`, vazio e JSON inválido → defaults
- [x] Campo novo ausente em `stats` recebe default
**Verify**: `npm test -- userData`
**Commit**: `feat(state): defaults e parse compatível com o formato legado`

### ✅ T11: recordResult
**What**: Função pura com a regra de `StorageService.recordResult`.
**Where**: `src/domain/recordResult.ts` + `.test.ts`
**Depends on**: T5, T6, T10 · **Reuses**: `legacy/js/storageService.js` · **Reqs**: STO-02, STO-03, DOM-01, DOM-02
**Done when**:
- [x] Acerto incrementa streak, total e máximo; erro zera o streak do modo
- [x] Gravação de `history["{dia}:{modo}"]` com todos os campos
- [x] Ofensiva: primeiro jogo, dia consecutivo, salto de dias (volta a 1), mesmo dia (sem mudança)
- [x] Arquivo não altera `current_streak`/`last_streak_day`
- [x] `newlyUnlocked` só traz ids novos; não muta a entrada
**Verify**: `npm test -- recordResult`
**Commit**: `feat(domain): recordResult (pontos, streaks, ofensiva e conquistas)`

### ✅ T12: userStore
**What**: Store com `getSnapshot` cacheado, `subscribe`, `update`, escuta de `storage`, `try/catch` em leitura/escrita.
**Where**: `src/state/userStore.ts` + `.test.ts`
**Depends on**: T10 · **Reqs**: STO-01, STO-04
**Done when**:
- [x] `getSnapshot()` devolve a mesma referência até um `update`
- [x] `update` persiste na chave `gramma_user_data` e notifica assinantes
- [x] `setItem` lançando erro não quebra e o estado em memória segue válido
**Verify**: `npm test -- userStore`
**Commit**: `feat(state): userStore persistente com snapshot estável`

### ✅ T13: Hooks de estado, tema e fonte
**What**: `useUserData`, `useTheme`, `useFontScale` (aplica `data-theme`/`--font-scale` em `<html>`, rótulos Pequena…Extra Grande, clamp 0..3).
**Where**: `src/state/hooks.ts` + `.test.tsx`
**Depends on**: T12 · **Reuses**: `legacy/js/theme.js`, `accessibility.js` · **Reqs**: PREF-01, PREF-03
**Done when**:
- [x] Alternar tema muda `document.documentElement.dataset.theme` e persiste
- [x] Fonte não passa de 0..3
**Verify**: `npm test -- hooks`
**Commit**: `feat(state): hooks de dados do usuário, tema e escala de fonte`

---

## Fase 3: Esqueleto da aplicação

### ✅ T14: CSS, assets e shell HTML
**What**: Copiar `style.css` para `src/styles/`, `favicon.svg` e `unirios-logo.png` para `public/`, `<link>` da fonte Material Symbols e título no `index.html`.
**Where**: `src/styles/style.css`, `public/`, `index.html`
**Emenda E3**: `style.css` fica congelado após esta task; CSS novo vira task `fix:` serial do orquestrador.
**Depends on**: T3 · **Reqs**: paridade visual
**Done when**:
- [x] Placeholder renderiza com as variáveis do tema
**Verify**: `npm run build`; abrir `dev` e conferir fundo/tema
**Commit**: `feat: traz style.css e assets para o app React`

### ✅ T15: Router, App e boot
**What**: `HashRouter` com as rotas do design, rotas inválidas → `/`; boot lê `?day=N` (válido → `#/jogo/N`, limpa a query) e decide por `/intro` (sessão).
**Where**: `src/router.tsx`, `src/App.tsx`, `src/main.tsx`, `src/boot.ts` + `.test.ts`, stubs `src/screens/{Menu,ModeHub,Game,End,Calendar,Stats,Achievements,Accessibility,HowToPlay,Intro}.tsx`
**Emenda E2**: o router importa todas as telas desses stubs (cada um exporta um componente placeholder). Tasks de tela substituem só o próprio arquivo, sem tocar `router.tsx`.
**Depends on**: T14 · **Reuses**: `legacy/js/main.js` (`getRequestedDayFromUrl`, `playIntro`) · **Reqs**: NAV-01, NAV-02, NAV-03
**Done when**:
- [x] `resolveBoot(search, introSeen)` coberto: `?day=5`, `?day=0`, `?day=abc`, sem query
- [x] Todas as rotas resolvem para um placeholder
**Verify**: `npm test -- boot`
**Commit**: `feat: roteamento (HashRouter) e decisão de boot`

### ✅ T16: ScreenTransition (GSAP)
**What**: Entrada `fromTo({opacity:0,y:10}→{1,0}, 0.25s power2.out)`; saída `to({opacity:0,y:-8}, 0.14s power1.in)` antes de navegar; `prefers-reduced-motion` desliga.
**Where**: `src/components/ScreenTransition.tsx`, `src/hooks/useAnimatedNavigate.ts`
**Depends on**: T15 · **Reuses**: `legacy/js/uiController.js` `showScreen` · **Reqs**: NAV-04
**Done when**:
- [x] Navegar entre dois placeholders anima e não deixa 2 telas visíveis
- [x] Sem `reduced-motion` aplicado, nada de timeline pendente ao desmontar
**Verify**: `npm test -- ScreenTransition` (gsap mockado) + checagem manual
**Commit**: `feat: transição de tela com GSAP`

### ✅ T17: TopBar e primitivos
**What**: `MaterialIcon`, `IconButton`, `TopBar` (tema + acessibilidade), exibida só no Menu (por layout de rota).
**Where**: `src/components/{MaterialIcon,IconButton,TopBar}.tsx`
**Depends on**: T13, T16 · **Reqs**: NAV-05
**Done when**:
- [x] `TopBar` só presente na rota `/`
- [x] Botões com `aria-label`
**Verify**: `npm test -- TopBar`
**Commit**: `feat(components): TopBar e primitivos de ícone/botão`

---

## Fase 4: Telas simples (paralelizáveis)

### ✅ T18: Menu [P]
**What**: Logo/título, badge de ofensiva (se > 0), seletor de modo (salva `study_type`, navega a `/modo`), atalhos para Como jogar e Conquistas.
**Where**: `src/screens/Menu.tsx` + `.test.tsx`
**Depends on**: T13, T17 · **Reuses**: marcação de `legacy/index.html` `#screen-menu` · **Reqs**: SCR-01
**Done when**:
- [x] Badge só com `current_streak > 0`
- [x] Clicar em um modo persiste e navega
- [x] Modo salvo aparece com `is-active`
**Verify**: `npm test -- Menu`
**Commit**: `feat(screens): Menu com seletor de modo e ofensiva`

### ✅ T19: ModeHub [P]
**What**: Ícone/título do modo, `DIA N`, botão JOGAR/VER RESULTADO conforme `history`, atalhos Calendário e Estatísticas, voltar.
**Where**: `src/screens/ModeHub.tsx` + `.test.tsx`
**Depends on**: T13, T17, T7 · **Reqs**: SCR-02
**Done when**:
- [x] Rótulo/ícone corretos nos dois estados
**Verify**: `npm test -- ModeHub`
**Commit**: `feat(screens): ModeHub (jogar ou ver resultado)`

### ✅ T20: Estatísticas [P]
**What**: As 14 linhas de `renderStats`; componente `StatRow`.
**Where**: `src/screens/Stats.tsx`, `src/components/StatRow.tsx` + `.test.tsx`
**Depends on**: T13, T17, T6 · **Reqs**: SCR-03
**Done when**:
- [x] 14 linhas; conquistas `n / 17`
**Verify**: `npm test -- Stats`
**Commit**: `feat(screens): Estatísticas`

### ✅ T21: Conquistas [P]
**What**: Lista das 17 com `AchievementCard`, bloqueadas em `is-locked`.
**Where**: `src/screens/Achievements.tsx`, `src/components/AchievementCard.tsx` + `.test.tsx`
**Depends on**: T13, T17, T6 · **Reqs**: SCR-04
**Done when**:
- [x] 17 cards; só os ids desbloqueados sem `is-locked`
**Verify**: `npm test -- Achievements`
**Commit**: `feat(screens): Conquistas`

### ✅ T22: Acessibilidade [P]
**What**: Controles de fonte (−/+, rótulo) e voltar.
**Where**: `src/screens/Accessibility.tsx` + `.test.tsx`
**Depends on**: T13, T17 · **Reqs**: PREF-03
**Done when**:
- [x] Botões desabilitam nos limites; rótulo acompanha
**Verify**: `npm test -- Accessibility`
**Commit**: `feat(screens): Acessibilidade (tamanho da fonte)`

### ✅ T23: Como jogar [P]
**What**: Conteúdo textual de `#screen-how-to-play`.
**Where**: `src/screens/HowToPlay.tsx`
**Depends on**: T17 · **Reqs**: SCR-07
**Done when**:
- [x] Texto equivalente ao legado; botão voltar vai ao Menu
**Verify**: `npm test -- HowToPlay`
**Commit**: `feat(screens): Como jogar`

### ✅ T24: Flip do tema com GSAP
**What**: Timeline: `scaleX→0` (0.14 s) → trocar `data-theme`+ícone → `scaleX→1` (0.24 s `back.out(2.4)`) → `clearProps`. Valor persiste no clique.
**Where**: `src/components/ThemeToggle.tsx`, usado na `TopBar`
**Depends on**: T17, T22 · **Reuses**: `legacy/js/theme.js` · **Reqs**: PREF-02
**Done when**:
- [x] `data-theme` muda no ponto fechado; sem animação em `reduced-motion`
- [x] Clique rápido repetido não deixa o botão em escala ≠ 1
**Verify**: `npm test -- ThemeToggle`
**Commit**: `feat: alternância de tema com flip em GSAP`

---

## Fase 5: Núcleo do jogo

### ✅ T25: AnswerButton
**What**: Letra A–D + texto, estados `idle|correct|wrong`, ícone `check_circle`/`cancel`, `disabled` após responder.
**Where**: `src/components/AnswerButton.tsx` + `.test.tsx`
**Depends on**: T14 · **Reqs**: GAME-02, GAME-04
**Done when**:
- [x] Classes `is-correct`/`is-wrong` e ícone corretos por estado
**Verify**: `npm test -- AnswerButton`
**Commit**: `feat(components): AnswerButton com estados de resposta`

### ✅ T26: Tela Game
**What**: Resolve o dia (`resolveDay`) e redireciona a `/` se inválido; `key` por `(dia, modo)`; `useState(() => buildQuestion)`; badge, rótulo da fase, frase por `PromptPart[]`; primeira escolha trava, marca certa/errada e a certa se errou; `setTimeout(900)` → `recordResult` (guard `useRef`) → `navigate('/fim/:dia', {state})`; `timeMs` por `useRef`.
**Where**: `src/screens/Game.tsx` + `.test.tsx`
**Emenda E5**: se `Game.tsx` passar de ~150 linhas, extrair `useQuestionSession` no mesmo commit.
**Depends on**: T9, T11, T13, T19, T25 · **Reuses**: `legacy/js/uiController.js` `renderQuestion`, `legacy/js/main.js` `runQuestionPhase` · **Reqs**: GAME-01..05, GAME-07, CAL-05, DOM-05
**Done when**:
- [x] Opções não reembaralham em re-render (teste com rerender)
- [x] Segundo clique é ignorado
- [x] Erro destaca a certa; `recordResult` chamado 1× mesmo em StrictMode
- [x] Dia de arquivo mostra `DIA N (ARQUIVO)`
- [x] Fake timers: nada acontece antes de 900 ms
**Verify**: `npm test -- Game`
**Commit**: `feat(screens): Game com pergunta, opções embaralhadas e registro do resultado`

### ✅ T27: Leitura em voz alta
**What**: `useSpeech(text)` (`pt-BR`, `cancel` antes de falar); botão "ouvir" no Game, desabilitado sem suporte.
**Where**: `src/hooks/useSpeech.ts`, integração em `Game.tsx` + `.test.ts`
**Emenda E4**: T27 e T31 editam `Game.tsx`; nunca em paralelo (T27 ∥ T30; T31 depois).
**Depends on**: T26 · **Reqs**: PREF-04
**Done when**:
- [x] Com mock de `speechSynthesis`, fala o texto da frase em `pt-BR`
- [x] Sem suporte: `disabled` e `title`
**Verify**: `npm test -- useSpeech`
**Commit**: `feat: leitura da frase em voz alta`

### ✅ T28: Sparkles e AchievementToast
**What**: `Sparkles` (16 ícones aleatórios `auto_awesome|star|stars`, posições/atrasos aleatórios, `aria-hidden`) e `AchievementToast`.
**Where**: `src/components/{Sparkles,AchievementToast}.tsx` + `.test.tsx`
**Depends on**: T14 · **Reqs**: SCR-05
**Done when**:
- [x] 16 sparkles; toast mostra nome e descrição
**Verify**: `npm test -- Sparkles AchievementToast`
**Commit**: `feat(components): Sparkles e toast de conquista`

### ✅ T29: Tela End
**What**: Lê `history` do `:dia`/modo atual; título (certa/errada), pontos, quebra base+bônus, linha de streak (só se acertou), toasts de `location.state.newlyUnlocked`, sparkles em marco ou conquista nova, classe `is-perfect`; sem entrada → `/`.
**Where**: `src/screens/End.tsx` + `.test.tsx`
**Depends on**: T13, T28 · **Reuses**: `renderEnd` · **Reqs**: SCR-05
**Done when**:
- [x] Texto "Resposta certa!" / "Não foi dessa vez"
- [x] Linha de bônus só com `bonus > 0`
- [x] Recarregar a página mostra o mesmo resultado sem toasts
**Verify**: `npm test -- End`
**Commit**: `feat(screens): tela de resultado`

### ✅ T30: Compartilhar com Toast
**What**: `shareResult(entry)` monta `GRAMMA — Dia N (Modo): 🟩|🟥 — X pts`; `navigator.clipboard.writeText`; `Toast` de sucesso, ou com o texto em caso de falha. Sem `alert`.
**Where**: `src/domain/share.ts`, `src/components/Toast.tsx`, integração em `End.tsx` + `.test.ts`
**Depends on**: T29 · **Reqs**: SCR-06
**Done when**:
- [x] Texto exato para acerto e erro nos 3 modos
- [x] Rejeição do clipboard mostra o texto no toast
**Verify**: `npm test -- share Toast`
**Commit**: `feat: compartilhar resultado com toast no lugar de alert`

### ✅ T31: Abrir resultado salvo
**What**: `Game` redireciona a `/fim/:dia` quando o dia atual já foi jogado no modo (não arquivo); via ModeHub e `?day=N`.
**Where**: `src/screens/Game.tsx` (modify)
**Depends on**: T26, T29 · **Reqs**: GAME-06, NAV-02
**Done when**:
- [x] Dia de hoje jogado → vai direto ao resultado
- [x] Arquivo já jogado → pergunta aparece de novo (paridade)
**Verify**: `npm test -- Game`
**Commit**: `feat(screens): abre resultado salvo ao jogar dia já concluído`

---

## Fase 6: Calendário

### ✅ T32: CalendarGrid
**What**: Grade com células vazias, `status-{won|lost|available|future}`, `is-today`, desabilitado no futuro, `onSelectDay`.
**Where**: `src/components/CalendarGrid.tsx` + `.test.tsx`
**Depends on**: T7, T14 · **Reqs**: CAL-02, CAL-03
**Done when**:
- [x] Classes por status; futuro desabilitado; hoje marcado
**Verify**: `npm test -- CalendarGrid`
**Commit**: `feat(components): CalendarGrid com status por dia`

### ✅ T33: Tela Calendário
**What**: Rótulo "MÊS ANO" em maiúsculas, navegação prev/next com limites, status via `history` do modo atual, clique → `/jogo/:dia`.
**Where**: `src/screens/Calendar.tsx` + `.test.tsx`
**Depends on**: T32, T13, T19 · **Reuses**: `legacy/js/main.js` `renderCalendarScreen` · **Reqs**: CAL-01, CAL-04, CAL-05, CAL-06
**Done when**:
- [x] Abre no mês do dia atual
- [x] Prev desabilitado no mês inicial; next no final
- [x] Clicar em dia disponível navega ao jogo
**Verify**: `npm test -- Calendar`
**Commit**: `feat(screens): Calendário com navegação mensal`

---

## Fase 7: Intro e acabamento

### ✅ T34: Intro animada
**What**: Timeline GSAP equivalente à do legado (eyebrow, logo, título, subtítulo, fade final), botão PULAR, `sessionStorage` `gramma_intro_seen`, cleanup no desmonte.
**Where**: `src/screens/Intro.tsx` + `.test.tsx`
**Depends on**: T15, T31 · **Reuses**: `legacy/js/main.js` `playIntro` · **Reqs**: NAV-03
**Done when**:
- [x] Pular ou terminar → `/`; segunda abertura na sessão não toca a intro
- [x] `timeline.kill()` ao desmontar
**Verify**: `npm test -- Intro`
**Commit**: `feat(screens): Intro animada com GSAP`

### ✅ T35: Revisão de acessibilidade
**What**: Foco visível, `aria-label`, ordem de tab, `aria-live` para o resultado, `aria-hidden` nos ícones decorativos.
**Where**: componentes e telas (modify)
**Depends on**: T34 · **Reqs**: A11Y-01
**Done when**:
- [x] Fluxo Menu→Jogo→Resultado operável só com teclado
- [x] Sem violação crítica no `jest-axe` nas telas principais
**Verify**: `npm test -- a11y`
**Commit**: `fix: foco, rótulos e navegação por teclado`

### T36: Testes de fluxo
**What**: Testes de integração com `MemoryRouter`/store real: jogar e acertar, jogar e errar, marco de 5, arquivo sem mexer na ofensiva, tema/fonte persistidos, fixture legada abrindo estatísticas.
**Where**: `src/__tests__/flows.test.tsx`
**Depends on**: T35 · **Reqs**: STO-01..03, P1 completo
**Done when**:
- [ ] ≥ 6 fluxos verdes
- [ ] Cobertura de `src/domain` e `src/state` ≥ 90%
**Verify**: `npm run test:cov`
**Commit**: `test: fluxos de tela e cobertura do domínio`

---

## Fase 8: Substituição e entrega

### T37: Paridade visual e funcional
**What**: Rodar o app novo e o `legacy/` lado a lado (claro/escuro, 4 escalas de fonte, mobile) com a checklist da spec; corrigir diferenças em commits `fix:` próprios. Se não houver diferença, nenhum commit.
**Where**: `.specs/features/port-react/parity.md` (registro)
**Depends on**: T36 · **Reqs**: Success Criteria
**Done when**:
- [ ] Checklist preenchida, sem item bloqueante
**Verify**: `npm run build && npm run preview` + comparação manual com `docs/screenshot-*.png`
**Commit**: `docs: registro de paridade visual do port` (+ `fix:` conforme achados)

### T38: Deploy no GitHub Pages
**What**: Workflow Actions: `npm ci`, typecheck, lint, test, build, `upload-pages-artifact`, `deploy-pages`; permissões mínimas. Configurar Pages para "GitHub Actions" (ação do usuário).
**Where**: `.github/workflows/deploy.yml`
**Depends on**: T37 · **Reqs**: OPS-01
**Done when**:
- [ ] Workflow verde na `main`
- [ ] `https://glaubermargem.github.io/Gramma/` serve o app novo
**Verify**: `gh run watch` e abrir a URL
**Commit**: `ci: build e deploy no GitHub Pages`

### T39: Remover o legado
**What**: Apagar `legacy/`. Garantir que nada no repositório o referencie.
**Where**: `legacy/` (delete)
**Depends on**: T38 · **Reqs**: OPS-02
**Done when**:
- [ ] `git grep -n "legacy/"` só em docs históricos
- [ ] CI continua verde
**Verify**: `npm run typecheck && npm test && npm run build`
**Commit**: `refactor: remove o app legado e scripts obsoletos`

### T40: Documentação
**What**: README (stack, `npm run dev|build|test|preview`, estrutura, remoção de "sem build step"), CHANGELOG (entrada do port), atualizar ROADMAP/STATE (M1 completo).
**Where**: `README.md`, `CHANGELOG.md`, `.specs/project/*`
**Depends on**: T39 · **Reqs**: OPS-03
**Done when**:
- [ ] README descreve a estrutura e os comandos reais
**Verify**: seguir o README do zero em clone limpo
**Commit**: `docs: atualiza README e CHANGELOG para a versão React`

---

## Task Granularity Check

| Task | Escopo | Status |
| --- | --- | --- |
| T5–T9 | 1 módulo cada | ✅ |
| T10–T13 | 1 módulo/arquivo de hooks | ✅ |
| T18–T23 | 1 tela cada | ✅ |
| T26 | 1 tela com lógica central | ⚠️ Maior da lista; se passar de ~150 linhas, dividir em `useQuestionSession` + `Game` |
| T35 | Transversal | ⚠️ Aceitável: só ajustes, sem arquivos novos |

## Traceability

| Req | Tasks |
| --- | --- |
| DOM-01 | T5, T11 |
| DOM-02 | T6, T11 |
| DOM-03 | T7 |
| DOM-04 | T8, T9 |
| DOM-05 | T9, T26 |
| STO-01 | T10, T12, T36 |
| STO-02 | T11 |
| STO-03 | T11, T36 |
| STO-04 | T12 |
| NAV-01 | T15 |
| NAV-02 | T15, T31 |
| NAV-03 | T15, T34 |
| NAV-04 | T16 |
| NAV-05 | T17 |
| SCR-01 | T18 |
| SCR-02 | T19 |
| SCR-03 | T20 |
| SCR-04 | T21 |
| SCR-05 | T28, T29 |
| SCR-06 | T30 |
| SCR-07 | T23 |
| GAME-01..05, 07 | T25, T26 |
| GAME-06 | T31 |
| CAL-01..06 | T7, T32, T33 |
| PREF-01 | T13 |
| PREF-02 | T24 |
| PREF-03 | T13, T22 |
| PREF-04 | T27 |
| OPS-01 | T38 |
| OPS-02 | T1, T39 |
| OPS-03 | T40 |
| A11Y-01 | T35 |

**Coverage:** 40 IDs, 40 mapeados, 0 sem task ✅
