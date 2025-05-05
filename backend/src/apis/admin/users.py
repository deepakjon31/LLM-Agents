from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from src.common.db.connection import get_db
from src.common.db.schema import User, Role, Permission
from src.common.pydantic_models.admin_models import UserListItem, UserRoleAssignment
from src.common.pydantic_models.user_models import UserUpdate, UserResponse, UserCreate
from src.common.pydantic_models.admin_models import RoleResponse, PermissionResponse
from src.apis.admin.middlewares import get_current_admin
from src.apis.auth import get_password_hash

# Add a log to verify that this module is being imported
logger = logging.getLogger(__name__)
logger.info("ADMIN USERS MODULE LOADED")

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
    logger.info("ADMIN LIST USERS ENDPOINT CALLED")
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.mobile_number.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    logger.info(f"Admin creating new user with mobile: {user_data.mobile_number}")
    logger.info(f"Admin creation payload: {user_data}")
    
    # Check if user with the mobile number already exists
    existing_user = db.query(User).filter(User.mobile_number == user_data.mobile_number).first()
    if existing_user:
        logger.warning(f"Mobile number already registered: {user_data.mobile_number}")
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    # Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # Get the default user role
    default_role = db.query(Role).filter(Role.name == "user").first()
    
    # Create the new user
    new_user = User(
        mobile_number=user_data.mobile_number,
        password_hash=hashed_password,
        email=user_data.email,
        is_active=True,
        is_admin=user_data.is_admin if hasattr(user_data, 'is_admin') else False,
        role_id=default_role.id if default_role else None
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"Admin created new user with ID: {new_user.id}")
        return new_user
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get user details with roles"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # UserResponse expects the User object directly and handles serialization with from_attributes
    # Ensure the roles are loaded if needed by the UserResponse model
    # (They should be loaded by default due to the relationship definition, but check if issues arise)
    return user # Return the user object directly

@router.put("/users/{user_id}", response_model=UserResponse)
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
    
    update_data = user_data.dict(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(user, key, value)
        
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user # Return the updated user object directly

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
    
    # Clear existing roles by removing all existing relationships
    user.roles = []
    
    # Add new roles
    for role_id in assignment.role_ids:
        # Verify role exists
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail=f"Role with ID {role_id} not found")
        
        # Add role to user's roles collection
        user.roles.append(role)
    
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
    
    # Get roles directly from the user.roles relationship
    return user.roles

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
    permissions = []
    for role in user.roles:
        permissions.extend(role.permissions)
    
    # Remove duplicates
    unique_permissions = []
    permission_ids = set()
    for permission in permissions:
        if permission.id not in permission_ids:
            permission_ids.add(permission.id)
            unique_permissions.append(permission)
            
    return unique_permissions 