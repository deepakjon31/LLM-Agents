from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DatabaseCreate(BaseModel):
    name: str = Field(..., description="Database connection name")
    description: Optional[str] = Field(None, description="Description of the database")
    db_type: str = Field(..., description="Database type (postgresql, mysql, etc.)")
    connection_string: str = Field(..., description="Connection string for the database")
    
class DatabaseResponse(BaseModel):
    id: int = Field(..., description="Database ID")
    name: str = Field(..., description="Database connection name")
    description: Optional[str] = Field(None, description="Description of the database")
    db_type: str = Field(..., description="Database type (postgresql, mysql, etc.)")
    is_active: bool = Field(..., description="Whether the database connection is active")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        
class DatabaseTableResponse(BaseModel):
    id: int = Field(..., description="Table ID")
    name: str = Field(..., description="Table name")
    description: Optional[str] = Field(None, description="Description of the table")
    schema: Dict[str, Any] = Field(..., description="JSON Schema of the table")
    sample_data: Optional[Dict[str, Any]] = Field(None, description="Sample data from the table")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True
        
class DatabaseQuery(BaseModel):
    question: str = Field(..., description="Natural language query to execute")
    tables: List[str] = Field(..., description="List of tables to consider in the query")
    
class DatabaseQueryResult(BaseModel):
    sql: str = Field(..., description="Generated SQL query")
    data: List[Dict[str, Any]] = Field(..., description="Result data")
    column_names: List[str] = Field(..., description="Column names in result")
    execution_time: float = Field(..., description="Query execution time in seconds")

# Adding the missing models required by database.py

class DatabaseConnection(BaseModel):
    id: int = Field(..., description="Database connection ID")
    user_id: int = Field(..., description="User ID who owns this connection")
    name: str = Field(..., description="Database connection name")
    description: Optional[str] = Field(None, description="Description of the database")
    db_type: str = Field(..., description="Database type (postgresql, mysql, etc.)")
    connection_string: str = Field(..., description="Connection string for the database")
    is_active: bool = Field(..., description="Whether the database connection is active")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        
class DatabaseConnectionCreate(BaseModel):
    name: str = Field(..., description="Database connection name")
    description: Optional[str] = Field(None, description="Description of the database")
    db_type: str = Field(..., description="Database type (postgresql, mysql, etc.)")
    connection_string: str = Field(..., description="Connection string for the database")
    is_active: bool = Field(True, description="Whether the database connection is active")
    
class DatabaseConnectionUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Database connection name")
    description: Optional[str] = Field(None, description="Description of the database")
    db_type: Optional[str] = Field(None, description="Database type (postgresql, mysql, etc.)")
    connection_string: Optional[str] = Field(None, description="Connection string for the database")
    is_active: Optional[bool] = Field(None, description="Whether the database connection is active")
    
class DatabaseTableInfo(BaseModel):
    id: int = Field(..., description="Table ID")
    database_id: int = Field(..., description="Database ID this table belongs to")
    name: str = Field(..., description="Table name")
    description: Optional[str] = Field(None, description="Description of the table")
    schema: Dict[str, Any] = Field(..., description="JSON Schema of the table")
    sample_data: Optional[Dict[str, Any]] = Field(None, description="Sample data from the table")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True
        
class QueryResult(BaseModel):
    sql: str = Field(..., description="Executed SQL query")
    data: List[Dict[str, Any]] = Field(..., description="Result data")
    column_names: List[str] = Field(..., description="Column names in result")
    execution_time: float = Field(..., description="Query execution time in seconds") 