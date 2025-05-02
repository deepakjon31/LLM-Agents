from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from ..common.auth.jwt_bearer import JWTBearer
from ..agents.sql_agent import SQLAgent
from ..common.db.connection import get_db
import os
from datetime import datetime

router = APIRouter(prefix="/database", tags=["database"])

@router.post("/connect")
async def connect_database(
    connection_info: Dict[str, Any] = Body(...),
    current_user: dict = Depends(JWTBearer())
):
    """Connect to a database and store connection info."""
    try:
        # Store connection info
        db = get_db()
        connection = {
            "user_id": current_user["user_id"],
            "name": connection_info["name"],
            "connection_string": connection_info["connection_string"],
            "created_at": datetime.utcnow()
        }
        
        result = await db.database_connections.insert_one(connection)
        
        return {
            "connection_id": str(result.inserted_id),
            "name": connection_info["name"],
            "status": "connected"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables")
async def get_tables(
    connection_id: str,
    current_user: dict = Depends(JWTBearer())
):
    """Get list of tables in the database."""
    db = get_db()
    
    # Get connection info
    connection = await db.database_connections.find_one({
        "_id": connection_id,
        "user_id": current_user["user_id"]
    })
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    try:
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
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table/{table_name}/schema")
async def get_table_schema(
    connection_id: str,
    table_name: str,
    current_user: dict = Depends(JWTBearer())
):
    """Get schema information for a table."""
    db = get_db()
    
    # Get connection info
    connection = await db.database_connections.find_one({
        "_id": connection_id,
        "user_id": current_user["user_id"]
    })
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    try:
        # Connect to database
        agent = SQLAgent(os.getenv("OPENAI_API_KEY"))
        agent.connect_to_database(connection["connection_string"])
        
        # Get schema
        schema = agent.get_table_schema(table_name)
        return schema
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def execute_query(
    connection_id: str,
    query_info: Dict[str, Any] = Body(...),
    current_user: dict = Depends(JWTBearer())
):
    """Execute a natural language query on the database."""
    db = get_db()
    
    # Get connection info
    connection = await db.database_connections.find_one({
        "_id": connection_id,
        "user_id": current_user["user_id"]
    })
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    try:
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
        
        # Store query history
        await db.query_history.insert_one({
            "user_id": current_user["user_id"],
            "connection_id": connection_id,
            "question": query_info["question"],
            "sql_query": sql_query,
            "result": result,
            "created_at": datetime.utcnow()
        })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 