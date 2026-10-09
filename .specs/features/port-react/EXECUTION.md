# Port para React + TypeScript: Execução com múltiplos agentes

**Tasks**: `.specs/features/port-react/tasks.md`
**Modelo**: um orquestrador (sessão principal) + subagentes em worktrees isoladas.

## Regras de orquestração

1. **Uma worktree por agente** (`isolation: "worktree"`), saindo do `main` atualizado. Cada agente faz **exatamente uma task** e **um commit** com a mensagem da task.
2. **O orquestrador integra**: ao fim de cada onda, traz os commits para `main` na ordem do número da task (`git cherry-pick`), roda os gates e só então abre a onda seguinte. Agentes nunca fazem push nem mexem em `main`.
3. **Gates por onda** (no `main`, após a integração): `npm run typecheck && npm run lint && npm test && npm run build`. Se falhar, o orquestrador corrige ou devolve a task ao agente (via `SendMessage`) antes de seguir.
4. **Arquivos disjuntos**: cada agente só toca os arquivos listados em `Where` da sua task. `package.json`, `router.tsx` e `style.css` são **proibidos** para agentes de onda paralela (ver Emendas).
5. **Sem especulação**: o agente que achar que precisa de algo fora da sua task para passar nos testes para e reporta, sem alargar o escopo.
6. **Relatório do agente** (formato fixo): task, commit, arquivos, comandos rodados com resultado, desvios do design, pendências.
7. **Atualização de estado**: o orquestrador registra em `STATE.md` decisões novas, bloqueios e lições ao fim de cada onda, e marca a task como concluída em `tasks.md`.
8. **Verificação**: o orquestrador não confia no relatório; relê o diff e roda os gates antes de integrar.
9. Tasks de revisão humana (T37 paridade visual, T38 configuração do Pages) **não são delegadas**: o orquestrador prepara e o usuário valida.

## Emendas ao plano (necessárias para paralelizar sem conflito)

| Emenda | Task | Mudança |
| --- | --- | --- |
| E1 | T2/T3 | Instalar **todas** as dependências já na preparação: `react`, `react-dom`, `react-router-dom`, `gsap`, `@gsap/react`, `vitest`, `jsdom`, `@testing-library/{react,user-event,jest-dom}`, `jest-axe`, `typescript-eslint`, `eslint-plugin-react-hooks`. Depois da T3 nenhum agente edita `package.json`. |
| E2 | T15 | O router importa **todas** as telas de arquivos stub já criados (`src/screens/{Menu,ModeHub,Game,End,Calendar,Stats,Achievements,Accessibility,HowToPlay,Intro}.tsx`, cada um exportando um componente placeholder). Tasks de tela passam a **substituir só o próprio arquivo**, sem tocar `router.tsx`. |
| E3 | T14 | `style.css` fica congelado após a T14. Se uma task precisar de CSS novo, reporta ao orquestrador, que cria uma task `fix:` serial. |
| E4 | T27 / T31 | Ambas editam `Game.tsx`: **não rodar em paralelo**. T27 ∥ T30 na mesma onda; T31 depois. |
| E5 | T26 | Se `Game.tsx` passar de ~150 linhas, o agente extrai `useQuestionSession` no mesmo commit (já previsto na checagem de granularidade). |
| E6 | Todas | Cada agente recebe como contexto: a seção da própria task em `tasks.md`, `design.md` (seções "Components", "Data Models" e "Tech Decisions") e os arquivos legados em `Reuses`. Não precisa de `spec.md` inteira, só dos IDs da task. |

## Ondas

| Onda | Tasks | Agentes | Pré-requisito |
| --- | --- | --- | --- |
| A | T1 → T2 → T3 | 1 (sequencial, no próprio orquestrador) | - |
| B | T4 | 1 | A |
| C | T5, T6, T7, T8, T10, T14 | 6 em paralelo | B (T14 só precisa de A) |
| D | T9, T11, T12, T15 | 4 em paralelo | C |
| E | T13, T16 | 2 em paralelo | D |
| F | T17, T25, T28, T32 | 4 em paralelo | E |
| G | T18, T19, T20, T21, T22, T23 | 6 em paralelo | F |
| H | T24, T26, T29, T33 | 4 em paralelo | G |
| I | T27, T30 | 2 em paralelo | H |
| J | T31 | 1 | I |
| K | T34 → T35 → T36 | 1 (sequencial; T35 é transversal) | J |
| L | T37 (com o usuário) → T38 → T39 → T40 | orquestrador | K |

