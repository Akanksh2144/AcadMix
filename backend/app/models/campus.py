from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text
from database import Base

def _uuid():
    import uuid
    return str(uuid.uuid4())


class CollegeGroup(Base):
    """University group — GNI, Malla Reddy, etc. Supports nesting."""
    __tablename__ = "college_groups"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    parent_group_id = Column(String, ForeignKey("college_groups.id", ondelete="SET NULL"), nullable=True)
    meta_data = Column(JSONB, nullable=False, server_default='{}')
    is_deleted = Column(Boolean, nullable=False, server_default=text('false'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Campus(Base):
    """Physical location — co-located colleges share same campus."""
    __tablename__ = "campuses"
    id = Column(String, primary_key=True, default=_uuid)
    group_id = Column(String, ForeignKey("college_groups.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True, server_default="Telangana")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    meta_data = Column(JSONB, nullable=False, server_default='{}')
    is_deleted = Column(Boolean, nullable=False, server_default=text('false'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CampusBuilding(Base):
    """A building/zone on the campus schematic grid."""
    __tablename__ = "campus_buildings"
    id = Column(String, primary_key=True, default=_uuid)
    campus_id = Column(String, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)
    college_id = Column(String, ForeignKey("colleges.id"), nullable=True)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=True)
    building_type = Column(String, nullable=False, server_default="academic")
    floor_count = Column(Integer, nullable=False, server_default=text('1'))
    grid_x = Column(Integer, nullable=False, server_default=text('0'))
    grid_y = Column(Integer, nullable=False, server_default=text('0'))
    grid_w = Column(Integer, nullable=False, server_default=text('1'))
    grid_h = Column(Integer, nullable=False, server_default=text('1'))
    color = Column(String, nullable=True, server_default='#6366f1')
    icon = Column(String, nullable=True, server_default='Buildings')
    departments = Column(JSONB, nullable=False, server_default='[]')
    facilities = Column(JSONB, nullable=False, server_default='[]')
    meta_data = Column(JSONB, nullable=False, server_default='{}')
    is_deleted = Column(Boolean, nullable=False, server_default=text('false'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CampusEvent(Base):
    """Event pinned to a building with approval state machine."""
    __tablename__ = "campus_events"
    id = Column(String, primary_key=True, default=_uuid)
    campus_id = Column(String, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)
    building_id = Column(String, ForeignKey("campus_buildings.id"), nullable=False)
    college_id = Column(String, ForeignKey("colleges.id"), nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, server_default='other')
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=False, server_default='pending_hod')
    visibility = Column(String, nullable=False, server_default='department')
    poster_url = Column(String, nullable=True)
    contact_info = Column(String, nullable=True)
    max_attendees = Column(Integer, nullable=True)
    meta_data = Column(JSONB, nullable=False, server_default='{}')
    is_deleted = Column(Boolean, nullable=False, server_default=text('false'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CampusEventApproval(Base):
    """Audit trail for event approvals/rejections."""
    __tablename__ = "campus_event_approvals"
    id = Column(String, primary_key=True, default=_uuid)
    event_id = Column(String, ForeignKey("campus_events.id", ondelete="CASCADE"), nullable=False)
    approved_by = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
