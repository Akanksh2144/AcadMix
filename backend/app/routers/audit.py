from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import ValidationError
from typing import List, Optional
from datetime import datetime

from database import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse, AuditExportQuery
from app.services.audit_service import AuditService
from app.core.security import get_current_user

router = APIRouter()

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1),
    action: Optional[str] = None
):
    """
    Retrieve paginated audit logs for the current tenant.
    Only accessible by Admin and Principal roles.
    """
    if current_user["role"] not in ["admin", "principal"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    stmt = select(AuditLog).where(AuditLog.college_id == current_user["college_id"])
    if action:
        stmt = stmt.where(AuditLog.action == action)
    
    stmt = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return logs

@router.get("/export")
async def export_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    status_filter: Optional[str] = None
):
    """
    Stream a CSV export of filtered audit logs.
    Only accessible by Admin and Principal roles.
    """
    if current_user["role"] not in ["admin", "principal"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    query = AuditExportQuery(
        start_date=start_date,
        end_date=end_date,
        action=action,
        resource_type=resource_type,
        status=status_filter
    )

    return await AuditService.export_audit_logs(db=db, college_id=current_user["college_id"], query=query)
