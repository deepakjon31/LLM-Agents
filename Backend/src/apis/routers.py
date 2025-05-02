from fastapi import APIRouter
from .auth import router as auth_router
from .documents import router as document_router
from .agents import router as agent_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(document_router)
api_router.include_router(agent_router)
