from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from apis.auth import router as auth_router
from apis.profile import router as profile_router

from .apis.routers import api_router
from .common.db.connection import engine
from .common.db.schema import Base

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Agentic RAG API",
    description="API for Agentic RAG with SQL and Document Agents using OpenAI LLM",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(auth_router)
app.include_router(profile_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Agentic RAG API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 