from fastapi import APIRouter

from app.api.routes import login, private, progress, ranking, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(progress.router)
api_router.include_router(ranking.router)


if settings.FASTAPI_ENV == "development":
    api_router.include_router(private.router)
