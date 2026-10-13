from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limit import limiter

LOGIN_URL = f"{settings.API_V1_STR}/login/access-token"


@pytest.fixture
def rate_limited() -> Generator[None]:
    limiter.reset()
    limiter.enabled = True
    yield
    limiter.enabled = False
    limiter.reset()


def test_allowed_origin_gets_cors_headers(client: TestClient) -> None:
    r = client.options(
        LOGIN_URL,
        headers={
            "Origin": settings.FRONTEND_HOST,
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == settings.FRONTEND_HOST


def test_unknown_origin_is_blocked(client: TestClient) -> None:
    r = client.options(
        LOGIN_URL,
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.status_code == 400
    assert "access-control-allow-origin" not in r.headers


def test_security_headers_are_present(client: TestClient) -> None:
    r = client.get(f"{settings.API_V1_STR}/utils/health-check/")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["referrer-policy"] == "no-referrer"


@pytest.mark.usefixtures("rate_limited")
def test_too_many_logins_get_429(client: TestClient) -> None:
    limit = int(settings.AUTH_RATE_LIMIT.split("/")[0])
    data = {"username": "nobody@example.com", "password": "wrong-password"}
    for _ in range(limit):
        assert client.post(LOGIN_URL, data=data).status_code == 400
    r = client.post(LOGIN_URL, data=data)
    assert r.status_code == 429
    assert "retry-after" in r.headers
