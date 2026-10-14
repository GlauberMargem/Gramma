# Leitor de tela e teclado — roteiro de teste

Este roteiro responde à pergunta do levantamento da equipe: **dá para jogar o
GRAMMA com um leitor de tela?** A Sprint 3 preparou o jogo para isso. A
verificação com um leitor de tela real ainda precisa ser feita por uma pessoa,
seguindo os passos abaixo e preenchendo a tabela de resultados.

## O que já foi feito (Sprint 3)

| Área | O que mudou |
| --- | --- |
| Estrutura | Cada tela tem um `<h1>`; o Jogo tem um título só para leitores ("Morfologia, dia 3"). Telas dentro de `<main>`; barra superior é um `<nav>` chamado "Conta e preferências". |
| Troca de tela | O foco vai para o título da tela nova, e o título da aba muda (ex.: "Ranking · GRAMMA"). |
| Jogo | A palavra destacada da frase é lida como "... (palavra destacada)". Ao responder, o leitor anuncia "Resposta certa!" ou "Resposta errada. A resposta certa é X.". Os botões passam a dizer "(resposta certa)" e "(sua resposta, errada)". |
| Teclado | Todas as ações são botões nativos (Tab + Enter/Espaço). No jogo, as teclas **A–D** ou **1–4** respondem direto. Contorno de foco forte em todos os controles. |
| Calendário | Cada dia é lido com a situação: "17, acertou", "18, errou", "19, disponível, hoje", "20, ainda bloqueado". |
| Ajustes | Interruptores "Fonte para dislexia" e "Alto contraste" são lidos como interruptores, com estado (ligado/desligado) e descrição. |
| Testes automáticos | `axe` sem violações em 13 telas (`src/__tests__/a11y.test.tsx`); fluxo Menu → Jogo → Resultado só com teclado. O `axe` no jsdom não mede contraste de cor nem anúncios reais. |

## Como testar

Leitores sugeridos (gratuitos):

- **Windows:** NVDA (<https://www.nvaccess.org/>) com Chrome ou Firefox; ou o
  Narrador (`Ctrl + Win + Enter`).
- **Android:** TalkBack (Configurações → Acessibilidade) com Chrome.
- **macOS/iOS:** VoiceOver (`Cmd + F5` / tripla do botão lateral).

Antes de começar: rode o front (`npm run dev`), abra em aba anônima (para
começar do zero) e **feche os olhos ou desligue o monitor** durante o teste.

Comandos úteis do NVDA: `H` próximo cabeçalho, `D` próximo landmark,
`B` próximo botão, `Insert + Espaço` alterna modo de navegação/foco,
`Insert + T` lê o título da janela.

### Roteiro

1. **Intro.** Ao abrir o app pela primeira vez aparece a intro animada.
   Esperado: "GRAMMA" lido como cabeçalho; botão para pular alcançável com Tab.
2. **Menu.** Esperado: foco no título "GRAMMA"; com `H`/Tab chega a
   "Morfologia", "Sintaxe", "Sinônimos", "Como Jogar", "Conquistas",
   "Ranking". Com `D`, chega ao landmark "Conta e preferências"
   (Entrar, tema, Acessibilidade).
3. **Acessibilidade.** Ligue "Fonte para dislexia" e "Alto contraste".
   Esperado: lidos como "interruptor, desligado/ligado" com a descrição.
4. **Escolher modo → JOGAR.** Esperado: ao entrar no jogo, o leitor lê
   "Morfologia, dia N"; a frase é lida com "(palavra destacada)" logo após a
   palavra da pergunta.
5. **Responder errado de propósito** (Tab até uma alternativa ou tecla A–D).
   Esperado: "Resposta errada. A resposta certa é X." e, em seguida, a tela de
   resultado com o título "Não foi dessa vez".
6. **Resultado.** Esperado: pontos lidos (`H` para o próximo cabeçalho),
   botões "Compartilhar" e "Menu".
7. **Calendário** (modo → Dias anteriores). Esperado: cada dia lido com a
   situação; dias futuros desabilitados.
8. **Ranking.** Esperado: abas "Hoje / 7 dias / 30 dias" lidas como abas com a
   selecionada; lista "Classificação" com "1º lugar: Nome ... pts".
9. **Entrar/criar conta.** Esperado: campos com rótulo; erros lidos
   automaticamente (alerta).

### Resultados

Preencha uma linha por passo e leitor. Status: ✅ ok · ⚠️ funciona com
dificuldade · ❌ não funciona.

| Passo | Leitor + navegador | Status | O que aconteceu |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |

## Riscos conhecidos (confirmar no teste)

1. **Anúncio do resultado cortado.** O jogo anuncia o resultado e, 900 ms
   depois, troca para a tela de resultado, que move o foco para o título. Alguns
   leitores interrompem o alerta ao mudar o foco. Se no passo 5 a resposta certa
   não for lida, a correção é mostrar a resposta certa também na tela de
   resultado.
2. **"Ouvir a frase" junto com o leitor.** O botão usa a voz do navegador, que
   fala por cima do leitor de tela. Para quem usa leitor, o próprio leitor já lê
   a frase; avaliar se o botão atrapalha.
3. **Conquistas desbloqueadas.** Os avisos aparecem junto com a tela de
   resultado; leitores costumam não anunciar regiões que já nascem com texto.
   Verificar no passo 6 se as conquistas novas são lidas.
4. **Intro automática.** A intro avança sozinha ao terminar a animação; quem
   usa leitor pode não perceber a troca. Verificar no passo 1.
5. **Atalhos A–D com o NVDA.** No modo de navegação do NVDA, letras são
   comandos do leitor (ex.: `B` = próximo botão) e não chegam ao jogo. Os
   atalhos funcionam no modo de foco (`Insert + Espaço`); Tab + Enter funciona
   sempre.
6. **Visual.** Alto contraste e fonte para dislexia não foram vistos num
   navegador real durante a sprint (só testes automáticos); conferir as telas
   com as duas opções ligadas, no claro e no escuro, e em celular.
