# Common FastAPI dependencies

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
import logging
from typing import Optional

# Assuming these imports are safe here (don't import back to apis/main)
from src.common.db.connection import get_db
from src.common.db.schema import User
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