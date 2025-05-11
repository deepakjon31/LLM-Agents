from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os
import logging
from typing import Optional
import hashlib

from src.common.db.connection import get_db
from src.common.db.schema import User, Role, Permission
from src.common.pydantic_models.user_models import UserCreate, UserResponse, Token, UserUpdate, UserWithPermissions
from src.common.dependencies import get_current_user, oauth2_scheme, SECRET_KEY, ALGORITHM
from src.common.config import AuthConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings moved to dependencies.py, but keep expire minutes here if specific to auth routes
ACCESS_TOKEN_EXPIRE_MINUTES = AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES

# Password verification
def verify_password(plain_password, hashed_password):
    try:
        logger.info("Attempting password verification with bcrypt")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error in password verification: {str(e)}")
        # Check if it's a SHA-256 fallback hash (for compatibility with older passwords)
        if hashed_password and hashed_password.startswith("$sha256$"):
            logger.info("Using SHA-256 fallback verification")
            hashed = hashlib.sha256(plain_password.encode()).hexdigest()
            return hashed_password == f"$sha256${hashed}"
        return False

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Error in password hashing: {str(e)}")
        # Use a simple hash algorithm as fallback
        logger.info("Using fallback SHA-256 password hashing")
        hashed = hashlib.sha256(password.encode()).hexdigest()
        # Format to look like bcrypt for compatibility
        return f"$sha256${hashed}"

# Keep DB interactions needed specifically for auth routes
def get_user_by_mobile(db: Session, mobile_number: str):
    try:
        user = db.query(User).filter(User.mobile_number == mobile_number).first()
        if user:
            logger.info(f"Found user with mobile: {mobile_number}, id: {user.id}")
        else:
            logger.warning(f"No user found with mobile: {mobile_number}")
        return user
    except Exception as e:
        logger.error(f"Database error in get_user_by_mobile: {str(e)}")
        return None

# Get user's permissions based on role
def get_user_permissions(db: Session, user_id: int):
    try:
        # Get user with role
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.role_id:
            return []
            
        # Get role with permissions
        role = db.query(Role).filter(Role.id == user.role_id).first()
        if not role:
            return []
            
        # Get permissions for role
        permissions = db.query(Permission).join(
            Role.permissions
        ).filter(Role.id == role.id).all()
        
        return [perm.name for perm in permissions]
    except Exception as e:
        logger.error(f"Error getting user permissions: {str(e)}")
        return []

def authenticate_user(db: Session, mobile_number: str, password: str):
    logger.info(f"Authenticating user with mobile: {mobile_number}")
    
    user = get_user_by_mobile(db, mobile_number)
    if not user:
        logger.warning(f"User not found with mobile number: {mobile_number}")
        return False
    
    logger.info(f"User found: {user.id} - {user.mobile_number}")
    
    if not verify_password(password, user.password_hash):
        logger.warning(f"Password verification failed for user: {user.id}")
        return False
    
    logger.info(f"Password verified for user: {user.id}")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    logger.info(f"Creating access token with data: {data}")
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiration can be set here or use the constant
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"JWT token created successfully")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating JWT token: {str(e)}")
        raise

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Signup attempt for mobile: {user.mobile_number}")
    
    db_user = get_user_by_mobile(db, mobile_number=user.mobile_number)
    if db_user:
        logger.warning(f"Mobile number already registered: {user.mobile_number}")
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Get the default 'user' role
    default_role = db.query(Role).filter(Role.name == AuthConfig.USER_ROLE_NAME).first()
    role_id = None
    
    if default_role:
        role_id = default_role.id
        logger.info(f"Found default '{AuthConfig.USER_ROLE_NAME}' role with id: {role_id}")
    else:
        # If no default role exists, create one or use admin as fallback
        admin_role = db.query(Role).filter(Role.name == AuthConfig.ADMIN_ROLE_NAME).first()
        if admin_role:
            role_id = admin_role.id
            logger.info(f"Default '{AuthConfig.USER_ROLE_NAME}' role not found, using '{AuthConfig.ADMIN_ROLE_NAME}' role with id: {role_id}")
        else:
            # Create a new role if neither user nor admin exists
            try:
                new_role = Role(name=AuthConfig.USER_ROLE_NAME, description="Default user role")
                db.add(new_role)
                db.commit()
                db.refresh(new_role)
                role_id = new_role.id
                logger.info(f"Created new '{AuthConfig.USER_ROLE_NAME}' role with id: {role_id}")
            except Exception as e:
                logger.error(f"Error creating default role: {str(e)}")
                # Continue without role if we can't create one
                logger.warning("Proceeding with user creation without role")
    
    db_user = User(
        mobile_number=user.mobile_number, 
        password_hash=hashed_password,
        email=user.email,
        role_id=role_id
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"User created successfully with id: {db_user.id}")
        return db_user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating user")

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Check if username is provided (could be mobile_number)
    username = form_data.username
    password = form_data.password
    
    logger.info(f"Login attempt with username: {username}")
    
    # Standard authentication
    try:
        logger.info(f"Attempting to authenticate user: {username}")
        user = authenticate_user(db, username, password)
        if not user:
            logger.warning(f"Authentication failed for username: {username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect mobile number or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Authentication successful for user: {user.id} - {user.mobile_number}")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        logger.info(f"Creating access token for user: {user.id} with expiry: {access_token_expires}")
        access_token = create_access_token(
            data={"sub": str(user.id)}, # Ensure sub is string
            expires_delta=access_token_expires
        )
        
        logger.info(f"Token generated successfully for user: {user.id}")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        logger.error(f"Login exception details: {type(e).__name__}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserWithPermissions)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current authenticated user info including permissions"""
    try:
        # Get user permissions
        permissions = get_user_permissions(db, current_user.id)
        
        # Get user role
        role = None
        if current_user.role_id:
            role = db.query(Role).filter(Role.id == current_user.role_id).first()
        
        # Determine admin status based on multiple criteria
        is_admin = False
        if role and role.name == AuthConfig.ADMIN_ROLE_NAME:
            is_admin = True
        elif AuthConfig.ADMIN_PERMISSION_NAME in permissions:
            is_admin = True
            
        # Return user data with permissions and role
        return {
            "id": current_user.id,
            "mobile_number": current_user.mobile_number,
            "email": current_user.email,
            "role_id": current_user.role_id,
            "role": role,
            "permissions": permissions,
            "is_admin": is_admin
        }
    except Exception as e:
        logger.error(f"Error retrieving user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user info: {str(e)}"
        )

@router.put("/me", response_model=UserResponse)
def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Updating user profile for user id: {current_user.id}")
    
    if user_update.email is not None:
        current_user.email = user_update.email
        
    if user_update.password is not None:
        current_user.password_hash = get_password_hash(user_update.password)
    
    current_user.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(current_user)
        logger.info(f"User profile updated successfully")
        return current_user
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error updating user profile")

@router.post("/logout")
def logout():
    """Logout endpoint (stateless - just for API completeness)"""
    logger.info("User logged out")
    return {"detail": "Successfully logged out"} 