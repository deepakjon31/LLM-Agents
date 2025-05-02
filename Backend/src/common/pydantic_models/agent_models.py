from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


class SQLAgentRequest(BaseModel):
    prompt: str
    database_id: Optional[int] = None
    database_type: Optional[str] = None  # "mysql", "postgresql", etc.


class DocumentAgentRequest(BaseModel):
    prompt: str
    document_ids: Optional[List[int]] = None


class AgentResponse(BaseModel):
    response_text: str
    chart_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    no_results: bool = False


class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
    status: str
    message: Optional[str] = None


class ChatHistoryItem(BaseModel):
    id: int
    agent_type: str
    prompt: str
    response: str
    created_at: datetime
    
    class Config:
        orm_mode = True


class ConnectedDatabase(BaseModel):
    id: int
    name: str
    type: str  # SQL or NoSQL
    connection_details: Dict[str, Any] 