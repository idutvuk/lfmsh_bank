import os
import socket
from pydantic_settings import BaseSettings
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# Check if running locally or in Docker
def is_running_in_docker():
    """Check if we're running in a Docker container or locally"""
    try:
        with open('/proc/1/cgroup', 'r') as f:
            return 'docker' in f.read()
    except:
        return False

# Determine host to use for database connection
def get_db_host():
    """Get the appropriate database host"""
    if is_running_in_docker():
        return "db"  # Docker service name
    else:
        return "localhost"  # Local development

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LFMSH Bank"
    
    # PostgreSQL
    POSTGRES_SERVER: str = os.environ.get("POSTGRES_SERVER", get_db_host())
    POSTGRES_USER: str = os.environ.get("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.environ.get("BANK_POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.environ.get("POSTGRES_DB", "lfmsh_bank")
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # JWT
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "secret_key_for_dev_only")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Build DB connection string
        self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"


settings = Settings() 