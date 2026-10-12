# Backend, Login e Ranking: Tasks

**Design**: `.specs/features/backend-auth/design.md`
**Status**: Planejado (aguardando autorização)
**Milestones**: M0 = T41–T48 · M1 = T49–T57

Convenções: 1 task = 1 commit (Conventional Commits em pt-BR). Gates do backend
(`backend/`): `ruff check backend && pytest`. Gates do front (raiz):
`npm run typecheck && npm run lint && npm test`. TDD nas tasks de domínio/estado
do front. Execução paralela: ver `EXECUTION.md`.

---

## Execution Plan

```
M0:  T41 → T42 ┬ T43 → ┬ T44 ┬ T46 → T47 → T48 (bloqueada pela hospedagem)
                       └ T45 ┘
M1:  T41–T45 → T49 → T50 ┬ T51 ┬ T55
                          ├ T54 ┘
      (T52 [P] desde cedo) └ T53 → T56 → T57 (bloqueada pela hospedagem)
```

Ondas (EXECUTION.md): W0=T41 · W1=T42,T52 · W2=T43 · W3=T44,T45 · W4=T46,T49 ·
W5=T47,T50 · W6=T48,T51 · W7=T53,T54,T55 · W8=T56 · W9=T57.

Marcos verificáveis: **M0-D** (fim de T47): backend com auth+progresso+ranking e
CI verde. **M1-D** (fim de T56): conta, sync e ranking no front, testados.

---

## M0 — Fundação backend (FastAPI)

### T41: Scaffold do backend a partir do template
**What**: vendorizar `backend/` do `fastapi/full-stack-fastapi-template` (Python
3.13, uv, SQLModel, Alembic, JWT, reset). Remover o **front React do template** e
o exemplo `Item`; manter `app/api` (login/users/utils), `app/core`,
`app/models.py`, `alembic/`, `tests/` e Docker Compose (Postgres + Mailpit).
**Where**: `backend/**`, `.gitignore` (entradas Python/uv/venv)
**Depends on**: - · **Reqs**: BE-AUTH-01
**Done when**:
- [ ] `docker compose up` sobe API + Postgres
- [ ] `POST /api/v1/login/access-token` devolve token do superuser; `/docs` abre
- [ ] `pytest` do template passa
**Verify**: `cd backend && docker compose up -d && docker compose exec backend pytest`
**Commit**: `chore(backend): adiciona o FastAPI template como base do backend`

### T42: Reduzir auth e simplificar o e-mail de reset [P]
**What**: remover rotas/entidades do exemplo; trocar React Email por e-mail HTML
simples (`fastapi-mail`); manter `/register`, `/login/access-token`,
`/password-recovery`, `/reset-password`, `/users/me`.
**Where**: `backend/app/api/routes/{login,users,utils}.py`,
`backend/app/core/{config,security}.py`, `backend/app/utils.py`,
`backend/app/emails/**`
**Depends on**: T41 · **Reqs**: BE-AUTH-01
**Done when**:
- [ ] register → login → recovery → reset coberto por teste
- [ ] Zero referência a `Item`
**Verify**: `pytest`
**Commit**: `refactor(backend): reduz auth e simplifica o e-mail de reset`

### T43: Modelo de progresso
**What**: `UserStats`, `HistoryEntry` (unique `user_id+day_id+study_type`,
inclui `played_on` derivado), `AchievementUnlocked`; migração Alembic.
**Where**: `backend/app/models.py`, `backend/app/alembic/versions/*_player_progress.py`
**Depends on**: T41 · **Reqs**: BE-MODEL-01
**Done when**:
- [ ] `alembic upgrade head && alembic downgrade -1 && alembic upgrade head` limpos
- [ ] Constraint unique testada; nomes em snake_case casando com o front
**Verify**: `pytest` + ciclo Alembic acima
**Commit**: `feat(backend): modelos de progresso (stats, histórico e conquistas)`

### T44: Endpoint de progresso [P]
**What**: `GET /api/v1/me/progress` (stats + history + achievements) e
`PUT /api/v1/me/progress` (snapshot idempotente, upsert por chave).
**Where**: `backend/app/api/routes/progress.py`, `backend/app/schemas.py`,
`backend/app/crud.py`
**Depends on**: T42, T43 · **Reqs**: BE-API-01
**Done when**:
- [ ] Dados isolados por usuário; exige auth
- [ ] Reenvio do mesmo `PUT` não duplica histórico
**Verify**: `pytest`
**Commit**: `feat(backend): leitura e gravação do progresso`

