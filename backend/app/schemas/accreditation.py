from pydantic import BaseModel, Field
from typing import Optional

class QlMUpdateRequest(BaseModel):
    criterion_code: str
    criterion_name: str
    narrative_text: str
    is_complete: bool = False

class QlMCopyRequest(BaseModel):
    from_academic_year: str
    criterion_code: Optional[str] = None

class ThresholdUpdateRequest(BaseModel):
    department_id: Optional[str] = None
    batch_year: str
    direct_threshold_pct: float = Field(..., ge=0, le=100)
    direct_weight: float = Field(..., ge=0, le=1)
    indirect_weight: float = Field(..., ge=0, le=1)
    po_target_level: float = Field(..., ge=0, le=3)
