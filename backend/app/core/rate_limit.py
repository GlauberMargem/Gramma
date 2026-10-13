from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Chave = IP do cliente. Atrás de proxy reverso, configure o proxy para repassar
# o IP real (ex.: uvicorn --proxy-headers) para não limitar todos juntos.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.RATE_LIMIT_ENABLED,
    headers_enabled=True,
)
auth_limit = limiter.limit(lambda: settings.AUTH_RATE_LIMIT)
