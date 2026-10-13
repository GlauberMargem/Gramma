from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models import (
    AchievementUnlocked,
    HistoryEntry,
    UserStats,
    played_on_for_day,
)
from tests.utils.user import create_random_user


def _entry(user_id, day_id=1, study_type="morphology") -> HistoryEntry:
    return HistoryEntry(
        user_id=user_id,
        day_id=day_id,
        study_type=study_type,
        correct=True,
        points=10,
        base=10,
        bonus=0,
        is_milestone=False,
        streak_after=1,
        time_ms=1500,
        is_archive=False,
        played_on=played_on_for_day(day_id),
    )


def test_played_on_matches_front_calendar() -> None:
    assert played_on_for_day(1) == date(2026, 7, 17)
    assert played_on_for_day(16) == date(2026, 8, 1)


def test_history_key_is_unique_per_user_day_and_mode(db: Session) -> None:
    user = create_random_user(db)
    db.add(_entry(user.id))
    db.add(_entry(user.id, study_type="syntax"))
    db.commit()

    db.add(_entry(user.id))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_progress_is_deleted_with_the_user(db: Session) -> None:
    user = create_random_user(db)
    user_id = user.id
    db.add(UserStats(user_id=user_id, current_streak=3, max_streak=3))
    db.add(_entry(user_id))
    db.add(AchievementUnlocked(user_id=user_id, achievement_id="first_steps"))
    db.commit()

    db.delete(user)
    db.commit()

    assert db.get(UserStats, user_id) is None
    assert not db.exec(
        select(HistoryEntry).where(HistoryEntry.user_id == user_id)
    ).all()
    assert not db.exec(
        select(AchievementUnlocked).where(AchievementUnlocked.user_id == user_id)
    ).all()
