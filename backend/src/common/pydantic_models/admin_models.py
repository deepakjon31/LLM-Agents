from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Role Models
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Permission Models
class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None
    resource: str
    action: str

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# User Management Models for Admin Panel
class UserListItem(BaseModel):
    id: int
    mobile_number: str
    email: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        orm_mode = True

class UserRoleAssignment(BaseModel):
    user_id: int
    role_ids: List[int]

class RolePermissionAssignment(BaseModel):
    role_id: int
    permission_ids: List[int]

# Admin Dashboard Stats
class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_documents: int
    total_databases: int
    total_roles: int
    total_permissions: int 