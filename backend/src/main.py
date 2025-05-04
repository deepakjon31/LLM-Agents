from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from src.apis.auth import router as auth_router
from src.apis.profile import router as profile_router
from src.apis.documents import router as documents_router
from src.apis.database import router as database_router
# Fix the router name to match what's defined in api.py
from src.agents.mcp_helpers.api import mcp_router
from src.common.db.connection import engine
from src.common.db.schema import Base
from typing import Dict
from fastapi.routing import Mount
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Load environment variables
load_dotenv()

# Skip database tables creation if SKIP_DB env var is set
skip_db = os.getenv("SKIP_DB", "").lower() in ("true", "1", "yes")
if not skip_db:
    try:
# Create database tables
Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified successfully")
    except Exception as e:
        print(f"⚠️ Database connection error: {e}")
        print("ℹ️ Set SKIP_DB=true to start without database connection")
        # Don't exit, just warn
        skip_db = True  # Set to skip to avoid further DB operations
        print("ℹ️ Continuing without database connection")

# Initialize FastAPI app
app = FastAPI(
    title="AI Chatbot API",
    description="API for AI Chatbot with SQL and Document Agents using OpenAI LLM and MCP",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://app.local:3000",
        "http://frontend:3000",
        "http://192.168.1.52:3000",
        "https://192.168.1.52:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(documents_router)
app.include_router(database_router)
app.include_router(mcp_router)

@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "status": "success",
        "message": "Welcome to AI Chatbot API",
    }

# Setup MCP server if configured
if os.getenv("START_MCP_SERVER", "false").lower() == "true":
    from src.agents.mcp_helpers.server import run_server
    
    # Create and mount the MCP server app at /mcp-server
    mcp_server_app = run_server()
    app.mount("/mcp-server", mcp_server_app)
    print("✅ MCP server mounted at /mcp-server")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 