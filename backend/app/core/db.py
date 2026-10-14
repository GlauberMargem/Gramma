from typing import Any

from sqlalchemy import event
from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate


def _create_engine() -> Any:
    if not settings.is_sqlite:
        return create_engine(settings.DATABASE_URL)
    sqlite_engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )

    # SQLite só aplica FOREIGN KEY / ON DELETE CASCADE com o pragma ligado.
    @event.listens_for(sqlite_engine, "connect")
    def _enable_foreign_keys(dbapi_connection: Any, _record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return sqlite_engine


engine = _create_engine()


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)
