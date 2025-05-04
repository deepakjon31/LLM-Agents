from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header, Body, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import os
import json
from src.agents.mcp_helpers.client import AgentMCPClient
from src.common.dependencies import get_current_user
from src.agents.sql_agent import SQLAgent
from src.agents.document_processor import DocumentProcessor

# Define API models
class DatabaseConnectionRequest(BaseModel):
    connection_string: str = Field(..., description="Database connection string")

class TableSchemaRequest(BaseModel):
    table_name: str = Field(..., description="Name of the table to get schema for")

class SqlGenerationRequest(BaseModel):
    query: str = Field(..., description="Natural language query")
    tables: List[str] = Field(..., description="List of tables to consider")

class SqlExecutionRequest(BaseModel):
    query: str = Field(..., description="SQL query to execute")
    params: Optional[Dict[str, Any]] = Field(None, description="Query parameters")

class DocumentProcessingRequest(BaseModel):
    file_path: str = Field(..., description="Path to the document file")
    chunk_size: Optional[int] = Field(1000, description="Size of text chunks")

class PromptRequest(BaseModel):
    query: str = Field(..., description="Query for the prompt")

# Create API router
mcp_router = APIRouter(prefix="/mcp", tags=["MCP"])

# Dependency for MCP client
async def get_mcp_client(authorization: Optional[str] = Header(None)):
    # Verify token if provided
    if authorization:
        # Extract token from header
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        
        # Optional: verify token with your authentication system
        # This would typically call your auth service

    mcp_url = os.environ.get("MCP_SERVER_URL", "http://localhost:8080")
    client = AgentMCPClient(server_url=mcp_url)
    try:
        await client.connect()
        yield client
    finally:
        await client.disconnect()

# SQL Agent endpoints
@mcp_router.post("/sql/connect", response_model=Dict[str, Any])
async def connect_to_database(
    request: DatabaseConnectionRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Connect to a database using the SQL agent."""
    try:
        result = await client.connect_to_database(request.connection_string)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mcp_router.post("/sql/schema", response_model=Dict[str, Any])
async def get_table_schema(
    request: TableSchemaRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Get the schema of a database table."""
    try:
        result = await client.get_table_schema(request.table_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mcp_router.post("/sql/generate", response_model=Dict[str, Any])
async def generate_sql_query(
    request: SqlGenerationRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Generate a SQL query from natural language."""
    try:
        result = await client.generate_sql_query(request.query, request.tables)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mcp_router.post("/sql/execute", response_model=Dict[str, Any])
async def execute_sql_query(
    request: SqlExecutionRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Execute a SQL query."""
    try:
        result = await client.execute_sql_query(request.query, request.params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Document Processor endpoints
@mcp_router.post("/document/process", response_model=Dict[str, Any])
async def process_document(
    request: DocumentProcessingRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Process a document and generate embeddings."""
    try:
        result = await client.process_document(request.file_path, request.chunk_size)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resource endpoints
@mcp_router.get("/resources/agent-state/{agent_type}", response_model=Dict[str, Any])
async def get_agent_state(
    agent_type: str,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Get the current state of an agent."""
    try:
        result = await client.get_agent_state(agent_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mcp_router.get("/resources/agent-context/{agent_type}/{session_id}", response_model=Dict[str, Any])
async def get_agent_context(
    agent_type: str,
    session_id: str,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Get the context for a specific agent session."""
    try:
        result = await client.get_agent_context(agent_type, session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mcp_router.get("/resources/database-tables", response_model=List[str])
async def get_available_tables(
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Get the list of available database tables."""
    try:
        result = await client.get_available_tables()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Prompt endpoints
@mcp_router.post("/prompts/sql", response_model=str)
async def get_sql_prompt(
    request: PromptRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Get a SQL generation prompt."""
    try:
        result = await client.get_sql_prompt(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mcp_router.post("/prompts/document", response_model=str)
async def get_document_analysis_prompt(
    request: DocumentProcessingRequest,
    client: AgentMCPClient = Depends(get_mcp_client),
    current_user = Depends(get_current_user)
):
    """Get a document analysis prompt."""
    try:
        result = await client.get_document_analysis_prompt(request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# In-memory storage for agent state
agent_state = {
    "sql_agent": None,
    "document_processor": None
} 