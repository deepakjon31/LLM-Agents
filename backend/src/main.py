from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from src.apis.auth import router as auth_router
from src.apis.profile import router as profile_router
from src.apis.documents import router as documents_router
from src.apis.database import router as database_router
from src.agents.mcp_helpers import mcp_router
from src.common.db.connection import engine
from src.common.db.schema import Base
from typing import Dict

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

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

# Start the MCP server in a separate process if configured
if os.getenv("START_MCP_SERVER", "false").lower() == "true":
    import subprocess
    import atexit
    
    # Start the MCP server
    mcp_process = subprocess.Popen(
        ["python", "-m", "src.agents.mcp_helpers"],
        env=os.environ.copy()
    )
    
    # Register cleanup function to terminate the MCP server when the app exits
    def cleanup_mcp_server():
        if mcp_process:
            mcp_process.terminate()
            mcp_process.wait()
            print("MCP server terminated")
    
    atexit.register(cleanup_mcp_server)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 