from fastapi import APIRouter
from src.apis.admin.middlewares import get_current_admin
from src.apis.admin.dashboard import router as dashboard_router
from src.apis.admin.users import router as users_router
from src.apis.admin.roles import router as roles_router
from src.apis.admin.permissions import router as permissions_router
from src.apis.admin.database import router as database_router

# Main admin router
router = APIRouter(prefix="/admin", tags=["Admin"])

# Include sub-routers
router.include_router(dashboard_router)
router.include_router(users_router)
router.include_router(roles_router)
router.include_router(permissions_router)
router.include_router(database_router) 