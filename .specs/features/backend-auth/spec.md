# Backend, Login e Ranking: Specification

**Status**: Draft (aguardando aprovação)
**Escopo**: Large (novo backend FastAPI + mudanças no front React)
**Milestones**: M0 (backend) e M1 (front: auth, sync, ranking)

## Problem Statement

O GRAMMA é hoje 100% client-side: o progresso vive só no `localStorage`
(`gramma_user_data`) e não há conta, sincronização nem ranking. Isso impede
comparar desempenho entre jogadores e perde o progresso ao trocar de
dispositivo/navegador. Precisamos de um backend que autentique o jogador (login
opcional), sincronize o progresso e sirva rankings — **sem quebrar** quem joga
como convidado offline.

Adotamos o `fastapi/full-stack-fastapi-template` como base do backend (já traz
FastAPI + SQLModel + PostgreSQL + Alembic + JWT + recuperação de senha + Pytest),
aproveitando o front React existente. Só o **backend** do template é usado; o
front React do template é descartado.

## Goals

- [ ] Login **opcional**: convidado continua jogando 100% local; conta sincroniza
  e entra no ranking.
- [ ] Progresso preservado no "link device": ao entrar, nada do que está local é
  perdido (merge determinístico e testado).
- [ ] Ranking diário, semanal e mensal, por modo e geral, via SQL.
- [ ] Backend com CORS restrito, senha com hash, JWT e rate limit no login/reset.
- [ ] Backend testado (Pytest) e com CI; front com fluxos e `jest-axe` verdes.

## Out of Scope (milestones seguintes)

| Feature | Motivo |
| --- | --- |
| Modos Antônimos, Aleatório e ENEM | M2 |
| Fonte p/ dislexia, alto contraste, leitor de tela | M3 |
| Foguinho da sequência (visual TikTok) | M4 |
| Modo Carreira | Adiado (decisão do usuário) |
| Skill de auditoria de segurança + execução | M4 |
| Mover conteúdo (frases/sinônimos) para o Postgres | M2 |
| Login obrigatório | Decisão: opcional |
| Provedor de hospedagem | Bloqueio: decidir com a equipe (BE-OPS-02) |

---

## User Stories

### P1: Entrar com uma conta (opcional) ⭐ MVP

**User Story**: Como jogador, quero criar conta e entrar por e-mail/senha (ou
recuperar a senha) para guardar meu progresso e aparecer no ranking.

**Why P1**: É o pré-requisito de tudo que envolve nuvem.

**Acceptance Criteria**:

1. WHEN um e-mail novo e senha válida são enviados THEN o sistema SHALL criar a
   conta com senha guardada apenas como hash. (BE-AUTH-01)
2. WHEN e-mail e senha corretos são enviados THEN o backend SHALL devolver um
   JWT de acesso com expiração configurável. (BE-AUTH-01, BE-SEC-01)
3. WHEN o jogador pede recuperação THEN o backend SHALL enviar um e-mail com
   token de reset; WHEN o token é usado com nova senha THEN a senha SHALL ser
   trocada e o token invalidado. (BE-AUTH-01)
4. WHEN o front recebe o token THEN o `authStore` SHALL persistir a sessão e
   restaurá-la ao recarregar; WHEN uma chamada retorna 401 THEN o jogador SHALL
   ser deslogado. (FE-AUTH-01)
5. WHEN a API altera o e-mail THEN o formulário SHALL validar antes de enviar e
   exibir erro/loading. (FE-AUTH-02)
6. WHEN o jogador está deslogado THEN o app SHALL continuar funcionando como
   convidado, sem exigir login. (FE-AUTH-02, FE-PROF-01)

**Independent Test**: Registrar, sair, entrar de novo e ver a sessão restaurada
após recarregar.

---

### P1: Sincronizar o progresso ⭐ MVP

**User Story**: Como jogador com conta, quero que meu progresso local seja
enviado para a nuvem ao entrar e mantido entre dispositivos.

**Why P1**: É o valor principal de ter conta; perder progresso é inaceitável.

**Acceptance Criteria**:

1. WHEN o jogador entra e a conta não tem jogos THEN o front SHALL enviar o
   snapshot local (`stats` + `history`) para o servidor. (FE-SYNC-01)
2. WHEN a conta já tem jogos THEN o front SHALL mesclar local e nuvem por
   `(day_id, study_type)`, mantendo a maior pontuação e sem perder entradas, e
   gravar o resultado mesclado. (FE-SYNC-01, BE-API-01)
3. WHEN o jogador está deslogado THEN o progresso SHALL continuar apenas local,
   inalterado. (FE-SYNC-01)
4. WHEN uma jogada acontece offline THEN ela SHALL ser enfileirada e enviada ao
   servidor quando a conexão/sessão voltar. (FE-SYNC-01)
5. WHEN o mesmo progresso é enviado duas vezes THEN o servidor SHALL ser
   idempotente (upsert por chave, sem duplicar histórico). (BE-API-01)
6. WHEN um usuário pede o progresso THEN o servidor SHALL devolver só os dados
   daquele usuário. (BE-API-01)

**Independent Test**: Jogar como convidado, criar conta e ver o progresso no
servidor; reenviar e conferir que não duplica.

---

### P1: Ranking ⭐ MVP

