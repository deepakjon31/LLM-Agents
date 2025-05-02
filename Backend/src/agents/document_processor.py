import os
import json
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from typing import Dict, Any, List

from ..common.db.connection import get_mongo_collection, SessionLocal
from ..common.db.schema import Document

# Import document processing libraries
import fitz  # PyMuPDF
import docx
import pandas as pd
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Initialize OpenAI embeddings
api_key = os.getenv("OPENAI_API_KEY")
embeddings = OpenAIEmbeddings(openai_api_key=api_key)


def extract_text(file_path: str, file_type: str) -> str:
    """Extract text from different document types"""
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "docx":
        return extract_text_from_docx(file_path)
    elif file_type == "txt":
        return extract_text_from_txt(file_path)
    elif file_type in ["csv", "xlsx"]:
        return extract_text_from_tabular(file_path, file_type)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF"""
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX"""
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])


def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT"""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_text_from_tabular(file_path: str, file_type: str) -> str:
    """Extract text from CSV/XLSX"""
    if file_type == "csv":
        df = pd.read_csv(file_path)
    else:  # xlsx
        df = pd.read_excel(file_path)
    
    return df.to_string()


def create_chunks(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Split text into chunks"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    return text_splitter.split_text(text)


def store_embeddings(document_id: int, chunks: List[str]):
    """Store embeddings in MongoDB"""
    vector_collection = get_mongo_collection("vector_store")
    
    # Create embeddings
    chunk_embeddings = embeddings.embed_documents(chunks)
    
    # Store each chunk with its embedding
    for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
        vector_collection.insert_one({
            "document_id": document_id,
            "chunk_index": i,
            "text": chunk,
            "vector": embedding
        })


def process_document(document_id: int, file_path: str, file_type: str):
    """Process document and create vector embeddings"""
    try:
        # Extract text from document
        text = extract_text(file_path, file_type)
        
        # Create chunks
        chunks = create_chunks(text)
        
        # Store embeddings
        store_embeddings(document_id, chunks)
        
        # Update document status
        db = SessionLocal()
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.embedding_status = True
                db.commit()
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error processing document {document_id}: {str(e)}")
        # Log error 