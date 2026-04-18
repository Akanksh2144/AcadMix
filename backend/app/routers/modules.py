import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from app.models.core import CollegeModule
from app.core.security import get_current_user, require_role, require_permission

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/college/modules", tags=["College Modules"])

class ModuleEnablePayload(BaseModel):
    is_enabled: bool

class ModuleVisibilityPayload(BaseModel):
    student_visible: bool

@router.get("")
async def get_modules(user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    """
    Returns modules filtered by the authenticated user's role.
    This guarantees no unauthenticated module enumeration.
    """
    result = await session.execute(
        select(CollegeModule).where(CollegeModule.college_id == user["college_id"])
    )
    modules = result.scalars().all()
    
    filtered_modules = []
    for mod in modules:
        # Admins bypass role checks to manage the platform and see all fields
        if user["role"] in ["admin", "super_admin"]:
            filtered_modules.append(mod)
        else:
            # End-users only get heavily redacted module metadata
            if mod.is_enabled and user["role"] in mod.visible_to_roles:
                filtered_modules.append({
                    "module_name": mod.module_name,
                    "student_visible": mod.student_visible
                })
                
    return filtered_modules

@router.patch("/{module_name}/enable")
async def enable_module(
    module_name: str, 
    payload: ModuleEnablePayload, 
    user: dict = Depends(require_role("admin", "super_admin")), 
    session: AsyncSession = Depends(get_db)
):
    """Admin-only global switch to toggle a module for the entire college."""
    result = await session.execute(
        select(CollegeModule).where(
            CollegeModule.college_id == user["college_id"],
            CollegeModule.module_name == module_name
        )
    )
    mod = result.scalars().first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
        
    mod.is_enabled = payload.is_enabled
    mod.enabled_by = user["id"] if payload.is_enabled else None
    await session.commit()
    return {"message": f"Module '{module_name}' enabled state set to {payload.is_enabled}"}

@router.patch("/{module_name}/visible")
async def set_module_visibility(
    module_name: str, 
    payload: ModuleVisibilityPayload, 
    request: Request, 
    session: AsyncSession = Depends(get_db)
):
    """
    Warden/Module-Owner switch to gate student access dynamically.
    Security: Escapes static routing constraints and uses modular require_permission 
    so a transport admin doesn't need a hardcoded role check to control Transport visibility.
    """
    perm_checker = require_permission(module_name, "manage")
    user = await perm_checker(request, session)
    
    result = await session.execute(
        select(CollegeModule).where(
            CollegeModule.college_id == user["college_id"],
            CollegeModule.module_name == module_name
        )
    )
    mod = result.scalars().first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
        
    mod.student_visible = payload.student_visible
    await session.commit()
    return {"message": f"Module '{module_name}' student visibility set to {payload.student_visible}"}
