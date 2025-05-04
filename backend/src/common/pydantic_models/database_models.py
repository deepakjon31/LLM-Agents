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