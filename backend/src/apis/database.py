from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from src.common.auth.jwt_bearer import JWTBearer
from src.agents.sql_agent import SQLAgent
from src.common.db.connection import get_db
from src.common.db.schema import Database, DatabaseTable
from src.common.pydantic_models.database_models import DatabaseCreate, DatabaseResponse, DatabaseTableResponse
from src.apis.auth import get_current_user
from src.common.utils import serialize_mongo_id
from bson import ObjectId
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/database", tags=["Database"])

@router.get("/connections")
async def list_connections(
    current_user: dict = Depends(JWTBearer())
):
    """List all database connections for the current user."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Get connections for the current user - using synchronous approach
        user_id = current_user["user_id"]
        logger.info(f"Fetching database connections for user: {user_id}")
        
        # Use a synchronous find approach
        connections = list(mongo_db.database_connections.find({"user_id": user_id}))
        logger.info(f"Found {len(connections)} connections")
        
        # Convert ObjectId to strings
        result = serialize_mongo_id(connections)
        return result
    except Exception as e:
        logger.error(f"Error in list_connections: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch database connections: {str(e)}")

@router.get("/history")
async def query_history(
    current_user: dict = Depends(JWTBearer())
):
    """Get the query history for the current user."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Get query history for the current user - using synchronous approach
        history = list(mongo_db.query_history.find(
            {"user_id": current_user["user_id"]}
        ).sort("created_at", -1).limit(50))  # Get last 50 queries
        
        return [{
            "id": str(entry["_id"]),
            "connection_id": str(entry["connection_id"]) if "connection_id" in entry else None,
            "question": entry["question"],
            "sql_query": entry.get("sql_query", ""),
            "created_at": entry["created_at"]
        } for entry in history]
    except Exception as e:
        logger.error(f"Error in query_history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch query history: {str(e)}")

@router.post("/connect")
async def connect_database(
    connection_info: Dict[str, Any] = Body(...),
    current_user: dict = Depends(JWTBearer())
):
    """Connect to a database and store connection info."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Store connection info
        connection = {
            "user_id": current_user["user_id"],
            "name": connection_info["name"],
            "connection_string": connection_info["connection_string"],
            "created_at": datetime.utcnow()
        }
        
        logger.info(f"Storing connection for user: {current_user['user_id']}, name: {connection_info['name']}")
        # Use synchronous insert_one
        result = mongo_db.database_connections.insert_one(connection)
        connection_id = str(result.inserted_id)
        logger.info(f"Connection stored with id: {connection_id}")
        
        return {
            "id": connection_id,
            "connection_id": connection_id,
            "name": connection_info["name"],
            "status": "connected"
        }
    except Exception as e:
        logger.error(f"Error in connect_database: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables")
async def get_tables(
    connection_id: str,
    current_user: dict = Depends(JWTBearer())
):
    """Get list of tables in the database."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Get connection info - synchronous approach
        connection = mongo_db.database_connections.find_one({
            "_id": ObjectId(connection_id),
            "user_id": current_user["user_id"]
        })
        
        if not connection:
            raise HTTPException(status_code=404, detail="Database connection not found")
        
        # Connect to database
        agent = SQLAgent(os.getenv("OPENAI_API_KEY"))
        agent.connect_to_database(connection["connection_string"])
        
        # Get tables
        with agent.engine.connect() as conn:
            tables = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)).fetchall()
        
        return [{"name": table[0]} for table in tables]
    except Exception as e:
        logger.error(f"Error in get_tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table/{table_name}/schema")
async def get_table_schema(
    connection_id: str,
    table_name: str,
    current_user: dict = Depends(JWTBearer())
):
    """Get schema information for a table."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Get connection info - synchronous approach
        connection = mongo_db.database_connections.find_one({
            "_id": ObjectId(connection_id),
            "user_id": current_user["user_id"]
        })
        
        if not connection:
            raise HTTPException(status_code=404, detail="Database connection not found")
        
        # Connect to database
        agent = SQLAgent(os.getenv("OPENAI_API_KEY"))
        agent.connect_to_database(connection["connection_string"])
        
        # Get schema
        schema = agent.get_table_schema(table_name)
        return schema
    except Exception as e:
        logger.error(f"Error in get_table_schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def execute_query(
    connection_id: str,
    query_info: Dict[str, Any] = Body(...),
    current_user: dict = Depends(JWTBearer())
):
    """Execute a natural language query on the database."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Get connection info - synchronous approach
        connection = mongo_db.database_connections.find_one({
            "_id": ObjectId(connection_id),
            "user_id": current_user["user_id"]
        })
        
        if not connection:
            raise HTTPException(status_code=404, detail="Database connection not found")
        
        # Connect to database
        agent = SQLAgent(os.getenv("OPENAI_API_KEY"))
        agent.connect_to_database(connection["connection_string"])
        
        # Get table schemas
        table_schemas = []
        for table_name in query_info.get("tables", []):
            schema = agent.get_table_schema(table_name)
            table_schemas.append(schema)
        
        # Generate and execute query
        sql_query = agent.generate_sql_query(query_info["question"], table_schemas)
        result = agent.execute_query(sql_query)
        
        # Store query history - synchronous approach
        mongo_db.query_history.insert_one({
            "user_id": current_user["user_id"],
            "connection_id": ObjectId(connection_id),
            "question": query_info["question"],
            "sql_query": sql_query,
            "result": result,
            "created_at": datetime.utcnow()
        })
        
        return result
    except Exception as e:
        logger.error(f"Error in execute_query: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 