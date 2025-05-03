from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.common.db.connection import get_db
from src.common.db.schema import Database, User
from src.common.pydantic_models.database_models import DatabaseResponse
from src.apis.admin.middlewares import get_current_admin

router = APIRouter()

# Database Management
@router.get("/database/all-connections", response_model=List[DatabaseResponse])
async def get_all_database_connections(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all database connections across all users (admin only)"""
    connections = db.query(Database).all()
    return connections

@router.get("/database/user-connections/{user_id}", response_model=List[DatabaseResponse])
async def get_user_database_connections(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all database connections for a specific user (admin only)"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    connections = db.query(Database).filter(Database.user_id == user_id).all()
    return connections

@router.delete("/database/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_database_connection(
    connection_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a database connection (admin only)"""
    connection = db.query(Database).filter(Database.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db.delete(connection)
    db.commit()
    return None 