from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from src.common.db.connection import get_db, get_mongo_collection
from src.common.db.schema import Document, User
from src.common.pydantic_models.document_models import DocumentResponse
from src.apis.auth import get_current_user
from src.agents.document_processor import DocumentProcessor
import os
from datetime import datetime
import shutil
import uuid
from pathlib import Path
from src.common.auth.jwt_bearer import JWTBearer

router = APIRouter(prefix="/documents", tags=["Documents"])

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

@router.post("/query")
async def query_documents(
    request: dict,
    current_user: dict = Depends(JWTBearer())
):
    """Query documents using semantic search with embeddings."""
    try:
        # Validate request
        if "prompt" not in request or not request["prompt"].strip():
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        if "document_ids" not in request or not request["document_ids"]:
            raise HTTPException(status_code=400, detail="At least one document ID is required")
            
        prompt = request["prompt"]
        document_ids = request["document_ids"]
        
        # Generate embedding for the query
        processor = DocumentProcessor(os.getenv("OPENAI_API_KEY"))
        query_embedding = processor._get_embedding(prompt)
        
        # Fetch document chunks for the specified documents
        db = get_db()
        
        # Convert document_ids to list if it's a single string
        if isinstance(document_ids, str):
            document_ids = [document_ids]
            
        chunks = await db.document_chunks.find(
            {"document_id": {"$in": document_ids}}
        ).to_list(length=None)
        
        if not chunks:
            return {
                "response": "No document chunks found for the specified documents.",
                "sources": []
            }
        
        # Calculate similarity between query and each chunk
        results = []
        for chunk in chunks:
            # Calculate cosine similarity
            chunk_embedding = chunk["embedding"]
            similarity = _calculate_similarity(query_embedding, chunk_embedding)
            
            results.append({
                "chunk": chunk,
                "similarity": similarity
            })
        
        # Sort by similarity (highest first)
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Take top 5 most relevant chunks
        top_chunks = results[:5]
        
        # Build context from top chunks
        context = "\n\n".join([chunk["chunk"]["text"] for chunk in top_chunks])
        
        # Generate response using OpenAI
        messages = [
            {"role": "system", "content": f"You are a helpful assistant answering questions based on the following document context:\n\n{context}"},
            {"role": "user", "content": prompt}
        ]
        
        completion = processor.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.0,
            max_tokens=1000
        )
        
        response = completion.choices[0].message.content
        
        # Build sources information
        sources = []
        for result in top_chunks:
            chunk = result["chunk"]
            doc = await db.documents.find_one({"_id": chunk["document_id"]})
            if doc:
                sources.append({
                    "filename": doc["filename"],
                    "chunk_text": chunk["text"][:100] + "..." if len(chunk["text"]) > 100 else chunk["text"]
                })
        
        return {
            "response": response,
            "sources": sources
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def _calculate_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    
    if magnitude1 * magnitude2 == 0:
        return 0
        
    return dot_product / (magnitude1 * magnitude2) 