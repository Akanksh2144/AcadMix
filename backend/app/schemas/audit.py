from pydantic import BaseModel, UUID4, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class AuditLogCreate(BaseModel):
    action: str
    resource_type: str
    resource_id: str
    status: str = "success"
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None

class AuditLogResponse(BaseModel):
    id: str
    college_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: str
    status: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditExportQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    status: Optional[str] = None
