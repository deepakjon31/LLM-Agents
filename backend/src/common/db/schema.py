from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from .connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(15), unique=True, index=True)
    password_hash = Column(String(255))
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    chat_histories = relationship("ChatHistory", back_populates="user")
    documents = relationship("Document", back_populates="user")
    databases = relationship("Database", back_populates="user")

class ChatHistory(Base):
    __tablename__ = "chat_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    agent_type = Column(String(50))  # SQL_AGENT or DOCUMENT_AGENT
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_histories")
    messages = relationship("Message", back_populates="chat_history", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_history_id = Column(Integer, ForeignKey("chat_histories.id"))
    role = Column(String(50))  # user or assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chat_history = relationship("ChatHistory", back_populates="messages")
    
class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String(255))
    file_path = Column(String(512))
    file_type = Column(String(50))
    file_size = Column(Integer)  # Size in bytes
    embedding_status = Column(Boolean, default=False)  # Whether vectors are generated
    chunk_count = Column(Integer, default=0)  # Number of chunks created
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    
class Database(Base):
    __tablename__ = "databases"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255))
    description = Column(Text, nullable=True)
    db_type = Column(String(50))  # postgresql, mysql, etc.
    connection_string = Column(String(512))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="databases")
    tables = relationship("DatabaseTable", back_populates="database", cascade="all, delete-orphan")
    
class DatabaseTable(Base):
    __tablename__ = "database_tables"
    
    id = Column(Integer, primary_key=True, index=True)
    database_id = Column(Integer, ForeignKey("databases.id"))
    name = Column(String(255))
    description = Column(Text, nullable=True)
    schema = Column(Text)  # JSON Schema of the table
    sample_data = Column(Text, nullable=True)  # JSON sample data for enhanced understanding
    created_at = Column(DateTime, default=datetime.utcnow)
    
    database = relationship("Database", back_populates="tables")
    
# MongoDB Collections:
# - vector_store: document vectors for RAG with schema:
#   {
#     "document_id": int,
#     "chunk_id": int,
#     "text": str,
#     "vector": list[float],
#     "metadata": dict  # page number, section, etc.
#   }
# - sql_metadata: metadata about SQL databases for the SQL agent
# - semantic_cache: cache for semantic queries to improve response time 