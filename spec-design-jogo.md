> **Nota:** este é o documento de especificação visual original (paleta
> azul-marinho/ciano/amarelo). A identidade visual adotada no jogo mudou
> — veja [`CHANGELOG.md`](CHANGELOG.md) para o que é diferente hoje e
> [`README.md`](README.md) para o design atual.

# Especificação Visual — Desafio Gramatical Diário

Baseado nas 3 imagens de referência: fundo azul-marinho profundo, cartão de pergunta com borda ciano arredondada, ícone de calendário/interrogação, palavra-alvo em amarelo, e grade 2x2 de botões de resposta com feedback verde/vermelho.

---

## 1. Paleta de cores (CSS Variables)

```css
:root {
  /* Base */
  --color-bg: #1B1470;          /* fundo azul-marinho principal (imagens 1 e 3) */
  --color-bg-alt: #241A8C;      /* variação usada na imagem 2, levemente mais roxa */
  --color-surface: transparent; /* o "cartão" da pergunta não tem preenchimento, só borda */

  /* Bordas e destaques */
  --color-border-card: #38BDF8; /* ciano do contorno do card de pergunta e botões neutros */
  --color-border-card-soft: #4C8DFF;

  /* Texto */
  --color-text-primary: #FFFFFF;
  --color-text-highlight: #FFD23F; /* palavra-alvo em amarelo */

  /* Estados dos botões de resposta */
  --color-answer-default-border: #38BDF8;
  --color-answer-default-bg: transparent;
  --color-answer-correct-bg: #22C55E;
  --color-answer-correct-border: #16A34A;
  --color-answer-wrong-bg: #E11D48;
  --color-answer-wrong-border: #F43F5E;

  /* Acentos de UI (header) */
  --color-icon: #FFFFFF;
  --color-label-day: #FFD23F; /* "DO DIA" em amarelo no header */

  /* Raio e sombra */
  --radius-card: 28px;
  --radius-button: 16px;
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-button: 0 4px 0 rgba(0, 0, 0, 0.25); /* efeito "botão físico" visto nas imagens */
}
```

**Por que essas cores:** o jogo é inspirado no Termo/quiz de TV — precisa de alto contraste para ser lido rápido em qualquer luz, então o fundo escuro + ciano neon + amarelo é a combinação que aparece nas 3 imagens (não é decoração aleatória, é a identidade visual do produto que você já validou).

---

## 2. Tipografia

```css
:root {
  --font-display: 'Fredoka', 'Baloo 2', sans-serif; /* fonte grossa e arredondada, tipo quiz de TV */
  --font-body: 'Fredoka', sans-serif;
}

body {
  font-family: var(--font-body);
  font-weight: 700; /* nas imagens, praticamente todo texto é bold */
  color: var(--color-text-primary);
  letter-spacing: 0.3px;
}
```

- Todo o texto do jogo é **caixa alta e bold** (ver imagens 1 e 3) — isso é intencional do gênero "quiz show", não um tell genérico de IA: mantenha.
- A palavra-alvo (`<span class="target-word">`) usa a mesma fonte, mesmo peso, só muda a cor para `--color-text-highlight`.
- Tamanhos sugeridos:
  - Frase da pergunta: `clamp(1.4rem, 4vw, 2rem)`
  - Texto dos botões: `clamp(1rem, 2.5vw, 1.3rem)`
  - Header "PERGUNTA DO DIA": `1.1rem` (linha 1 branca) / `1.1rem` (linha 2 amarela, "DO DIA")

---

## 3. Estrutura de layout (wireframe)

```
┌──────────────────────────────────────────────┐
│ [📅] PERGUNTA                        [ 1/1 ]  │  ← header
│      DO DIA                                   │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  ❓  "ELA CHEGOU CEDO PARA O               │ │  ← card da pergunta
│  │      COMPROMISSO."                        │ │     (borda ciano, sem fundo)
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌───────────────┐     ┌───────────────┐      │
│  │ A | SUBSTANTIVO│     │ B | ADJETIVO  │      │  ← grade 2x2
│  ├───────────────┤     ├───────────────┤      │
│  │ C | VERBO      │     │ D | ADVÉRBIO  │      │
│  └───────────────┘     └───────────────┘      │
└──────────────────────────────────────────────┘
```

- O **card da pergunta** (imagens 1 e 3) não tem cor de fundo própria: é o fundo azul “vazando” dentro de uma borda arredondada — visualmente é só um `border` + `border-radius`, não um `background`.
- Nas imagens 1 e 2, um ícone de **interrogação grande** fica à esquerda, fora da borda do card, alinhado verticalmente ao centro do texto.
- Na imagem 3 (que já mostra o header do "dia"), o ícone de interrogação some e dá lugar ao ícone de calendário no header — ou seja: **o `?` é usado no modo "pergunta avulsa/preview"**; no jogo diário de verdade, o cabeçalho com calendário + contador `1/1` é o que aparece.

