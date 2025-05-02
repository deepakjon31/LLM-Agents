from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re
from datetime import datetime


class UserBase(BaseModel):
    mobile_number: str
    
    @validator('mobile_number')
    def validate_mobile_number(cls, v):
        if not re.match(r'^\+?[1-9]\d{9,14}$', v):
            raise ValueError('Invalid mobile number format')
        return v


class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserLogin(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    mobile_number: Optional[str] = None
    user_id: Optional[int] = None 