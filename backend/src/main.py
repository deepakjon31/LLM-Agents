"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from src.common.config import AppConfig, CORSConfig
from src.apis.auth import router as auth_router
from src.apis.profile import router as profile_router
from src.apis.documents import router as documents_router
from src.apis.database import router as database_router
from src.apis.agents import router as agents_router
# Import admin router
from src.apis.admin import router as admin_router
# Fix the router name to match what's defined in api.py
from src.agents.mcp_helpers.api import mcp_router
from src.common.db.connection import engine
from src.common.db.schema import Base
from typing import Dict
from starlette.routing import Mount
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Skip database tables creation if SKIP_DB is set
if not AppConfig.SKIP_DB:
    try:
        # Create database tables properly indented
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"⚠️ Database connection error: {e}")
        logger.info("ℹ️ Set SKIP_DB=true to start without database connection")
        # Don't exit, just warn
        AppConfig.SKIP_DB = True  # Set to skip to avoid further DB operations
        logger.info("ℹ️ Continuing without database connection")

# Initialize FastAPI app
app = FastAPI(
    title="AI Chatbot API",
    description="API for AI Chatbot with SQL and Document Agents using OpenAI LLM and MCP",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORSConfig.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(documents_router)
app.include_router(database_router)
app.include_router(agents_router)
app.include_router(mcp_router)

# Include admin router with explicit prefix
logger.info("Attempting to include admin router...")
try:
    app.include_router(admin_router, prefix="/admin")
    logger.info("✅ Admin router included successfully.")
except Exception as e:
    logger.error(f"❌ Failed to include admin router: {e}")

@app.get("/", response_model=Dict[str, str])
async def root():
    """API root endpoint"""
    return {
        "status": "success",
        "message": "Welcome to AI Chatbot API",
    }

# Setup MCP server if configured
if AppConfig.START_MCP_SERVER:
    from src.agents.mcp_helpers.server import run_server
    
    # Create and mount the MCP server app at /mcp-server
    mcp_server_app = run_server()
    app.mount("/mcp-server", mcp_server_app)
    logger.info("✅ MCP server mounted at /mcp-server")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=AppConfig.HOST,
        port=AppConfig.PORT,
        reload=AppConfig.DEBUG
    ) 