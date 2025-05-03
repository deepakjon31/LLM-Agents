from fastapi import FastAPI, Body, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import os
import shutil
from pathlib import Path
import uuid
import time
import asyncio
import numpy as np
from enum import Enum
from openai import OpenAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Document processing status enum
class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# In-memory storage for testing
documents = []
document_chunks = []
chat_history = []

# Mock embedding generation function
def generate_mock_embedding(text: str, dimensions: int = 384) -> List[float]:
    """Generate a mock embedding vector for demonstration purposes."""
    # This generates a random vector - in a real app, this would use OpenAI's embedding API
    np.random.seed(hash(text) % 2**32)
    return list(np.random.normal(0, 1, dimensions).astype(float))

# Background task for document processing
async def process_document_task(document_id: str, file_path: str, content_type: str):
    """Process document in background, update status, and generate chunks with embeddings."""
    try:
        # Update status to processing
        doc = next((d for d in documents if d["id"] == document_id), None)
        if not doc:
            print(f"Document {document_id} not found")
            return
        
        doc["status"] = ProcessingStatus.PROCESSING
        
        # Simulate document processing time
        await asyncio.sleep(2)
        
        # Read file content (simplified for test)
        text_content = ""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
        except:
            # If file can't be read as text, use mock content
            text_content = f"This is mock content for {Path(file_path).name} of type {content_type}"
        
        # Create chunks (simplified)
        chunk_size = 1000
        chunks = []
        
        if len(text_content) > chunk_size:
            # Simple chunking by character count - real implementation would be more sophisticated
            for i in range(0, len(text_content), chunk_size):
                chunk_text = text_content[i:i+chunk_size]
                chunks.append(chunk_text)
        else:
            chunks = [text_content]
        
        # Generate embeddings and store chunks
        for i, chunk_text in enumerate(chunks):
            embedding = generate_mock_embedding(chunk_text)
            
            chunk = {
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "chunk_index": i,
                "text": chunk_text[:100] + "..." if len(chunk_text) > 100 else chunk_text,  # Truncate for display
                "embedding": embedding[:5] + ["..."] if embedding else [],  # Truncate embedding for display
                "created_at": datetime.now().isoformat()
            }
            
            document_chunks.append(chunk)
        
        # Update document status and metadata
        doc["status"] = ProcessingStatus.COMPLETED
        doc["chunk_count"] = len(chunks)
        doc["vectorized"] = True
        doc["completed_at"] = datetime.now().isoformat()
        
    except Exception as e:
        # Update status to failed
        if doc:
            doc["status"] = ProcessingStatus.FAILED
            doc["error_message"] = str(e)
        
        print(f"Error processing document {document_id}: {e}")

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/auth/login")
async def login(credentials: Dict[str, Any] = Body(...)):
    # Extract username and password if provided
    username = credentials.get("username", "")
    password = credentials.get("password", "")
    
    print(f"Login attempt with username: {username}")
    
    # In a real app, you would validate credentials
    # For testing, we always return a successful login
    return {"access_token": "test_token", "token_type": "bearer"}

