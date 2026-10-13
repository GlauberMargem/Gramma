import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Literal

from pydantic import EmailStr
from sqlalchemy import DateTime, PrimaryKeyConstraint, String
from sqlmodel import Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None
    full_name: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# ---------------------------------------------------------------------------
# Progresso do jogador (espelha src/domain/types.ts, em snake_case)
# ---------------------------------------------------------------------------

StudyType = Literal["morphology", "syntax", "synonyms"]

# Mesmo START_DATE de src/domain/calendar.ts: o dia 1 do jogo é 17/07/2026.
GAME_START_DATE = date(2026, 7, 17)
# Teto de sanidade para day_id/pontos/tempo vindos do cliente.
MAX_DAY_ID = 100_000
MAX_POINTS = 10_000
MAX_TIME_MS = 24 * 60 * 60 * 1000


def played_on_for_day(day_id: int) -> date:
    """Data de calendário do `day_id` (não confia no relógio do cliente)."""
    return GAME_START_DATE + timedelta(days=day_id - 1)


class StatsBase(SQLModel):
    current_streak: int = Field(default=0, ge=0)
    max_streak: int = Field(default=0, ge=0)
    last_streak_day: int = Field(default=0, ge=0, le=MAX_DAY_ID)
    games_played: int = Field(default=0, ge=0)
    total_score: int = Field(default=0, ge=0)
    morph_correct_streak: int = Field(default=0, ge=0)
    morph_correct_streak_max: int = Field(default=0, ge=0)
    syntax_correct_streak: int = Field(default=0, ge=0)
    syntax_correct_streak_max: int = Field(default=0, ge=0)
    synonyms_correct_streak: int = Field(default=0, ge=0)
    synonyms_correct_streak_max: int = Field(default=0, ge=0)
    total_correct_morph: int = Field(default=0, ge=0)
    total_correct_syntax: int = Field(default=0, ge=0)
    total_correct_synonyms: int = Field(default=0, ge=0)


class UserStats(StatsBase, table=True):
    __tablename__ = "user_stats"

    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True, ondelete="CASCADE"
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )


class HistoryEntryBase(SQLModel):
    day_id: int = Field(ge=1, le=MAX_DAY_ID)
    study_type: StudyType = Field(sa_type=String(20))
    correct: bool
    points: int = Field(ge=0, le=MAX_POINTS)
    base: int = Field(ge=0, le=MAX_POINTS)
    bonus: int = Field(ge=0, le=MAX_POINTS)
    is_milestone: bool
    streak_after: int = Field(ge=0)
    time_ms: int = Field(ge=0, le=MAX_TIME_MS)
    is_archive: bool


class HistoryEntry(HistoryEntryBase, table=True):
    """Uma jogada: chave natural (usuário, dia, modo), como no `history` do front."""

    __tablename__ = "history_entry"
    __table_args__ = (PrimaryKeyConstraint("user_id", "day_id", "study_type"),)

    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    # Derivado de day_id no servidor; usado pelas janelas do ranking.
    played_on: date = Field(index=True)


class AchievementUnlocked(SQLModel, table=True):
    __tablename__ = "achievement_unlocked"

    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True, ondelete="CASCADE"
    )
    achievement_id: str = Field(primary_key=True, max_length=64)
    unlocked_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
