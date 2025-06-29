from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_router
from app.core.config import settings

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

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR) 