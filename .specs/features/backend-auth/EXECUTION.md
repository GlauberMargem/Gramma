# Backend, Login e Ranking: Execução

**Tasks**: `.specs/features/backend-auth/tasks.md`
**Modelo**: orquestrador (sessão principal) + subagentes em worktrees isoladas.

## Regras de orquestração

1. **Uma worktree por agente** (`isolation: "worktree"`), saindo do `main`
   atualizado. Cada agente faz **exatamente uma task** e **um commit** com a
   mensagem da task.
2. **O orquestrador integra**: ao fim de cada onda, traz os commits para `main`
   na ordem do número da task (`git cherry-pick`), roda os gates e só então abre
   a onda seguinte. Agentes nunca fazem push nem mexem em `main`.
3. **Gates por onda** (no `main`): backend `ruff check backend && pytest`; front
   `npm run typecheck && npm run lint && npm test`. Onda que só toca o backend
   roda só o gate do backend e vice-versa; onda mista roda os dois.
4. **Arquivos disjuntos**: cada agente só toca o que está em `Where`. O
   orquestrador é dono de `router.tsx` quando a onda tem duas telas
   simultâneas — nesse caso o agente entrega o componente e o orquestrador liga a
   rota (evitar conflito no mesmo arquivo).
5. **Hospedagem é bloqueio**: T48 e T57 **não** são executáveis até a equipe
   decidir o provedor. O orquestrador para nessas tasks e pede a decisão.
6. **Sem especulação**: agente que precisa de algo fora da task para e reporta,
   sem alargar o escopo.
7. **Relatório do agente** (formato fixo): task, commit, arquivos, comandos com
   resultado, desvios, pendências.
8. **Verificação**: o orquestrador relê o diff e roda os gates antes de integrar.
9. **Tarefas humanas** (T48, T57) não são delegadas.

## Emendas ao plano

| Emenda | Task | Mudança |
| --- | --- | --- |
| E1 | T41 | O scaffold pode ser feito pelo orquestrador (mecânico); a partir de T42 os agentes assumem. `backend/` inteiro entra num só commit. |
| E2 | T44/T45 | Ambos editam `crud.py`/`schemas.py`: **não rodar em paralelo** se o orquestrador preferir evitar conflito; ou cada um cria seu arquivo de crud e o orquestrador consolida. |
| E3 | T51/T54/T55 | Todas editam `router.tsx`: cada agente **não** toca `router.tsx`; adiciona a página e reporta a rota; o orquestrador liga. |
| E4 | T53 | Edita `authStore.ts` e `recordResult.ts`; **não** rodar junto de T50/T52 que tocam os mesmos arquivos. |
| E5 | Front | `style.css` recebeu adições em M3; aqui as telas novas podem adicionar CSS, mas o orquestrador centraliza as mudanças de CSS para evitar conflito. |
| E6 | Todas | Contexto do agente: seção da própria task em `tasks.md` + seções relevantes de `design.md` + tipos de `src/domain/types.ts`. Não precisa de `spec.md` inteira. |

## Ondas

| Onda | Tasks | Agentes | Pré-requisito |
| --- | --- | --- | --- |
| W0 | T41 | 1 (orquestrador) | - |
| W1 | T42, T52 [P] | 2 | W0 |
| W2 | T43 | 1 | W1 |
| W3 | T44, T45 [P] | 2 | W2 |
| W4 | T46, T49 [P] | 2 | W3 |
| W5 | T47, T50 [P] | 2 | W4 |
| W6 | T48 (bloqueada), T51 [P] | 1 | W5 |
| W7 | T53, T54, T55 [P] | 3 | W6 |
| W8 | T56 | 1 | W7 |
| W9 | T57 (bloqueada) | - | W8 + decisão de hospedagem |

Mapa de dependências: T42←T41; T43←T41; T44←T42,T43; T45←T42,T43; T46←T44;
T47←T45; T48←T47; T49←T44,T45; T50←T49; T51←T50; T52←∅; T53←T45,T50,T52;
T54←T49,T50; T55←T50,T51; T56←T53,T54,T55; T57←T48,T56.

Pico de paralelismo: 3 agentes (W7).

## Prompt do orquestrador

````text
Você é o orquestrador da execução do backend/auth/ranking do GRAMMA.
Leia, nesta ordem: .specs/project/PROJECT.md, .specs/project/STATE.md,
.specs/features/backend-auth/EXECUTION.md e
.specs/features/backend-auth/tasks.md. Consulte design.md e spec.md sob demanda.

OBJETIVO
Executar as tasks T41–T57 de tasks.md, em ondas (EXECUTION.md), com commits
progressivos na main, um por task, na mensagem exata de cada task.

COMO TRABALHAR
1. Aplique as emendas E1–E6.
2. W0 (T41): faça você mesmo (cópia/trim do template). Nas demais, dispare os
   agentes da onda em paralelo com isolation: "worktree".
3. Ao receber os relatórios: revise cada diff, integre com cherry-pick em ordem
   de task, rode os gates da onda e só então abra a próxima.
4. Pare e peça decisão ao usuário em T48 e T57 (hospedagem) e antes de qualquer
   push.
5. Ao fim de cada onda: marque as tasks em tasks.md e registre decisões/lições
   em STATE.md.

PROMPT-BASE DOS AGENTES (preencha {TASK})
"""
Você implementa a task {TASK} do backend/auth/ranking do GRAMMA.
Trabalhe somente na sua worktree. Leia a seção {TASK} de
.specs/features/backend-auth/tasks.md e as seções relevantes de design.md.

REGRAS
- Faça só o que a task pede, só nos arquivos de "Where". Proibido editar
  src/router.tsx ou empilhar CSS global; se precisar, pare e reporte.
- Domínio/estado do front: TDD. Backend: teste junto da rota.
- TypeScript strict (sem any); Python com type hints e ruff limpo.
- Nunca logar senha/token; senha só como hash.
- Rode os comandos de Verify e o gate do seu lado:
  backend: ruff check backend && pytest
  front:   npm run typecheck && npm run lint && npm test
- Faça UM commit com a mensagem exata da task.
- Não faça push nem toque em main.

RELATÓRIO FINAL (formato fixo)
Task: {TASK} | Commit: <hash> | Arquivos: <lista>
Comandos e resultado: <resumo>
Done when: <ok/não ok por item>
Desvios: <ou "nenhum">
Pendências/riscos: <ou "nenhum">
"""
````
