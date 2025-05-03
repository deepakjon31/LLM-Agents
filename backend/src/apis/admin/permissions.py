from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.common.db.connection import get_db
from src.common.db.schema import Permission, User
from src.common.pydantic_models.admin_models import (
    PermissionCreate, PermissionUpdate, PermissionResponse
)
from src.apis.admin.middlewares import get_current_admin

router = APIRouter()

# Permission Management
@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    resource: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all permissions with optional resource filter"""
    query = db.query(Permission)
    
    if resource:
        query = query.filter(Permission.resource == resource)
    
    permissions = query.all()
    return permissions

@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_data: PermissionCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new permission"""
    # Check if permission with same name exists
    existing_permission = db.query(Permission).filter(Permission.name == permission_data.name).first()
    if existing_permission:
        raise HTTPException(status_code=400, detail="Permission with this name already exists")
    
    new_permission = Permission(
        name=permission_data.name,
        description=permission_data.description,
        resource=permission_data.resource,
        action=permission_data.action
    )
    
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

@router.get("/permissions/{permission_id}", response_model=PermissionResponse)
async def get_permission(
    permission_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get permission details"""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission

@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: int,
    permission_data: PermissionUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update permission details"""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    if permission_data.name is not None:
        # Check if permission with same name exists
        existing_permission = db.query(Permission).filter(Permission.name == permission_data.name).first()
        if existing_permission and existing_permission.id != permission_id:
            raise HTTPException(status_code=400, detail="Permission with this name already exists")
        permission.name = permission_data.name
    
    if permission_data.description is not None:
        permission.description = permission_data.description
    
    if permission_data.resource is not None:
        permission.resource = permission_data.resource
    
    if permission_data.action is not None:
        permission.action = permission_data.action
    
    permission.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(permission)
    return permission

@router.delete("/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a permission"""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    db.delete(permission)
    db.commit()
    return None 