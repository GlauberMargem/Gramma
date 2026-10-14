from datetime import datetime
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Query

from app import crud
from app.api.deps import OptionalUser, SessionDep
from app.core.config import settings
from app.models import MAX_RANKING_LIMIT, RankingPeriod, RankingPublic, StudyType

router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.get("/")
def read_ranking(
    session: SessionDep,
    current_user: OptionalUser,
    period: RankingPeriod = "daily",
    study_type: StudyType | None = None,
    limit: Annotated[int, Query(ge=1, le=MAX_RANKING_LIMIT)] = 50,
) -> RankingPublic:
    """
    Ranking público por período (diário, semanal, mensal), opcionalmente por
    modo. Com token válido, marca e devolve a posição do usuário (`me`).
    """
    today = datetime.now(ZoneInfo(settings.GAME_TIMEZONE)).date()
    return crud.get_ranking(
        session=session,
        period=period,
        today=today,
        study_type=study_type,
        limit=limit,
        current_user_id=current_user.id if current_user else None,
    )
