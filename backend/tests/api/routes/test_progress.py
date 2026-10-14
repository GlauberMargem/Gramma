from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import GAME_START_DATE, HistoryEntry
from tests.utils.user import user_authentication_headers
from tests.utils.utils import random_email, random_lower_string

URL = f"{settings.API_V1_STR}/me/progress"


def _headers(client: TestClient) -> dict[str, str]:
    """Cria um usuário novo (progresso vazio) e devolve o header de auth."""
    email, password = random_email(), random_lower_string()
    r = client.post(
        f"{settings.API_V1_STR}/users/signup",
        json={"email": email, "password": password},
    )
    assert r.status_code == 200
    return user_authentication_headers(client=client, email=email, password=password)


def _entry(**overrides: Any) -> dict[str, Any]:
    entry = {
        "day_id": 3,
        "study_type": "morphology",
        "correct": True,
        "points": 15,
        "base": 10,
        "bonus": 5,
        "is_milestone": False,
        "streak_after": 2,
        "time_ms": 4000,
        "is_archive": False,
    }
    return entry | overrides


def _progress(history: list[dict[str, Any]], **stats: Any) -> dict[str, Any]:
    return {
        "stats": {"current_streak": 2, "max_streak": 4, "last_streak_day": 3} | stats,
        "history": history,
    }


def test_progress_requires_auth(client: TestClient) -> None:
    assert client.get(URL).status_code == 401
    assert client.put(URL, json=_progress([])).status_code == 401


def test_new_user_starts_with_empty_progress(client: TestClient) -> None:
    r = client.get(URL, headers=_headers(client))
    assert r.status_code == 200
    body = r.json()
    assert body["history"] == []
    assert body["stats"]["current_streak"] == 0
    assert body["stats"]["unlocked_achievements"] == []


def test_put_then_get_round_trip_keeps_streak(client: TestClient) -> None:
    headers = _headers(client)
    payload = _progress(
        [_entry(), _entry(study_type="syntax", points=0, correct=False)],
        games_played=2,
        total_score=15,
        unlocked_achievements=["first_steps"],
    )
    assert client.put(URL, json=payload, headers=headers).status_code == 204

    body = client.get(URL, headers=headers).json()
    assert body["stats"]["current_streak"] == 2
    assert body["stats"]["max_streak"] == 4
    assert body["stats"]["last_streak_day"] == 3
    assert body["stats"]["games_played"] == 2
    assert body["stats"]["unlocked_achievements"] == ["first_steps"]
    assert {(e["day_id"], e["study_type"]) for e in body["history"]} == {
        (3, "morphology"),
        (3, "syntax"),
    }


def test_put_is_idempotent(client: TestClient) -> None:
    headers = _headers(client)
    payload = _progress([_entry()], unlocked_achievements=["first_steps"])
    client.put(URL, json=payload, headers=headers)
    client.put(URL, json=payload, headers=headers)

    body = client.get(URL, headers=headers).json()
    assert len(body["history"]) == 1
    assert body["stats"]["unlocked_achievements"] == ["first_steps"]


def test_put_keeps_the_best_play_and_never_deletes(client: TestClient) -> None:
    headers = _headers(client)
    client.put(URL, json=_progress([_entry(time_ms=4000)]), headers=headers)
    # Pior pontuação (erro) não sobrescreve; empate com menos tempo sobrescreve.
    client.put(URL, json=_progress([_entry(correct=False)]), headers=headers)
    client.put(URL, json=_progress([_entry(time_ms=900)]), headers=headers)
    # Snapshot sem a entrada não a apaga.
    client.put(URL, json=_progress([_entry(day_id=4)]), headers=headers)

    history = {
        e["day_id"]: e for e in client.get(URL, headers=headers).json()["history"]
    }
    assert history[3]["points"] == 100
    assert history[3]["time_ms"] == 900
    assert 4 in history


def test_progress_is_isolated_per_user(client: TestClient) -> None:
    alice, bob = _headers(client), _headers(client)
    client.put(URL, json=_progress([_entry()], current_streak=9), headers=alice)

    body = client.get(URL, headers=bob).json()
    assert body["history"] == []
    assert body["stats"]["current_streak"] == 0


def test_played_on_is_derived_by_the_server(client: TestClient, db: Session) -> None:
    headers = _headers(client)
    client.put(URL, json=_progress([_entry(day_id=16)]), headers=headers)
    entry = db.exec(select(HistoryEntry).where(HistoryEntry.day_id == 16)).first()
    assert entry is not None
    assert entry.played_on.isoformat() == "2026-08-01"


def test_invalid_payload_is_rejected(client: TestClient) -> None:
    headers = _headers(client)
    for bad in (
        _progress([_entry(study_type="hacking")]),
        _progress([_entry(points=-1)]),
        _progress([_entry(day_id=0)]),
        _progress([], current_streak=-5),
    ):
        assert client.put(URL, json=bad, headers=headers).status_code == 422


def _today_day_id() -> int:
    today = datetime.now(ZoneInfo(settings.GAME_TIMEZONE)).date()
    return (today - GAME_START_DATE).days + 1


def test_server_recomputes_points_from_game_rules(client: TestClient) -> None:
    """SEC-01: pontos forjados pelo cliente não chegam ao ranking."""
    headers = _headers(client)
    forged = [
        _entry(day_id=5, study_type="syntax", points=10_000, base=10_000, bonus=0),
        _entry(day_id=6, correct=False, points=500, base=500, bonus=0),
        _entry(
            day_id=10, study_type="synonyms", streak_after=5, points=9, base=9, bonus=0
        ),
    ]
    client.put(URL, json=_progress(forged), headers=headers)

    history = {
        e["day_id"]: e for e in client.get(URL, headers=headers).json()["history"]
    }
    assert (history[5]["points"], history[5]["base"], history[5]["bonus"]) == (
        200,
        200,
        0,
    )
    assert (history[6]["points"], history[6]["base"]) == (0, 0)
    assert (history[10]["points"], history[10]["bonus"]) == (165, 15)
    assert history[10]["is_milestone"] is True


def test_future_days_are_ignored(client: TestClient) -> None:
    """SEC-01: não dá para pré-preencher dias que ainda não chegaram."""
    headers = _headers(client)
    today = _today_day_id()
    client.put(
        URL,
        json=_progress([_entry(day_id=today), _entry(day_id=today + 30)]),
        headers=headers,
    )
    days = {e["day_id"] for e in client.get(URL, headers=headers).json()["history"]}
    assert days == {today}


def test_streaks_are_capped_by_the_game_age(client: TestClient) -> None:
    """SEC-01: ofensiva exibida no ranking não passa do nº de dias do jogo."""
    headers = _headers(client)
    today = _today_day_id()
    client.put(
        URL,
        json=_progress(
            [], current_streak=99_999, max_streak=99_999, last_streak_day=99_999
        ),
        headers=headers,
    )
    stats = client.get(URL, headers=headers).json()["stats"]
    assert stats["current_streak"] <= today
    assert stats["max_streak"] <= today
    assert stats["last_streak_day"] <= today + 1
