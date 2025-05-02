from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from datetime import datetime

from ..common.db.connection import get_db
from ..common.db.schema import User, ChatHistory, Document
from ..common.pydantic_models.agent_models import SQLAgentRequest, DocumentAgentRequest, AgentResponse, ChatHistoryItem
from .auth import get_current_user
from ..agents.sql_agent import query_sql_database
from ..agents.document_agent import query_documents

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/sql", response_model=AgentResponse)
async def sql_agent(
    request: SQLAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Call SQL agent
        result = query_sql_database(request.prompt, request.database_id, request.database_type)
        
        # Save to chat history
        chat_history = ChatHistory(
            user_id=current_user.id,
            agent_type="SQL_AGENT",
            prompt=request.prompt,
            response=json.dumps(result)
        )
        db.add(chat_history)
        db.commit()
        
        # Return response
        return AgentResponse(
            response_text=result["response"],
            chart_data=result.get("chart_data"),
            no_results=result.get("no_results", False)
        )
    except Exception as e:
        return AgentResponse(
            response_text="An error occurred while processing your request.",
            error=str(e),
            no_results=True
        )


@router.post("/document", response_model=AgentResponse)
async def document_agent(
    request: DocumentAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Validate documents belong to user
        if request.document_ids:
            documents = db.query(Document).filter(
                Document.id.in_(request.document_ids),
                Document.user_id == current_user.id
            ).all()
            
            if len(documents) != len(request.document_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more documents not found or don't belong to you"
                )
        
        # Call document agent
        result = query_documents(request.prompt, request.document_ids)
        
        # Save to chat history
        chat_history = ChatHistory(
            user_id=current_user.id,
            agent_type="DOCUMENT_AGENT",
            prompt=request.prompt,
            response=json.dumps(result)
        )
        db.add(chat_history)
        db.commit()
        
        # Return response
        return AgentResponse(
            response_text=result["response"],
            chart_data=result.get("chart_data"),
            no_results=result.get("no_results", False)
        )
    except Exception as e:
        return AgentResponse(
            response_text="An error occurred while processing your request.",
            error=str(e),
            no_results=True
        )


@router.get("/history", response_model=List[ChatHistoryItem])
async def get_chat_history(
    agent_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Build query
    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    
    # Apply filter if agent_type is provided
    if agent_type:
        query = query.filter(ChatHistory.agent_type == agent_type)
    
    # Get results ordered by most recent first
    chat_histories = query.order_by(ChatHistory.created_at.desc()).all()
    
    return chat_histories 