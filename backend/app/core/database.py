"""
Database connection and utilities
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global database client
_client: AsyncIOMotorClient = None
_database = None


async def get_database():
    """Get database instance"""
    global _client, _database
    
    if _database is None:
        try:
            # Create MongoDB client
            _client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            
            # Get database
            _database = _client[settings.DATABASE_NAME]
            
            # Test connection
            await _client.admin.command('ping')
            
            logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    return _database


async def close_database_connection():
    """Close database connection"""
    global _client, _database
    
    if _client is not None:
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed")


# Collection names
COLLECTIONS = {
    'shipments': 'shipments',
    'predictions': 'predictions',
    'users': 'users',
    'dealers': 'dealers',
    'warehouses': 'warehouses'
}
