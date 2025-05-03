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
database_connections = []  # New in-memory storage for database connections

# Database types supported
SUPPORTED_DB_TYPES = ["postgresql", "mysql", "sqlite", "mongodb", "oracle", "sqlserver"]

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

# Database connection endpoints
@app.post("/database/connections")
async def create_database_connection(connection_info: Dict[str, Any] = Body(...)):
    """Create a new database connection."""
    try:
        # Validate connection info
        required_fields = ["name", "type", "host", "port", "username", "password", "database"]
        for field in required_fields:
            if field not in connection_info:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Validate database type
        if connection_info["type"] not in SUPPORTED_DB_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported database type. Supported types: {', '.join(SUPPORTED_DB_TYPES)}"
            )
        
        # Create connection entry
        connection_id = str(uuid.uuid4())
        connection = {
            "id": connection_id,
            "name": connection_info["name"],
            "type": connection_info["type"],
            "host": connection_info["host"],
            "port": connection_info["port"],
            "username": connection_info["username"],
            "password": connection_info["password"],  # In a real app, this should be encrypted
            "database": connection_info["database"],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add to in-memory storage
        database_connections.append(connection)
        
        # Return the connection info (excluding password)
        connection_response = connection.copy()
        connection_response.pop("password")
        
        return connection_response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/connections")
async def list_database_connections():
    """List all database connections."""
    # Return connections without passwords
    return [
        {k: v for k, v in connection.items() if k != "password"}
        for connection in database_connections
    ]

@app.get("/database/connections/{connection_id}")
async def get_database_connection(connection_id: str):
    """Get a specific database connection by ID."""
    connection = next((conn for conn in database_connections if conn["id"] == connection_id), None)
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Return connection without password
    connection_response = connection.copy()
    connection_response.pop("password")
    
    return connection_response

@app.post("/database/connections/{connection_id}/test")
async def test_database_connection(connection_id: str):
    """Test a database connection."""
    connection = next((conn for conn in database_connections if conn["id"] == connection_id), None)
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    try:
        # In a real implementation, we would actually test the connection
        # Here we'll just simulate a successful connection
        
        # Generate connection string based on database type
        connection_string = ""
        if connection["type"] == "postgresql":
            connection_string = f"postgresql://{connection['username']}:{connection['password']}@{connection['host']}:{connection['port']}/{connection['database']}"
        elif connection["type"] == "mysql":
            connection_string = f"mysql+pymysql://{connection['username']}:{connection['password']}@{connection['host']}:{connection['port']}/{connection['database']}"
        elif connection["type"] == "sqlite":
            connection_string = f"sqlite:///{connection['database']}"
        # Add other database types as needed
        
        # Simulate connection test
        # In a real app, you would use something like:
        # engine = create_engine(connection_string)
        # with engine.connect() as conn:
        #     conn.execute(text("SELECT 1"))
        
        return {
            "status": "success",
            "message": f"Successfully connected to {connection['name']} ({connection['type']}) database"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

@app.delete("/database/connections/{connection_id}")
async def delete_database_connection(connection_id: str):
    """Delete a database connection."""
    connection = next((conn for conn in database_connections if conn["id"] == connection_id), None)
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Remove from in-memory storage
    database_connections.remove(connection)
    
    return {"status": "success", "message": "Database connection deleted"}

@app.get("/database/connections/{connection_id}/tables")
async def get_database_tables(connection_id: str):
    """Get tables from the connected database."""
    connection = next((conn for conn in database_connections if conn["id"] == connection_id), None)
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    try:
        # In a real implementation, we would connect to the DB and get actual tables
        # Here we'll just return mock tables based on the database type
        
        if connection["type"] == "postgresql":
            tables = ["users", "products", "orders", "categories", "inventory"]
        elif connection["type"] == "mysql":
            tables = ["customers", "products", "orders", "inventory", "payments"]
        elif connection["type"] == "mongodb":
            tables = ["users", "products", "orders", "analytics", "logs"]
        else:
            tables = ["table1", "table2", "table3"]  # Generic tables for other DB types
        
        return [{"name": table_name, "schema": connection["database"]} for table_name in tables]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tables: {str(e)}")

@app.post("/database/connections/{connection_id}/query")
async def run_database_query(connection_id: str, query_info: Dict[str, Any] = Body(...)):
    """Run a SQL query on the database."""
    connection = next((conn for conn in database_connections if conn["id"] == connection_id), None)
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Validate query info
    if "query" not in query_info:
        raise HTTPException(status_code=400, detail="Missing required field: query")
    
    try:
        # In a real implementation, we would execute the query on the database
        # Here we'll just return mock results
        
        # Mock data for different queries (in a real app, this would be actual DB data)
        if "SELECT" in query_info["query"].upper() and "USER" in query_info["query"].upper():
            return {
                "columns": ["id", "username", "email", "created_at"],
                "rows": [
                    [1, "user1", "user1@example.com", "2023-01-01T00:00:00"],
                    [2, "user2", "user2@example.com", "2023-01-02T00:00:00"],
                    [3, "user3", "user3@example.com", "2023-01-03T00:00:00"]
                ]
            }
        elif "SELECT" in query_info["query"].upper() and "PRODUCT" in query_info["query"].upper():
            return {
                "columns": ["id", "name", "price", "stock"],
                "rows": [
                    [1, "Product 1", 99.99, 100],
                    [2, "Product 2", 149.99, 50],
                    [3, "Product 3", 199.99, 25]
                ]
            }
        else:
            # Generic response for other queries
            return {
                "columns": ["column1", "column2", "column3"],
                "rows": [
                    [1, "value1", "data1"],
                    [2, "value2", "data2"],
                    [3, "value3", "data3"]
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute query: {str(e)}")

@app.post("/database/connections/{connection_id}/ai-query")
async def ai_database_query(connection_id: str, query_info: Dict[str, Any] = Body(...)):
    """Execute a natural language query on the database using AI."""
    connection = next((conn for conn in database_connections if conn["id"] == connection_id), None)
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Validate query info
    if "prompt" not in query_info:
        raise HTTPException(status_code=400, detail="Missing required field: prompt")
    
    try:
        # In a real implementation, we would:
        # 1. Use LLM to convert natural language to SQL
        # 2. Execute the SQL on the database
        # 3. Return the results
        
        # Here we'll simulate this process with mock responses
        
        prompt = query_info["prompt"].lower()
        
        # Use OpenAI to generate SQL (simulated)
        sql_query = ""
        if "users" in prompt or "customers" in prompt:
            sql_query = "SELECT * FROM users LIMIT 5"
        elif "products" in prompt or "items" in prompt:
            sql_query = "SELECT * FROM products LIMIT 5"
        elif "orders" in prompt or "sales" in prompt:
            sql_query = "SELECT * FROM orders LIMIT 5"
        else:
            sql_query = "SELECT * FROM table1 LIMIT 5"
        
        # Mock results based on the query
        if "users" in sql_query or "customers" in sql_query:
            results = {
                "columns": ["id", "username", "email", "created_at"],
                "rows": [
                    [1, "user1", "user1@example.com", "2023-01-01T00:00:00"],
                    [2, "user2", "user2@example.com", "2023-01-02T00:00:00"],
                    [3, "user3", "user3@example.com", "2023-01-03T00:00:00"]
                ]
            }
        elif "products" in sql_query:
            results = {
                "columns": ["id", "name", "price", "stock"],
                "rows": [
                    [1, "Product 1", 99.99, 100],
                    [2, "Product 2", 149.99, 50],
                    [3, "Product 3", 199.99, 25]
                ]
            }
        elif "orders" in sql_query:
            results = {
                "columns": ["id", "user_id", "total", "status", "date"],
                "rows": [
                    [1, 1, 99.99, "completed", "2023-01-05T00:00:00"],
                    [2, 2, 149.99, "processing", "2023-01-06T00:00:00"],
                    [3, 1, 199.99, "completed", "2023-01-07T00:00:00"]
                ]
            }
        else:
            results = {
                "columns": ["column1", "column2", "column3"],
                "rows": [
                    [1, "value1", "data1"],
                    [2, "value2", "data2"],
                    [3, "value3", "data3"]
                ]
            }
        
        return {
            "prompt": query_info["prompt"],
            "sql_query": sql_query,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process AI query: {str(e)}")

@app.post("/database/multi-query")
async def multi_database_query(query_info: Dict[str, Any] = Body(...)):
    """Execute a natural language query across multiple databases."""
    # Validate query info
    if "prompt" not in query_info:
        raise HTTPException(status_code=400, detail="Missing required field: prompt")
    
    if "connectionIds" not in query_info or not query_info["connectionIds"]:
        raise HTTPException(status_code=400, detail="Missing required field: connectionIds")
    
    try:
        connection_ids = query_info["connectionIds"]
        prompt = query_info["prompt"]
        
        # Validate all connections exist
        connections = []
        for conn_id in connection_ids:
            connection = next((conn for conn in database_connections if conn["id"] == conn_id), None)
            if not connection:
                raise HTTPException(status_code=404, detail=f"Database connection not found: {conn_id}")
            connections.append(connection)
        
        # In a real implementation, we would:
        # 1. Use LLM to convert natural language to appropriate SQL for each database type
        # 2. Execute the SQL on each database
        # 3. Combine and process the results
        # 4. Return the consolidated findings
        
        # Mock response structure for multi-database queries
        results = []
        
        for connection in connections:
            # Generate a mock SQL query based on prompt and DB type
            sql_query = ""
            if "users" in prompt.lower() or "customers" in prompt.lower():
                sql_query = f"SELECT * FROM users LIMIT 5 /* {connection['type']} */"
            elif "products" in prompt.lower() or "items" in prompt.lower():
                sql_query = f"SELECT * FROM products LIMIT 5 /* {connection['type']} */"
            elif "orders" in prompt.lower() or "sales" in prompt.lower():
                sql_query = f"SELECT * FROM orders LIMIT 5 /* {connection['type']} */"
            else:
                sql_query = f"SELECT * FROM table1 LIMIT 5 /* {connection['type']} */"
            
            # Mock different data based on database type
            data = None
            if connection["type"] == "postgresql":
                data = {
                    "columns": ["id", "name", "value", "created_at"],
                    "rows": [
                        [1, "PostgreSQL Item 1", 100.50, "2023-01-01T00:00:00"],
                        [2, "PostgreSQL Item 2", 200.75, "2023-01-02T00:00:00"]
                    ]
                }
            elif connection["type"] == "mysql":
                data = {
                    "columns": ["id", "name", "value", "created_at"],
                    "rows": [
                        [1, "MySQL Item 1", 150.25, "2023-01-01T00:00:00"],
                        [2, "MySQL Item 2", 250.50, "2023-01-02T00:00:00"]
                    ]
                }
            else:
                data = {
                    "columns": ["id", "name", "value", "created_at"],
                    "rows": [
                        [1, "Generic Item 1", 125.75, "2023-01-01T00:00:00"],
                        [2, "Generic Item 2", 225.25, "2023-01-02T00:00:00"]
                    ]
                }
            
            results.append({
                "connectionId": connection["id"],
                "connectionName": connection["name"],
                "databaseType": connection["type"],
                "sqlQuery": sql_query,
                "data": data
            })
        
        # Generate an AI summary of the cross-database results
        summary = f"Analysis across {len(connections)} databases: "
        
        if "total" in prompt.lower() or "sum" in prompt.lower() or "sales" in prompt.lower():
            summary += "Total sales across all databases amount to $1,052.25."
        elif "average" in prompt.lower() or "mean" in prompt.lower():
            summary += "The average value across all items is $175.38."
        elif "compare" in prompt.lower() or "comparison" in prompt.lower():
            summary += "PostgreSQL databases show 15% higher values compared to MySQL databases."
        else:
            summary += f"Found {sum(len(r['data']['rows']) for r in results)} relevant records across all databases."
        
        # In a real implementation, we might include visualizations here
        visualization = None
        if "chart" in prompt.lower() or "graph" in prompt.lower() or "plot" in prompt.lower() or "sales" in prompt.lower():
            visualization = {
                "type": "bar",
                "data": {
                    "labels": [conn["name"] for conn in connections],
                    "datasets": [{
                        "label": "Values",
                        "data": [301.25, 400.75, 351.00][:len(connections)]
                    }]
                }
            }
        
        return {
            "results": results,
            "summary": summary,
            "visualization": visualization
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute multi-database query: {str(e)}") 