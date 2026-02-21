"""
Dependency injection for FastAPI
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import logging

from app.core.config import settings
from app.core.security import decode_access_token
from app.services.prediction_service import PredictionService
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Global instances
_db_client: Optional[AsyncIOMotorClient] = None
_prediction_service: Optional[PredictionService] = None


def get_db_client() -> AsyncIOMotorClient:
    """Get MongoDB client"""
    global _db_client
    if _db_client is None:
        _db_client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _db_client


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    client = get_db_client()
    return client[settings.MONGODB_DB_NAME]


def get_prediction_service() -> PredictionService:
    """Get prediction service instance"""
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService(models_dir=settings.MODELS_DIR)
    return _prediction_service


def get_analytics_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AnalyticsService:
    """Get analytics service instance"""
    return AnalyticsService(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Get current authenticated user
    
    Validates JWT token and returns user information.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    # Get user from database
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Remove password from user dict
    user.pop('password', None)
    user['_id'] = str(user['_id'])
    
    return user


async def get_current_active_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Get current user if admin"""
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
