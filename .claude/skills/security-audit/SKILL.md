---
name: security-audit
description: Auditoria de segurança do GRAMMA (backend FastAPI + front React). Use quando pedirem auditoria/revisão de segurança, antes de publicar o backend, ou ao fim de uma sprint que mexeu em auth, banco ou API. Gera um relatório em docs/security/ com achados classificados por severidade.
---

# Auditoria de segurança do GRAMMA

Objetivo: encontrar vulnerabilidades **reais e exploráveis** no repositório e
registrar cada uma com evidência (arquivo:linha), impacto e correção. Não
liste boas práticas genéricas sem um ponto concreto no código.

Stack: `backend/` (FastAPI, SQLModel, Alembic, JWT HS256, slowapi, SQLite em
dev e PostgreSQL em produção) e front na raiz (React + Vite, token JWT no
`localStorage` em `gramma_auth`, progresso em `gramma_user_data`).

## 1. Escopo e versão

- Registre o commit auditado: `git rev-parse --short HEAD` e a branch.
- Liste as rotas da API (`backend/app/api/routes/*.py`) e as telas
  (`src/router.tsx`) para saber a superfície de ataque.

## 2. Dependências

- Front: `npm audit --omit=dev` (produção) e `npm audit` (tudo).
- Backend: `cd backend && uvx pip-audit` (usa o ambiente do projeto) ou
  `uv export --no-hashes | uvx pip-audit -r /dev/stdin`.
- Registre só o que tiver CVE com caminho alcançável; anote o resto como info.

## 3. Segredos

- `git grep -nIiE "(secret|password|token|api[_-]?key)\s*[:=]" -- . ':!*.lock' ':!package-lock.json'`
- Confirme que `.env` e `backend/.env` estão no `.gitignore` e nunca foram
  commitados: `git log --all --oneline -- .env backend/.env`.
- Valores padrão (`changethis`) devem ser recusados fora de desenvolvimento
  (`backend/app/core/config.py`).

## 4. Backend — checklist

Para cada item, leia o código e marque OK / achado:

1. **Autenticação**: toda rota que lê/grava dados do usuário depende de
   `CurrentUser` (`app/api/deps.py`); token inválido → 401/403, nunca 500.
2. **Autorização / IDOR**: rotas com `user_id` na URL checam dono ou
   superuser; `/me/*` usa só `current_user.id`.
3. **JWT**: algoritmo fixo (`HS256`), `SECRET_KEY` forte em produção (≥ 32
   bytes), expiração configurada, `sub` validado como UUID.
4. **Senhas**: hash Argon2/bcrypt (`pwdlib`), tamanho mínimo, comparação
   resistente a timing no login de e-mail inexistente.
5. **Enumeração de contas**: recuperação de senha e login não revelam se o
   e-mail existe. Cadastro (409/400 "já existe") revela — avalie o risco.
6. **Rate limit**: login, cadastro, recuperação e reset (`app/core/rate_limit.py`);
   atrás de proxy, o IP real precisa chegar (`--proxy-headers`).
7. **Validação de entrada**: limites em listas/números/strings dos schemas
   (`app/models.py`), `Literal` para enums, nada de `text()` com f-string.
8. **SQL injection**: procure `text(`, `exec_driver_sql`, f-strings em SQL.
9. **CORS**: origens explícitas, sem `*` com credenciais.
10. **Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
11. **Vazamento de dados**: respostas públicas (ranking) não expõem e-mail
    completo, ids internos ou dados de outros usuários.
12. **Erros e logs**: sem stack trace para o cliente; sem senha/token em log.
13. **Rotas de desenvolvimento**: `private.py` só com `FASTAPI_ENV=development`;
    docs (`/docs`) — decidir se ficam públicas em produção.
14. **Banco em produção**: SQLite recusado fora de dev; migrações aplicadas.

## 5. Front — checklist

1. **XSS**: `git grep -n "dangerouslySetInnerHTML\|innerHTML\|eval(" -- src`.
2. **Token**: JWT no `localStorage` é legível por qualquer XSS — registre
   como risco aceito ou proponha cookie httpOnly (exige mudança no backend).
3. **Redirecionamentos**: parâmetros de rota/query usados em navegação
   (`?token=`, `?day=`) são validados.
4. **Dados do servidor**: nada vindo da API é renderizado como HTML.
5. **Build**: nenhum segredo em `VITE_*` (vai para o bundle público).

## 6. Verificação dinâmica (opcional, recomendado)

Suba o backend (`uv run fastapi dev`) e teste com `curl`: rota protegida sem
token, token adulterado, payload gigante no `PUT /me/progress`, 11 logins
seguidos (espera 429), origem não permitida no preflight CORS.

## 7. Relatório

Escreva `docs/security/AUDIT-<AAAA-MM-DD>.md` com:

- Cabeçalho: data, commit, branch, quem/qual agente rodou, escopo.
- Resumo: contagem por severidade.
- Tabela de achados: `ID | Severidade | Título | Local | Status`.
- Para cada achado: descrição, evidência (arquivo:linha ou comando + saída),
  impacto, correção proposta, status (aberto / corrigido em `<commit>` /
  risco aceito).
- Seção "Verificado e OK": itens do checklist sem problema (uma linha cada).

Severidades: **Crítica** (exploração remota sem auth com dano grave),
**Alta** (exploração com impacto real em contas/dados), **Média** (exige
condição extra ou impacto limitado), **Baixa** (endurecimento), **Info**.

Corrija Crítica e Alta na mesma branch, com teste que falha antes da
correção; Média/Baixa viram tasks no `SPRINTS.md` se a equipe aceitar.
