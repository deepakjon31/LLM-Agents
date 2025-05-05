# Common FastAPI dependencies

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
import logging
from typing import List, Optional, Callable
from functools import wraps

# Assuming these imports are safe here (don't import back to apis/main)
from src.common.db.connection import get_db
from src.common.db.schema import User, Role, Permission
from src.common.pydantic_models.user_models import TokenData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT settings (ensure SECRET_KEY is loaded, e.g., via dotenv in main)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Database query function (could also be in a separate db utils file)
def get_user_by_id(db: Session, user_id: int):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            logger.info(f"Found user with ID: {user_id}")
        else:
            logger.warning(f"No user found with ID: {user_id}")
        return user
    except Exception as e:
        logger.error(f"Database error in get_user_by_id: {str(e)}")
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logger.info("Authenticating token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        logger.info(f"Decoding JWT token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        logger.info(f"Token payload: {payload}")
        
        if user_id_str is None:
            logger.warning("Token missing subject (user id)")
            raise credentials_exception
            
        # Convert string user_id back to integer for database lookup
        try:
            token_data = TokenData(user_id=int(user_id_str))
            logger.info(f"Token contains user_id: {token_data.user_id}")
        except ValueError as ve:
            logger.error(f"Invalid user ID format in token: {user_id_str}")
            raise credentials_exception
            
    except JWTError as je:
        logger.error(f"JWT decode error: {str(je)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error in token validation: {str(e)}")
        raise credentials_exception
    
    # Use the local or imported get_user_by_id
    user = get_user_by_id(db, user_id=token_data.user_id)
    if user is None:
        logger.warning(f"No user found for ID from token: {token_data.user_id}")
        raise credentials_exception
        
    logger.info(f"Authentication successful for user ID: {user.id}")
    return user 

def get_user_permissions(user: User, db: Session) -> List[str]:
    """Get list of permission names for a user based on their role."""
    if not user.role_id:
        return []
        
    try:
        # Get permissions for the user's role
        permissions = db.query(Permission).join(
            Role.permissions
        ).filter(Role.id == user.role_id).all()
        
        return [perm.name for perm in permissions]
    except Exception as e:
        logger.error(f"Error fetching user permissions: {str(e)}")
        return []

def has_permission(required_permission: str):
    """Dependency to check if user has specific permission."""
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user_permissions = get_user_permissions(current_user, db)
        
        if required_permission not in user_permissions:
            logger.warning(f"Permission denied: {required_permission} for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {required_permission}"
            )
        
        return current_user
    
    return permission_checker

def has_role(required_role: str):
    """Dependency to check if user has specific role."""
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not current_user.role_id:
            logger.warning(f"Role check failed: User {current_user.id} has no role")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role required"
            )
        
        role = db.query(Role).filter(Role.id == current_user.role_id).first()
        if not role or role.name != required_role:
            logger.warning(f"Role denied: {required_role} for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role denied: {required_role}"
            )
        
        return current_user
    
    return role_checker

def requires_permissions(permissions: List[str]):
    """Decorator to check if user has any of the required permissions."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user and db from kwargs
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing dependencies for permission check"
                )
            
            user_permissions = get_user_permissions(current_user, db)
            
            # Check if user has any of the required permissions
            if not any(perm in user_permissions for perm in permissions):
                logger.warning(f"Permissions denied: {permissions} for user {current_user.id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator 