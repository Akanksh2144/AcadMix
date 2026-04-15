"""
IoT & Micro-Economy Models
==========================
Database models bridging physical campus hardware to the WhatsApp
transactional layer:
  - Bus fleet tracking (ESP32 GPS modules)
  - Vending machine registry and transactions
  - Gamification reward point ledger
"""

from sqlalchemy import (
    Column, String, Integer, Float, ForeignKey, DateTime, Boolean,
    Index, UniqueConstraint, Date, CheckConstraint, Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text
import uuid
from database import Base
from app.models.core import SoftDeleteMixin


def generate_uuid():
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════════════════════
# BUS FLEET — Route definitions and real-time tracking
# ═══════════════════════════════════════════════════════════════════════════════


class BusRoute(Base, SoftDeleteMixin):
    """
    A bus route with ordered stops and schedule metadata.
    The BUS is the permanent asset. Drivers rotate via roster.

    stops JSONB shape:
    [
        {"name": "Kukatpally", "order": 1, "lat": 17.4948, "lng": 78.3996, "geofence_radius_m": 200},
        {"name": "KPHB Colony", "order": 2, "lat": 17.4876, "lng": 78.3953, "geofence_radius_m": 200},
        ...
    ]

    avg_stop_times JSONB shape (built from historical data):
    ["07:15", "07:22", "07:30", ...]  — expected arrival time at each stop index
    """
    __tablename__ = "bus_routes"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    route_number    = Column(String, nullable=False)          # "Route 4", "R-12"
    route_name      = Column(String, nullable=True)           # "Kukatpally – Campus"
    vehicle_number  = Column(String, nullable=True)           # "TS 09 AB 1234" — physical bus plate
    capacity        = Column(Integer, nullable=True)          # Seating capacity
    driver_id       = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Current roster assignment
    stops           = Column(JSONB, nullable=False, server_default='[]')
    avg_stop_times  = Column(JSONB, nullable=True)            # Historical avg arrival times per stop
    departure_time  = Column(String, nullable=True)           # "07:30" — morning departure from first stop
    return_time     = Column(String, nullable=True)           # "17:00" — evening departure from campus
    fee_amount      = Column(Float, nullable=True)            # Semester transport fee in INR
    is_active       = Column(Boolean, nullable=False, server_default=text('true'))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("college_id", "route_number", name="uq_bus_route_number"),
    )


class BusLocation(Base):
    """
    Real-time GPS pings from ESP32 bus trackers.
    High-frequency table — no soft delete, TTL-managed or partitioned.
    """
    __tablename__ = "bus_locations"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    route_id        = Column(String, ForeignKey("bus_routes.id", ondelete="CASCADE"), nullable=False)
    latitude        = Column(Float, nullable=False)
    longitude       = Column(Float, nullable=False)
    speed_kmh       = Column(Float, nullable=True)
    heading         = Column(Float, nullable=True)            # 0-360 compass degrees
    geofence_event  = Column(String, nullable=True)           # "enter:Kukatpally", "exit:Campus", null if no event
    recorded_at     = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_busloc_route_time", "route_id", "recorded_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# VENDING — Machine registry and transactions
# ═══════════════════════════════════════════════════════════════════════════════


class VendingMachine(Base, SoftDeleteMixin):
    """
    Physical vending machine registry.

    inventory JSONB shape:
    [
        {"item": "Tea", "price": 10, "qty": 45, "max_qty": 50},
        {"item": "Coffee", "price": 15, "qty": 3, "max_qty": 50},
        ...
    ]
    """
    __tablename__ = "vending_machines"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_code    = Column(String, nullable=False, unique=True)  # "VM-CS-01"
    location        = Column(String, nullable=False)               # "CS Block Ground Floor"
    esp32_ip        = Column(String, nullable=True)                # For direct health pings
    inventory       = Column(JSONB, nullable=False, server_default='[]')
    status          = Column(String, nullable=False, server_default="online")  # online, offline, maintenance
    last_heartbeat  = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('online', 'offline', 'maintenance')", name="ck_vending_status"),
    )


class VendingTransaction(Base):
    """
    Individual card-tap / wallet transactions at vending machines or mess counters.
    High-frequency — no soft delete.
    """
    __tablename__ = "vending_transactions"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    student_id      = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    machine_id      = Column(String, ForeignKey("vending_machines.id", ondelete="SET NULL"), nullable=True)
    transaction_type = Column(String, nullable=False)             # "purchase", "mess_breakfast", "mess_lunch", "mess_dinner"
    item_name       = Column(String, nullable=True)               # "Tea", "Coffee", null for mess
    amount          = Column(Float, nullable=False)
    balance_after   = Column(Float, nullable=False)               # Wallet balance after deduction
    recorded_at     = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_vending_txn_student", "student_id", "recorded_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# REWARD POINTS — Gamification ledger