### T45: Endpoint de ranking [P]
**What**: `GET /api/v1/ranking?period=daily|weekly|monthly&study_type=&limit=`
com `SUM(points)` por usuário na janela (`played_on`), excluindo `is_archive`;
retorna rank/display_name/score/streak; índices em `played_on`/`user_id`.
**Where**: `backend/app/api/routes/ranking.py`, `backend/app/crud.py`, migração de índices
**Depends on**: T42, T43 · **Reqs**: BE-API-02
**Done when**:
- [ ] Janelas corretas (daily=hoje, weekly=7d, monthly=30d); filtro por modo
- [ ] Ordenação estável; teste com dados semeados
**Verify**: `pytest`
**Commit**: `feat(backend): ranking diário, semanal e mensal`

### T46: CORS, JWT e rate limit
**What**: `BACKEND_CORS_ORIGINS` para a origem do Pages; expiração de token
configurável; `slowapi` no login/recovery; headers de segurança básicos.
**Where**: `backend/app/main.py`, `backend/app/core/config.py`,
`backend/app/api/routes/login.py`, `backend/app/api/deps.py`
**Depends on**: T44 · **Reqs**: BE-SEC-01
**Done when**:
- [ ] Origem não permitida bloqueada; excesso de login → 429
- [ ] Testes cobrem CORS e limite
**Verify**: `pytest`
**Commit**: `feat(backend): CORS, expiração de token e rate limit`

### T47: CI do backend
**What**: `.github/workflows/backend.yml` com Postgres de serviço, `ruff` +
`pytest`, sem tocar no `deploy.yml` do front.
**Where**: `.github/workflows/backend.yml`, `backend/pyproject.toml`
**Depends on**: T45 · **Reqs**: BE-OPS-01
**Done when**:
- [ ] Workflow verde no push; teste vermelho barra o merge
**Verify**: `gh run list -w backend.yml`
**Commit**: `ci(backend): testes e lint do backend no Actions`

### T48: Documentação e env de hospedagem (BLOQUEADA pela equipe)
**What**: documentar variáveis de ambiente e opções de deploy
(Render/Railway/Fly + Postgres gerenciado) **sem fixar provedor**; registrar o
bloqueio em `STATE.md`.
**Where**: `backend/README.md`, `backend/.env.example`, `README.md`,
`.specs/project/STATE.md`
**Depends on**: T47 · **Reqs**: BE-OPS-02
**Done when**:
- [ ] README do backend reproduzível localmente
- [ ] Provedor registrado como bloqueio pendente (não é possível completar até a
      equipe decidir)
**Verify**: seguir o README do backend em clone limpo
**Commit**: `docs(backend): variáveis de ambiente e opções de deploy`

---

## M1 — Front: auth, sync e ranking

### T49: API client tipado
**What**: `client.ts` (base `import.meta.env.VITE_API_URL`, erros tipados,
header `Authorization`), `auth.ts`, `progress.ts`, `ranking.ts`, `types.ts`.
**Where**: `src/api/**`, `.env.example`
**Depends on**: T44, T45 · **Reqs**: FE-AUTH-01
**Done when**:
- [ ] Typecheck; testes com fetch mockado cobrem 401 e erro de rede
**Verify**: `npm run typecheck && npm test -- client`
**Commit**: `feat(api): client HTTP tipado para o backend`

### T50: authStore e token [P]
**What**: store externa `{ user, token, status }`; persistência em `gramma_auth`
via `tokenStorage.ts`; `login`/`logout`/`refresh`; sync multi-aba via `storage`.
**Where**: `src/state/authStore.ts`, `src/state/tokenStorage.ts` + `.test.ts`
**Depends on**: T49 · **Reqs**: FE-AUTH-01
**Done when**:
- [ ] Login persiste, logout limpa, reload restaura; 401 desloga
**Verify**: `npm test -- authStore`
**Commit**: `feat(state): authStore com sessão persistida`

### T51: Telas de autenticação [P]
**What**: `Login`, `Register`, `ForgotPassword`, `ResetPassword` (`/reset?token=`),
validação, loading/erro; rotas no `router.tsx`.
**Where**: `src/screens/{Login,Register,ForgotPassword,ResetPassword}.tsx`,
`src/router.tsx` + `.test.tsx`
**Depends on**: T50 · **Reqs**: FE-AUTH-02
**Done when**:
- [ ] Fluxo testado (client mockado); labels/foco corretos
**Verify**: `npm test -- Login Register`
**Commit**: `feat(screens): login, cadastro e recuperação de senha`

### T52: mergeProgress (domínio puro) [P]
**What**: `mergeProgress(local, cloud)`: history por chave (maior `points`;
empate → menor `time_ms`), conquistas = união, `max_streak` = máx, derivados
recomputados do history; documentar limites.
**Where**: `src/domain/mergeProgress.ts` + `.test.ts`
**Depends on**: - · **Reqs**: FE-SYNC-01
**Done when**:
- [ ] Casos só-local, só-nuvem e conflito cobertos; pura/determinística
**Verify**: `npm test -- mergeProgress`
**Commit**: `feat(domain): merge local/nuvem do progresso do jogador`