```css
.game-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
  background: var(--color-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header .title-line-2 {
  color: var(--color-label-day);
}

.header .day-counter {
  border: 2px solid var(--color-border-card);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 0.9rem;
}

.question-card {
  border: 3px solid var(--color-border-card);
  border-radius: var(--radius-card);
  padding: 32px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-card);
}

.question-card .icon-question {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  stroke: var(--color-text-primary);
}

.question-card .sentence {
  text-align: center;
  line-height: 1.3;
}

.target-word {
  color: var(--color-text-highlight);
}
```

---

## 4. Botões de resposta (Modo Normal)

```css
.answers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.answer-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 3px solid var(--color-answer-default-border);
  background: var(--color-answer-default-bg);
  border-radius: var(--radius-button);
  padding: 16px 20px;
  color: var(--color-text-primary);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}

.answer-btn:hover {
  transform: translateY(-2px);
}

.answer-btn .option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-right: 2px solid rgba(255,255,255,0.3);
  padding-right: 10px;
}

/* Estados de resposta */
.answer-btn.is-correct {
  background: var(--color-answer-correct-bg);
  border-color: var(--color-answer-correct-border);
}

.answer-btn.is-wrong {
  background: var(--color-answer-wrong-bg);
  border-color: var(--color-answer-wrong-border);
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

Isso bate exatamente com a imagem 1: botão B ("SUBSTANTIVO") em vermelho/rosa forte porque foi clicado errado, os outros três continuam no estado neutro ciano.

### Modo Difícil (input + datalist)

```css
.hard-mode-input {
  border: 3px solid var(--color-border-card);
  border-radius: var(--radius-button);
  background: transparent;
  color: var(--color-text-primary);
  padding: 16px 20px;
  font-size: 1.1rem;
  width: 100%;
}

.hard-mode-input:focus {
  outline: none;
  border-color: var(--color-text-highlight);
}
```

---

## 5. Responsividade

- Abaixo de `480px`, a `.answers-grid` vira `grid-template-columns: 1fr` (uma coluna só, botões empilhados) — mantém a leitura fácil no celular, que é a plataforma principal de um jogo diário tipo Termo.
- O ícone de interrogação (`.icon-question`) reduz para `32px` e o padding do `.question-card` cai para `20px` em telas pequenas.

---

## 6. Fluxo de Menu e Tela Inicial ("Iniciar")

Pensando na sua Máquina de Estados (`INIT → MORPHOLOGY_PHASE → SYNTAX_PHASE → END_SCREEN`), o menu principal é a tela que existe **antes** do `INIT`, e funciona como um "hub":

### 6.1. Estrutura da tela de menu

```
┌──────────────────────────────────────────────┐
│                🧠  NOME DO JOGO                │
│         Desafio Gramatical & Sintático         │
│                                                │
│         🔥 Ofensiva atual: 5 dias              │
│                                                │
│   ┌────────────────────────────────────────┐  │
│   │            ▶  JOGAR DIA 42              │  │  ← CTA primário
│   └────────────────────────────────────────┘  │
│                                                │
│   [ 📅 Ver dias anteriores ]  [ 📊 Estatísticas ]│
│   [ ⚙️ Modo: Normal / Difícil ]                │
└──────────────────────────────────────────────┘
```

### 6.2. Regras de exibição do botão "Iniciar"

O botão principal muda de rótulo e comportamento conforme o `history` do `localStorage` para o `current_day` (a mesma lógica que já está no seu `ferramentas.md`, seção 2):

| Situação | Rótulo do botão | Ação ao clicar |
|---|---|---|
| Dia atual ainda não jogado | `▶ JOGAR DIA 42` | Inicia `INIT` normalmente, calculando `current_day` pela fórmula do Epoch |
| Dia atual já jogado (venceu ou perdeu) | `✓ VER RESULTADO` | Pula direto para `END_SCREEN` com os dados salvos daquele dia, sem permitir refazer |
| Usuário entrou via `?day=N` de um dia passado | `▶ JOGAR DIA N (ARQUIVO)` | Inicia o jogo normalmente, mas com uma flag `isArchive: true` — vitória não altera `current_streak`, só entra no histórico pessoal |
| Dia futuro (tentativa de acesso indevido) | — | Botão nem aparece; redireciona para `current_day` |

### 6.3. Submenus

- **"Ver dias anteriores"** abre um calendário/grade (tipo GitHub contributions) com os 1–365 dias: verde = vitória perfeita, amarelo = vitória com erros, vermelho = derrota, cinza = não jogado. Clicar em um dia passado joga em modo arquivo (ver tabela acima).
- **"Estatísticas"** é a tela de perfil descrita no seu `ideia.md` (streak atual, streak máxima, % de vitórias, tempo médio, "você é melhor em Morfologia do que em Sintaxe").
- **"Modo: Normal/Difícil"** é um toggle simples que grava em `user_data.settings.hard_mode` — muda o ícone com um 🔥 ao lado do nome do modo quando Difícil está ativo, reforçando visualmente antes mesmo de começar a jogar.

### 6.4. Transição Menu → Jogo

Ao clicar em "Jogar", a transição deve ser um fade/slide simples (`opacity` + `transform: translateY()`, 300ms, conforme a diretriz de "nunca animar via JS" do seu documento de arquitetura) — o menu desliza para cima e sai, o `.question-card` entra por baixo com fade-in. Isso preserva a sensação de "um capítulo por vez" que o jogo pede.
