# Arquitetura e Especificação Técnica: Jogo Gramatical/Sintático Diário

**Instrução Inicial (System Prompt):**
Você atuará como um Engenheiro de Software Front-end Sênior. Sua tarefa é desenvolver a lógica, estrutura de dados e arquitetura web (HTML, CSS, Vanilla JS) para um jogo diário de gramática/sintaxe inspirado no "Termo". O foco absoluto deve ser em **alta performance**, **arquitetura de software limpa (Clean Code/SOLID)**, e **gerenciamento de estado robusto**.

Não use frameworks pesados (React, Angular). Use Vanilla JS moderno (ES6+, Modules) com manipulação de DOM otimizada.

Abaixo estão os requisitos de engenharia. Implemente o sistema seguindo estritamente estas diretrizes.

## 1. Estrutura de Dados (Single Source of Truth)

### 1.1. Banco de Dados de Frases (JSON)

O banco de dados deve ser um arquivo JSON estático (ex: `database.json`) ou um módulo exportado em JS, garantindo carregamento rápido.

* **Performance:** 365 dias em JSON pesam menos de 150kb. O sistema deve carregar este arquivo assincronamente (`fetch`) e fazer cache local na memória do navegador.

* **Contrato de Dados (Interface):**

```
[
  {
    "day_id": 1,
    "sentence": "O Brasil é um país <span>rico</span>.",
    "target_word": "rico",
    "morphology": {
      "answer": "Adjetivo",
      "options": ["Substantivo", "Adjetivo", "Verbo", "Advérbio"]
    },
    "syntax": {
      "answer": "Predicativo do Sujeito",
      "options": ["Sujeito", "Objeto Direto", "Predicativo do Sujeito", "Adjunto Adnominal"]
    }
  }
]

```

### 1.2. Gerenciamento de Estado do Usuário (LocalStorage)

O `localStorage` manterá o progresso. Crie uma classe genérica de Storage (`StorageService`) para serializar e desserializar os dados com tratamento de erros.

* **Estrutura do `user_data`:**

```
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "settings": { "hard_mode": false, "dark_mode": true },
  "stats": {
    "current_streak": 5,
    "max_streak": 12,
    "games_played": 20,
    "wins": 18,
    "avg_time_ms": 4500
  },
  "history": {
    "1": { "status": "won", "mode": "normal", "attempts": 2, "time_ms": 3200 },
    "2": { "status": "lost", "mode": "hard", "attempts": 1, "time_ms": 1500 }
  }
}

```

## 2. Engine de Tempo e Controle de Calendário

A lógica de cálculo do "Dia Atual" deve ser pura e determinística, baseada em um Epoch (Data de Lançamento) fixo no código (ex: `const START_DATE = new Date('2024-03-01T00:00:00-03:00')`).

* **Fórmula do Dia Atual:** `Math.floor((Now - START_DATE) / (1000 * 60 * 60 * 24)) + 1`

* **Regra de Segurança Temporais:**

  * Se `requested_day > current_day`: Retornar erro ou redirecionar para `current_day`.

  * Se o usuário tentar alterar o relógio do sistema para o futuro, o jogo travará as respostas baseado no hash do dia ou simplesmente confiará no client-side (aceitável para jogos locais sem backend, mas garanta que o UI bloqueie dias não liberados).

* **Navegador do Passado:** O construtor do jogo deve aceitar um parâmetro (via URL param, ex: `?day=4`) para inicializar jogos passados.

## 3. Máquina de Estados do Jogo (State Machine)

Para garantir performance e evitar bugs de UI, implemente o fluxo do jogo usando um padrão de Máquina de Estados Finitos (FSM).

* **Estados Principais:** `INIT` -> `MORPHOLOGY_PHASE` -> `SYNTAX_PHASE` -> `END_SCREEN`.

* O DOM não deve ser atualizado com espaguete de `document.getElementById`. Crie uma classe `ViewRenderer` que escuta as mudanças de estado e aplica atualizações em lote (Batch DOM Updates).

* **Transição de Fase:** Ao acertar a Morfologia, adicione um delay (ex: 500ms) para o feedback verde, seguido de uma animação CSS fluida (`opacity`/`transform`) para revelar a pergunta de Sintaxe.

## 4. Lógica de Modos de Dificuldade

### 4.1. Modo Normal (Componente: Múltipla Escolha)

* **Renderização:** Renderize 4 botões dinamicamente.

* **Delegação de Eventos:** Use *Event Delegation* no container pai dos botões para ouvir cliques (maior performance).

* **Lógica:** Permitir errar. Clique errado adiciona classe CSS `.is-wrong` e registra no estado.

### 4.2. Modo Difícil (Componente: Autocomplete / Dropdown)

* **Renderização:** Renderiza um `<input type="text">` e um `<datalist>` (ou um dropdown customizado para maior controle visual).

* **Fonte de Dados do Dropdown:** Extraia dinamicamente um `Set` (Valores Únicos) de todas as classes e funções sintáticas mapeadas no sistema.

* **Lógica de Morte Súbita:** Ao confirmar o input, se a string não for uma correspondência exata, dispare o estado de `GAME_OVER` imediatamente. Zere o `current_streak` no banco de dados.

## 5. Arquitetura Front-end e Performance

* **Separação de Preocupações (SoC):**

  * `GameEngine.js`: Regras de negócio, cálculo de tempo e controle de turnos.

  * `Storage.js`: Interface de leitura/escrita no LocalStorage.

  * `UIController.js`: Manipulação direta do DOM, animações CSS.

  * `DataStore.js`: Classe Singleton para carregar e gerenciar o JSON das 365 perguntas.

* **Timer Otimizado:** O contador de tempo de resposta não deve atualizar o DOM a cada milissegundo (causa repaints caros). Use `performance.now()` no momento de renderização da pergunta (início) e guarde o tempo no momento da resposta correta (fim). `Δt = fim - início`.

* **Animações:** Nunca use JS para animar. Adicione/remova classes CSS e use `transition: all 0.3s ease` no CSS.

## 6. Sistema de Compartilhamento (Share)

Implemente uma função `generateShareGrid()` que lê o histórico do dia atual e constrói uma string usando emojis, copiando-a para o `navigator.clipboard`.

* *Lógica:*

  * Verde (🟩) = Acerto de primeira.

  * Amarelo (🟨) = Acertou com tentativas no Modo Normal.

  * Vermelho (🟥) = Erro fatal (Modo Difícil) ou desistência.

  * Fogo (🔥) = Adicionado no título se jogado no Modo Difícil.

## Entregável Requisitado:

Gere os arquivos estruturais (`index.html`, `style.css` usando variáveis CSS nativas, e os módulos `.js`) implementando a arquitetura acima. Forneça o código completo da lógica (GameEngine e Storage) e um mock funcional do JSON com 3 dias para eu poder rodar e testar.