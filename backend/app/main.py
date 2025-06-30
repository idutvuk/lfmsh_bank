from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import traceback

from app.api.v1 import router as api_router
from app.core.config import settings
from app.db.init_db import run_initialization

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.on_event("startup")
async def startup_db_client():
    logger.info("Initializing database on startup...")
    try:
        run_initialization()
        logger.info("Database initialization completed!")
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error during database initialization: {str(e)}")
        logger.error(f"Traceback: {error_details}")
        # Don't raise the exception to prevent the app from failing to start
        # This allows us to debug the issue while the API is still running

@app.get("/")
async def root():
    return {"message": "Welcome to LFMSH Bank API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR) 