from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import settings


def game_today() -> date:
    """O "hoje" do jogo, no fuso configurado (o dia muda à meia-noite local)."""
    return datetime.now(ZoneInfo(settings.GAME_TIMEZONE)).date()
