import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    AchievementUnlocked,
    HistoryEntry,
    HistoryEntryPublic,
    Progress,
    StatsBase,
    StatsPublic,
    User,
    UserCreate,
    UserStats,
    UserUpdate,
    get_datetime_utc,
    played_on_for_day,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


def get_progress(*, session: Session, user_id: uuid.UUID) -> Progress:
    stats = session.get(UserStats, user_id)
    history = session.exec(
        select(HistoryEntry)
        .where(HistoryEntry.user_id == user_id)
        .order_by(HistoryEntry.day_id, HistoryEntry.study_type)  # type: ignore[arg-type]
    ).all()
    achievements = session.exec(
        select(AchievementUnlocked.achievement_id)
        .where(AchievementUnlocked.user_id == user_id)
        .order_by(AchievementUnlocked.achievement_id)
    ).all()
    stats_data = StatsBase.model_validate(stats or StatsBase()).model_dump()
    return Progress(
        stats=StatsPublic(**stats_data, unlocked_achievements=list(achievements)),
        history=[HistoryEntryPublic.model_validate(entry) for entry in history],
    )


def _is_better(new: HistoryEntryPublic, old: HistoryEntry) -> bool:
    """Mesma regra do mergeProgress do front: mais pontos; empate → menos tempo."""
    if new.points != old.points:
        return new.points > old.points
    return new.time_ms < old.time_ms


def save_progress(*, session: Session, user_id: uuid.UUID, progress: Progress) -> None:
    """Grava o snapshot de forma idempotente.

    - stats: substituídas pelo snapshot (o cliente já mesclou com a nuvem);
    - history: upsert por (dia, modo), mantendo a melhor jogada; nada é apagado;
    - conquistas: união com as já registradas.
    """
    stats_in = progress.stats.model_dump(exclude={"unlocked_achievements"})
    stats = session.get(UserStats, user_id)
    if stats is None:
        stats = UserStats(user_id=user_id)
    stats.sqlmodel_update(stats_in, update={"updated_at": get_datetime_utc()})
    session.add(stats)

    existing = {
        (entry.day_id, entry.study_type): entry
        for entry in session.exec(
            select(HistoryEntry).where(HistoryEntry.user_id == user_id)
        ).all()
    }
    for entry_in in progress.history:
        key = (entry_in.day_id, entry_in.study_type)
        current = existing.get(key)
        if current is None:
            current = HistoryEntry(
                **entry_in.model_dump(),
                user_id=user_id,
                played_on=played_on_for_day(entry_in.day_id),
            )
            existing[key] = current
        elif _is_better(entry_in, current):
            current.sqlmodel_update(entry_in.model_dump())
        else:
            continue
        session.add(current)

    unlocked = set(
        session.exec(
            select(AchievementUnlocked.achievement_id).where(
                AchievementUnlocked.user_id == user_id
            )
        ).all()
    )
    for achievement_id in dict.fromkeys(progress.stats.unlocked_achievements):
        if achievement_id not in unlocked:
            session.add(
                AchievementUnlocked(user_id=user_id, achievement_id=achievement_id)
            )

    session.commit()
