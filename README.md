# Gramma

## Banco de dados

O conteúdo do jogo (frases de morfologia/sintaxe e palavras de sinônimos) tem
o `.json` como fonte oficial, editável por qualquer pessoa do time:

- `database_completo_365.json`
- `database_sinonimos.json`

O jogo em si **não lê esses `.json` diretamente** — ele importa os módulos
`js/database.js` e `js/synonymsDatabase.js`, que são cópias geradas a partir
dos JSON acima (evita `fetch`/CORS ao abrir o jogo direto pelo `file://`).

**Por isso: depois de editar qualquer um dos `.json`, rode**

```
node scripts/build-data.js
```

e commite os `.js` atualizados junto com o `.json`. Se pular esse passo, a
edição fica só no `.json` e nunca aparece dentro do jogo de verdade.
