# Port para React + TypeScript: Specification

**Status**: Draft (aguardando aprovação)
**Escopo**: Large (multi-componente, substitui o app inteiro)

## Problem Statement

O GRAMMA é hoje JS puro com telas alternadas por `hidden`, HTML montado por string, estado em globais (`window.currentShareData`) e `localStorage` lido a cada chamada. Isso dificulta evoluir (PWA, mascote, efeitos) e testar. O port para React + TypeScript organiza UI e estado e tipa o domínio, sem mudar regras nem visual.

## Goals

- [ ] Paridade funcional: todo requisito abaixo verificado contra o app legado.
- [ ] Progresso existente preservado: fixture de `gramma_user_data` legado carrega e evolui sem perda.
- [ ] Domínio testado (≥ 90% de linhas em `src/domain` e `src/state`).
- [ ] Deploy automático no GitHub Pages; `legacy/` removido ao final.

## Out of Scope

| Feature | Motivo |
| --- | --- |
| Novas regras, conteúdo ou design | Port é de paridade (AD-006) |
| PWA, mascote, Canvas/WebGL | Roadmap M2 |
| Corrigir rejogo de arquivo repontuando | Mudança de regra; Deferred |
| Backend/contas/ranking | Não existe hoje |
| Modo difícil (campo aberto) | Só existe na proposta original |

---

## User Stories

### P1: Jogar o desafio do dia ⭐ MVP

**User Story**: Como jogador, quero escolher um modo e responder a pergunta do dia para ganhar pontos e manter minha ofensiva.

**Why P1**: É o núcleo do produto.

**Acceptance Criteria**:

1. WHEN o jogador abre o Menu e toca em um modo THEN o sistema SHALL salvar `settings.study_type`, marcar o botão ativo e abrir o ModeHub com ícone, título e `DIA N`. (SCR-01, SCR-02)
2. WHEN o dia atual ainda não foi jogado no modo THEN o ModeHub SHALL mostrar `JOGAR DIA N` com `play_arrow`; WHEN já foi jogado THEN SHALL mostrar `VER RESULTADO` com `check_circle`. (SCR-02)
3. WHEN o jogador inicia o jogo THEN o sistema SHALL exibir badge `DIA N / total`, rótulo da fase do modo, a frase com o termo destacado (ou "Qual é o sinônimo de **X**?") e 4 opções com letras A–D. (GAME-01, GAME-02)
4. WHEN a tela de pergunta é montada THEN as opções SHALL ser embaralhadas uma única vez e manter a ordem em re-renders. (GAME-03)
5. WHEN o jogador escolhe uma opção THEN o sistema SHALL aceitar só a primeira escolha, marcar a opção como certa/errada com ícone, destacar a certa se errou, desabilitar as demais e, após 900 ms, ir ao resultado. (GAME-04, GAME-05)
6. WHEN a resposta é registrada THEN o sistema SHALL calcular pontos (100/200/150), bônus de +10% a cada 5 acertos seguidos no modo, atualizar streaks por modo, `games_played`, `total_score`, histórico `"{dia}:{modo}"` e conquistas. (DOM-01, STO-02)
7. WHEN o dia atual já foi jogado no modo e o jogador toca JOGAR THEN o sistema SHALL abrir o resultado salvo sem nova pergunta. (GAME-06)

**Independent Test**: Abrir `#/`, escolher Morfologia, jogar e acertar; ver pontos e linha do `localStorage` corretos.

---

### P1: Preservar dados do jogador ⭐ MVP

**User Story**: Como jogador existente, quero que meu progresso continue após a atualização.

**Why P1**: Quebrar isso apaga streaks e conquistas de quem já joga.

**Acceptance Criteria**:

1. WHEN existir `gramma_user_data` no formato legado THEN o sistema SHALL carregar com merge de defaults em `settings` e `stats` e preservar `uuid` e `history`. (STO-01)
2. WHEN o JSON estiver corrompido ou ausente THEN o sistema SHALL iniciar dados padrão sem quebrar a UI. (STO-01)
3. WHEN os dados forem gravados THEN o sistema SHALL usar a mesma chave e os mesmos nomes de campo do legado. (STO-01)
4. WHEN `localStorage` estiver indisponível ou cheio THEN o jogo SHALL continuar funcionando na sessão. (STO-04)

**Independent Test**: Teste com fixture exportada do app legado.

---

### P1: Calendário e arquivo ⭐ MVP

**User Story**: Como jogador, quero rejogar dias passados sem afetar minha ofensiva diária.

**Why P1**: Parte do núcleo e do contrato de ofensiva.

