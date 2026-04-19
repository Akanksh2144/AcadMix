import asyncio
from database import AsyncSessionLocal
from app.services.resume_vault_service import ResumeVaultService
from app.models import User
from sqlalchemy.future import select

async def mock_extract_pdf_text(file_bytes):
    return "This is a completely valid fake PDF text content from a mock."

async def main():
    async with AsyncSessionLocal() as db:
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalars().first()
        user_dict = {"id": user.id, "college_id": user.college_id, "role": user.role}
        svc = ResumeVaultService(db)
        
        # We will mock the imported function inside resume_vault_service directly!
        import app.services.resume_vault_service as rvs
        rvs.extract_pdf_text = mock_extract_pdf_text
        
        try:
            res1 = await svc.upload(b"%PDF-1.4...", "resume1.pdf", "application/pdf", user_dict)
            print("Upload 1 success:", res1)
        except Exception as e:
            print("Upload 1 Failed:", repr(e))
            
        try:
            res2 = await svc.upload(b"%PDF-1.4...", "resume2.pdf", "application/pdf", user_dict)
            print("Upload 2 success:", res2)
        except Exception as e:
            print("Upload 2 Failed:", type(e), repr(e))

asyncio.run(main())
