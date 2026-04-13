from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from app.core.security import get_current_user
from app import models



async def get_industry_user_company(user: dict, session: AsyncSession):
    company_id = user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="Industry user missing company_id in profile_data")
        
    result = await session.execute(select(models.Company).where(models.Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=403, detail=f"Company {company_id} not found.")
    return company

