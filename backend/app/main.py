"""
Main FastAPI application - Full version with all features
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import logging
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import get_database, close_database_connection

# Import all routers
from app.routers import predictions, shipments, analytics, auth

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("="*60)
    logger.info("Starting Paint Damage Prediction API")
    logger.info("="*60)
    logger.info(f"Version: {settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Initialize database connection
    try:
        db = await get_database()
        logger.info("✓ MongoDB connection established")
        
        # Test connection
        await db.command('ping')
        logger.info("✓ MongoDB ping successful")
        
    except Exception as e:
        logger.error(f"✗ MongoDB connection failed: {str(e)}")
        logger.warning("⚠ Running without MongoDB - only predictions available")
    
    logger.info("="*60)
    logger.info("✓ Application startup complete")
    logger.info("="*60)
    
    yield
    
    # Shutdown
    logger.info("Shutting down API...")
    await close_database_connection()
    logger.info("✓ Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    """Redirect to API documentation"""
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")


# Health check
@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    db_status = "connected"
    try:
        db = await get_database()
        await db.command('ping')
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "service": settings.PROJECT_NAME,
        "database": db_status,
        "endpoints": {
            "predictions": f"{settings.API_V1_STR}/predictions",
            "shipments": f"{settings.API_V1_STR}/shipments",
            "analytics": f"{settings.API_V1_STR}/analytics",
            "auth": f"{settings.API_V1_STR}/auth"
        }
    }


# Include all routers
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(shipments.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
