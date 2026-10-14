import uuid
from datetime import date, timedelta
from typing import Any

from sqlmodel import Session, col, func, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    RANKING_WINDOW_DAYS,
    AchievementUnlocked,
    HistoryEntry,
    HistoryEntryPublic,
    Progress,
    RankingEntry,
    RankingPeriod,
    RankingPublic,
    StatsBase,
    StatsPublic,
    StudyType,
    User,
    UserCreate,
    UserStats,
    UserUpdate,
    get_datetime_utc,
    played_on_for_day,
    score_for,
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


def _normalize_entry(entry: HistoryEntryPublic) -> HistoryEntryPublic:
    """Recalcula os pontos pelas regras do jogo (não confia no cliente)."""
    base, bonus = score_for(entry.study_type, entry.correct, entry.streak_after)
    return entry.model_copy(
        update={
            "base": base,
            "bonus": bonus,
            "points": base + bonus,
            "is_milestone": bonus > 0,
        }
    )


def save_progress(
    *,
    session: Session,
    user_id: uuid.UUID,
    progress: Progress,
    today_day_id: int,
) -> None:
    """Grava o snapshot de forma idempotente.

    - stats: substituídas pelo snapshot (o cliente já mesclou com a nuvem), com
      a ofensiva limitada à idade do jogo;
    - history: upsert por (dia, modo), mantendo a melhor jogada; nada é apagado;
      pontos recalculados no servidor; dias futuros (além de amanhã, margem
      para fusos à frente) são ignorados;
    - conquistas: união com as já registradas.
    """
    max_day_id = today_day_id + 1
    stats_in = progress.stats.model_dump(exclude={"unlocked_achievements"})
    for field in ("current_streak", "max_streak"):
        stats_in[field] = min(stats_in[field], max(today_day_id, 0))
    stats_in["last_streak_day"] = min(stats_in["last_streak_day"], max_day_id)
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
    for raw_entry in progress.history:
        if raw_entry.day_id > max_day_id:
            continue
        entry_in = _normalize_entry(raw_entry)
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


def display_name_for(user: User) -> str:
    """Nome público: full_name, ou a parte local do e-mail (nunca o e-mail todo)."""
    if user.full_name and user.full_name.strip():
        return user.full_name.strip()
    return user.email.split("@", 1)[0]


def get_ranking(
    *,
    session: Session,
    period: RankingPeriod,
    today: date,
    study_type: StudyType | None = None,
    limit: int = 50,
    current_user_id: uuid.UUID | None = None,
) -> RankingPublic:
    """Soma de pontos por usuário na janela, sem dias de arquivo.

    Ordem: pontos (desc), ofensiva atual (desc), nome e id — estável. Empates em
    pontos dividem a posição (1, 2, 2, 4).
    """
    start = today - timedelta(days=RANKING_WINDOW_DAYS[period] - 1)
    score = func.sum(HistoryEntry.points).label("score")
    streak = func.coalesce(UserStats.current_streak, 0).label("streak")
    statement = (
        select(User, score, streak)
        .join(HistoryEntry, col(HistoryEntry.user_id) == col(User.id))
        .outerjoin(UserStats, col(UserStats.user_id) == col(User.id))
        .where(
            col(User.is_active).is_(True),
            col(HistoryEntry.is_archive).is_(False),
            col(HistoryEntry.played_on) >= start,
            col(HistoryEntry.played_on) <= today,
        )
        .group_by(col(User.id), col(UserStats.current_streak))
    )
    if study_type is not None:
        statement = statement.where(col(HistoryEntry.study_type) == study_type)

    rows = sorted(
        session.exec(statement).all(),
        key=lambda row: (-row[1], -row[2], display_name_for(row[0]), str(row[0].id)),
    )

    ranked: list[RankingEntry] = []
    me: RankingEntry | None = None
    for position, (user, user_score, user_streak) in enumerate(rows, start=1):
        previous = ranked[-1] if ranked else None
        rank = (
            previous.rank
            if previous is not None and previous.score == user_score
            else position
        )
        entry = RankingEntry(
            rank=rank,
            display_name=display_name_for(user),
            score=int(user_score),
            streak=int(user_streak),
            is_me=user.id == current_user_id,
        )
        ranked.append(entry)
        if entry.is_me:
            me = entry

    return RankingPublic(
        period=period,
        study_type=study_type,
        start_date=start,
        end_date=today,
        entries=ranked[:limit],
        me=me,
    )