@app.post("/auth/signup")
async def signup(credentials: Dict[str, Any] = Body(...)):
    # Extract mobile_number and password if provided
    mobile_number = credentials.get("mobile_number", "1234567890")
    password = credentials.get("password", "")
    email = credentials.get("email", "")
    
    print(f"Signup attempt with mobile: {mobile_number}, email: {email}")
    
    # In a real app, you would create a new user
    # For testing, we always return a successful signup
    return {
        "id": 1, 
        "mobile_number": mobile_number,
        "email": email,
        "created_at": datetime.now().isoformat()
    }

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Generate a unique filename
        user_id = "test_user"
        timestamp = datetime.now().timestamp()
        file_path = UPLOAD_DIR / f"{user_id}_{timestamp}_{file.filename}"
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create document entry with initial pending status
        document_id = str(uuid.uuid4())
        document = {
            "id": document_id,
            "filename": file.filename,
            "file_path": str(file_path),
            "file_type": file.content_type or "application/octet-stream",
            "file_size": file_size,
            "chunk_count": 0,
            "status": ProcessingStatus.PENDING,
            "vectorized": False,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add to our in-memory list for testing
        documents.append(document)
        
        # Start background processing task
        asyncio.create_task(process_document_task(document_id, str(file_path), file.content_type))
        
        return {
            "document_id": document_id,
            "filename": file.filename,
            "status": ProcessingStatus.PENDING,
            "message": "Document uploaded and queued for processing"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/list")
async def list_documents():
    """List all documents with their processing status."""
    return documents

@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document by ID."""
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@app.get("/documents/{document_id}/chunks")
async def get_document_chunks(document_id: str):
    """Get all chunks for a specific document."""
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    chunks = [chunk for chunk in document_chunks if chunk["document_id"] == document_id]
    
    return chunks

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    # Find the document in our in-memory list
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the file if it exists
    try:
        file_path = Path(document["file_path"])
        if file_path.exists():
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Remove document from our in-memory list
    documents.remove(document)
    
    # Remove associated chunks
    global document_chunks
    document_chunks = [chunk for chunk in document_chunks if chunk["document_id"] != document_id]
    
    return {"status": "success"}

# Chat history endpoints
@app.post("/agents/history")
async def save_chat_history(history_item: Dict[str, Any] = Body(...)):
    """Save a chat history item."""
    history_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    # Create history entry
    history_entry = {
        "id": history_id,
        "agentType": history_item.get("agentType"),
        "prompt": history_item.get("prompt"),
        "response": history_item.get("response"),
        "timestamp": timestamp,
        "hasChart": history_item.get("hasChart", False)
    }
    
    # Add to our in-memory list
    chat_history.append(history_entry)
    
    return {
        "id": history_id,
        "status": "success",
        "timestamp": timestamp
    }

@app.get("/agents/history")
async def get_chat_history():
    """Get all chat history items."""
    # Sort by timestamp in descending order (newest first)
    sorted_history = sorted(
        chat_history, 
        key=lambda x: x.get("timestamp", ""), 
        reverse=True
    )
    return sorted_history

@app.delete("/agents/history/{history_id}")
async def delete_chat_history(history_id: str):
    """Delete a chat history item."""
    # Find the history item
    history_item = next((item for item in chat_history if item["id"] == history_id), None)
    
    if not history_item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    # Remove from our in-memory list
    chat_history.remove(history_item)
    
    return {"status": "success"}

@app.post("/documents/query")
async def query_documents(request: Dict[str, Any] = Body(...)):
    """Query documents using embeddings."""
    try:
        # Validate request
        if "prompt" not in request or not request["prompt"].strip():
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        if "document_ids" not in request or not request["document_ids"]:
            raise HTTPException(status_code=400, detail="At least one document ID is required")
            
        prompt = request["prompt"]
        document_ids = request["document_ids"]
        
        # Convert document_ids to list if it's a single string
        if isinstance(document_ids, str):
            document_ids = [document_ids]
        
        # Get chunks for the specified documents
        relevant_chunks = [chunk for chunk in document_chunks if chunk["document_id"] in document_ids]
        
        if not relevant_chunks:
            return {
                "response": "No document chunks found for the specified documents.",
                "sources": []
            }
        
        # In a real implementation, we would:
        # 1. Generate embeddings for the query
        # 2. Compare with chunk embeddings to find most relevant chunks
        # 3. Use those chunks as context for an LLM
        
        # For this test implementation, we'll just use all chunks as context
        context = "\n\n".join([chunk["text"] for chunk in relevant_chunks])
        
        # Use the OpenAI API with the configured key
        try:
            client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            
            # Generate response using OpenAI
            messages = [
                {"role": "system", "content": f"You are a helpful assistant answering questions based on the provided document context. Only use information from the context to answer. If the answer is not in the context, say you don't know:\n\n{context}"},
                {"role": "user", "content": prompt}
            ]
            
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.0,
                max_tokens=1000
            )
            
            response_text = completion.choices[0].message.content
        except Exception as e:
            # If OpenAI fails (e.g., no API key), provide a fallback response
            print(f"Error using OpenAI: {e}")
            response_text = f"Based on the documents, I found the following information related to your query: '{prompt}'\n\n" + context[:500] + "..."
        
        # Build sources information for display
        sources = []
        for chunk in relevant_chunks[:5]:  # Limit to top 5 chunks
            document = next((doc for doc in documents if doc["id"] == chunk["document_id"]), None)
            if document:
                sources.append({
                    "filename": document["filename"],
                    "chunk_text": chunk["text"][:100] + "..." if len(chunk["text"]) > 100 else chunk["text"]
                })
        
        return {
            "response": response_text,
            "sources": sources
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 