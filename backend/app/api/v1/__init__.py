from fastapi import APIRouter

router = APIRouter()

from app.api.v1.endpoints import users, transactions, auth, statistics, tax, badges #noqa: E402

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
router.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
router.include_router(tax.router, prefix="", tags=["tax"]) # Using prefix="" to match /api/tax
router.include_router(badges.router, prefix="/badges", tags=["badges"]) 