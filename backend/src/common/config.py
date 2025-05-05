"""
Configuration utilities for the application.
This module centralizes access to environment variables and configuration settings.
"""

import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Database configuration
class DatabaseConfig:
    """Database configuration settings"""
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "Password1")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "agentic_rag")
    
    @classmethod
    def get_connection_url(cls) -> str:
        """Get the database connection URL"""
        return f"postgresql://{cls.POSTGRES_USER}:{cls.POSTGRES_PASSWORD}@{cls.POSTGRES_SERVER}:{cls.POSTGRES_PORT}/{cls.POSTGRES_DB}"

    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return {
            "POSTGRES_USER": cls.POSTGRES_USER,
            "POSTGRES_PASSWORD": "********",  # Hide password
            "POSTGRES_SERVER": cls.POSTGRES_SERVER,
            "POSTGRES_PORT": cls.POSTGRES_PORT,
            "POSTGRES_DB": cls.POSTGRES_DB,
        }

# MongoDB configuration
class MongoConfig:
    """MongoDB configuration settings"""
    MONGO_CONNECTION_STRING: str = os.getenv("MONGO_CONNECTION_STRING", "mongodb://mongodb:27017/")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "agentic_rag")
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return {
            "MONGO_CONNECTION_STRING": cls.MONGO_CONNECTION_STRING,
            "MONGO_DB_NAME": cls.MONGO_DB_NAME,
        }

# Authentication configuration
class AuthConfig:
    """Authentication configuration settings"""
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development_secret_key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours by default
    
    # Admin configuration
    ADMIN_ROLE_NAME: str = "admin"
    ADMIN_PERMISSION_NAME: str = "admin_access"
    
    # User role configuration
    USER_ROLE_NAME: str = "user"
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return {
            "SECRET_KEY": "********",  # Hide secret key
            "ACCESS_TOKEN_EXPIRE_MINUTES": cls.ACCESS_TOKEN_EXPIRE_MINUTES,
            "ADMIN_ROLE_NAME": cls.ADMIN_ROLE_NAME,
            "ADMIN_PERMISSION_NAME": cls.ADMIN_PERMISSION_NAME,
            "USER_ROLE_NAME": cls.USER_ROLE_NAME,
        }

# CORS Configuration
class CORSConfig:
    """CORS configuration settings"""
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://app.local:3000",
        "http://frontend:3000",
        "http://192.168.1.52:3000",  # Common development IP
        "https://192.168.1.52:3000", # HTTPS version
        "http://0.0.0.0:3000",       # Wildcard development
    ]
    
    @classmethod
    def add_origin(cls, origin: str) -> None:
        """Add a new origin to the allowed origins list"""
        if origin not in cls.CORS_ORIGINS:
            cls.CORS_ORIGINS.append(origin)
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return {
            "CORS_ORIGINS": cls.CORS_ORIGINS,
        }

# Application Settings
class AppConfig:
    """Application configuration settings"""
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    SKIP_DB: bool = os.getenv("SKIP_DB", "False").lower() in ("true", "1", "yes")
    START_MCP_SERVER: bool = os.getenv("START_MCP_SERVER", "False").lower() in ("true", "1", "yes")
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return {
            "HOST": cls.HOST,
            "PORT": cls.PORT,
            "DEBUG": cls.DEBUG,
            "SKIP_DB": cls.SKIP_DB,
            "START_MCP_SERVER": cls.START_MCP_SERVER,
        }

# Get all config as dictionary
def get_config_dict() -> Dict[str, Dict[str, Any]]:
    """Get all configuration as a dictionary"""
    return {
        "app": AppConfig.to_dict(),
        "database": DatabaseConfig.to_dict(),
        "mongo": MongoConfig.to_dict(),
        "auth": AuthConfig.to_dict(),
        "cors": CORSConfig.to_dict(),
    } 