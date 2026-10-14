from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import Settings

BASE: dict[str, Any] = {
    "_env_file": None,
    "PROJECT_NAME": "GRAMMA",
    "SECRET_KEY": "a-real-secret-key-for-production-use",
    "FIRST_SUPERUSER": "admin@example.com",
    "FIRST_SUPERUSER_PASSWORD": "a-real-admin-password",
}


def test_production_rejects_sqlite(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("FASTAPI_ENV", raising=False)
    with pytest.raises(ValidationError, match="SQLite"):
        Settings(**BASE, DATABASE_URL="sqlite:///./gramma.db")


def test_production_accepts_postgres(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("FASTAPI_ENV", raising=False)
    settings = Settings(
        **BASE, DATABASE_URL="postgresql://gramma:s3nha-forte@db.example.com/app"
    )
    assert settings.DATABASE_URL.startswith("postgresql+psycopg://")
    assert not settings.is_sqlite


def test_development_allows_sqlite(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("FASTAPI_ENV", "development")
    assert Settings(**BASE, DATABASE_URL="sqlite:///./gramma.db").is_sqlite
