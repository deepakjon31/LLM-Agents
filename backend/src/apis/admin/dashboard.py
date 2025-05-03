from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.common.db.connection import get_db
from src.common.db.schema import User, Role, Permission, Document, Database
from src.common.pydantic_models.admin_models import AdminDashboardStats
from src.apis.admin.middlewares import get_current_admin

router = APIRouter()

# Dashboard Stats
@router.get("/dashboard/stats", response_model=AdminDashboardStats)
async def get_dashboard_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_documents = db.query(func.count(Document.id)).scalar()
    total_databases = db.query(func.count(Database.id)).scalar()
    total_roles = db.query(func.count(Role.id)).scalar()
    total_permissions = db.query(func.count(Permission.id)).scalar()
    
    return AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_documents=total_documents,
        total_databases=total_databases,
        total_roles=total_roles,
        total_permissions=total_permissions
    ) 