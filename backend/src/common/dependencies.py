# Common FastAPI dependencies

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
from typing import Optional

# Assuming these imports are safe here (don't import back to apis/main)
from src.common.db.connection import get_db
from src.common.db.schema import User
from src.common.pydantic_models.user_models import TokenData

# JWT settings (ensure SECRET_KEY is loaded, e.g., via dotenv in main)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Database query function (could also be in a separate db utils file)
def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        # Convert string user_id back to integer for database lookup
        token_data = TokenData(user_id=int(user_id_str))
    except (JWTError, ValueError):
        raise credentials_exception
    
    # Use the local or imported get_user_by_id
    user = get_user_by_id(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    return user 