**User Story**: Como jogador, quero ver um ranking diário, semanal e mensal
(filtrado por modo) para comparar meu desempenho.

**Why P1**: É o segundo valor de ter conta e motiva o jogo diário.

**Acceptance Criteria**:

1. WHEN o front pede o ranking `daily|weekly|monthly` THEN o backend SHALL
   agregar `SUM(points)` por usuário na janela correspondente. (BE-API-02)
2. WHEN o filtro por `study_type` é informado THEN o backend SHALL considerar só
   aquele modo. (BE-API-02)
3. WHEN o histórico for de dia de arquivo (`is_archive`) THEN SHALL NOT entrar
   nos rankings competitivos. (BE-API-02)
4. WHEN a tela de Ranking abre THEN o front SHALL mostrar as abas de período,
   o filtro por modo e destacar a linha do usuário atual. (FE-RANK-01)
5. WHEN o ranking vem vazio THEN o front SHALL mostrar estado vazio. (FE-RANK-01)

**Independent Test**: Semear três usuários e conferir a ordem e as janelas.

---

### P2: Backend seguro e observável

**User Story**: Como mantenedor, quero o backend protegido e testado para
confiar na publicação.

**Acceptance Criteria**:

1. WHEN uma origem não permitida chama a API THEN o CORS SHALL bloqueá-la;
   WHEN o login excede o limite THEN SHALL responder 429. (BE-SEC-01)
2. WHEN houver push/PR no backend THEN o CI SHALL rodar `ruff` + `pytest` com
   Postgres de serviço. (BE-OPS-01)
3. WHEN o modelo de progresso mudar THEN SHALL haver migração Alembic
   reversível. (BE-MODEL-01)

**Independent Test**: Chamar a API de uma origem não listada e receber bloqueio.

---

### P3: Empacotar para publicação

**User Story**: Como mantenedor, quero documentar e configurar o build para
publicar o front contra o backend.

**Acceptance Criteria**:

1. WHEN o front é buildado THEN SHALL usar `VITE_API_URL` do ambiente. (FE-OPS-01)
2. WHEN a hospedagem for decidida THEN o README do backend SHALL descrever envs
   e passos de deploy. (BE-OPS-02)

**Independent Test**: Buildar com uma `VITE_API_URL` de teste e ver o client
apontando para lá.

---

## Edge Cases

- WHEN e-mail já cadastrado THEN o registro SHALL falhar com erro claro (409).
- WHEN a senha não atende ao mínimo THEN o backend SHALL rejeitar (422).
- WHEN o token de reset expirou/foi usado THEN SHALL ser rejeitado.
- WHEN o progresso local e o da nuvem têm o mesmo `(day, modo)` com pontuações
  diferentes THEN o merge SHALL manter a maior; empate → menor `time_ms`.
- WHEN o jogador tem conquistas locais ausentes na nuvem THEN o merge SHALL unir
  os conjuntos.
- WHEN o `localStorage` está indisponível THEN o app SHALL seguir funcional como
  convidado (sem sync).
- WHEN o backend está fora do ar THEN o jogo SHALL continuar jogável offline.

## Requirement Traceability

| ID | Descrição | Story | Status |
| --- | --- | --- | --- |
| BE-AUTH-01 | Registro, login JWT e recuperação/reset de senha | P1 Conta | Pending |
| BE-MODEL-01 | Modelos de progresso (stats, histórico, conquistas) + migração | P2 Backend | Pending |
| BE-API-01 | `GET`/`PUT /me/progress` idempotente e isolado por usuário | P1 Sync | Pending |
| BE-API-02 | `GET /ranking` diário/semanal/mensal por modo | P1 Ranking | Pending |
| BE-SEC-01 | CORS, expiração de token e rate limit | P2 Backend | Pending |
| BE-OPS-01 | CI do backend (ruff + pytest) | P2 Backend | Pending |
| BE-OPS-02 | Envs e opções de deploy (bloqueado) | P3 Publicação | Pending |
| FE-AUTH-01 | API client tipado, authStore e token | P1 Conta | Pending |
| FE-AUTH-02 | Telas de login/cadastro/recuperação/reset | P1 Conta | Pending |
| FE-SYNC-01 | `mergeProgress` e sync "link device" + outbox | P1 Sync | Pending |
| FE-RANK-01 | Tela Ranking (abas, filtro, destaque) | P1 Ranking | Pending |
| FE-PROF-01 | Conta no TopBar e tela de Perfil | P1 Conta | Pending |
| FE-TEST-01 | Fluxos de integração e a11y das telas novas | P2 Backend | Pending |
| FE-OPS-01 | `VITE_API_URL` no build do front | P3 Publicação | Pending |

**Coverage:** 14 IDs, 14 mapeados a tasks (ver `tasks.md`, T41–T57)

---

## Success Criteria

- [ ] Fluxo completo: jogar como convidado → criar conta → progresso no servidor
  sem perda; reenviar não duplica.
- [ ] Ranking diário/semanal/mensal corretos com dados semeados.
- [ ] Convidado permanece 100% local; nada muda sem conta.
- [ ] `pytest`/`ruff` (backend) e `npm run typecheck && npm run lint && npm test`
  (front) passam.
- [ ] CORS e rate limit verificados; senhas só como hash; sem segredos no repo.
- [ ] `VITE_API_URL` configurável; documentação do backend reproduzível.
