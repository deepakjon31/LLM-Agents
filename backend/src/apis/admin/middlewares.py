from fastapi import Depends, HTTPException, status
from src.common.db.schema import User
from src.apis.auth import get_current_user

# Admin access middleware
async def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin resources",
        )
    return current_user 