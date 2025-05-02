from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import uuid
import shutil
from datetime import datetime

from ..common.db.connection import get_db, get_mongo_collection
from ..common.db.schema import User, Document
from ..common.pydantic_models.agent_models import DocumentUploadResponse, ChatHistoryItem
from .auth import get_current_user
from ..agents.document_processor import process_document

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = ['.pdf', '.docx', '.txt', '.csv', '.xlsx']
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create a unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create document record
    db_document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_ext[1:],  # Remove the dot
        embedding_status=False
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Process document in background
    background_tasks.add_task(
        process_document,
        document_id=db_document.id,
        file_path=file_path,
        file_type=file_ext[1:]
    )
    
    return DocumentUploadResponse(
        document_id=db_document.id,
        filename=file.filename,
        status="processing",
        message="Document upload successful. Processing started."
    )


@router.get("/", response_model=List[Dict[str, Any]])
async def get_user_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "embedding_status": doc.embedding_status,
            "created_at": doc.created_at
        }
        for doc in documents
    ]


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete document record
    db.delete(document)
    db.commit()
    
    # Delete vectors from MongoDB
    vector_collection = get_mongo_collection("vector_store")
    vector_collection.delete_many({"document_id": document_id})
    
    return {"message": "Document deleted successfully"} 