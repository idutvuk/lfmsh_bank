import sys
from loguru import logger


def configure_logging():
    """Configure loguru logging for the application."""
    # Remove default handler
    logger.remove()
    
    # Add custom handler with colored output for console
    logger.add(
        sys.stdout,
        format="<cyan>{time:YYYY-MM-DD HH:mm:ss}</cyan> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
        colorize=True
    )
    
    # Add file handler for errors
    logger.add(
        "backend/logs/error.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )
    
    # Add file handler for all logs
    logger.add(
        "backend/logs/app.log", 
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="INFO",
        rotation="50 MB",
        retention="7 days",
        compression="zip"
    ) 