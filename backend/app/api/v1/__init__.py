from fastapi import APIRouter

router = APIRouter()

from app.api.v1.endpoints import users, transactions, auth, statistics #noqa: E402

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
router.include_router(statistics.router, prefix="/statistics", tags=["statistics"]) 