from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.core.schemas.base_model import Base
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel
import uuid

class UserSchema(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,  # Convert datetime to ISO format string
            "modified_at": self.modified_at.isoformat()
        }