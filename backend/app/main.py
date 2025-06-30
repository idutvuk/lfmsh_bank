from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1 import router as api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import SessionLocal
from app.db.init_db import init_db

# Configure loguru
configure_logging()

app = FastAPI(
    title="LFMSH Bank API",
    description="API for the LFMSH Bank System",
    version="0.1.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to LFMSH Bank API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Initialize database with required data
@app.on_event("startup")
def initialize_data():
    logger.info("=== APPLICATION STARTUP - INITIALIZING DATABASE ===")
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("=== DATABASE INITIALIZATION COMPLETED SUCCESSFULLY ===")
    except Exception as e:
        logger.error(f"=== DATABASE INITIALIZATION FAILED: {str(e)} ===")
    finally:
        db.close()

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR) 