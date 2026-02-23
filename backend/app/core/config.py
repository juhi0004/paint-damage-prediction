"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    API_V1_STR: str = "/api/v1"  # backward compatibility
    PROJECT_NAME: str = "Paint Tin Damage Prediction API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "ML-powered damage prediction system for paint tin shipments"
    DEBUG: bool = False

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]

    # Database Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "paint_damage_db"
    DATABASE_NAME: str = "paint_damage_db"

    # Security Settings
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Model Settings
    MODELS_DIR: str = "../models"
    XGBOOST_MODEL_PATH: Optional[str] = None
    DL_MODEL_PATH: Optional[str] = None
    ENCODERS_PATH: Optional[str] = None
    SCALER_PATH: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 1000

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"   # 🔥 THIS STOPS THE CRASH


settings = Settings()
