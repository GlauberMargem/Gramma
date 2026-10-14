import warnings
from typing import Literal, Self

from pydantic import (
    EmailStr,
    HttpUrl,
    computed_field,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Env vars file local to ./backend/
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    FRONTEND_HOST: str = "http://localhost:5173"
    # Origens extras liberadas no CORS, separadas por vírgula.
    BACKEND_CORS_ORIGINS: str = ""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        extra = [o.strip().rstrip("/") for o in self.BACKEND_CORS_ORIGINS.split(",")]
        return [self.FRONTEND_HOST.rstrip("/"), *(o for o in extra if o)]

    # Fuso que define o "hoje" do jogo (dias e janelas do ranking).
    GAME_TIMEZONE: str = "America/Sao_Paulo"

    # Limite por IP nas rotas de autenticação (sintaxe do slowapi/limits).
    RATE_LIMIT_ENABLED: bool = True
    AUTH_RATE_LIMIT: str = "10/minute"
    FASTAPI_ENV: Literal["development"] | None = None

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    # SQLite só em desenvolvimento/testes; produção usa PostgreSQL,
    # ex.: postgresql://usuario:senha@host:5432/app
    DATABASE_URL: str = "sqlite:///./gramma.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        database_url = str(value)
        for scheme in ("postgres://", "postgresql://"):
            if database_url.startswith(scheme):
                return database_url.replace(scheme, "postgresql+psycopg://", 1)
        return database_url

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: EmailStr = "test@example.com"
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.FASTAPI_ENV == "development":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _require_postgres_in_production(self) -> Self:
        if self.is_sqlite and self.FASTAPI_ENV != "development":
            raise ValueError(
                "SQLite é só para desenvolvimento: em produção defina "
                "DATABASE_URL com o PostgreSQL (ou FASTAPI_ENV=development)."
            )
        return self

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret(
            "DATABASE_URL password", make_url(self.DATABASE_URL).password
        )
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self


settings = Settings()  # type: ignore[call-arg]
