from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from database import get_db
from app.core.security import get_current_user
from app.core.security import require_role
from app import models
import app.schemas as server_schemas
from app.schemas import *

router = APIRouter()


@router.get("/placements/student")
async def student_placements(user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    college_id = user.get("college_id", "")
    # Query PlacementDrive joined with Company for company name
    stmt = (
        select(models.PlacementDrive, models.Company.name.label("company_name"))
        .join(models.Company, models.PlacementDrive.company_id == models.Company.id)
        .where(
            models.PlacementDrive.college_id == college_id,
            models.PlacementDrive.status.in_(["upcoming", "ongoing", "completed"]),
        )
    )
    result = await session.execute(stmt)
    rows = result.all()
    out = []
    for drive, company_name in rows:
        out.append({
            "id": drive.id,
            "company": company_name,
            "role": drive.job_description or drive.drive_type or "",
            "type": drive.type,
            "status": drive.status,
            "work_location": drive.work_location,
        })
    return out


@router.post("/placements")
async def create_placement(req: dict, user: dict = Depends(require_role("admin", "hod", "tp_officer")), session: AsyncSession = Depends(get_db)):
    row = models.PlacementDrive(
        college_id=user["college_id"],
        company_id=req.get("company_id", ""),
        drive_type=req.get("drive_type", "on-campus"),
        type=req.get("type", "placement"),
        job_description=req.get("job_description", ""),
        work_location=req.get("work_location", ""),
        status=req.get("status", "upcoming"),
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return {"id": row.id, "status": row.status, "drive_type": row.drive_type}


@router.get("/placements")
async def list_placements(user: dict = Depends(require_role("admin", "hod", "teacher", "tp_officer")), session: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.PlacementDrive, models.Company.name.label("company_name"))
        .join(models.Company, models.PlacementDrive.company_id == models.Company.id)
        .where(models.PlacementDrive.college_id == user["college_id"])
    )
    result = await session.execute(stmt)
    rows = result.all()
    return [{"id": d.id, "company": cn, "drive_type": d.drive_type, "type": d.type, "status": d.status, "work_location": d.work_location} for d, cn in rows]


@router.get("/tpo/drives/{drive_id}/applicants")
async def get_drive_applicants(drive_id: str, user: dict = Depends(require_role("tp_officer", "admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PlacementApplication).where(
        models.PlacementApplication.drive_id == drive_id,
        models.PlacementApplication.college_id == user["college_id"]
    )
    res = await session.execute(stmt)
    return res.scalars().all()


@router.put("/tpo/drives/{drive_id}/shortlist")
async def bulk_shortlist(drive_id: str, req: ShortlistRequest, user: dict = Depends(require_role("tp_officer", "admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PlacementApplication).where(
        models.PlacementApplication.drive_id == drive_id,
        models.PlacementApplication.college_id == user["college_id"],
        models.PlacementApplication.student_id.in_(req.student_ids)
    )
    res = await session.execute(stmt)
    apps = res.scalars().all()
    for app in apps:
        if app.status == "registered":
            app.status = "shortlisted"
            
    await session.commit()
    return {"message": f"Successfully shortlisted {len(apps)} candidates"}


@router.put("/tpo/drives/{drive_id}/results")
async def append_round_result(drive_id: str, req: ResultRequest, user: dict = Depends(require_role("tp_officer", "admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PlacementApplication).where(
        models.PlacementApplication.drive_id == drive_id,
        models.PlacementApplication.student_id == req.student_id,
        models.PlacementApplication.college_id == user["college_id"]
    )
    res = await session.execute(stmt)
    app = res.scalars().first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    res_list = app.round_results or []
    from datetime import datetime
    res_list.append({
        "round": req.round_name,
        "result": req.result,
        "remarks": req.remarks,
        "evaluated_at": datetime.utcnow().isoformat()
    })
    app.round_results = res_list
    
    if req.result == "fail":
        app.status = "rejected"
        
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(app, "round_results")
    await session.commit()
    return {"message": "Result appended"}


@router.put("/tpo/drives/{drive_id}/select")
async def select_candidate(drive_id: str, req: SelectRequest, user: dict = Depends(require_role("tp_officer", "admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PlacementApplication).where(
        models.PlacementApplication.drive_id == drive_id,
        models.PlacementApplication.student_id == req.student_id,
        models.PlacementApplication.college_id == user["college_id"]
    )
    res = await session.execute(stmt)
    app = res.scalars().first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.status = "selected"
    app.offer_details = {
        "ctc": req.ctc,
        "role": req.role,
        "joining_date": req.joining_date,
        "location": req.location,
        "offer_url": req.offer_url,
        "is_accepted": False
    }
    await session.commit()
    return {"message": "Candidate selected and generated offer metadata"}


@router.get("/tpo/statistics")
async def get_tpo_statistics(user: dict = Depends(require_role("tp_officer", "admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PlacementApplication).where(
        models.PlacementApplication.college_id == user["college_id"],
        models.PlacementApplication.status == "selected"
    )
    res = await session.execute(stmt)
    selected = res.scalars().all()
    
    total_ctc = 0
    highest = 0
    for s in selected:
        if s.offer_details:
            ctc = float(s.offer_details.get("ctc") or 0)
            total_ctc += ctc
            if ctc > highest:
                highest = ctc
                
    avg = total_ctc / len(selected) if selected else 0
    return {
        "total_selected": len(selected),
        "highest_package": highest,
        "average_package": avg
    }


@router.get("/tpo/statistics/export")
async def export_tpo_statistics(user: dict = Depends(require_role("tp_officer", "admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PlacementApplication).where(
        models.PlacementApplication.college_id == user["college_id"],
        models.PlacementApplication.status == "selected"
    )
    res = await session.execute(stmt)
    selected = res.scalars().all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Placement Record"
    ws.append(["Student ID", "Drive ID", "Role", "CTC (LPA)", "Location"])
    
    for s in selected:
        details = s.offer_details or {}
        ws.append([
            s.student_id,
            s.drive_id,
            details.get("role", ""),
            details.get("ctc", ""),
            details.get("location", "")
        ])
        
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers={"Content-Disposition": "attachment; filename=placement_statistics.xlsx"}
    )


@router.get("/tpo/alumni-jobs")
async def get_tpo_alumni_jobs(
    user: dict = Depends(require_role("tpo", "tp_officer", "admin")),
    session: AsyncSession = Depends(get_db)
):
    stmt = select(models.AlumniJobPosting).where(models.AlumniJobPosting.college_id == user["college_id"])
    jobs = (await session.execute(stmt)).scalars().all()
    return jobs


@router.put("/tpo/alumni-jobs/{job_id}/moderate")
async def moderate_alumni_job(
    job_id: str,
    status: str = Body(..., embed=True), # "active" or "rejected"
    user: dict = Depends(require_role("tpo", "tp_officer", "admin")),
    session: AsyncSession = Depends(get_db)
):
    job = await session.get(models.AlumniJobPosting, job_id)
    if not job or job.college_id != user["college_id"]:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = status
    await session.commit()
    return {"message": f"Job posting marked as {status}"}