**Acceptance Criteria**:

1. WHEN o jogador abre o Calendário THEN o sistema SHALL mostrar o mês do dia atual com grade iniciando no dia da semana correto. (CAL-01)
2. WHEN um dia for futuro ou fora do intervalo 1..total THEN o botão SHALL ficar desabilitado (`status-future`). (CAL-02)
3. WHEN um dia tiver resultado no modo atual THEN SHALL aparecer `won`/`lost`; senão `available`; o dia de hoje SHALL ter `is-today`. (CAL-03)
4. WHEN o jogador navega de mês THEN o sistema SHALL desabilitar anterior/próximo nos limites do primeiro e do último dia. (CAL-04)
5. WHEN o jogador joga um dia diferente de hoje THEN o badge SHALL ser `DIA N (ARQUIVO)` e a ofensiva diária SHALL NOT mudar. (CAL-05, STO-03)
6. WHEN o jogador abre um dia de arquivo já jogado THEN o sistema SHALL permitir jogar de novo (paridade legado). (CAL-06)

**Independent Test**: Jogar um dia anterior e conferir `current_streak` e `last_streak_day` inalterados.

---

### P2: Estatísticas, conquistas e resultado

**User Story**: Como jogador, quero acompanhar meu desempenho e desbloquear conquistas.

**Acceptance Criteria**:

1. WHEN abrir Estatísticas THEN o sistema SHALL listar as 14 linhas atuais, incluindo `N / 17` conquistas. (SCR-03)
2. WHEN abrir Conquistas THEN o sistema SHALL mostrar as 17 conquistas, com as bloqueadas em `is-locked`. (SCR-04)
3. WHEN uma conquista for desbloqueada no jogo THEN o resultado SHALL exibir um toast por conquista nova. (SCR-05)
4. WHEN o acerto fechar marco de 5 (ou houver conquista nova) THEN o resultado SHALL exibir sparkles e `is-perfect` no marco. (SCR-05)
5. WHEN tocar COMPARTILHAR THEN o sistema SHALL copiar `GRAMMA — Dia N (Modo): 🟩|🟥 — X pts` e mostrar toast; WHEN o clipboard falhar THEN SHALL exibir o texto no toast. (SCR-06)
6. WHEN o resultado for aberto de um salvo THEN `newlyUnlocked` SHALL ser vazio. (SCR-05)

**Independent Test**: Forçar `morph_correct_streak_max = 9` e acertar; ver "Morfologicador".

---

### P2: Preferências e acessibilidade

**User Story**: Como jogador, quero ajustar tema, fonte e ouvir a frase.

**Acceptance Criteria**:

1. WHEN o app inicia THEN o tema SHALL vir de `settings.dark_mode` (padrão: `prefers-color-scheme`, senão escuro) e a escala de `font_scale_index`. (PREF-01)
2. WHEN alternar o tema THEN o botão SHALL fazer o flip GSAP (scaleX 0→1) e trocar `data-theme` e o ícone no ponto fechado; o valor SHALL persistir. (PREF-02)
3. WHEN alterar a fonte THEN o índice SHALL ficar entre 0 e 3, o rótulo (Pequena/Normal/Grande/Extra Grande) SHALL atualizar e persistir. (PREF-03)
4. WHEN tocar "ouvir" THEN o sistema SHALL ler o texto da frase em `pt-BR`; WHEN não houver `speechSynthesis` THEN o botão SHALL ficar desabilitado com `title` explicativo. (PREF-04)

**Independent Test**: Alterar tema e fonte, recarregar e ver os valores mantidos.

---

### P2: Navegação e intro

**User Story**: Como jogador, quero a abertura animada e links diretos para um dia.

**Acceptance Criteria**:

1. WHEN abrir o app sem `?day` e sem `gramma_intro_seen` na sessão THEN o sistema SHALL tocar a intro GSAP uma vez e, ao fim ou ao tocar PULAR, ir ao Menu. (NAV-03)
2. WHEN abrir `…/?day=N` (N inteiro > 0) THEN o sistema SHALL ir direto ao jogo/resultado do dia N, sem intro. (NAV-02)
3. WHEN N > total de dias THEN o sistema SHALL ir ao Menu. (NAV-02)
4. WHEN trocar de tela THEN a saída SHALL fazer fade/up de 0,14 s e a entrada fade/down de 0,25 s. (NAV-04)
5. WHEN fora do Menu THEN a barra de ícones flutuante SHALL ficar oculta. (NAV-05)
6. Rotas e botões "voltar" SHALL seguir o grafo do legado (ver design.md). (NAV-01)

