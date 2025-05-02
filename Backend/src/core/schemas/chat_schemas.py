from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Numeric, Integer
from sqlalchemy.sql import func
from src.core.schemas.base_model import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class ChatSchema(Base):
    __tablename__ = 'chats'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    chat_name = Column(String, nullable=True)
    model = Column(UUID(as_uuid=True), ForeignKey('llm_models.id', ondelete='CASCADE'))
    model_settings = Column(UUID(as_uuid=True), ForeignKey('llm_settings.id', ondelete='CASCADE'))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "chat_name": str(self.chat_name),
            "model": str(self.model),
            "model_settings": str(self.model_settings),
            "created_at": self.created_at.isoformat() if self.created_at else None,  # Convert datetime to ISO format string
            "modified_at": self.modified_at.isoformat()
        }
    
class ChatMessageSchema(Base):
    __tablename__ = 'chat_messages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey('chats.id', ondelete='CASCADE'))
    message = Column(String)
    is_user = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "chat_id": str(self.chat_id),
            "message": self.message,
            "is_user": self.is_user,
            "created_at": self.created_at.isoformat() if self.created_at else None,  # Convert datetime to ISO format string
            "modified_at": self.modified_at.isoformat()
        }