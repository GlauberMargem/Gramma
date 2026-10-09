# State

**Last Updated:** 2026-10-09
**Current Work:** port-react: execução em ondas (EXECUTION.md). Ondas A e B concluídas (T1–T4); próxima: Onda C (T5,T6,T7,T8,T10,T14)

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

## Active Blockers

Nenhum.

---

## Lessons Learned

- `package-lock.json` estava no `.gitignore`; passou a ser versionado (necessário para `npm ci`/CI).
- `@vitest/coverage-v8` não estava na lista E1 mas `test:cov` exige; instalado na T3 (versão igual à do vitest).
- `npm i` incremental quebrou com `edgesOut` após muitas instalações; recriar `node_modules`+lock resolveu.
- Worktrees de agentes nascem de `origin/main` (antigo), não da `main` local: o prompt dos agentes ganhou o passo 0 `git reset --hard <hash da main>` na branch da worktree.
- Em worktree, o hook `rtk` faz o sandbox recusar `git add/commit/status` do agente. Fluxo adotado: o agente deixa as mudanças sem commit e reporta; o orquestrador revisa, commita na worktree com a mensagem exata e faz cherry-pick.

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
