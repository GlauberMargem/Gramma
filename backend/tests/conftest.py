import os
from collections.abc import Generator
from pathlib import Path

# Os testes usam um banco próprio (nunca o de desenvolvimento): precisa estar no
# ambiente antes de `app.core.config` ser importado.
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite:///./test.db")

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.db import engine, init_db  # noqa: E402
from app.main import app  # noqa: E402
from tests.utils.user import authentication_token_from_email  # noqa: E402
from tests.utils.utils import get_superuser_token_headers  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _migrate_from_scratch() -> None:
    SQLModel.metadata.drop_all(engine)
    with engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE IF EXISTS alembic_version")
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "app" / "alembic"))
    command.upgrade(config, "head")


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session]:
    _migrate_from_scratch()
    with Session(engine) as session:
        init_db(session)
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
