from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from ..common.auth.jwt_bearer import JWTBearer
from ..agents.document_processor import DocumentProcessor
from ..common.db.connection import get_db
import os
from datetime import datetime
import shutil
from pathlib import Path

router = APIRouter(prefix="/documents", tags=["documents"])

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(JWTBearer())
):
    """Upload and process a document."""
    try:
        # Save file
        file_path = UPLOAD_DIR / f"{current_user['user_id']}_{datetime.now().timestamp()}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document
        processor = DocumentProcessor(os.getenv("OPENAI_API_KEY"))
        chunks = processor.process_document(str(file_path))
        
        # Store in database
        db = get_db()
        document = {
            "user_id": current_user["user_id"],
            "filename": file.filename,
            "file_path": str(file_path),
            "file_type": file.content_type,
            "chunk_count": len(chunks),
            "created_at": datetime.utcnow()
        }
        
        # Insert document metadata
        result = await db.documents.insert_one(document)
        document_id = result.inserted_id
        
        # Insert chunks with embeddings
        for chunk in chunks:
            chunk["document_id"] = document_id
            await db.document_chunks.insert_one(chunk)
        
        return {
            "document_id": str(document_id),
            "filename": file.filename,
            "chunk_count": len(chunks),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents(
    current_user: dict = Depends(JWTBearer())
):
    """List all documents for the current user."""
    db = get_db()
    documents = await db.documents.find(
        {"user_id": current_user["user_id"]},
        {"_id": 1, "filename": 1, "file_type": 1, "chunk_count": 1, "created_at": 1}
    ).to_list(length=None)
    
    return [{
        "id": str(doc["_id"]),
        "filename": doc["filename"],
        "file_type": doc["file_type"],
        "chunk_count": doc["chunk_count"],
        "created_at": doc["created_at"]
    } for doc in documents]

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(JWTBearer())
):
    """Delete a document and its chunks."""
    db = get_db()
    
    # Verify document ownership
    document = await db.documents.find_one({
        "_id": document_id,
        "user_id": current_user["user_id"]
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete document file
    try:
        os.remove(document["file_path"])
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete document and its chunks
    await db.documents.delete_one({"_id": document_id})
    await db.document_chunks.delete_many({"document_id": document_id})
    
    return {"status": "success"} 