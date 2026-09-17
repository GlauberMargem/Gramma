> **Nota:** este é o documento de proposta original. Várias decisões
> mudaram durante o desenvolvimento — veja [`CHANGELOG.md`](CHANGELOG.md)
> para o que é diferente hoje e [`README.md`](README.md) para o jogo como
> ele é atualmente.

# Conceito do Jogo: Desafio Gramatical & Sintático Diário

## 1. A Ideia Central
O jogo é um puzzle diário de língua portuguesa inspirado no *Termo*, mas focado em **Morfologia** (classes de palavras) e **Sintaxe** (funções sintáticas). O objetivo é analisar uma única frase por dia, testando os conhecimentos gramaticais do jogador em duas camadas diferentes.

## 2. A Dupla Camada Diária (Mecânica Principal)
Todo dia, uma nova frase com um termo em destaque (em **amarelo**) é apresentada. O desafio diário é dividido em duas etapas consecutivas para a *mesma* frase e palavra destacada:

*   **Fase 1 - Morfologia:** O jogador precisa identificar a Classe Gramatical da palavra (Ex: Substantivo, Adjetivo, Verbo, Conjunção).
*   **Fase 2 - Sintaxe:** Logo após acertar a Fase 1, a interface desliza ou transita para a Fase 2. Agora, o jogador precisa identificar a Função Sintática daquele mesmo termo na frase (Ex: Sujeito, Objeto Direto, Adjunto Adnominal, Predicativo do Sujeito).

## 3. Níveis de Dificuldade
Para agradar tanto jogadores casuais quanto os "puristas" da gramática, o jogo oferece dois modos que podem ser alternados nas configurações (assim como no Termo):

### ☀️ Modo Normal (Padrão)
*   **Formato de Quiz:** O jogador recebe 4 botões (A, B, C, D) com alternativas fechadas para escolher.
*   **Segunda Chance:** Se clicar na opção errada, ela fica **vermelha** e o jogador perde pontos, mas ainda pode tentar as outras opções até acertar a **verde** para poder avançar para a próxima fase.

### 🔥 Modo Difícil (Hardcore)
*   **Sem Múltipla Escolha (Campo Aberto):** Os botões A, B, C, D somem. Em vez disso, o jogador tem uma barra de pesquisa com um *dropdown* (lista suspensa) contendo **todas** as classes gramaticais ou funções sintáticas existentes. Ele precisa saber a resposta de cabeça e selecioná-la na lista (ex: digitar "Obje..." e clicar em "Objeto Indireto").
*   **Morte Súbita:** Não há segunda chance. Se o jogador submeter a resposta errada na Fase 1 ou na Fase 2, o jogo acaba imediatamente, o dia é registrado como **Derrota (X/2)**, e a ofensiva (streak) é zerada.

## 4. Dinâmica de Calendário e Banco de Dados
*   **As 365 Frases:** O jogo possui um banco de dados inteligente com 365 desafios preparados. Cada entrada no banco de dados agora conterá a frase, a palavra-alvo, a resposta morfológica e a resposta sintática.
*   **Bloqueio do Futuro:** O jogador jamais poderá acessar os dias que ainda não chegaram.
*   **Arquivo do Passado:** Jogadores podem acessar os dias anteriores no calendário para jogar perguntas que perderam, mas essas jogadas no passado não contam para restaurar a ofensiva (streak) atual, apenas para completar a galeria pessoal de estatísticas.

## 5. Pontuação, Compartilhamento e Ranking
Como as máquinas são tratadas como usuários únicos via `localStorage`:

*   **O Placar Diário:** 
    *   Vitória Perfeita: Acertou Morfologia e Sintaxe de primeira.
    *   Vitória Suada (Apenas Normal): Errou algumas vezes, mas concluiu.
    *   Derrota: Desistiu ou perdeu no Modo Difícil.
*   **O Botão de Compartilhar:** Fundamental para a viralização. Ao terminar, o jogador pode copiar seus resultados para o WhatsApp/Twitter em formato de emojis.
    *   *Exemplo Modo Normal:* 🧠 Dia 42: 🟩🟩 (Acertou as duas de primeira)
    *   *Exemplo Modo Difícil:* 🧠🔥 Dia 42: 🟩🟩 (O ícone de fogo indica que ele jogou no modo hardcore).
*   **Ranking/Estatísticas:** Uma tela de perfil mostrando a % de vitórias, a sequência máxima de dias jogados (streak), tempo médio de resposta e divisão de acertos (ex: "Você é melhor em Morfologia do que em Sintaxe!").