"""
Database connection module for the application.
Provides connection to PostgreSQL and MongoDB databases.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pymongo import MongoClient
import logging
from src.common.config import DatabaseConfig, MongoConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create PostgreSQL database URL from config
SQLALCHEMY_DATABASE_URL = DatabaseConfig.get_connection_url()

# Create engine
try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Error creating database engine: {e}")
    raise

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
Base = declarative_base()

# Dependency
def get_db():
    """Database session dependency injector for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# MongoDB connection
mongo_client = MongoClient(MongoConfig.MONGO_CONNECTION_STRING)
mongo_db = mongo_client[MongoConfig.MONGO_DB_NAME]

def get_mongo_collection(collection_name):
    """Get a MongoDB collection by name"""
    return mongo_db[collection_name] 