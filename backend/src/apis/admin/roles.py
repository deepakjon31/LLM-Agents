from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from src.common.db.connection import get_db
from src.common.db.schema import Role, Permission, User
from src.common.pydantic_models.admin_models import (
    RoleCreate, RoleUpdate, RoleResponse, 
    PermissionResponse, RolePermissionAssignment
)
from src.apis.admin.middlewares import get_current_admin

router = APIRouter()

# Role Management
@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all roles"""
    roles = db.query(Role).all()
    return roles

@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new role"""
    # Check if role with same name exists
    existing_role = db.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role with this name already exists")
    
    new_role = Role(
        name=role_data.name,
        description=role_data.description
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get role details"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update role details"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role_data.name is not None:
        # Check if role with same name exists
        existing_role = db.query(Role).filter(Role.name == role_data.name).first()
        if existing_role and existing_role.id != role_id:
            raise HTTPException(status_code=400, detail="Role with this name already exists")
        role.name = role_data.name
    
    if role_data.description is not None:
        role.description = role_data.description
    
    role.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    db.delete(role)
    db.commit()
    return None

# Role-Permission Assignment
@router.post("/roles/{role_id}/permissions", status_code=status.HTTP_200_OK)
async def assign_permissions_to_role(
    role_id: int,
    assignment: RolePermissionAssignment,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Assign permissions to a role"""
    # Verify role exists
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Clear existing permissions
    role.permissions = []
    
    # Add new permissions
    for permission_id in assignment.permission_ids:
        # Verify permission exists
        permission = db.query(Permission).filter(Permission.id == permission_id).first()
        if not permission:
            raise HTTPException(status_code=404, detail=f"Permission with ID {permission_id} not found")
        
        # Add permission to role's permissions collection
        role.permissions.append(permission)
    
    db.commit()
    return {"message": "Permissions assigned successfully"}

@router.get("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
async def get_role_permissions(
    role_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get permissions assigned to a role"""
    # Verify role exists
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Get permissions directly from role.permissions relationship
    return role.permissions 