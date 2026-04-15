"""
Transport Management Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Enrollment ──────────────────────────────────────────────────────────────

class TransportEnrollRequest(BaseModel):
    route_id: str
    boarding_stop_index: int
    academic_year: Optional[str] = None


# ─── Trip Control ────────────────────────────────────────────────────────────

class TripStartRequest(BaseModel):
    route_id: str
    direction: str = "morning"  # morning / evening


class ClearStopRequest(BaseModel):
    route_id: str
    stop_index: int


class TripEndRequest(BaseModel):
    route_id: str


# ─── AIS 140 Telemetry ──────────────────────────────────────────────────────

class AIS140TelemetryPacket(BaseModel):
    imei: str
    latitude: float
    longitude: float
    speed_kmh: float = 0
    heading: float = 0
    timestamp: Optional[str] = None
    sos: bool = False


# ─── Device Management ──────────────────────────────────────────────────────

class AIS140DeviceRegister(BaseModel):
    imei: str
    vehicle_number: Optional[str] = None
    sim_iccid: Optional[str] = None
    route_id: Optional[str] = None


# ─── Boarding ────────────────────────────────────────────────────────────────

class BoardingScanRequest(BaseModel):
    student_id: str
    route_id: str


# ─── Admin ───────────────────────────────────────────────────────────────────

class RouteCreateRequest(BaseModel):
    route_number: str
    route_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    capacity: Optional[int] = None
    stops: List[dict] = []  # [{name, lat, lng, geofence_radius_m, order}]
    departure_time: Optional[str] = None
    return_time: Optional[str] = None
    fee_amount: Optional[float] = None
    avg_stop_times: Optional[List[str]] = None


class RouteUpdateRequest(BaseModel):
    route_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    capacity: Optional[int] = None
    stops: Optional[List[dict]] = None
    departure_time: Optional[str] = None
    return_time: Optional[str] = None
    fee_amount: Optional[float] = None
    avg_stop_times: Optional[List[str]] = None
    driver_id: Optional[str] = None
    is_active: Optional[bool] = None


class AssignDriverRequest(BaseModel):
    route_id: str
    driver_id: str


class SimulateAdvanceRequest(BaseModel):
    route_id: str
