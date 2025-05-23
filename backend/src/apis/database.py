from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from src.common.auth.jwt_bearer import JWTBearer
from src.agents.sql_agent import SQLAgent
from src.common.db.connection import get_db
from src.common.db.schema import Database, DatabaseTable, User
from src.common.dependencies import get_current_user, has_permission, has_role
from src.common.pydantic_models.database_models import (
    DatabaseCreate, DatabaseResponse, DatabaseTableResponse,
    DatabaseConnection, DatabaseConnectionCreate, DatabaseConnectionUpdate,
    DatabaseTableInfo, QueryResult
)
from src.common.utils import serialize_mongo_id
from bson import ObjectId
import os
from datetime import datetime
import logging
from sqlalchemy import create_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/database", tags=["Database"])

@router.get("/connections", response_model=List[DatabaseConnection])
async def get_user_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_active: Optional[bool] = Query(None)
):
    """Get database connections for the current user."""
    query = db.query(Database).filter(Database.user_id == current_user.id)
    
    if is_active is not None:
        query = query.filter(Database.is_active == is_active)
    
    connections = query.all()
    return connections

@router.post("/connections", response_model=DatabaseConnection)
async def create_connection(
    connection: DatabaseConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("manage_databases"))
):
    """Create a new database connection. Requires manage_databases permission."""
    # Check if admin or developer roles (the only ones allowed to create database connections)
    if current_user.role.name not in ["admin", "developer"]:
        raise HTTPException(
            status_code=403, 
            detail="Only admin and developer roles can create database connections"
        )
        
    db_connection = Database(
        user_id=current_user.id,
        name=connection.name,
        description=connection.description,
        db_type=connection.db_type,
        connection_string=connection.connection_string,
        is_active=connection.is_active
    )
    
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    
    return db_connection

@router.get("/connections/{connection_id}", response_model=DatabaseConnection)
async def get_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific database connection."""
    db_connection = db.query(Database).filter(Database.id == connection_id).first()
    
    if not db_connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Only allow access if the user owns the connection or has admin/developer role
    if db_connection.user_id != current_user.id and current_user.role.name not in ["admin", "developer"]:
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to access this connection"
        )
    
    return db_connection

@router.put("/connections/{connection_id}", response_model=DatabaseConnection)
async def update_connection(
    connection_id: int,
    connection_update: DatabaseConnectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a database connection."""
    db_connection = db.query(Database).filter(Database.id == connection_id).first()
    
    if not db_connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Only allow updates if the user owns the connection or has admin role
    if db_connection.user_id != current_user.id and current_user.role.name != "admin":
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to update this connection"
        )
    
    # Update fields
    for key, value in connection_update.dict(exclude_unset=True).items():
        setattr(db_connection, key, value)
    
    db_connection.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_connection)
    
    return db_connection

@router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a database connection."""
    db_connection = db.query(Database).filter(Database.id == connection_id).first()
    
    if not db_connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Only allow deletion if the user owns the connection or has admin role
    if db_connection.user_id != current_user.id and current_user.role.name != "admin":
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to delete this connection"
        )
    
    db.delete(db_connection)
    db.commit()
    
    return {"detail": "Database connection deleted successfully"}

@router.get("/connections/{connection_id}/tables", response_model=List[DatabaseTableInfo])
async def get_connection_tables(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tables for a specific database connection."""
    db_connection = db.query(Database).filter(Database.id == connection_id).first()
    
    if not db_connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Check permission
    if db_connection.user_id != current_user.id and current_user.role.name not in ["admin", "developer", "analyst"]:
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to view tables of this connection"
        )
    
    tables = db.query(DatabaseTable).filter(DatabaseTable.database_id == connection_id).all()
    return tables

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

@router.get("/connections/{connection_id}/test")
async def test_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test a database connection to verify it's working."""
    try:
        # Find the connection
        db_connection = db.query(Database).filter(Database.id == connection_id).first()
        
        if not db_connection:
            raise HTTPException(status_code=404, detail="Database connection not found")
        
        # Check permission
        if db_connection.user_id != current_user.id and current_user.role.name not in ["admin", "developer", "analyst"]:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to test this connection"
            )
        
        # Try to connect to the database to test the connection
        # Different handling based on database type
        if db_connection.db_type == "postgresql" or db_connection.db_type == "mysql":
            # For SQL databases
            engine = None
            try:
                # Create a temporary engine
                engine = create_engine(db_connection.connection_string)
                
                # Try to connect
                with engine.connect() as conn:
                    # Just running a simple query to verify connection
                    result = conn.execute(text("SELECT 1")).first()
                    
                return {"success": True, "message": "Connection successful"}
            except Exception as e:
                logger.error(f"Error testing connection: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to database: {str(e)}"
                )
            finally:
                if engine:
                    engine.dispose()
        
        elif db_connection.db_type == "mongodb":
            # For MongoDB connections
            try:
                # Create a temporary client
                from pymongo import MongoClient
                client = MongoClient(db_connection.connection_string, serverSelectionTimeoutMS=5000)
                
                # Force a connection to verify
                client.admin.command('ping')
                
                return {"success": True, "message": "Connection successful"}
            except Exception as e:
                logger.error(f"Error testing MongoDB connection: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to MongoDB: {str(e)}"
                )
            finally:
                if 'client' in locals():
                    client.close()
        
        else:
            # Unsupported database type
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported database type: {db_connection.db_type}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in test_connection: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 