"""
API routes for authentication
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import logging

from app.models.user import LoginRequest, Token, UserCreate, UserResponse
from app.core.security import (
    create_access_token, verify_password, get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.core.dependencies import get_database, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({'email': user.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        user_dict = user.dict()
        user_dict['password'] = get_password_hash(user_dict['password'])
        user_dict['created_at'] = datetime.now()
        user_dict['last_login'] = None
        
        # Insert user
        result = await db.users.insert_one(user_dict)
        
        created_user = await db.users.find_one({'_id': result.inserted_id})
        created_user['_id'] = str(created_user['_id'])
        
        # Remove password from response
        created_user.pop('password', None)
        
        return UserResponse(**created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(
    credentials: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Login and get access token
    
    Returns JWT token for authentication.
    """
    try:
        # Find user
        user = await db.users.find_one({'email': credentials.email})
        
        if not user or not verify_password(credentials.password, user['password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not user.get('is_active', True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Update last login
        await db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.now()}}
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user['email'], "role": user.get('role', 'viewer')},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/token", response_model=Token)
async def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """OAuth2 compatible token endpoint"""
    credentials = LoginRequest(email=form_data.username, password=form_data.password)
    return await login(credentials, db)


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user)
