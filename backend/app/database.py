from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db = None


db = Database()


async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    try:
        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            server_api=ServerApi('1')
        )
        db.db = db.client[settings.MONGODB_DB_NAME]
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        logger.info("Closing MongoDB connection...")
        if db.client:
            db.client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")


async def create_indexes():
    """Create database indexes for performance"""
    try:
        # Shipments collection indexes
        await db.db.shipments.create_index("date")
        await db.db.shipments.create_index("dealer_code")
        await db.db.shipments.create_index("warehouse")
        await db.db.shipments.create_index([("date", -1)])  # Descending for recent first
        
        # Predictions collection indexes
        await db.db.predictions.create_index("prediction_date")
        await db.db.predictions.create_index("dealer_code")
        await db.db.predictions.create_index([("prediction_date", -1)])
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")


def get_database():
    """Dependency for getting database instance"""
    return db.db
