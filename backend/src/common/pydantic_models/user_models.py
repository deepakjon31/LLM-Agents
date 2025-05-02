from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any, Union
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
    email: Optional[EmailStr] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v


class UserLogin(BaseModel):
    mobile_number: str
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters')
            if not any(c.isdigit() for c in v):
                raise ValueError('Password must contain at least one number')
            if not any(c.isupper() for c in v):
                raise ValueError('Password must contain at least one uppercase letter')
        return v


class UserResponse(BaseModel):
    id: int
    mobile_number: str
    email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    mobile_number: Optional[str] = None


class UserProfile(BaseModel):
    user_id: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    preferences: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[dict] = None 