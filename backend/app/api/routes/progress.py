from fastapi import APIRouter, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.core.game_time import game_today
from app.models import Progress, day_id_for

router = APIRouter(prefix="/me", tags=["progress"])


@router.get("/progress")
def read_progress(session: SessionDep, current_user: CurrentUser) -> Progress:
    """
    Progresso competitivo do usuário logado (stats, histórico e conquistas).
    """
    return crud.get_progress(session=session, user_id=current_user.id)


@router.put("/progress", status_code=status.HTTP_204_NO_CONTENT)
def update_progress(
    session: SessionDep, current_user: CurrentUser, progress_in: Progress
) -> None:
    """
    Grava o snapshot do progresso. Idempotente: reenviar não duplica nada.
    """
    crud.save_progress(
        session=session,
        user_id=current_user.id,
        progress=progress_in,
        today_day_id=day_id_for(game_today()),
    )
