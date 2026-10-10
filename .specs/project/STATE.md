# State

**Last Updated:** 2026-10-10
**Current Work:** backend-auth (M0+M1): spec criada em `.specs/features/backend-auth/`,
**aguardando revisão e autorização do usuário** antes de executar T41–T57.
Contexto anterior: port-react T1–T36 concluídas; T37 (validação de paridade) pendente.

---

## Recent Decisions (Last 60 days)

### AD-001: TypeScript estrito (2026-10-09)

**Decision:** Port em TypeScript com `strict`.
**Reason:** Escolha do usuário; o formato de dados do jogador é contrato e se beneficia de tipos.
**Trade-off:** Um pouco mais de cerimônia nos tipos dos JSON.
**Impact:** `resolveJsonModule`; tipos centrais em `src/domain/types.ts`.

### AD-002: Port substitui o projeto atual (2026-10-09)

**Decision:** Legado vai para `legacy/` no início e é apagado no fim, na mesma branch/`main`.
**Reason:** Escolha do usuário; evita manter dois apps.
**Trade-off:** Commits intermediários não publicáveis sem cuidado; mitigado por CI de deploy só ao final (T38).
**Impact:** O deploy atual do Pages continua servindo o último estado publicado até o workflow novo entrar.

### AD-003: GSAP mantido (2026-10-09)

**Decision:** `gsap` + `@gsap/react` (`useGSAP`) no lugar do `vendor/gsap.min.js`.
**Reason:** Escolha do usuário; paridade de animações com menor risco.
**Trade-off:** Nenhum relevante; cleanup automático via `useGSAP`.
**Impact:** Remover `window.gsap` e os checks `typeof window.gsap`.

### AD-004: HashRouter (2026-10-09)

**Decision:** React Router com `HashRouter`; `?day=N` (fora do hash) é lido no boot e redirecionado.
**Reason:** GitHub Pages não tem fallback de SPA.
**Trade-off:** URLs com `#`.
**Impact:** Links antigos `…/Gramma/?day=N` continuam funcionando.

### AD-005: Store externa com snapshot em cache (2026-10-09)

**Decision:** `userStore` sobre `localStorage` consumido por `useSyncExternalStore`; `getSnapshot` devolve objeto cacheado, invalidado só em `save`/evento `storage`.
**Reason:** O `load()` legado cria objeto novo a cada chamada, o que causaria loop de render.
**Trade-off:** Uma camada a mais que o `StorageService` estático.
**Impact:** Domínio (`recordResult`) vira função pura `(UserData, …) → UserData`; a store só persiste.

### AD-006: Paridade antes de correção (2026-10-09)

**Decision:** O port reproduz o comportamento legado, inclusive quirks; correções ficam para depois.
**Reason:** Evita misturar migração com mudança de regra.
**Trade-off:** Quirk conhecido permanece: rejogar um dia de arquivo grava de novo no histórico e soma `games_played`/`total_score`/streaks de novo.
**Impact:** Registrado em Deferred Ideas.

---

### AD-007: Backend FastAPI + login opcional (2026-10-10)

**Decision:** Backend em FastAPI a partir do `full-stack-fastapi-template` (só o
backend; front do template descartado). Login **opcional** — convidado segue
100% local. Sync "link device" com merge determinístico e outbox.
**Reason:** Escolha do usuário; o template traz JWT, reset de senha e Alembic
prontos, menos risco que escrever do zero.
**Trade-off:** Dois deploys (front no Pages, backend à parte) e CORS.
**Impact:** Feature `backend-auth` (T41–T57). Preferências ficam só no
`localStorage`; nuvem guarda apenas progresso competitivo.

## Active Blockers

- **Hospedagem do backend + Postgres** (T48, T57): decidir provedor com a equipe
  antes de concluir M0/M1.

---

## Lessons Learned