**Independent Test**: Abrir `/?day=3` em aba nova e ver o dia 3.

---

### P3: Qualidade, CI e limpeza

**Acceptance Criteria**:

1. WHEN houver push na `main` THEN o CI SHALL rodar typecheck, lint, testes e build e publicar no Pages. (OPS-01)
2. WHEN o port estiver aprovado THEN `legacy/`, `js/`, `scripts/build-data.js` e os `.js` de dados SHALL ser removidos. (OPS-02)
3. WHEN concluído THEN README e CHANGELOG SHALL descrever o novo fluxo (`npm run dev|build|test`). (OPS-03)
4. Todos os elementos interativos SHALL ter foco visível, nome acessível e operação por teclado. (A11Y-01)

---

## Edge Cases

- WHEN o dia atual for > total de dias THEN o jogo SHALL usar o último dia disponível (clamp de `GameEngine`). (DOM-03)
- WHEN `dayId` do banco de sinônimos exceder o pool THEN SHALL ciclar `(dia-1) % tamanho`. (DOM-04)
- WHEN uma frase já tiver `<span>` THEN o destaque SHALL usá-lo; senão destacar a primeira ocorrência de `target_word`. (DOM-04)
- WHEN a rota `/jogo/:dia` receber valor inválido (≤ 0, NaN) THEN SHALL ir ao Menu. (NAV-02)
- WHEN o React rodar em StrictMode (dev) THEN o jogo SHALL NOT embaralhar duas vezes nem gravar resultado duas vezes. (GAME-07)
- WHEN o dia virar com o app aberto THEN o dia atual SHALL ser recalculado a cada abertura de tela (sem cache global). (DOM-03)

---

## Requirement Traceability

| ID | Descrição | Story | Status |
| --- | --- | --- | --- |
| DOM-01 | Pontuação 100/200/150 e bônus de marco | P1 Jogar | Pending |
| DOM-02 | Catálogo e avaliação de 17 conquistas | P2 Stats | Pending |
| DOM-03 | Calendário: dia atual, dateForDay, dayIdForDate, clamp | P1 Calendário | Pending |
| DOM-04 | Stores de frases e sinônimos; destaque do termo | P1 Jogar | Pending |
| DOM-05 | Montagem da pergunta (prompt, shuffle, resposta) | P1 Jogar | Pending |
| STO-01 | Formato e chave compatíveis, merge de defaults, fallback | P1 Dados | Pending |
| STO-02 | `recordResult` (stats, histórico, conquistas) | P1 Jogar | Pending |
| STO-03 | Ofensiva diária e arquivo não conta | P1 Calendário | Pending |
| STO-04 | Falha de storage tolerada | P1 Dados | Pending |
| NAV-01 | Rotas e grafo de navegação | P2 Navegação | Pending |
| NAV-02 | `?day=N` e validação | P2 Navegação | Pending |
| NAV-03 | Intro uma vez por sessão | P2 Navegação | Pending |
| NAV-04 | Transições de tela GSAP | P2 Navegação | Pending |
| NAV-05 | TopBar só no Menu | P2 Navegação | Pending |
| SCR-01 | Menu (modo, ofensiva, atalhos) | P1 Jogar | Pending |
| SCR-02 | ModeHub | P1 Jogar | Pending |
| SCR-03 | Estatísticas | P2 Stats | Pending |
| SCR-04 | Conquistas | P2 Stats | Pending |
| SCR-05 | Resultado (pontos, streak, toasts, sparkles) | P2 Stats | Pending |
| SCR-06 | Compartilhar | P2 Stats | Pending |
| SCR-07 | Como jogar | P2 Prefs | Pending |
| GAME-01..07 | Pergunta, opções, feedback, atraso, salvo, StrictMode | P1 Jogar | Pending |
| CAL-01..06 | Calendário | P1 Calendário | Pending |
| PREF-01..04 | Tema, fonte, voz | P2 Prefs | Pending |
| OPS-01..03 | CI, limpeza, docs | P3 | Pending |
| A11Y-01 | Foco, nomes, teclado | P3 | Pending |

**Coverage:** 40 IDs, 40 mapeados a tasks (ver `tasks.md`, 40 tasks)

---

## Success Criteria

- [ ] Checklist de paridade (screenshots `docs/screenshot-*.png` vs. novo app, claro e escuro) sem diferenças visuais relevantes.
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` passam.
- [ ] Jogador com dados legados abre o novo app e vê as mesmas estatísticas e conquistas.
- [ ] Workflow de deploy verde e jogo acessível em `https://glaubermargem.github.io/Gramma/`.
