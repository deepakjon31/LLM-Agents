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
import logging
from src.common.utils import serialize_mongo_id
from bson.objectid import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        from src.common.db.connection import mongo_db
        
        document = {
            "user_id": current_user["user_id"],
            "filename": file.filename,
            "file_path": str(file_path),
            "file_type": file.content_type,
            "chunk_count": len(chunks),
            "created_at": datetime.utcnow()
        }
        
        # Insert document metadata - using synchronous approach
        result = mongo_db.documents.insert_one(document)
        document_id = result.inserted_id
        
        # Insert chunks with embeddings - synchronous approach
        for chunk in chunks:
            chunk["document_id"] = document_id
            mongo_db.document_chunks.insert_one(chunk)
        
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
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Use MongoDB collection directly - synchronous approach
        logger.info(f"Fetching documents for user: {current_user['user_id']}")
        documents = list(mongo_db.documents.find(
            {"user_id": current_user["user_id"]},
            {"_id": 1, "filename": 1, "file_type": 1, "chunk_count": 1, "created_at": 1}
        ))
        logger.info(f"Found {len(documents)} documents for user {current_user['user_id']}")
        
        # Use the utility function to serialize ObjectId
        return serialize_mongo_id(documents)
        
    except Exception as e:
        logger.error(f"Error in list_documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(JWTBearer())
):
    """Delete a document and its chunks."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Verify document ownership - using synchronous approach
        document = mongo_db.documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": current_user["user_id"]
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete document file
        try:
            os.remove(document["file_path"])
        except Exception as e:
            logger.warning(f"Error deleting file: {e}")
        
        # Delete document and its chunks - synchronous approach
        mongo_db.documents.delete_one({"_id": ObjectId(document_id)})
        mongo_db.document_chunks.delete_many({"document_id": ObjectId(document_id)})
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error in delete_document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

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
        
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Convert document_ids to list if it's a single string
        if isinstance(document_ids, str):
            document_ids = [document_ids]
        
        # Convert string IDs to ObjectId
        object_ids = [ObjectId(doc_id) for doc_id in document_ids]
            
        # Use synchronous approach for finding chunks
        chunks = list(mongo_db.document_chunks.find(
            {"document_id": {"$in": object_ids}}
        ))
        
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
            # Use synchronous approach to fetch document
            doc = mongo_db.documents.find_one({"_id": chunk["document_id"]})
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