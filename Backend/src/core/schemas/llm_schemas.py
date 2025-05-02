from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Numeric, Integer
from sqlalchemy.sql import func
from src.core.schemas.base_model import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class AIModelsSchema(Base):
    __tablename__ = 'llm_models'

    id =Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String, default="llama")
    provider = Column(String, default="groq")
    is_active = Column(Boolean, default=True)
    advanced_settings = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "model_name": self.model_name,
            "provider": self.provider,
            "advanced_settings": self.advanced_settings,
            "created_at": self.created_at.isoformat() if self.created_at else None,  # Convert datetime to ISO format string
            "modified_at": self.modified_at.isoformat()
        }
    
class AIModelSettingsSchema(Base):
    __tablename__ = 'llm_settings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    model_id = Column(UUID(as_uuid=True), ForeignKey('llm_models.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    is_active = Column(Boolean, default=True)
    temperature = Column(Numeric, default=0.8)
    max_output_token = Column(Integer, default=2048)
    created_at = Column(DateTime, server_default=func.now())
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": str(self.name),
            "description": str(self.description),
            "model_id": str(self.model_id),
            "user_id": str(self.user_id),
            "temperature": str(self.temperature),
            "max_output_tokens": str(self.max_output_token),
            "default": self.default,
            "created_at": self.created_at.isoformat() if self.created_at else None,  # Convert datetime to ISO format string
            "modified_at": self.modified_at.isoformat() 
        }
