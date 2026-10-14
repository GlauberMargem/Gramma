import uuid
from datetime import date, timedelta

from sqlmodel import Session

from app import crud
from app.models import (
    GAME_START_DATE,
    HistoryEntry,
    RankingPublic,
    User,
    UserCreate,
    UserStats,
    played_on_for_day,
)
from tests.utils.utils import random_email, random_lower_string

# Datas longe das usadas nos outros testes (que ficam em 2026).
TODAY = date(2030, 3, 31)


def _day_id(on: date) -> int:
    return (on - GAME_START_DATE).days + 1


def _user(db: Session, full_name: str | None = None, streak: int = 0) -> User:
    user = crud.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(), password=random_lower_string(), full_name=full_name
        ),
    )
    db.add(UserStats(user_id=user.id, current_streak=streak))
    db.commit()
    return user


def _play(
    db: Session,
    user: User,
    on: date,
    points: int,
    study_type: str = "morphology",
    is_archive: bool = False,
) -> None:
    day_id = _day_id(on)
    db.add(
        HistoryEntry(
            user_id=user.id,
            day_id=day_id,
            study_type=study_type,
            correct=points > 0,
            points=points,
            base=points,
            bonus=0,
            is_milestone=False,
            streak_after=1,
            time_ms=1000,
            is_archive=is_archive,
            played_on=played_on_for_day(day_id),
        )
    )
    db.commit()


def _scores(ranking: RankingPublic) -> dict[str, int]:
    return {e.display_name: e.score for e in ranking.entries}


def test_windows_sum_points_per_user(db: Session) -> None:
    today = TODAY
    suffix = uuid.uuid4().hex[:6]
    ana, bia, caio = (_user(db, f"{n}-{suffix}") for n in ("ana", "bia", "caio"))
    _play(db, ana, today, 100)
    _play(db, ana, today - timedelta(days=6), 50)  # entra na semanal
    _play(db, bia, today - timedelta(days=7), 500)  # fora da semanal
    _play(db, caio, today - timedelta(days=29), 70)  # último dia da mensal
    _play(db, caio, today - timedelta(days=30), 999)  # fora da mensal
    _play(db, ana, today + timedelta(days=1), 999)  # futuro não conta

    daily = crud.get_ranking(session=db, period="daily", today=today)
    weekly = crud.get_ranking(session=db, period="weekly", today=today)
    monthly = crud.get_ranking(session=db, period="monthly", today=today)

    assert _scores(daily) == {ana.full_name: 100}
    assert _scores(weekly) == {ana.full_name: 150}
    assert [(e.display_name, e.score) for e in monthly.entries] == [
        (bia.full_name, 500),
        (ana.full_name, 150),
        (caio.full_name, 70),
    ]
    assert weekly.start_date == today - timedelta(days=6)
    assert monthly.end_date == today


def test_archive_days_do_not_count(db: Session) -> None:
    today = TODAY + timedelta(days=100)
    user = _user(db, "arquivo")
    _play(db, user, today, 80, is_archive=True)
    assert crud.get_ranking(session=db, period="daily", today=today).entries == []


def test_filter_by_study_type(db: Session) -> None:
    today = TODAY + timedelta(days=200)
    user = _user(db, "modos")
    _play(db, user, today, 10, study_type="morphology")
    _play(db, user, today, 20, study_type="syntax")

    syntax = crud.get_ranking(
        session=db, period="daily", today=today, study_type="syntax"
    )
    overall = crud.get_ranking(session=db, period="daily", today=today)
    assert _scores(syntax) == {"modos": 20}
    assert _scores(overall) == {"modos": 30}


def test_ties_share_rank_and_order_is_stable(db: Session) -> None:
    today = TODAY + timedelta(days=300)
    top = _user(db, "topo", streak=1)
    tie_more_streak = _user(db, "empate-b", streak=5)
    tie_less_streak = _user(db, "empate-a", streak=2)
    last = _user(db, "ultimo")
    for user, points in (
        (top, 90),
        (tie_more_streak, 50),
        (tie_less_streak, 50),
        (last, 10),
    ):
        _play(db, user, today, points)

    first = crud.get_ranking(session=db, period="daily", today=today)
    again = crud.get_ranking(session=db, period="daily", today=today)

    assert [(e.rank, e.display_name, e.streak) for e in first.entries] == [
        (1, "topo", 1),
        (2, "empate-b", 5),
        (2, "empate-a", 2),
        (4, "ultimo", 0),
    ]
    assert first.entries == again.entries


def test_limit_and_my_position_outside_the_top(db: Session) -> None:
    today = TODAY + timedelta(days=400)
    users = [_user(db, f"jogador-{i}") for i in range(4)]
    for i, user in enumerate(users):
        _play(db, user, today, 100 - i)

    ranking = crud.get_ranking(
        session=db, period="daily", today=today, limit=2, current_user_id=users[3].id
    )
    assert len(ranking.entries) == 2
    assert not any(e.is_me for e in ranking.entries)
    assert ranking.me is not None
    assert (ranking.me.rank, ranking.me.display_name) == (4, "jogador-3")


def test_display_name_never_exposes_full_email(db: Session) -> None:
    user = _user(db)
    assert crud.display_name_for(user) == user.email.split("@")[0]
    assert "@" not in crud.display_name_for(user)