# ═══════════════════════════════════════════════════════════════════════════════


class RewardPointLog(Base):
    """
    Point earn/redeem ledger for campus gamification.
    Points are earned via: attendance streaks, quiz performance, event participation.
    Points are redeemed at: vending machines, campus store.
    """
    __tablename__ = "reward_point_logs"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    student_id      = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points          = Column(Integer, nullable=False)             # Positive = earn, negative = redeem
    reason          = Column(String, nullable=False)              # "100% weekly attendance", "quiz_top_scorer", "vending_redeem"
    category        = Column(String, nullable=False)              # "attendance", "academic", "event", "redeem"
    balance_after   = Column(Integer, nullable=False)             # Running total after this entry
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_reward_student_time", "student_id", "created_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# TRANSPORT — AIS 140 Hardware, Enrollment, Trips, Attendance
# ═══════════════════════════════════════════════════════════════════════════════


class AIS140Device(Base, SoftDeleteMixin):
    """
    AIS 140 GPS device registry — hardwired into each bus.
    The bus is the permanent asset; this links IMEI to a specific route/vehicle.
    """
    __tablename__ = "ais140_devices"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    imei            = Column(String, nullable=False, unique=True)   # Device IMEI — auth key
    sim_iccid       = Column(String, nullable=True)                 # SIM card ICCID
    vehicle_number  = Column(String, nullable=True)                 # "TS 09 AB 1234"
    route_id        = Column(String, ForeignKey("bus_routes.id", ondelete="SET NULL"), nullable=True)
    status          = Column(String, nullable=False, server_default="active")  # active, inactive, maintenance
    last_ping_at    = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_ais140_imei", "imei"),
    )


class TransportEnrollment(Base, SoftDeleteMixin):
    """
    Student enrollment on a bus route for an academic year.
    Links student → route → specific boarding stop.
    """
    __tablename__ = "transport_enrollments"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id      = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    route_id        = Column(String, ForeignKey("bus_routes.id", ondelete="CASCADE"), nullable=False)
    boarding_stop_index = Column(Integer, nullable=False)           # Index into route.stops[]
    boarding_stop_name  = Column(String, nullable=True)             # Denormalized for quick access
    academic_year   = Column(String, nullable=False)                # "2025-26"
    fee_paid        = Column(Float, nullable=True, default=0)
    is_active       = Column(Boolean, nullable=False, server_default=text('true'))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "route_id", "academic_year", name="uq_transport_enrollment"),
        Index("ix_transport_enroll_route", "route_id", "boarding_stop_index"),
    )


class Trip(Base):
    """
    Active trip lifecycle.
    State machine: STARTED → IN_TRANSIT → COMPLETED
    One row per trip (morning run, evening run).
    """
    __tablename__ = "trips"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    route_id        = Column(String, ForeignKey("bus_routes.id", ondelete="CASCADE"), nullable=False)
    driver_id       = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    state           = Column(String, nullable=False, server_default="started")  # started, in_transit, completed
    direction       = Column(String, nullable=False, server_default="morning")  # morning (to campus), evening (from campus)
    current_node_index = Column(Integer, nullable=True, default=0)
    started_at      = Column(DateTime(timezone=True), server_default=func.now())
    completed_at    = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_trip_route_state", "route_id", "state"),
    )


class TripSummary(Base):
    """
    Persisted AFTER trip completion. One row per completed trip.
    This is the ONLY transport write to PostgreSQL — all live data stays in Redis.
    """
    __tablename__ = "trip_summaries"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    trip_id         = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    route_id        = Column(String, ForeignKey("bus_routes.id", ondelete="CASCADE"), nullable=False)
    driver_id       = Column(String, nullable=True)
    direction       = Column(String, nullable=False)  # morning / evening
    started_at      = Column(DateTime(timezone=True), nullable=False)
    completed_at    = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    stops_visited   = Column(Integer, nullable=True)
    total_stops     = Column(Integer, nullable=True)
    max_speed_kmh   = Column(Float, nullable=True)
    delay_minutes   = Column(Integer, nullable=True, default=0)    # vs scheduled time
    incidents       = Column(JSONB, nullable=True, server_default='[]')  # speed violations, deviations, SOS
    date            = Column(Date, nullable=False)

    __table_args__ = (
        Index("ix_tripsummary_route_date", "route_id", "date"),
    )


class TransportAttendance(Base):
    """
    Per-trip boarding log. Created when student scans QR / taps RFID on bus.
    """
    __tablename__ = "transport_attendance"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    student_id      = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trip_id         = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    route_id        = Column(String, ForeignKey("bus_routes.id", ondelete="CASCADE"), nullable=False)
    boarded_at_stop = Column(Integer, nullable=True)           # Stop index where scanned
    scan_time       = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "trip_id", name="uq_transport_attendance"),
        Index("ix_transport_att_trip", "trip_id"),
    )
