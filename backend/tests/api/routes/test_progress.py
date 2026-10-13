from typing import Any

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import HistoryEntry
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
    client.put(URL, json=_progress([_entry(points=15, time_ms=4000)]), headers=headers)
    # Pior pontuação não sobrescreve; empate com menos tempo sobrescreve.
    client.put(URL, json=_progress([_entry(points=5)]), headers=headers)
    client.put(URL, json=_progress([_entry(points=15, time_ms=900)]), headers=headers)
    # Snapshot sem a entrada não a apaga.
    client.put(URL, json=_progress([_entry(day_id=4)]), headers=headers)

    history = {
        e["day_id"]: e for e in client.get(URL, headers=headers).json()["history"]
    }
    assert history[3]["points"] == 15
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
