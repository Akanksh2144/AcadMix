import os

new_endpoints = """

# ─── Missing Principal Endpoints (Queue/Activity) ────────────────────────────────

@app.get("/api/principal/leave/pending")
async def get_pending_hod_leaves(user: dict = Depends(require_role("principal", "admin")), session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(models.LeaveRequest, models.User).join(
            models.User, models.LeaveRequest.applicant_id == models.User.id
        ).where(
            models.LeaveRequest.college_id == user["college_id"],
            models.LeaveRequest.status.in_(["pending", "cancellation_requested", "partially_cancelled"]),
            models.LeaveRequest.applicant_role == "hod"
        )
    )
    rows = result.all()
    return [{
        "id": l.id, "applicant_id": l.applicant_id, "applicant_name": u.name, "applicant_email": u.email,
        "applicant_department": u.profile_data.get("department") if u.profile_data else "Unknown",
        "leave_type": l.leave_type, "from_date": l.from_date.isoformat(), "to_date": l.to_date.isoformat(),
        "reason": l.reason, "document_url": l.document_url, "created_at": l.created_at.isoformat()
    } for l, u in rows]

@app.get("/api/principal/activity-reports")
async def get_principal_activity_reports(user: dict = Depends(require_role("principal", "admin")), session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(models.ActivityPermission, models.User).join(
            models.User, models.ActivityPermission.faculty_id == models.User.id
        ).where(
            models.ActivityPermission.college_id == user["college_id"],
            models.ActivityPermission.hod_report_decision == "accepted",
            models.ActivityPermission.principal_noted_at.is_(None)
        )
    )
    rows = result.all()
    return [{
        "id": a.id, "faculty_name": u.name, "department": u.profile_data.get("department") if u.profile_data else "Unknown",
        "activity_type": a.activity_type, "event_title": a.event_title, "event_date": a.event_date.isoformat() if a.event_date else None,
        "phase": a.phase, "created_at": a.created_at.isoformat() if a.created_at else None
    } for a, u in rows]

"""

with open('c:/AcadMix/backend/server.py', 'a', encoding='utf-8') as f:
    f.write(new_endpoints)
    print("Endpoints added to server.py")
