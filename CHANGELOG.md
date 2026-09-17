# Changelog de concepção

Os documentos originais de proposta (`ideia.md`, `ferramentas.md`,
`spec-design-jogo.md`) registram o desenho inicial do projeto. Ao longo do
desenvolvimento, várias decisões mudaram — este arquivo existe para que a
proposta escrita e o jogo entregue não se contradigam.

## O que mudou desde a proposta original

- **Duas fases por pergunta → um modo por vez.** A ideia original
  (`ideia.md`) tinha Morfologia e Sintaxe como duas etapas obrigatórias da
  *mesma* pergunta, uma após a outra. O jogo hoje pede que o jogador
  escolha **um** modo de estudo (Morfologia, Sintaxe ou Sinônimos) e joga
  o desafio daquele dia só nesse modo — os três modos têm progresso,
  streak e conquistas independentes.

- **Modo Difícil removido.** O campo livre com autocomplete e a "morte
  súbita" descritos em `ideia.md`/`ferramentas.md` não existem mais.
  Existe um único modo, com feedback claro (certo/errado) em uma única
  tentativa por dia.

- **Modo Sinônimos, não previsto na proposta original.** Terceiro modo de
  estudo, com banco próprio de 100 palavras difíceis (curadoria em
  andamento pela equipe).

- **Paleta de cores totalmente diferente.** `spec-design-jogo.md`
  especificava fundo azul-marinho + ciano neon + amarelo, inspirado em
  quiz de TV. A identidade visual adotada usa a paleta de marca Merino /
  Rock Blue / Venice Blue, com temas claro e escuro completos.

- **Sistema de conquistas, adicionado depois.** Não estava na proposta
  original; foi incorporado com conquistas por sequência de acertos (por
  modo), por ofensiva diária, por total de desafios e por pontuação.

- **Carregamento dos dados.** `ferramentas.md` pedia `fetch()` assíncrono
  do JSON. Os dados hoje são embutidos como módulos JS
  (`js/database.js`, `js/synonymsDatabase.js`), gerados a partir dos JSON
  via `node scripts/build-data.js` — evita problemas de CORS ao abrir o
  jogo direto pelo disco, sem precisar de servidor. Ver seção "Banco de
  dados" do README.

## Por que manter os documentos antigos

`ideia.md`, `ferramentas.md` e `spec-design-jogo.md` continuam no
repositório como registro histórico do desenho inicial — útil para
mostrar a evolução do projeto na apresentação. Quem quiser entender o
jogo **como ele é hoje** deve usar o README, não esses documentos.
