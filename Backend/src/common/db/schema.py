from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(15), unique=True, index=True)
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    chat_histories = relationship("ChatHistory", back_populates="user")
    documents = relationship("Document", back_populates="user")

class ChatHistory(Base):
    __tablename__ = "chat_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    agent_type = Column(String(50))  # SQL_AGENT or DOCUMENT_AGENT
    prompt = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_histories")
    
class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String(255))
    file_path = Column(String(512))
    file_type = Column(String(50))
    embedding_status = Column(Boolean, default=False) # Whether vectors are generated
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    
# MongoDB Collections:
# - vector_store: document vectors for RAG
# - sql_metadata: metadata about SQL databases for the SQL agent
# - nosql_metadata: metadata about NoSQL databases for the NoSQL agent
