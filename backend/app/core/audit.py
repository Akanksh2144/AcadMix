from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models

async def log_audit(session: AsyncSession, user_id: str, resource: str, action: str, details: dict = None):
    # 1. Resolve college_id from session info or DB lookup
    college_id = session.info.get("college_id")
    if not college_id:
        res = await session.execute(select(models.User.college_id).where(models.User.id == user_id))
        college_id = res.scalar_one_or_none()
    if not college_id:
        college_id = "test-college"  # Safe default fallback

    # 2. Extract resource_id from details dict
    details_dict = details or {}
    resource_id = (
        details_dict.get("id") or 
        details_dict.get("quiz_id") or 
        details_dict.get("attempt_id") or 
        details_dict.get("material_id") or
        "system"
    )

    log_entry = models.AuditLog(
        college_id=college_id,
        user_id=user_id,
        action=action,
        resource_type=resource,
        resource_id=str(resource_id),
        status="success",
        new_value=details_dict
    )
    session.add(log_entry)
