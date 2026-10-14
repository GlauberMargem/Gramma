# GRAMMA — Contexto e Sprints

Mapa de tasks a partir do documento **"GRAMMA - JOGOS DIGITAIS"** (levantamento
da equipe). Sprints de **2 semanas**, numeradas, sem datas fixas.

Legenda: `[x]` feito · `[~]` parcialmente feito · `[ ]` a fazer · 🔒 bloqueado

---

## Contexto (documento original)

### Mudanças estruturais

- **Implementar** > React || Stack moderna
- **Adicionar um banco de dados** > salvar informações de login, progresso,
  ~~(modo carreira {opcional})~~, ranking (diário, semanal, mensal)
- **Adicionar login e senha** > função para ranking e histórico
- **Rodar uma auditoria de segurança** > importar uma skill de auditoria
- **Registro de sequências:** o foguinho do TikTok!

### Modos de jogo

- Antônimos
- Aleatório
- Módulo de ENEM (<https://github.com/yunger7/enem-api>)

### Acessibilidade

- Fonte de dislexia
- Tema de alto contraste
- Para cegos / jogar pelo teclado
- **Ver se dá pra fazer com que um leitor de tela funcione no jogo**

### Decisões sobre o documento

- **Modo Carreira:** descartado.
- **Foguinho (sequência):** o visual já existe (ícone de fogo + "Ofensiva" no
  Menu, Fim e Estatísticas). Falta só salvar a ofensiva **vinculada ao
  usuário** no banco.

---

## Sprint 0 — Já entregue

**Stack moderna (React)**

- [x] Port para React + TypeScript + Vite, com paridade do jogo legado
  (`.specs/features/port-react/`, T1–T36)
- [x] Domínio testado (pontuação, conquistas, calendário, ofensiva)
- [ ] Validação visual lado a lado com o legado (T37)
- [ ] Remover a pasta `legacy/` (T39)

**Banco de dados e login**

- [x] Backend FastAPI + Alembic (tabela `user`)
- [x] Cadastro, login (JWT) e sessão persistida no front (`/entrar`, `/perfil`)
- [x] Recuperação de senha (esqueci / redefinir)

**Sequência e acessibilidade (já existente)**

- [x] Foguinho/ofensiva exibido no Menu, Fim e Estatísticas (salvo só no navegador)
- [x] Tema claro/escuro
- [x] Ajuste do tamanho da fonte
- [x] Leitura da frase em voz alta
- [x] Navegação por teclado e rótulos de acessibilidade (base na T35,
  completada na Sprint 3)

---

## Sprint 1 — Progresso e ofensiva no banco ✅

Objetivo: o progresso e a ofensiva do jogador ficam salvos na conta dele.
Branch: `feature/sprint-1-progresso`.

- [x] Banco **SQLite** em dev e testes; **PostgreSQL em produção** (SQLite é recusado fora de dev)
- [x] Modelo de progresso no banco: partidas, pontuação e ofensiva por usuário (T43)
- [x] Endpoint de progresso `GET/PUT /api/v1/me/progress` (T44)
- [x] Merge do progresso local com o da conta (T52)
- [x] Sincronizar ao abrir logado, no login e após cada jogada, com fila offline (T53)
- [x] Ofensiva (foguinho) lida da conta quando o jogador está logado
- [x] CORS, expiração de token, rate limit e headers de segurança (T46)

Ponto de atenção: o progresso do aparelho é mesclado na conta que fizer login
nele. Se duas pessoas usarem contas diferentes no mesmo navegador, o progresso
local de uma vai para a conta da outra (comportamento "link device" do design).

## Sprint 2 — Ranking e auditoria de segurança

Objetivo: ranking diário, semanal e mensal e uma auditoria de segurança
antes de abrir para mais jogadores. Branch: `feature/sprint-2-ranking`.

- [x] Endpoint de ranking diário / semanal / mensal, por modo e geral (T45)
- [x] Tela de Ranking no front, com acesso pelo Menu e pelo Perfil (T54)
- [x] Histórico do jogador acessível pela conta (o sync traz o histórico da
  conta para Calendário e Estatísticas em qualquer aparelho)
- [x] CI do backend (T47), rodando os testes também em PostgreSQL —
  ⚠️ só roda no GitHub após o push
- [x] Testes de fluxo e a11y das telas de conta/ranking (T56)
- [x] Importar uma skill de auditoria de segurança para o projeto
  (`.claude/skills/security-audit/SKILL.md`)
- [x] Rodar a auditoria (front + backend) e registrar os achados
  (`docs/security/AUDIT-2026-10-13.md`)
- [x] Corrigir os achados críticos/altos (SEC-01: pontos do ranking
  recalculados no servidor)
- 🔒 Hospedagem do backend + Postgres e env do front (T48, T57) — decisão da equipe

**Propostas da auditoria (aguardando aceite da equipe):**

- [ ] SEC-02: compose sem `FASTAPI_ENV=development` por padrão (junto da hospedagem)
- [ ] SEC-03: rate limit compartilhado entre processos e IP real atrás do proxy
- [ ] SEC-04: token de redefinição de uso único e revogar sessões ao trocar a senha
- [ ] SEC-05: apelido no ranking para quem não informou nome (ou nome obrigatório)
- [ ] SEC-06/07/09/12: chave forte, limite por e-mail na recuperação,
  autoescape nos e-mails e claim de tipo nos tokens

## Sprint 3 — Acessibilidade

Objetivo: o jogo é jogável por pessoas com dislexia, baixa visão e cegas.
Branch: `feature/sprint-3-acessibilidade`.

- [x] Opção de fonte para dislexia na tela de Acessibilidade (OpenDyslexic)
- [x] Tema de alto contraste (preto/branco/amarelo, contraste ≥ 8:1)
- [x] Jogo 100% pelo teclado: foco visível, atalhos A–D / 1–4 no jogo,
  foco no título a cada tela
- [x] Preparar para leitor de tela: títulos `<h1>`, landmarks, palavra
  destacada lida em texto, resultado anunciado, calendário com a situação de
  cada dia
- [ ] Testar com leitor de tela real (NVDA / Narrador / TalkBack) seguindo
  `docs/a11y/LEITOR-DE-TELA.md` e registrar os resultados — **precisa de uma
  pessoa da equipe**
- [ ] Corrigir o que o teste manual apontar (riscos já listados no roteiro)
- [ ] Conferir visualmente alto contraste e fonte para dislexia (claro,
  escuro e celular)

## Sprint 4 — Novos modos de jogo

Objetivo: três modos novos além de Morfologia, Sintaxe e Sinônimos.

- 🔒 Receber da equipe o JSON de antônimos e o JSON de questões do ENEM
- [ ] Modo Antônimos (questões do JSON fornecido pela equipe)
- [ ] Modo ENEM, **livre** (fora do desafio diário; questões do JSON fornecido
  pela equipe)
- [ ] Modo Aleatório: mescla as questões de todos os modos
- [ ] Ranking e progresso aceitando os modos novos

---

## Decisões dos modos novos

- **Antônimos e ENEM:** o conteúdo vem de arquivos JSON que a equipe vai fornecer.
- **ENEM:** modo livre, fora do desafio diário.
- **Aleatório:** mistura as questões de todos os modos.

## Dúvidas em aberto

1. **Hospedagem** do backend e do banco (já registrada como bloqueio no `ROADMAP`).
