from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1 import router as api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User
from app.db.session import Base, engine

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

def create_test_users(db):
    """Create test users if TEST_MODE is enabled"""
    if not settings.TEST_MODE:
        return
    
    logger.info("=== TEST MODE ENABLED - CREATING TEST USERS ===")
    
    test_users = [
        {
            "username": "girik",
            "email": "girik@test.com",
            "first_name": "Саша",
            "last_name": "Гирик",
            "is_superuser": False,
            "is_staff": False,
            "grade": 7,
            "party": 4
        },
        {
            "username": "girix",
            "email": "girix@test.com", 
            "first_name": "Александр",
            "last_name": "Гирикс",
            "is_superuser": False,
            "is_staff": True,
            "grade": 0,
            "party": 0
        },
        {
            "username": "bank_manager",
            "email": "bank_manager@test.com",
            "first_name": "Банкир",
            "last_name": "ЛФМШ",
            "is_superuser": True,
            "is_staff": True,
            "grade": 0,
            "party": 0
        }
    ]
    
    for user_data in test_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if existing_user:
            logger.info(f"Test user {user_data['username']} already exists, skipping...")
            continue
            
        # Create new user
        hashed_password = get_password_hash("r")
        new_user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=hashed_password,
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            is_superuser=user_data["is_superuser"],
            is_staff=user_data["is_staff"],
            grade=user_data["grade"],
            party=user_data["party"],
            balance=0.0
        )
        
        db.add(new_user)
        logger.info(f"Created test user: {user_data['username']} ({user_data['first_name']} {user_data['last_name']})")
    
    try:
        db.commit()
        logger.info("=== TEST USERS CREATED SUCCESSFULLY ===")
    except Exception as e:
        db.rollback()
        logger.error(f"=== FAILED TO CREATE TEST USERS: {str(e)} ===")

# Initialize database with required data
@app.on_event("startup")
def initialize_data():
    logger.info("=== APPLICATION STARTUP - INITIALIZING DATABASE ===")
    db = SessionLocal()
    Base.metadata.create_all(bind=engine)
    try:
        # Create test users if TEST_MODE is enabled
        create_test_users(db)
        logger.info("=== DATABASE INITIALIZATION COMPLETED SUCCESSFULLY ===")
    except Exception as e:
        logger.error(f"=== DATABASE INITIALIZATION FAILED: {str(e)} ===")
    finally:
        db.close()

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR) 