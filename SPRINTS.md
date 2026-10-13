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

- [x] Backend FastAPI + PostgreSQL + Alembic (tabela `user`)
- [x] Cadastro, login (JWT) e sessão persistida no front (`/entrar`, `/perfil`)
- [x] Recuperação de senha (esqueci / redefinir)

**Sequência e acessibilidade (já existente)**

- [x] Foguinho/ofensiva exibido no Menu, Fim e Estatísticas (salvo só no navegador)
- [x] Tema claro/escuro
- [x] Ajuste do tamanho da fonte
- [x] Leitura da frase em voz alta
- [~] Navegação por teclado e rótulos de acessibilidade (base feita na T35;
  falta garantir o jogo 100% pelo teclado — Sprint 3)

---

## Sprint 1 — Progresso e ofensiva no banco

Objetivo: o progresso e a ofensiva do jogador ficam salvos na conta dele.

- [ ] Modelo de progresso no banco: partidas, pontuação e ofensiva por usuário (T43)
- [ ] Endpoint de progresso (T44)
- [ ] Merge do progresso local com o da conta (T52)
- [ ] Sincronizar ao fazer login, com fila offline (T53)
- [ ] Ofensiva (foguinho) lida da conta quando o jogador está logado
- [ ] CORS, expiração de token e rate limit no login (T46)

## Sprint 2 — Ranking e auditoria de segurança

Objetivo: ranking diário, semanal e mensal e uma auditoria de segurança
antes de abrir para mais jogadores.

- [ ] Endpoint de ranking diário / semanal / mensal, por modo e geral (T45)
- [ ] Tela de Ranking no front (T54)
- [ ] Histórico do jogador acessível pela conta
- [ ] CI do backend (T47)
- [ ] Testes de fluxo e a11y das telas de conta/ranking (T56)
- [ ] Importar uma skill de auditoria de segurança para o projeto
- [ ] Rodar a auditoria (front + backend) e registrar os achados
- [ ] Corrigir os achados críticos/altos
- 🔒 Hospedagem do backend + Postgres e env do front (T48, T57) — decisão da equipe

## Sprint 3 — Acessibilidade

Objetivo: o jogo é jogável por pessoas com dislexia, baixa visão e cegas.

- [ ] Opção de fonte para dislexia na tela de Acessibilidade
- [ ] Tema de alto contraste
- [ ] Jogo 100% pelo teclado (todas as telas, incluindo resposta e calendário)
- [ ] Investigar leitor de tela (NVDA / leitor do Windows / TalkBack) jogando
  uma partida completa e registrar o que falha
- [ ] Corrigir o que for viável: anúncio de acerto/erro, troca de tela, foco

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
