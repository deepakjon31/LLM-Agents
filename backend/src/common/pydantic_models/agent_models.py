from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class AgentType(str, Enum):
    SQL = "SQL_AGENT"
    DOCUMENT = "DOCUMENT_AGENT"


class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    SCATTER = "scatter"
    AREA = "area"
    RADAR = "radar"


class SQLAgentRequest(BaseModel):
    prompt: str
    database_id: int
    chat_history_id: Optional[int] = None
    include_sample_data: bool = False
    generate_visualizations: bool = True


class DocumentAgentRequest(BaseModel):
    prompt: str
    document_ids: List[int]
    chat_history_id: Optional[int] = None
    similarity_threshold: float = 0.7
    max_context_chunks: int = 5


class AgentPromptOptions(BaseModel):
    temperature: float = 0.1
    stream: bool = False
    model: str = "gpt-4"
    max_tokens: Optional[int] = None


class ChartData(BaseModel):
    chart_type: ChartType
    title: str
    labels: List[str]
    datasets: List[Dict[str, Any]]
    options: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    response_text: str
    chart_data: Optional[ChartData] = None
    sql_query: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    no_results: bool = False
    execution_time: float = 0.0


class DocumentMetadata(BaseModel):
    document_id: int
    filename: str
    file_type: str
    chunk_id: int
    page_number: Optional[int] = None
    section: Optional[str] = None
    confidence_score: float


class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
    status: str
    message: Optional[str] = None


class ChatHistoryCreate(BaseModel):
    agent_type: AgentType
    title: Optional[str] = None


class MessageCreate(BaseModel):
    role: str  # user or assistant
    content: str
    metadata: Optional[Dict[str, Any]] = None


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    id: int
    agent_type: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True


class DatabaseConnection(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    db_type: str
    host: str
    port: int
    username: str
    password: str
    database_name: str
    
    def get_connection_string(self) -> str:
        if self.db_type.lower() == "postgresql":
            return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database_name}"
        elif self.db_type.lower() == "mysql":
            return f"mysql+pymysql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database_name}"
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")


class DatabaseTableInfo(BaseModel):
    name: str
    description: Optional[str] = None
    columns: List[Dict[str, Any]]
    primary_key: List[str]
    foreign_keys: List[Dict[str, Any]]
    sample_data: Optional[List[Dict[str, Any]]] = None 