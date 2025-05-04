from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str = Field(..., description="The document ID")
    filename: str = Field(..., description="The original filename")
    file_type: str = Field(..., description="The MIME type of the file")
    chunk_count: int = Field(..., description="Number of chunks the document was split into")
    created_at: datetime = Field(..., description="The time the document was uploaded")
    
    class Config:
        from_attributes = True

class DocumentChunk(BaseModel):
    id: str = Field(..., description="Chunk ID")
    document_id: str = Field(..., description="The parent document ID")
    text: str = Field(..., description="The text content of the chunk")
    embedding: List[float] = Field(..., description="Vector embedding of the chunk")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    class Config:
        from_attributes = True

class DocumentQuery(BaseModel):
    prompt: str = Field(..., description="The query prompt")
    document_ids: List[str] = Field(..., description="List of document IDs to search within")

class DocumentQueryResponse(BaseModel):
    response: str = Field(..., description="The AI generated response")
    sources: List[Dict[str, Any]] = Field(..., description="Sources used to generate the response") 