Mapa de dependências conferido contra `tasks.md`: T9←T8; T11←T5,T6,T10; T12←T10; T13←T12; T15←T14; T16←T15; T17←T13,T16; T18–T23←T13,T17 (T19 também T7); T24←T17,T22; T26←T9,T11,T13,T19,T25; T29←T13,T28; T33←T32,T13,T19; T27←T26; T30←T29; T31←T26,T29; T34←T15,T31.

Pico de paralelismo: 6 agentes (ondas C e G). Teto sugerido: 6, para o orquestrador conseguir revisar os diffs.

## Prompt do orquestrador

Cole na sessão principal, na raiz do repositório, em `main` limpa:

````text
Você é o orquestrador da execução do port do GRAMMA para React + TypeScript.
Leia, nesta ordem: .specs/project/PROJECT.md, .specs/project/STATE.md,
.specs/features/port-react/EXECUTION.md e .specs/features/port-react/tasks.md.
Consulte spec.md e design.md sob demanda. Use /tlc-spec-driven (fase Execute).

OBJETIVO
Executar as 40 tasks de tasks.md, em ondas (EXECUTION.md), com commits
progressivos na main, um por task, na mensagem exata de cada task e terminando
com a linha: Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

COMO TRABALHAR
1. Aplique as emendas E1–E6 de EXECUTION.md: atualize tasks.md com elas no
   primeiro commit da Onda A (ou antes, em `docs: emendas de execução ao plano`).
2. Onda A (T1→T3): faça você mesmo, sequencialmente.
3. Ondas B em diante: para cada onda, dispare TODOS os agentes da onda em uma
   única mensagem (chamadas Agent em paralelo), com isolation: "worktree".
   Cada agente recebe o prompt-base abaixo preenchido com o ID da task.
4. Ao receber os relatórios: revise cada diff (git diff main...<branch>),
   integre com cherry-pick em ordem de task, rode os gates
   (npm run typecheck && npm run lint && npm test && npm run build) e só então
   abra a onda seguinte. Em falha, devolva ao agente com SendMessage ou corrija.
5. Ao fim de cada onda: marque as tasks como concluídas em tasks.md, registre
   decisões/bloqueios/lições em STATE.md (commit `docs: estado após onda X`).
6. Não delegue T37 (paridade visual) nem T38 (Pages). Na T37 pare e peça ao
   usuário para validar o app lado a lado com legacy/. Na T38 peça ao usuário
   para configurar Pages > Source > GitHub Actions antes do primeiro deploy.
7. Não faça push sem o usuário pedir. Pare e pergunte se: um gate falhar duas
   vezes na mesma task, um agente propuser mudar o design, ou surgir conflito
   de merge não trivial.
8. No final de cada onda, responda com: tasks concluídas, commits, resultado dos
   gates, desvios, e a próxima onda.

PROMPT-BASE DOS AGENTES (preencha {TASK})
"""
Você implementa a task {TASK} do port do GRAMMA para React + TypeScript.
Trabalhe somente na sua worktree. Leia: a seção {TASK} de
.specs/features/port-react/tasks.md; as seções Components, Data Models e Tech
Decisions de .specs/features/port-react/design.md; e os arquivos legados citados
em Reuses (em legacy/). Não precisa ler o resto do repositório.

REGRAS
- Faça só o que a task pede, só nos arquivos de "Where". É proibido editar
  package.json, src/router.tsx e src/styles/style.css. Se precisar, pare e reporte.
- Domínio e estado: TDD (escreva o teste, veja falhar, implemente, veja passar).
- Paridade com o legado: reproduza o comportamento, não "melhore" regras.
- TypeScript strict, sem `any`, sem dangerouslySetInnerHTML.
- Siga o estilo do código vizinho; comentários só onde o porquê não é óbvio.
- Rode os comandos de "Verify" e os gates:
  npm run typecheck && npm run lint && npm test
- Faça UM commit com a mensagem exata de "Commit" da task, mais a linha
  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
- Não faça push nem toque em main.

RELATÓRIO FINAL (formato fixo)
Task: {TASK} | Commit: <hash> | Arquivos: <lista>
Comandos rodados e resultado: <saída resumida, inclusive falhas>
Critérios "Done when": <cada item marcado ok/não ok>
Desvios do design: <ou "nenhum">
Pendências/riscos: <ou "nenhum">
"""
````
