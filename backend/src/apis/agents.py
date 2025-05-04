from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from src.common.auth.jwt_bearer import JWTBearer
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("/history")
async def get_agent_history(
    current_user: dict = Depends(JWTBearer())
):
    """Get the history of agent interactions for the current user."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Get history for the current user - using synchronous approach
        agent_history = list(mongo_db.agent_history.find(
            {"user_id": current_user["user_id"]}
        ).sort("created_at", -1).limit(50))  # Get last 50 interactions
        
        return [{
            "id": str(entry["_id"]),
            "agent_type": entry.get("agent_type", "unknown"),
            "query": entry.get("query", ""),
            "response": entry.get("response", ""),
            "created_at": entry.get("created_at", datetime.utcnow())
        } for entry in agent_history]
    except Exception as e:
        logger.error(f"Error in get_agent_history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent history: {str(e)}")

@router.post("/history")
async def add_agent_history(
    history_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(JWTBearer())
):
    """Add a new entry to the agent interaction history."""
    try:
        # Get MongoDB database connection
        from src.common.db.connection import mongo_db
        
        # Prepare history entry
        history_entry = {
            "user_id": current_user["user_id"],
            "agent_type": history_data.get("agent_type", "unknown"),
            "query": history_data.get("query", ""),
            "response": history_data.get("response", ""),
            "created_at": datetime.utcnow()
        }
        
        # Add optional fields if provided
        if "metadata" in history_data:
            history_entry["metadata"] = history_data["metadata"]
        
        # Insert history entry - using synchronous approach
        result = mongo_db.agent_history.insert_one(history_entry)
        
        return {
            "id": str(result.inserted_id),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in add_agent_history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add agent history: {str(e)}") 