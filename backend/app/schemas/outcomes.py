from pydantic import BaseModel, Field
from typing import List, Optional

# COPOMapping
class MappingItemCreate(BaseModel):
    co_id: str
    po_id: str
    strength: int = Field(..., ge=1, le=3)

# CO
class CourseOutcomeCreate(BaseModel):
    id: Optional[str] = None  # if supplied, update; else insert
    code: str
    description: str
    bloom_level: Optional[str] = None

class CourseOutcomeResponse(CourseOutcomeCreate):
    id: str
    course_id: str

# Unified Upsert Payload
class MatrixUpsertRequest(BaseModel):
    course_outcomes: List[CourseOutcomeCreate]
    mappings: List[MappingItemCreate]

# Read Response
class ProgramOutcomeResponse(BaseModel):
    id: str
    code: str
    description: str

class COPOMappingResponse(BaseModel):
    id: str
    co_id: str
    po_id: str
    strength: int

class OutcomeMatrixResponse(BaseModel):
    program_outcomes: List[ProgramOutcomeResponse]
    course_outcomes: List[CourseOutcomeResponse]
    mappings: List[COPOMappingResponse]