### T53: Sync no login (link device) + outbox [P]
**What**: no login: `GET /me/progress`; nuvem vazia → `PUT` local; senão →
`mergeProgress` → `PUT` e adota. `recordResult` segue gravando local; `syncQueue`
(outbox em `gramma_sync_outbox`) reenvia pendências no boot/login/`online`.
**Where**: `src/state/sync.ts`, `src/state/authStore.ts`,
`src/domain/recordResult.ts` + `.test.ts`
**Depends on**: T45, T50, T52 · **Reqs**: FE-SYNC-01
**Done when**:
- [ ] Convidado 100% local; jogada offline enfileira e sobe ao reconectar
- [ ] Nenhum dado local é perdido (teste com fixtures)
**Verify**: `npm test -- sync`
**Commit**: `feat(state): sincronização de progresso no login (link device)`

### T54: Tela Ranking [P]
**What**: `Ranking` (abas diário/semanal/mensal, filtro por modo), linha do
usuário destacada, estados vazio/loading; componente `RankRow`; rota `/ranking`;
CSS novo.
**Where**: `src/screens/Ranking.tsx`, `src/components/RankRow.tsx`,
`src/router.tsx`, `src/styles/style.css` + `.test.tsx`
**Depends on**: T49, T50 · **Reqs**: FE-RANK-01
**Done when**:
- [ ] Aba/filtro chamam o endpoint certo; usuário destacado; sem violação axe
**Verify**: `npm test -- Ranking`
**Commit**: `feat(screens): ranking diário, semanal e mensal`

### T55: Conta no TopBar e Perfil [P]
**What**: botão Entrar/Conta no `TopBar`; tela `Profile` (e-mail, sair, link
ranking).
**Where**: `src/components/TopBar.tsx`, `src/screens/Profile.tsx`,
`src/router.tsx` + `.test.tsx`
**Depends on**: T50, T51 · **Reqs**: FE-PROF-01
**Done when**:
- [ ] Deslogado → "Entrar"; logado → conta/sair; logout volta ao Menu
**Verify**: `npm test -- TopBar Profile`
**Commit**: `feat: acesso à conta no TopBar e tela de perfil`

### T56: Testes de fluxo e a11y
**What**: integração (registrar → jogar → progresso sincronizado com client
mockado; ranking; recuperação) + `jest-axe` nas telas novas.
**Where**: `src/__tests__/flows.test.tsx`, `src/__tests__/a11y.test.tsx`
**Depends on**: T53, T54, T55 · **Reqs**: FE-TEST-01
**Done when**:
- [ ] Fluxos verdes; sem violação crítica de axe
- [ ] Cobertura `src/domain`/`src/state` ≥ 90%
**Verify**: `npm run test:cov`
**Commit**: `test: fluxos de autenticação, sync e ranking`

### T57: Env no build do front (BLOQUEADA pela hospedagem)
**What**: injetar `VITE_API_URL` no build do Pages.
**Where**: `.github/workflows/deploy.yml`, `.env.example`
**Depends on**: T48, T56 · **Reqs**: FE-OPS-01
**Done when**:
- [ ] Build usa a URL configurada; login funciona contra o backend publicado
      (requer hospedagem decidida)
**Verify**: `npm run build` com a env + teste manual
**Commit**: `ci: injeta VITE_API_URL no build do front`

---

## Task Granularity Check

| Task | Escopo | Status |
| --- | --- | --- |
| T41 | Scaffold/vendor do template | ⚠️ Grande, mas mecânico (cópia + trim) |
| T42 | Superfície de auth | ✅ |
| T43 | 3 modelos + 1 migração | ✅ |
| T44, T45 | 1 endpoint cada | ✅ |
| T46 | Segurança transversal | ✅ |
| T49–T55 | 1 módulo/tela cada | ✅ |
| T56 | Transversal (testes) | ✅ |

## Traceability

| Req | Tasks |
| --- | --- |
| BE-AUTH-01 | T41, T42 |
| BE-MODEL-01 | T43 |
| BE-API-01 | T44, T53 |
| BE-API-02 | T45, T54 |
| BE-SEC-01 | T46 |
| BE-OPS-01 | T47 |
| BE-OPS-02 | T48, T57 |
| FE-AUTH-01 | T49, T50 |
| FE-AUTH-02 | T51, T55 |
| FE-SYNC-01 | T52, T53 |
| FE-RANK-01 | T54 |
| FE-PROF-01 | T55 |
| FE-TEST-01 | T56 |
| FE-OPS-01 | T57 |

**Coverage:** 14 IDs, 14 mapeados, 0 sem task ✅
