from typing import List, Dict, Any
import PyPDF2
import docx
from docx import Document
import pandas as pd
import numpy as np
from openai import OpenAI
import os
from pathlib import Path
import json
from datetime import datetime
from .base_agent import BaseAgent

class DocumentProcessor(BaseAgent):
    def __init__(self, openai_api_key: str):
        super().__init__()
        self.client = OpenAI(api_key=openai_api_key)
        self.supported_formats = {
            '.pdf': self._process_pdf,
            '.docx': self._process_docx,
            '.txt': self._process_txt,
            '.csv': self._process_csv,
            '.xlsx': self._process_excel
        }
        self.update_agent_state({
            "processed_files": [],
            "total_chunks": 0,
            "last_processed_file": None
        })

    def process_document(self, file_path: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
        """Process a document and return chunks with embeddings."""
        file_extension = Path(file_path).suffix.lower()
        if file_extension not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {file_extension}")

        self.update_context(
            f"Processing document: {file_path}",
            role="system",
            metadata={
                "file_path": file_path,
                "file_extension": file_extension,
                "chunk_size": chunk_size
            }
        )

        # Extract text from document
        text = self.supported_formats[file_extension](file_path)
        
        # Split text into chunks
        chunks = self._split_text(text, chunk_size)
        
        # Generate embeddings for each chunk
        chunks_with_embeddings = []
        for i, chunk in enumerate(chunks):
            embedding = self._get_embedding(chunk)
            chunk_data = {
                "text": chunk,
                "embedding": embedding,
                "chunk_id": i,
                "metadata": {
                    "file_path": file_path,
                    "chunk_size": len(chunk),
                    "processed_at": datetime.utcnow().isoformat()
                }
            }
            chunks_with_embeddings.append(chunk_data)
            
            self.update_context(
                f"Processed chunk {i+1}/{len(chunks)}",
                role="system",
                metadata={
                    "chunk_id": i,
                    "chunk_size": len(chunk),
                    "embedding_dim": len(embedding)
                }
            )
        
        self.update_agent_state({
            "processed_files": self.get_agent_state()["processed_files"] + [file_path],
            "total_chunks": self.get_agent_state()["total_chunks"] + len(chunks),
            "last_processed_file": file_path
        })
        
        return chunks_with_embeddings

    def _process_pdf(self, file_path: str) -> str:
        """Process PDF file and extract text."""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text

    def _process_docx(self, file_path: str) -> str:
        """Process DOCX file and extract text."""
        doc = Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])

    def _process_txt(self, file_path: str) -> str:
        """Process TXT file and extract text."""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()

    def _process_csv(self, file_path: str) -> str:
        """Process CSV file and convert to text."""
        df = pd.read_csv(file_path)
        return df.to_string()

    def _process_excel(self, file_path: str) -> str:
        """Process Excel file and convert to text."""
        df = pd.read_excel(file_path)
        return df.to_string()

    def _split_text(self, text: str, chunk_size: int) -> List[str]:
        """Split text into chunks of specified size."""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            if current_size + len(word) + 1 > chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_size = len(word)
            else:
                current_chunk.append(word)
                current_size += len(word) + 1
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks

    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using OpenAI API."""
        response = self.client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding 