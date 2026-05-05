from typing import Optional, List
from pydantic import BaseModel, Field


class SyllabusTopicCreate(BaseModel):
    topic_no: int
    title: str
    hours: int = 1
    co_id: Optional[str] = None


class SyllabusUnitCreate(BaseModel):
    unit_no: int
    title: str
    total_hours: int = 0
    topics: List[SyllabusTopicCreate] = []


class SyllabusBulkCreate(BaseModel):
    """Full syllabus for a course: list of units with nested topics."""
    units: List[SyllabusUnitCreate]


class SyllabusTopicOut(BaseModel):
    id: str
    topic_no: int
    title: str
    hours: int
    co_id: Optional[str] = None
    is_covered: bool = False
    covered_on: Optional[str] = None


class SyllabusUnitOut(BaseModel):
    id: str
    unit_no: int
    title: str
    total_hours: int
    topics: List[SyllabusTopicOut] = []
    coverage_pct: float = 0.0


class SyllabusCoverageOut(BaseModel):
    course_id: str
    subject_code: str
    subject_name: str
    total_topics: int
    covered_topics: int
    coverage_pct: float
    units: List[SyllabusUnitOut] = []
