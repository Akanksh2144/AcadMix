import logging
import jwt
import random
from datetime import datetime, timezone, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from app.models.admissions import Admission
from app.services.otp_service import OTPService
from app.core.config import settings
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

# The prefix deliberately omits an authenticated guard since this is public pre-enrollment.
router = APIRouter(prefix="/pre-enroll", tags=["Pre-Enrollment"])

PRE_ENROLL_JWT_SECRET = settings.PRE_ENROLL_JWT_SECRET
JWT_ALGORITHM = settings.JWT_ALGORITHM

class RequestOTPPayload(BaseModel):
    college_id: str
    admission_number: str
    mobile_number: str

class VerifyOTPPayload(BaseModel):
    college_id: str
    admission_number: str
    mobile_number: str
    otp: str

async def pre_enroll_limit_key(request: Request) -> str:
    try:
        body = await request.body()
        import json
        data = json.loads(body)
        return str(data.get("mobile_number", request.client.host))
    except Exception:
        return request.client.host

@router.get("/status")
async def get_pre_enroll_status(session: AsyncSession = Depends(get_db)):
    # Hardcoded to true for now as requested by the architecture doc
    return {"is_open": True}

@router.post("/hostel/request-otp")
@limiter.limit("5/15minute", key_func=pre_enroll_limit_key)
async def request_otp(payload: RequestOTPPayload, request: Request, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Admission).where(
            Admission.college_id == payload.college_id,
            Admission.admission_number == payload.admission_number,
            Admission.mobile_number == payload.mobile_number,
            Admission.status == "confirmed"
        )
    )
    admission = result.scalars().first()
    
    if not admission:
        logger.warning(f"Failed pre-enroll OTP request for mobile: {payload.mobile_number}")
        raise HTTPException(status_code=400, detail="Invalid admission credentials or not in confirmed status")
        
    otp = str(random.randint(100000, 999999))
    
    admission.otp_hash = OTPService.hash_otp(otp)
    admission.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    await session.commit()
    
    await OTPService.send_otp(payload.mobile_number, otp, payload.college_id)
    return {"message": "OTP sent successfully"}

@router.post("/hostel/verify-otp")
@limiter.limit("5/15minute", key_func=pre_enroll_limit_key)
async def verify_otp(payload: VerifyOTPPayload, request: Request, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Admission).where(
            Admission.college_id == payload.college_id,
            Admission.admission_number == payload.admission_number,
            Admission.mobile_number == payload.mobile_number,
            Admission.status == "confirmed"
        )
    )
    admission = result.scalars().first()
    
    if not admission or not admission.otp_hash or not admission.otp_expires_at:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if datetime.now(timezone.utc) > admission.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")
        
    input_hash = OTPService.hash_otp(payload.otp)
    if input_hash != admission.otp_hash:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Flush OTP fields
    admission.otp_hash = None
    admission.otp_expires_at = None
    await session.commit()
    
    # Generate Pre-Enroll Context Token
    token = jwt.encode({
        "sub": admission.id,
        "college_id": payload.college_id,
        "admission_number": admission.admission_number,
        "gender": admission.gender,
        "type": "pre_enroll",
        "iss": "pre_enroll_issuer",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
        "jti": str(uuid.uuid4())
    }, PRE_ENROLL_JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}

# ═══════════════════════════════════════════════════════════════════════════════
# PRE-ENROLL BOOKING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

from app.services.hostel_service import HostelService
from app.core.security import get_pre_enroll_user
from app.schemas.hostel import BedLockRequest, BedBookConfirm

def get_hostel_service(session: AsyncSession = Depends(get_db)):
    return HostelService(session)

@router.get("/hostel/available")
async def get_available_hostels(
    user: dict = Depends(get_pre_enroll_user),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_available_hostels(user["college_id"])}


@router.get("/hostel/buildings/{hostel_id}/floors")
async def get_hostel_floors(
    hostel_id: str,
    user: dict = Depends(get_pre_enroll_user),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_rooms_by_floor(hostel_id, user["college_id"])}


@router.get("/hostel/rooms/{room_id}/grid")
async def get_room_grid(
    room_id: str,
    user: dict = Depends(get_pre_enroll_user),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_room_grid(room_id, user["college_id"])}


@router.post("/hostel/beds/lock")
async def lock_bed(
    payload: BedLockRequest,
    user: dict = Depends(get_pre_enroll_user),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.lock_bed(payload.bed_id, user["id"], user["college_id"], actor_type="admission")
    return {"success": True, "data": result}


@router.post("/hostel/beds/confirm")
async def confirm_booking(
    payload: BedBookConfirm,
    user: dict = Depends(get_pre_enroll_user),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.confirm_booking(
        payload.bed_id, user["id"], user["college_id"], payload.payment_reference, actor_type="admission"
    )
    return {"success": True, "data": result}

@router.get("/hostel/my-allocation")
async def get_my_allocation(
    user: dict = Depends(get_pre_enroll_user),
    session: AsyncSession = Depends(get_db)
):
    # Admission allocation lookup logic since svc.get_my_allocation hardcodes student_id
    from app.models.hostel import Allocation, Bed, Room, Hostel
    
    result = await session.execute(
        select(Allocation).where(
            Allocation.admission_id == user["id"],
            Allocation.college_id == user["college_id"],
            Allocation.status == "active",
            Allocation.is_deleted == False,
        ).order_by(Allocation.allocated_at.desc())
    )
    alloc = result.scalars().first()
    if not alloc:
        return {"data": None}

    bed_q = await session.execute(select(Bed).where(Bed.id == alloc.bed_id))
    bed = bed_q.scalars().first()
    room_q = await session.execute(select(Room).where(Room.id == alloc.room_id))
    room = room_q.scalars().first()
    hostel_q = await session.execute(select(Hostel).where(Hostel.id == alloc.hostel_id))
    hostel = hostel_q.scalars().first()

    return {"data": {
        "allocation_id": alloc.id,
        "academic_year": alloc.academic_year,
        "hostel_name": hostel.name if hostel else "Unknown",
        "room_number": room.room_number if room else "Unknown",
        "floor": room.floor if room else None,
        "bed_identifier": bed.bed_identifier if bed else "Unknown",
        "is_premium": bed.is_premium if bed else False,
        "allocated_at": alloc.allocated_at.isoformat() if alloc.allocated_at else None,
    }}
