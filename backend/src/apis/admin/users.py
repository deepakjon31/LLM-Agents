from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.common.db.connection import get_db
from src.common.db.schema import User, Role, UserRole, Permission, RolePermission
from src.common.pydantic_models.admin_models import UserListItem, UserRoleAssignment
from src.common.pydantic_models.user_models import UserUpdate, UserRoleResponse
from src.common.pydantic_models.admin_models import RoleResponse, PermissionResponse
from src.apis.admin.middlewares import get_current_admin
from src.apis.auth import get_password_hash

router = APIRouter()

# User Management
@router.get("/users", response_model=List[UserListItem])
async def list_users(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all users with pagination and optional search"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.mobile_number.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserRoleResponse)
async def get_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get user details with roles"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user roles
    user_roles = db.query(UserRole, Role).join(Role).filter(UserRole.user_id == user_id).all()
    roles = [{"id": role.id, "name": role.name} for _, role in user_roles]
    
    # Create response
    response = UserRoleResponse(
        id=user.id,
        mobile_number=user.mobile_number,
        email=user.email,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at,
        roles=roles
    )
    
    return response

@router.put("/users/{user_id}", response_model=UserRoleResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.email is not None:
        user.email = user_data.email
    
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    if user_data.is_admin is not None:
        user.is_admin = user_data.is_admin
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Get user roles
    user_roles = db.query(UserRole, Role).join(Role).filter(UserRole.user_id == user_id).all()
    roles = [{"id": role.id, "name": role.name} for _, role in user_roles]
    
    # Create response
    response = UserRoleResponse(
        id=user.id,
        mobile_number=user.mobile_number,
        email=user.email,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at,
        roles=roles
    )
    
    return response

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting self
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete own account")
    
    db.delete(user)
    db.commit()
    return None

# User-Role Assignment
@router.post("/users/{user_id}/roles", status_code=status.HTTP_200_OK)
async def assign_roles_to_user(
    user_id: int,
    assignment: UserRoleAssignment,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Assign roles to a user"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clear existing roles
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    
    # Add new roles
    for role_id in assignment.role_ids:
        # Verify role exists
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail=f"Role with ID {role_id} not found")
        
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id
        )
        db.add(user_role)
    
    db.commit()
    return {"message": "Roles assigned successfully"}

@router.get("/users/{user_id}/roles", response_model=List[RoleResponse])
async def get_user_roles(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get roles assigned to a user"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get roles
    roles = db.query(Role).join(
        UserRole, UserRole.role_id == Role.id
    ).filter(UserRole.user_id == user_id).all()
    
    return roles

@router.get("/users/{user_id}/permissions", response_model=List[PermissionResponse])
async def get_user_permissions(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all permissions assigned to a user through their roles"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get permissions from all user roles
    permissions = db.query(Permission).distinct().join(
        RolePermission, RolePermission.permission_id == Permission.id
    ).join(
        Role, Role.id == RolePermission.role_id
    ).join(
        UserRole, UserRole.role_id == Role.id
    ).filter(UserRole.user_id == user_id).all()
    
    return permissions 