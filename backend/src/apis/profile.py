from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from ..common.pydantic_models.user_models import UserProfile, UserProfileUpdate
from ..common.db.connection import get_db
from ..common.auth.jwt_bearer import JWTBearer
from datetime import datetime
import pymongo

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(JWTBearer())):
    db = get_db()
    profile = await db.user_profiles.find_one({"user_id": current_user["user_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/me", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(JWTBearer())
):
    db = get_db()
    update_data = profile_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.user_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    updated_profile = await db.user_profiles.find_one({"user_id": current_user["user_id"]})
    return updated_profile

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(JWTBearer())
):
    # TODO: Implement file upload to cloud storage
    # For now, we'll just return a mock URL
    mock_url = f"https://storage.example.com/avatars/{current_user['user_id']}/{file.filename}"
    
    db = get_db()
    await db.user_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {
            "profile_picture": mock_url,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"url": mock_url} 