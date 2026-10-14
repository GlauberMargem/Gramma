from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient

from app.core.config import settings
from app.models import GAME_START_DATE
from tests.utils.user import user_authentication_headers
from tests.utils.utils import random_email, random_lower_string

URL = f"{settings.API_V1_STR}/ranking/"


def _today_day_id() -> int:
    today = datetime.now(ZoneInfo(settings.GAME_TIMEZONE)).date()
    return (today - GAME_START_DATE).days + 1


def test_ranking_is_public(client: TestClient) -> None:
    r = client.get(URL, params={"period": "weekly"})
    assert r.status_code == 200
    body = r.json()
    assert body["period"] == "weekly"
    assert body["me"] is None
    assert all(not e["is_me"] for e in body["entries"])


def test_logged_user_sees_own_position(client: TestClient) -> None:
    email, password = random_email(), random_lower_string()
    client.post(
        f"{settings.API_V1_STR}/users/signup",
        json={"email": email, "password": password, "full_name": "Eu Mesmo"},
    )
    headers = user_authentication_headers(client=client, email=email, password=password)
    entry = {
        "day_id": _today_day_id(),
        "study_type": "syntax",
        "correct": True,
        "points": 200,
        "base": 200,
        "bonus": 0,
        "is_milestone": False,
        "streak_after": 7,
        "time_ms": 2000,
        "is_archive": False,
    }
    client.put(
        f"{settings.API_V1_STR}/me/progress",
        json={"stats": {"current_streak": 4}, "history": [entry]},
        headers=headers,
    )

    body = client.get(
        URL, params={"period": "daily", "study_type": "syntax"}, headers=headers
    ).json()
    assert body["me"]["display_name"] == "Eu Mesmo"
    assert body["me"]["score"] == 200
    assert body["me"]["streak"] == 4
    assert any(e["is_me"] for e in body["entries"])


def test_invalid_token_is_treated_as_anonymous(client: TestClient) -> None:
    r = client.get(URL, headers={"Authorization": "Bearer invalido"})
    assert r.status_code == 200
    assert r.json()["me"] is None


def test_invalid_params_are_rejected(client: TestClient) -> None:
    assert client.get(URL, params={"period": "yearly"}).status_code == 422
    assert client.get(URL, params={"study_type": "x"}).status_code == 422
    assert client.get(URL, params={"limit": 0}).status_code == 422
    assert client.get(URL, params={"limit": 1000}).status_code == 422
