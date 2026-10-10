# GRAMMA

![GitHub repo size](https://img.shields.io/github/repo-size/GlauberMargem/Gramma)
![GitHub language count](https://img.shields.io/github/languages/count/GlauberMargem/Gramma)

Este projeto foi desenvolvido para a matéria de Jogos Digitais do curso de
Sistemas de Informação do Centro Universitário do Rio São Francisco -
UniRios, ministrada pelo Professor Dr. Erick Barros.

GRAMMA é um desafio gramatical e sintático diário, no estilo Wordle/Termo,
focado em três frentes da língua portuguesa: classes gramaticais, funções
sintáticas e sinônimos.

Jogue em: https://glaubermargem.github.io/Gramma/

## Tela Inicial

![Tela inicial do GRAMMA](docs/screenshot-menu.png)

Tela inicial do jogo, onde o jogador escolhe o modo de estudo do dia:
Morfologia, Sintaxe ou Sinônimos.

## Menu do Modo

![Menu do modo escolhido](docs/screenshot-modo.png)

Depois de escolher o modo, o jogador acessa o desafio do dia, o
calendário de dias anteriores e as estatísticas daquele modo.

## Interface do Jogo

![Interface de uma pergunta do jogo](docs/screenshot-question.png)

Interface de uma pergunta, com a frase do dia, a palavra em destaque e as
quatro alternativas de resposta.

## Ajustes e melhorias

O jogo ainda está em desenvolvimento e as próximas atualizações serão
voltadas para as seguintes tarefas:

- Mascote ou fio narrativo leve nas telas de feedback
- Jogo instalável (PWA / manifest.json)
- Camada Canvas/WebGL nos efeitos de celebração

## Tecnologias

- **React 19** + **TypeScript** (strict)
- **Vite** como bundler e servidor de desenvolvimento
- **React Router** com `HashRouter` (o GitHub Pages não tem fallback de SPA)
- **GSAP** + `@gsap/react` para as animações
- Estado do jogador em store externa (`useSyncExternalStore`) sobre o
  `localStorage`
- **Vitest** + Testing Library para os testes

## Pré-requisitos

- Node.js 20 ou superior
- npm

## Executando localmente

Instale as dependências e suba o servidor de desenvolvimento:

```
npm install
npm run dev
```

Depois abra o endereço exibido no terminal (por padrão,
`http://localhost:5173`).

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Checagem de tipos (`tsc --noEmit`) e build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Checagem de tipos sem gerar arquivos |
| `npm run lint` | ESLint |
| `npm test` | Testes (Vitest), uma execução |
| `npm run test:cov` | Testes com relatório de cobertura |

## Estrutura do Projeto

```
src/
  domain/       tipos e regras puras (scoreEngine, achievements, calendar, game, share)
  data/         grammar-days.json (365 dias), synonyms.json (100 palavras) e stores.ts
  state/        userStore (localStorage), userData, hooks de estado
  hooks/        useSpeech, useAnimatedNavigate
  components/   AnswerButton, CalendarGrid, TopBar, Sparkles, Toast, ...
  screens/      Intro, Menu, ModeHub, Game, End, Calendar, Stats,
                Achievements, Accessibility, HowToPlay
  styles/       style.css (design system, temas claro/escuro)
  App.tsx, main.tsx, router.tsx, boot.ts
public/         favicon.svg, unirios-logo.png
legacy/         versão antiga (HTML/CSS/JS puro), mantida como referência
```

## Rotas

As telas são acessadas por hash (ex.: `/#/modo`):

`/` · `/modo` · `/jogo/:dia` · `/fim/:dia` · `/calendario` ·
`/estatisticas` · `/conquistas` · `/acessibilidade` · `/como-jogar` ·
`/intro`

O parâmetro `?day=N` (ex.: `http://localhost:5173/?day=42`) abre
diretamente o desafio daquele dia e pula a introdução.

## Banco de dados

O conteúdo do jogo tem o `.json` como fonte única, editável por qualquer
pessoa do time:

- `src/data/grammar-days.json`: 365 dias de morfologia e sintaxe
- `src/data/synonyms.json`: banco de palavras difíceis do modo Sinônimos

Os JSON são importados diretamente por `src/data/stores.ts` e expostos
pelos `DataStore` e `SynonymStore` tipados — não há mais passo de geração
(`build-data.js`) nem cópias `.js`. Como o banco de sinônimos tem menos
entradas que os 365 dias, ele repete em ciclo.

## Progresso do jogador

O progresso fica no `localStorage` sob a chave `gramma_user_data`, no
mesmo formato da versão anterior — quem já jogava não perde nada ao
atualizar.

## Deploy

O deploy é automático: a cada push na `main`, o workflow
`.github/workflows/deploy.yml` roda typecheck, lint, testes e build, e
publica o `dist/` no GitHub Pages. O `base` do Vite é `/Gramma/`.

## Histórico e documentos originais

O desenho do jogo mudou bastante desde a proposta inicial (modo difícil
removido, sinônimos adicionado, paleta de cores refeita, entre outros). O
histórico dessas decisões está em [`CHANGELOG.md`](CHANGELOG.md); o plano
do port para React está em [`PLANO-PORT-REACT.md`](PLANO-PORT-REACT.md);
os documentos originais (`ideia.md`, `ferramentas.md`,
`spec-design-jogo.md`) ficam no repositório como registro histórico.

## Colaboradores

Este projeto foi desenvolvido para a matéria de Jogos Digitais do curso
de Sistemas de Informação do Centro Universitário do Rio São Francisco -
UniRios, ministrada pelo Professor Dr. Erick Barros:

| [GlauberMargem](https://github.com/GlauberMargem) | [Yurialvessmoreiraaa](https://github.com/Yurialvessmoreiraaa) | [anthonyysm](https://github.com/anthonyysm) |
| :---: | :---: | :---: |
| <img src="https://github.com/GlauberMargem.png" width="100"> | <img src="https://github.com/Yurialvessmoreiraaa.png" width="100"> | <img src="https://github.com/anthonyysm.png" width="100"> |
