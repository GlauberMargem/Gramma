# FastAPI Project - Backend

API do GRAMMA: cadastro de usuário, login com JWT (OAuth2), sessão
(`/users/me`) e recuperação de senha. O front React (na raiz do repositório)
consome estes endpoints.

## Requirements

* [uv](https://docs.astral.sh/uv/) para gerenciar o ambiente Python
* Python 3.13+
* Opcional: [Docker](https://www.docker.com/) para PostgreSQL e Mailpit

## Local Development

O banco padrão é **SQLite** (arquivo `backend/gramma.db`, fora do git), então
não é preciso subir nenhum serviço. A partir de `backend/`, copie o
`.env.example` para `.env`, instale as dependências, prepare o banco e inicie o
servidor:

```console
$ uv sync
$ uv run bash scripts/prestart.sh
$ uv run fastapi dev
```

A API fica em `http://localhost:8000`, com documentação interativa em
`http://localhost:8000/docs`.

Em desenvolvimento, o front (Vite) faz **proxy** de `/api` para
`http://localhost:8000`, então não é preciso configurar CORS. As origens
permitidas em produção vêm de `FRONTEND_HOST` (veja `.env.example`).

> No Windows, `scripts/prestart.sh` precisa de um shell bash (Git Bash/WSL).
> Alternativa manual: `uv run alembic upgrade head` seguido de
> `uv run python app/initial_data.py`.

## Workflow

Rode os comandos em `backend/` com `uv run`. O interpretador do editor deve
apontar para `.venv` dentro de `backend/`.

Modifique modelos SQLModel e tabelas em `./backend/app/models.py`, endpoints em
`./backend/app/api/`, e o CRUD em `./backend/app/crud.py`.

## Docker

Para subir API + banco juntos (usa o `docker-compose.yml` deste diretório):

```console
$ docker compose run --rm backend bash scripts/prestart.sh
$ docker compose up
```

A aplicação fica disponível em `http://localhost:8000`.

Para abrir um shell no contêiner da API:

```console
$ docker compose exec backend bash
```

## Backend tests

A partir de `backend/`:

```console
$ uv run bash ./scripts/test.sh
```

Os testes usam Pytest; adicione/edite em `./backend/tests/`. Eles rodam num
banco próprio (`backend/test.db`, recriado pelas migrações a cada execução) e
nunca tocam no `gramma.db`. Para testar contra PostgreSQL, defina
`TEST_DATABASE_URL`.

### Coverage

Ao rodar os testes, é gerado `htmlcov/index.html` com a cobertura.

## Migrations

Sempre crie uma revisão ao mudar os modelos e aplique com Alembic, a partir de
`backend/`:

* O Alembic importa os modelos SQLModel de `./backend/app/models.py`.

* Após mudar um modelo (ex.: nova coluna), crie a revisão:

```console
$ uv run alembic revision --autogenerate -m "Add column last_name to User model"
```

* Versione os arquivos gerados em `alembic/versions/`.

* Aplique a migração no banco:

```console
$ uv run alembic upgrade head
```

Para não usar migrações, descomente `SQLModel.metadata.create_all(engine)` em
`./backend/app/core/db.py` e remova o `alembic upgrade head` de
`scripts/prestart.sh`.

## Email Templates

Os e-mails são HTML renderizados com **Jinja2** por
`render_email_template()` em `./backend/app/utils.py`. Os arquivos ficam em
`./backend/app/email-templates/` e podem ser editados diretamente — não há passo
de build.

Variáveis vindas do backend são placeholders Jinja2 (ex.: `{{ username }}`). O
contexto de cada e-mail é montado em `generate_*_email()` no mesmo
`./backend/app/utils.py`.

Enquanto o Mailpit estiver no ar, acesse `http://localhost:8025` para ver os
e-mails enviados em desenvolvimento.