- `package-lock.json` estava no `.gitignore`; passou a ser versionado (necessário para `npm ci`/CI).
- `@vitest/coverage-v8` não estava na lista E1 mas `test:cov` exige; instalado na T3 (versão igual à do vitest).
- `npm i` incremental quebrou com `edgesOut` após muitas instalações; recriar `node_modules`+lock resolveu.
- Worktrees de agentes nascem de `origin/main` (antigo), não da `main` local: o prompt dos agentes ganhou o passo 0 `git reset --hard <hash da main>` na branch da worktree.
- Em worktree, o hook `rtk` faz o sandbox recusar `git add/commit/status` do agente. Fluxo adotado: o agente deixa as mudanças sem commit e reporta; o orquestrador revisa, commita na worktree com a mensagem exata e faz cherry-pick.
- Spec errada: 1º/jul/2026 é quarta, não quinta (T7 corrigida em tasks.md).
- T14: `import './styles/style.css'` foi adicionado em `src/main.tsx` pelo orquestrador no mesmo commit (não estava em Where). `unirios-logo.png` fica em `public/`; usar `import.meta.env.BASE_URL` na Intro.
- Fixture legada da T10 usa o id `first_win`, que não existe no catálogo (17 ids); irrelevante para o parse.
- Convenção dos stubs de tela (T15): named export (`export function Menu()`), mesmo nome do arquivo; telas reais mantêm isso. `router.tsx` exporta `AppRoutes` e `AppRouter`; `boot.ts` expõe `markIntroSeen`, que a Intro (T34) deve chamar.
- `userStore` (T12) é `createUserStore()` + singleton `userStore` + `USER_DATA_KEY`; API `getSnapshot/subscribe/update` (não `save`).
- `recordResult(data, {dayId,type,correct,timeMs,isArchive}) → {data,score,streak,newlyUnlocked}`; `isArchive` obrigatório.
- T11: o agente não viu o teste falhar antes de implementar (sandbox recusou comando composto); revisão manual confirmou paridade com o legado.
- T13: `useTheme`/`useFontScale` só aplicam no DOM onde são montados; `App` monta um `Preferences` (commit extra) para valer em todas as telas.
- T16: `ScreenTransition({children, className})` envolve a tela; `useAnimatedNavigate()` anima a saída via registro de módulo (um `ScreenTransition` por vez). Intro NÃO usa `ScreenTransition`. Risco: o `<div>` wrapper pode afetar o layout do CSS legado; usar `className` se necessário.
- Convenção de tela (Onda G em diante): `<ScreenTransition className="game-container"><section className="screen-panel|menu-screen|…">…</section></ScreenTransition>` (section é filha direta de `.game-container`, como no legado). Intro não usa `ScreenTransition`/`game-container`. `Background` e `TopBar` (auto-oculta fora de `/`) ficam em `AppRouter`, fora dos `Routes`, porque `.top-bar` é `position: fixed` e quebraria dentro de um ancestral com `transform`. Menu NÃO renderiza TopBar.
- Componentes prontos: `MaterialIcon({name,className})`, `IconButton({icon,label,...})`, `AnswerButton({letter,text,state,disabled,onSelect})`, `Sparkles({count,rng})`, `AchievementToast({achievement})` (recebe o objeto, não o id), `CalendarGrid({cells,todayDayId,getStatus,onSelectDay})` + tipo `DayStatus`.
- A11y a revisar na T35: `CalendarGrid` renderiza células vazias como `<button>` (paridade); `AnswerButton` tem ícone inline (trocar por MaterialIcon); toast sem `aria-live`.
- T19: o agente usou `min(diaAtual, total)` no hub; revertido para `getCurrentDayId()` puro (paridade, AD-006).
- `src/smoke.test.tsx` quebra a cada tela real que substitui um stub (assertava o `<h1>` do stub); o orquestrador atualiza o texto esperado da rota a cada onda (agentes não editam esse arquivo).
- Navegação de "voltar": Stats→`/modo`; Achievements, Accessibility, HowToPlay e ModeHub(fechar)→`/`.
- T24: `ThemeToggle` usa um gate de módulo (`holdThemeApply` em `state/hooks.ts`) para o efeito de `useTheme` não aplicar `data-theme` antes do ponto fechado do flip; persiste `dark_mode` no clique. Orquestrador adicionou: ao desmontar no meio do flip, aplica o tema pendente. Wrapper `<span style="display:contents">` — conferir layout da `.top-bar` na T37.
- T26: `Game` = `GameSession` com `key={dia-modo}` + `useQuestionSession` (`src/screens/useQuestionSession.ts`, 900 ms, guard `useRef`, `userStore.update(() => result.data)`, `go('/fim/:dia', {state:{newlyUnlocked}})`). `timeMs` inclui os 900 ms (paridade). Saída por "Fechar" nos 900 ms não cancela o timeout (paridade com o legado).
- T29: `End` redireciona a `/` sem entrada no histórico; botão Compartilhar sem `onClick` (T30 liga). "Menu" do End vai a `/modo` (como no legado).
- T33: Calendário volta a `/modo`.
- T30: `Toast` reutiliza `.achievement-toast` (CSS congelado, E3) com `role=status`; `shareResult(entry)` em `src/domain/share.ts`. Aparência igual ao toast de conquista, sem ícone — avaliar na T37.
- T31: `Game` → `GameDay` (decide uma vez, na montagem, se redireciona a `/fim/:dia`) → `GameSession`. O agente reformatou Game.tsx/Game.test.tsx inteiros com aspas duplas; o orquestrador refez só as mudanças lógicas no estilo original (sem Prettier no projeto — se quiser formatação automática, é decisão fora do port). Lição: pedir aos agentes para não reformatar arquivos.
- T35: `aria-live="polite"` no título/pontos do End é montado junto com a tela (leitores de tela só anunciam mudanças), então o ganho real é pequeno; mover foco ao trocar de tela NÃO foi feito (arrisca paridade). Contraste de cor e foco visível não são verificáveis em jsdom: checar na T37. Células vazias do calendário viraram `<div aria-hidden>`.
- T36: 7 fluxos em `src/__tests__/flows.test.tsx`; cobertura de linhas 100% em `src/domain` + `src/state`. Fluxo da fixture legada usa o evento `storage` (sem `vi.resetModules`, que duplicaria o React).
- Ao fim da Onda K: 245 testes verdes, typecheck/lint/build OK. Pendente só validação humana (T37), Pages (T38) e remoção do legado/documentação (T39, T40).

---

## Quick Tasks Completed

| #   | Description | Date | Commit | Status |
| --- | ----------- | ---- | ------ | ------ |

---

## Deferred Ideas

- [ ] Bloquear pontuação em rejogo de arquivo (mudança de regra, pós-port): Captured during: port-react design
- [ ] Consolidar `time_ms` (hoje gravado e nunca exibido): Captured during: port-react design
- [ ] Validar `START_DATE` e total de dias quando passar do dia 365: Captured during: port-react design

---

## Preferences

- Commits em português, Conventional Commits, um por task.
