# Roadmap

**Current Milestone:** M3: Backend, login e ranking (spec criada, aguardando autorização)
**Status:** Planning

> O port (M1) está em execução/finalização; M3 depende de M1 estar publicado.

---

## M1: Port para React + TypeScript

**Goal:** App React publicado no Pages com paridade total e o legado removido.
**Target:** Critérios de aceite de `features/port-react/spec.md` todos verificados.

### Features

**port-react** - PLANNING (spec, design e tasks em `.specs/features/port-react/`)

- Domínio e dados tipados e testados
- Store de persistência compatível com o formato legado
- Todas as telas, rotas e animações GSAP
- CI de deploy e remoção do legado

---

## M2: Melhorias pós-port

**Goal:** Itens que o README já listava como próximos passos.

### Features

**pwa** - PLANNED (instalável, `vite-plugin-pwa`)
**mascote-feedback** - PLANNED (mascote/fio narrativo nas telas de feedback)
**efeitos-canvas** - PLANNED (Canvas/WebGL nas celebrações)

---

## M3: Backend, login e ranking

**Goal:** Backend FastAPI (base `full-stack-fastapi-template`) com login
opcional, sincronização de progresso e ranking; front integrado sem quebrar o
modo convidado.

**Status:** PLANNING — spec em `.specs/features/backend-auth/`, aguardando
autorização do usuário. Hospedagem (T48/T57) pendente de decisão da equipe.

### Features

**backend-auth** - PLANNING

- M0 (T41–T48): backend com auth, progresso e ranking + CI
- M1 (T49–T57): front com conta, sync "link device" e tela de ranking

---

## M4: Jogos, acessibilidade e extras (futuro)

Ideias capturadas para milestones seguintes (ainda sem spec):

- Modos: Antônimos, Aleatório e módulo ENEM (API `enem.dev`)
- Acessibilidade: fonte para dislexia, tema de alto contraste, suporte a
  leitor de tela e jogo 100% por teclado
- Foguinho da sequência (visual estilo TikTok/Duolingo) nas telas
- Modo Carreira (trilha progressiva de dificuldade) — adiado pelo usuário
- Skill de auditoria de segurança (`.opencode/skills/security-audit/`) + execução

---

## Future Considerations

- Impedir pontuação repetida ao rejogar dias de arquivo (ver STATE.md, AD-006)
- Mais palavras no banco de sinônimos (hoje repete em ciclo)
- Modo difícil (campo aberto) previsto na proposta original (`ideia.md`)
