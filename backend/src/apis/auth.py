from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os
from typing import Optional

from src.common.db.connection import get_db
from src.common.db.schema import User
from src.common.pydantic_models.user_models import UserCreate, UserResponse, Token, UserUpdate
from src.common.dependencies import get_current_user, oauth2_scheme, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings moved to dependencies.py, but keep expire minutes here if specific to auth routes
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# oauth2_scheme moved to dependencies.py

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Keep DB interactions needed specifically for auth routes
def get_user_by_mobile(db: Session, mobile_number: str):
    return db.query(User).filter(User.mobile_number == mobile_number).first()

# get_user_by_id is now in dependencies.py

def authenticate_user(db: Session, mobile_number: str, password: str):
    user = get_user_by_mobile(db, mobile_number)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiration can be set here or use the constant
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# get_current_user function moved to dependencies.py

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_mobile(db, mobile_number=user.mobile_number)
    if db_user:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        mobile_number=user.mobile_number, 
        password_hash=hashed_password,
        email=user.email
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Check if username is provided (could be mobile_number)
    username = form_data.username
    password = form_data.password
    
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect mobile number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, # Ensure sub is string
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.email is not None:
        current_user.email = user_update.email
        
    if user_update.password is not None:
        current_user.password_hash = get_password_hash(user_update.password)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user 