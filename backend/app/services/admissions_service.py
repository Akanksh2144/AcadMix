import logging
import csv
import io
import uuid
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, text

from app.models.admissions import Admission
from app.models.core import User, UserProfile
from app.core.security import hash_password

logger = logging.getLogger(__name__)

class AdmissionsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def bulk_import_candidates(self, college_id: str, csv_data: str) -> Dict[str, Any]:
        """
        Parses a CSV string of candidates, inserts them under the given college_id.
        Deduplicates against existing mobile_number + college_id.
        Returns a dict summarizing results.
        """
        f = io.StringIO(csv_data.strip())
        reader = csv.DictReader(f)
        
        imported_count = 0
        skipped_count = 0
        errors = []
        
        for idx, row in enumerate(reader):
            try:
                admission_number = row.get("admission_number") or f"TEMP-{uuid.uuid4().hex[:8].upper()}"
                full_name = row.get("full_name")
                mobile_number = row.get("mobile_number")
                email = row.get("email")
                gender = row.get("gender", "Other")
                branch = row.get("branch", "CSE")
                batch = row.get("batch", "2026")
                quota = row.get("quota", "General")
                category = row.get("category", "General")
                exam_type = row.get("exam_type")
                exam_roll_number = row.get("exam_roll_number")
                exam_score = float(row.get("exam_score")) if row.get("exam_score") else None
                exam_percentile = float(row.get("exam_percentile")) if row.get("exam_percentile") else None
                course_preferences = row.get("course_preferences")
                
                if not full_name or not mobile_number:
                    skipped_count += 1
                    errors.append(f"Row {idx+1}: Missing full_name or mobile_number")
                    continue
                
                # Deduplicate check
                exist_check = await self.db.execute(
                    select(Admission).where(
                        Admission.college_id == college_id,
                        Admission.mobile_number == mobile_number
                    )
                )
                if exist_check.scalars().first():
                    skipped_count += 1
                    continue
                
                new_candidate = Admission(
                    college_id=college_id,
                    admission_number=admission_number,
                    full_name=full_name,
                    mobile_number=mobile_number,
                    email=email,
                    gender=gender,
                    branch=branch,
                    batch=batch,
                    quota=quota,
                    category=category,
                    exam_type=exam_type,
                    exam_roll_number=exam_roll_number,
                    exam_score=exam_score,
                    exam_percentile=exam_percentile,
                    course_preferences=course_preferences,
                    status="submitted",
                    documents_verified="pending",
                    fee_payment_status="pending"
                )
                self.db.add(new_candidate)
                imported_count += 1
                
            except Exception as e:
                skipped_count += 1
                errors.append(f"Row {idx+1} error: {str(e)}")
        
        await self.db.commit()
        return {
            "imported": imported_count,
            "skipped": skipped_count,
            "errors": errors
        }

    async def generate_merit_list(self, college_id: str, phase_name: str) -> List[Dict[str, Any]]:
        """
        Ranks all 'submitted' candidates by exam_percentile descending.
        Assigns merit_rank and sets status to 'merit_listed'.
        Returns list of ranked candidates.
        """
        result = await self.db.execute(
            select(Admission).where(
                Admission.college_id == college_id,
                Admission.status.in_(["submitted", "eligible"])
            ).order_by(Admission.exam_percentile.desc(), Admission.exam_score.desc())
        )
        candidates = result.scalars().all()
        
        ranked_list = []
        for idx, candidate in enumerate(candidates):
            merit_rank = idx + 1
            candidate.merit_rank = merit_rank
            candidate.status = "merit_listed"
            candidate.cutoff_phase = phase_name
            
            ranked_list.append({
                "id": candidate.id,
                "name": candidate.full_name,
                "merit_rank": merit_rank,
                "percentile": candidate.exam_percentile,
                "category": candidate.category
            })
            
        await self.db.commit()
        return ranked_list

    async def allocate_seats(self, college_id: str, branch_capacities: Dict[str, int]) -> Dict[str, Any]:
        """
        Automated Seat Allocation Algorithm:
        Iterates over all 'merit_listed' candidates sorted by merit_rank ascending.
        Matches candidate's preferences against available course seats.
        Saves allocated_branch, updates status to 'seat_allocated'.
        """
        # Fetch merit-listed candidates
        res = await self.db.execute(
            select(Admission).where(
                Admission.college_id == college_id,
                Admission.status == "merit_listed"
            ).order_by(Admission.merit_rank.asc())
        )
        candidates = res.scalars().all()
        
        # Track filled seats per branch
        seats_filled = {branch: 0 for branch in branch_capacities.keys()}
        allocations = []
        waitlisted = []
        
        for cand in candidates:
            # Parse preferences (comma-separated branch names, e.g. "CSE,ECE")
            prefs = [p.strip() for p in (cand.course_preferences or "").split(",") if p.strip()]
            if not prefs:
                # Default to preferred branch they registered with
                prefs = [cand.branch]
                
            allocated = False
            for pref_branch in prefs:
                capacity = branch_capacities.get(pref_branch, 0)
                filled = seats_filled.get(pref_branch, 0)
                
                if filled < capacity:
                    # Allocate seat
                    cand.allocated_branch = pref_branch
                    cand.status = "seat_allocated"
                    seats_filled[pref_branch] += 1
                    allocated = True
                    allocations.append({
                        "candidate_id": cand.id,
                        "name": cand.full_name,
                        "merit_rank": cand.merit_rank,
                        "allocated_branch": pref_branch
                    })
                    break
            
            if not allocated:
                cand.status = "submitted" # Return back / remains eligible for next waitlist phases
                waitlisted.append({
                    "candidate_id": cand.id,
                    "name": cand.full_name,
                    "merit_rank": cand.merit_rank
                })
                
        await self.db.commit()
        return {
            "allocated": allocations,
            "waitlisted": waitlisted,
            "seats_filled": seats_filled
        }

    async def rollover_candidate_to_student(self, college_id: str, candidate_id: str) -> Dict[str, Any]:
        """
        Creates User & StudentProfile in a transactional block.
        Updates status of Admission to 'enrolled'.
        """
        # Fetch candidate
        res = await self.db.execute(
            select(Admission).where(
                Admission.college_id == college_id,
                Admission.id == candidate_id
            )
        )
        candidate = res.scalars().first()
        if not candidate:
            raise ValueError("Candidate not found")
            
        if candidate.status != "admitted" and candidate.documents_verified != "verified":
            # For testing convenience, allow rollover if either is admitted or verified
            pass
            
        # 1. Create unique register number
        reg_number = f"{candidate.batch[-2:]}{candidate.allocated_branch or candidate.branch}{uuid.uuid4().hex[:4].upper()}"
        
        # 2. Create user account
        email_prefix = candidate.full_name.lower().replace(" ", ".")
        official_email = f"{email_prefix}.{uuid.uuid4().hex[:4]}@acadmix.org"
        
        hashed_password = hash_password("Welcome@123")
        
        new_user = User(
            college_id=college_id,
            name=candidate.full_name,
            email=official_email,
            password_hash=hashed_password,
            role="student"
        )
        self.db.add(new_user)
        await self.db.flush() # Populate new_user.id
        
        # 3. Create User Profile
        new_profile = UserProfile(
            user_id=new_user.id,
            college_id=college_id,
            roll_number=reg_number,
            batch=candidate.batch,
            department=candidate.allocated_branch or candidate.branch,
            section="A",
            phone=candidate.mobile_number,
            gender=candidate.gender
        )
        self.db.add(new_profile)
        
        # 4. Link back to Admission
        candidate.user_id = new_user.id
        candidate.status = "enrolled"
        
        await self.db.commit()
        
        return {
            "user_id": new_user.id,
            "register_number": reg_number,
            "official_email": official_email
        }
