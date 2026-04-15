import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app import models
from app.core.exceptions import ResourceNotFoundError

class GDPRService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def anonymize_user(self, college_id: str, user_id: str) -> None:
        """
        Cryptographically scrambles PII of a user to comply with GDPR's Right to Erasure,
        while maintaining the primary key to preserve relational integrity across 
        financial and grading records.
        """
        user_r = await self.db.execute(
            select(models.User).where(
                models.User.id == user_id, 
                models.User.college_id == college_id
            )
        )
        user = user_r.scalars().first()
        if not user:
            raise ResourceNotFoundError("User", user_id)
        
        # Prevent re-anonymization
        if getattr(user, "is_anonymized", False):
            return

        # Scramble algorithm (un-reversable hash to fulfill "right to be forgotten")
        # Use UUID + timestamp as salt
        salt = f"{user.id}_{datetime.now(timezone.utc).timestamp()}"
        user_hash = hashlib.sha256(salt.encode()).hexdigest()
        
        # 1. Update Core User PII
        user.name = f"Deleted User {user_hash[:8]}"
        user.email = f"deleted_{user_hash[:12]}@gdpr.invalid"
        user.password_hash = "LOCKED_" + user_hash # Invalid bycrypt hash format automatically acts as lockout
        user.is_anonymized = True
        user.anonymized_at = datetime.now(timezone.utc)
        
        # 2. Update User Profile PII
        profile_r = await self.db.execute(
            select(models.UserProfile).where(models.UserProfile.user_id == user_id)
        )
        profile = profile_r.scalars().first()
        
        if profile:
            profile.roll_number = f"ANON-{user_hash[:10]}"
            profile.phone = None
            profile.blood_group = None
            
            # Additional PII scrub inside extra_data if any
            if profile.extra_data:
                extra = dict(profile.extra_data)
                # Remove sensitive keys
                for key in ["address", "date_of_birth", "father_name", "mother_name", "photo_url"]:
                    extra.pop(key, None)
                profile.extra_data = extra

        # 3. Log GDPR Anonymization Action
        from app.services.audit_service import AuditService
        await AuditService.log_audit(
            db=self.db,
            college_id=college_id,
            user_id=user_id, # Can continue using user_id because audit row PK needs to exist
            action="GDPR_ANONYMIZATION",
            resource_type="users",
            resource_id=user_id,
            status="success"
        )

        await self.db.commit()
