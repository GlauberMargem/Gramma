# Paridade visual e funcional (T37)

**Como conferir**: abrir o legado e o app novo lado a lado.

```bash
# legado (porta 8000)
cd legacy && python3 -m http.server 8000
# app novo (porta 4173)
npm run build && npm run preview
```

Legado: `http://localhost:8000/`. Novo: `http://localhost:4173/Gramma/`. Comparar com `docs/screenshot-*.png` quando útil.
Preencher `[x]` (igual), `[~]` (diferença aceitável, anotar) ou `[!]` (bloqueante, vira `fix:`).

## Matriz de aparência (cada tela em claro e escuro)

| Tela | Claro | Escuro | Fonte Pequena | Normal | Grande | Extra Grande | Mobile (~390 px) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Intro | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Menu (com e sem ofensiva) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Hub do modo (JOGAR / VER RESULTADO) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Jogo (3 modos) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Resultado (acerto, erro, marco, conquista) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Calendário | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Estatísticas | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Conquistas | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Acessibilidade | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Como jogar | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Comportamento

- [ ] Fundo (blobs) e TopBar fixa só no Menu; TopBar não pula nem some durante a transição
- [ ] Transição entre telas (entrada 0,25 s / saída 0,14 s); só uma tela visível por vez
- [ ] Flip do tema (botão encolhe, troca ícone e tema, desdobra); clique repetido rápido não deixa o botão torto; layout da `.top-bar` igual (a T24 envolve o botão num `span` com `display: contents`)
- [ ] Intro: sequência, PULAR, não repete na mesma sessão (aba nova repete)
- [ ] `?day=N` (ex.: `http://localhost:4173/Gramma/?day=2`) abre o jogo do dia N e limpa a query
- [ ] Opções embaralhadas; só a primeira escolha vale; certa destacada se errou; 900 ms até o resultado
- [ ] Voltar/fechar de cada tela vai ao mesmo destino do legado
- [ ] Resultado: pontos, bônus, linha de ofensiva, sparkles em marco ou conquista nova; recarregar mostra o mesmo resultado sem toasts
- [ ] Compartilhar: toast de sucesso, e (negando permissão do clipboard) toast com o texto. Aparência do toast (reusa o estilo de conquista) aceitável
- [ ] Leitura em voz alta fala a frase em pt-BR
- [ ] Calendário: abre no mês atual, limites prev/next, status ganhou/perdeu/disponível/futuro, jogar dia de arquivo não mexe na ofensiva
- [ ] Fonte (4 escalas) e tema persistem após recarregar
- [ ] Foco visível ao navegar por Tab (não verificável em testes automatizados) e contraste legível nos dois temas

## Dados do jogador

- [ ] Com `gramma_user_data` do legado no `localStorage` do mesmo origin (ou colando o JSON no console), o app novo mostra as mesmas estatísticas e conquistas
- [ ] Dados corrompidos/ausentes: app abre com padrões

## Achados

| # | Tela | Descrição | Severidade | Commit de correção |
| --- | --- | --- | --- | --- |

**Resultado (2026-10-09):** validado pelo usuário, que confirmou que tudo funciona. Nenhum achado bloqueante registrado.
