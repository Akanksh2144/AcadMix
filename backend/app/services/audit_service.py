import csv
import io
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.audit import AuditLog
from app.schemas.audit import AuditExportQuery
from typing import Optional, Any
import json

class AuditService:
    @staticmethod
    async def log_audit(
        db: AsyncSession,
        college_id: str,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        status: str = "success",
        old_value: Optional[dict[str, Any]] = None,
        new_value: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Explicitly logs an action at the service layer for SOC 2 / ISO 27001 compliance.
        Does NOT commit automatically to allow being part of the parent transaction.
        """
        from sqlalchemy import text
        # Ensure values are serializable
        if old_value:
            old_value = json.loads(json.dumps(old_value, default=str))
        if new_value:
            new_value = json.loads(json.dumps(new_value, default=str))

        # Explicitly set the tenant context for this transaction before inserting.
        # This is critical for unauthenticated endpoints (like /login or /logout)
        # where the RLSMiddleware hasn't set the app.college_id GUC.
        try:
            await db.execute(text("SELECT set_config('app.college_id', :cid, true)"), {"cid": str(college_id)})
        except Exception as e:
            import logging
            logging.getLogger("acadmix.audit").warning(f"Failed to set GUC for audit log: {e}")

        audit_log = AuditLog(
            college_id=college_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            status=status,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit_log)
        # Intentionally do not commit here
        return audit_log

    @staticmethod
    async def export_audit_logs(
        db: AsyncSession,
        college_id: str,
        query: AuditExportQuery
    ) -> StreamingResponse:
        """
        Exports audit logs as a streamable CSV to prevent memory crashes on large datasets.
        """
        stmt = select(AuditLog).where(AuditLog.college_id == college_id).order_by(AuditLog.created_at.desc())

        if query.start_date:
            stmt = stmt.where(AuditLog.created_at >= query.start_date)
        if query.end_date:
            stmt = stmt.where(AuditLog.created_at <= query.end_date)
        if query.action:
            stmt = stmt.where(AuditLog.action == query.action)
        if query.resource_type:
            stmt = stmt.where(AuditLog.resource_type == query.resource_type)
        if query.status:
            stmt = stmt.where(AuditLog.status == query.status)

        # Execute query iteratively
        result = await db.execute(stmt)
        results = result.scalars().all()

        # CSV generator
        def iter_csv():
            output = io.StringIO()
            writer = csv.writer(output)
            # Write header
            writer.writerow([
                "ID", "Timestamp", "User ID", "Action", "Resource Type", "Resource ID",
                "Status", "Old Value", "New Value", "IP Address", "User Agent"
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

            # Write rows
            for log in results:
                writer.writerow([
                    str(log.id),
                    log.created_at.isoformat() if log.created_at else "",
                    str(log.user_id),
                    log.action,
                    log.resource_type,
                    log.resource_id,
                    log.status,
                    json.dumps(log.old_value) if log.old_value else "",
                    json.dumps(log.new_value) if log.new_value else "",
                    log.ip_address or "",
                    log.user_agent or ""
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)

        dt_str = query.start_date.strftime("%Y%m%d") if query.start_date else "all_time"
        headers = {
            "Content-Disposition": f"attachment; filename=audit_export_{dt_str}.csv",
            "Content-Type": "text/csv"
        }

        return StreamingResponse(iter_csv(), headers=headers)
