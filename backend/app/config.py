from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "paint_damage_db"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Paint Tin Damage Prediction System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8081"]
    
    # Model Paths
    XGBOOST_MODEL_PATH: str = "./models/xgboost_model.pkl"
    DL_MODEL_PATH: str = "./models/deep_learning_model.h5"
    ENCODERS_PATH: str = "./models/encoders.pkl"
    SCALER_PATH: str = "./models/scaler.pkl"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
