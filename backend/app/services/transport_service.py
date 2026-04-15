"""
Transport Service Layer
========================
Core business logic for the Adaptive Radar transport management system.

Handles:
  - Student enrollment + digital bus pass
  - Trip lifecycle (start → node arrivals → end)
  - Boarding verification + transport attendance
  - AIS 140 telemetry processing
  - Fleet dashboard
"""

import logging
import json
from datetime import datetime, date
from typing import Optional, Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app import models
from app.core.config import settings
from app.services import transport_state, geofence_engine, push_notifications

logger = logging.getLogger("acadmix.transport_service")


class TransportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ═══════════════════════════════════════════════════════════════════════════
    # ENROLLMENT
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_available_routes(self, college_id: str) -> List[Dict]:
        """List all active routes with stops and enrollment counts."""
        stmt = (
            select(models.BusRoute)
            .where(
                models.BusRoute.college_id == college_id,
                models.BusRoute.is_active == True,
                models.BusRoute.is_deleted == False,
            )
            .order_by(models.BusRoute.route_number)
        )
        result = await self.db.execute(stmt)
        routes = result.scalars().all()

        output = []
        for r in routes:
            # Count current enrollments
            count_r = await self.db.execute(
                select(func.count(models.TransportEnrollment.id)).where(
                    models.TransportEnrollment.route_id == r.id,
                    models.TransportEnrollment.is_active == True,
                    models.TransportEnrollment.is_deleted == False,
                )
            )
            enrolled = count_r.scalar() or 0

            output.append({
                "id": r.id,
                "route_number": r.route_number,
                "route_name": r.route_name,
                "vehicle_number": r.vehicle_number,
                "capacity": r.capacity,
                "stops": r.stops or [],
                "departure_time": r.departure_time,
                "return_time": r.return_time,
                "fee_amount": r.fee_amount,
                "enrolled": enrolled,
                "available": (r.capacity - enrolled) if r.capacity else None,
            })

        return output

    async def enroll_student(
        self, student_id: str, college_id: str,
        route_id: str, boarding_stop_index: int,
        academic_year: str = None,
    ) -> Dict:
        """Enroll a student on a bus route with a specific boarding stop."""
        if not academic_year:
            now = datetime.now()
            academic_year = f"{now.year}-{str(now.year + 1)[-2:]}"

        # Validate route exists
        route_r = await self.db.execute(
            select(models.BusRoute).where(
                models.BusRoute.id == route_id,
                models.BusRoute.college_id == college_id,
                models.BusRoute.is_deleted == False,
            )
        )
        route = route_r.scalars().first()
        if not route:
            raise ValueError("Route not found")

        stops = route.stops or []
        if boarding_stop_index < 0 or boarding_stop_index >= len(stops):
            raise ValueError(f"Invalid boarding stop index. Route has {len(stops)} stops.")

        stop_name = stops[boarding_stop_index].get("name", f"Stop {boarding_stop_index}")

        # Check capacity
        count_r = await self.db.execute(
            select(func.count(models.TransportEnrollment.id)).where(
                models.TransportEnrollment.route_id == route_id,
                models.TransportEnrollment.is_active == True,
                models.TransportEnrollment.is_deleted == False,
            )
        )
        enrolled = count_r.scalar() or 0
        if route.capacity and enrolled >= route.capacity:
            raise ValueError("Route is at full capacity")

        # Create enrollment
        enrollment = models.TransportEnrollment(
            college_id=college_id,
            student_id=student_id,
            route_id=route_id,
            boarding_stop_index=boarding_stop_index,
            boarding_stop_name=stop_name,
            academic_year=academic_year,
            fee_paid=route.fee_amount or 0,
        )
        self.db.add(enrollment)
        await self.db.flush()

        return {
            "id": enrollment.id,
            "route_number": route.route_number,
            "route_name": route.route_name,
            "boarding_stop": stop_name,
            "fee_paid": enrollment.fee_paid,
        }

    async def get_my_enrollment(self, student_id: str, college_id: str) -> Optional[Dict]:
        """Get student's current transport enrollment."""
        stmt = (
            select(models.TransportEnrollment, models.BusRoute)
            .join(models.BusRoute, models.BusRoute.id == models.TransportEnrollment.route_id)
            .where(
                models.TransportEnrollment.student_id == student_id,
                models.TransportEnrollment.college_id == college_id,
                models.TransportEnrollment.is_active == True,
                models.TransportEnrollment.is_deleted == False,
            )
            .order_by(models.TransportEnrollment.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None

        enrollment, route = row
        return {
            "enrollment_id": enrollment.id,
            "route_id": route.id,
            "route_number": route.route_number,
            "route_name": route.route_name,
            "vehicle_number": route.vehicle_number,
            "boarding_stop_index": enrollment.boarding_stop_index,
            "boarding_stop_name": enrollment.boarding_stop_name,
            "stops": route.stops or [],
            "departure_time": route.departure_time,
            "return_time": route.return_time,
            "fee_paid": enrollment.fee_paid,
            "academic_year": enrollment.academic_year,
        }

    async def generate_bus_pass_data(self, student_id: str, college_id: str) -> Optional[Dict]:
        """Generate QR payload for digital bus pass."""
        enrollment = await self.get_my_enrollment(student_id, college_id)
        if not enrollment:
            return None

        # Get student name
        user_r = await self.db.execute(
            select(models.User.name).where(models.User.id == student_id)
        )
        user = user_r.scalar()

        return {
            "type": "transport_pass",
            "student_id": student_id,
            "student_name": user or "",
            "college_id": college_id,
            "enrollment_id": enrollment["enrollment_id"],
            "route_id": enrollment["route_id"],
            "route_number": enrollment["route_number"],
            "boarding_stop": enrollment["boarding_stop_name"],
            "valid_until": f"{enrollment['academic_year']}-06-30",
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # TRIP LIFECYCLE — The "Adaptive Radar" Core
    # ═══════════════════════════════════════════════════════════════════════════

    async def start_trip(
        self, route_id: str, college_id: str,
        direction: str = "morning",
    ) -> Dict:
        """
        Start a new trip. Creates Trip row in DB, sets Redis state.
        Sends FCM push to students at first 2 stops (go_live trigger).
        """
        # Get route
        route_r = await self.db.execute(
            select(models.BusRoute).where(
                models.BusRoute.id == route_id,
                models.BusRoute.college_id == college_id,
            )
        )
        route = route_r.scalars().first()
        if not route:
            raise ValueError("Route not found")

        # Create Trip record
        trip = models.Trip(
            college_id=college_id,
            route_id=route_id,
            driver_id=route.driver_id,
            state="started",
            direction=direction,
            current_node_index=0,
        )
        self.db.add(trip)
        await self.db.flush()

        # Set Redis state
        await transport_state.start_trip(route_id, trip.id, direction)

        # If first stop has coordinates, set initial position
        stops = route.stops or []
        if stops:
            first = stops[0]
            await transport_state.update_live_position(
                route_id,
                first.get("lat", 0), first.get("lng", 0),
                speed=0, heading=0,
            )

        # FCM push to first 2 stops (visible notification + go_live data message)
        await push_notifications.notify_trip_started(self.db, route_id, route.route_name or route.route_number)

        logger.info("Trip started: route=%s trip=%s", route.route_number, trip.id)
        return {
            "trip_id": trip.id,
            "route": route.route_number,
            "direction": direction,
            "state": "started",
        }

    async def process_node_arrival(
        self, route_id: str, node_index: int, college_id: str,
    ) -> Dict:
        """
        Bus has reached/departed a stop node.
        Core of the Adaptive Radar:
          1. Update Redis node
          2. Compute ETA for next stops
          3. FCM notification to N+1 and N+2 students (visible + go_live)
          4. Silent FCM data push to ALL students (node_update for map jumping)
        """
        # Get route for stop data
        route_r = await self.db.execute(
            select(models.BusRoute).where(models.BusRoute.id == route_id)
        )
        route = route_r.scalars().first()
        if not route:
            raise ValueError("Route not found")

        stops = route.stops or []
        if node_index < 0 or node_index >= len(stops):
            raise ValueError(f"Invalid node index {node_index}")

        departed_stop = stops[node_index]
        departed_name = departed_stop.get("name", f"Stop {node_index}")

        # 1. Update Redis
        await transport_state.set_current_node(route_id, node_index)

        # Set position to the node's coordinates
        await transport_state.update_live_position(
            route_id,
            departed_stop.get("lat", 0),
            departed_stop.get("lng", 0),
            speed=0, heading=0,
        )

        # Update Trip in DB
        trip_state = await transport_state.get_trip_state(route_id)
        if trip_state:
            trip_r = await self.db.execute(
                select(models.Trip).where(
                    models.Trip.id == trip_state["trip_id"],
                    models.Trip.state != "completed",
                )
            )
            trip = trip_r.scalars().first()
            if trip:
                trip.current_node_index = node_index
                trip.state = "in_transit"

        # 2. Compute ETA for next stops
        eta_minutes = 0
        next_stops = geofence_engine.get_students_to_notify(node_index, len(stops), n_ahead=2)
        if next_stops and len(stops) > next_stops[0]:
            next_stop = stops[next_stops[0]]
            # Try schedule-based ETA first
            eta_minutes = geofence_engine.calculate_eta_from_schedule(
                node_index, next_stops[0],
                route.avg_stop_times or [],
                route.departure_time or "07:00",
            )
            # Fall back to distance-based
            if eta_minutes is None:
                eta_minutes = geofence_engine.calculate_eta_simple(
                    departed_stop.get("lat", 0), departed_stop.get("lng", 0),
                    next_stop.get("lat", 0), next_stop.get("lng", 0),
                    avg_speed_kmh=30,
                )
            await transport_state.update_eta(
                route_id, next_stop.get("name", ""), eta_minutes,
            )

        # 3. FCM alerts to N+1 and N+2 (visible notification + go_live trigger)
        if next_stops:
            await push_notifications.notify_stop_approaching(
                self.db, route_id, route.route_name or route.route_number,
                node_index, departed_name, next_stops, eta_minutes, stops,
            )

        # 4. Silent FCM node_update to ALL enrolled students (powers Node-Jumper map phase)
        await push_notifications.notify_node_update_all(
            self.db, route_id, node_index, departed_name,
        )

        logger.info("Node arrival: route=%s node=%d stops_notified=%s", route_id, node_index, next_stops)
        return {
            "route_id": route_id,
            "node_index": node_index,
            "stop_name": departed_name,
            "next_stops_notified": next_stops,
            "eta_minutes": eta_minutes,
        }

    async def end_trip(self, route_id: str, college_id: str) -> Dict:
        """
        End a trip. Persist TripSummary to PostgreSQL. Clear Redis.
        This is the ONLY significant DB write in the entire transport flow.
        """
        # Get trip state before clearing
        trip_state = await transport_state.get_trip_state(route_id)
        current_node = await transport_state.get_current_node(route_id)
        max_speed = await transport_state.end_trip(route_id)

        if not trip_state:
            raise ValueError("No active trip for this route")

        # Get route
        route_r = await self.db.execute(
            select(models.BusRoute).where(models.BusRoute.id == route_id)
        )
        route = route_r.scalars().first()
        total_stops = len(route.stops or []) if route else 0

        # Update Trip to completed
        trip_r = await self.db.execute(
            select(models.Trip).where(
                models.Trip.id == trip_state["trip_id"]
            )
        )
        trip = trip_r.scalars().first()
        if trip:
            trip.state = "completed"
            trip.completed_at = datetime.utcnow()

        # Calculate duration
        started_at = datetime.fromisoformat(trip_state.get("started_at", datetime.utcnow().isoformat()))
        completed_at = datetime.utcnow()
        duration_min = int((completed_at - started_at).total_seconds() / 60)

        # Persist TripSummary
        summary = models.TripSummary(
            college_id=college_id,
            trip_id=trip_state["trip_id"],
            route_id=route_id,
            driver_id=route.driver_id if route else None,
            direction=trip_state.get("direction", "morning"),
            started_at=started_at,
            completed_at=completed_at,
            duration_minutes=duration_min,
            stops_visited=(current_node or 0) + 1,
            total_stops=total_stops,
            max_speed_kmh=max_speed,
            delay_minutes=0,
            date=date.today(),
        )
        self.db.add(summary)

        # Notify all students
        if route:
            await push_notifications.notify_trip_ended(
                self.db, route_id, route.route_name or route.route_number,
            )

        logger.info(
            "Trip ended: route=%s duration=%d min stops=%d/%d",
            route_id, duration_min, (current_node or 0) + 1, total_stops,
        )
        return {
            "trip_id": trip_state["trip_id"],
            "duration_minutes": duration_min,
            "stops_visited": (current_node or 0) + 1,
            "max_speed_kmh": max_speed,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # LIVE STATUS — Sub-1ms Redis reads
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_live_status(self, route_id: str) -> Dict:
        """
        Get complete bus status from Redis. Sub-1ms response.
        This is what the frontend polls every 10 seconds in Live Radar mode.
        """
        position = await transport_state.get_live_position(route_id)
        trip = await transport_state.get_trip_state(route_id)
        node = await transport_state.get_current_node(route_id)
        eta = await transport_state.get_eta(route_id)

        if not trip:
            return {"status": "inactive", "position": None, "node": None, "eta": None}

        return {
            "status": trip.get("state", "unknown"),
            "direction": trip.get("direction", "morning"),
            "position": position,
            "current_node": node,
            "eta": eta,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # TELEMETRY PROCESSING — For AIS 140 (when hardware arrives)
    # ═══════════════════════════════════════════════════════════════════════════

    async def process_telemetry(
        self, imei: str, lat: float, lng: float,
        speed: float, heading: float, sos: bool = False,
    ) -> Dict:
        """
        Process incoming AIS 140 GPS packet.
        1. IMEI → route lookup (cached)
        2. Redis position update
        3. Auto-geofence check
        4. Speed violation check
        5. Route deviation check
        """
        # IMEI → Device → Route lookup
        device_r = await self.db.execute(
            select(models.AIS140Device).where(
                models.AIS140Device.imei == imei,
                models.AIS140Device.is_deleted == False,
            )
        )
        device = device_r.scalars().first()
        if not device:
            raise ValueError(f"Unknown IMEI: {imei}")

        route_id = device.route_id
        if not route_id:
            raise ValueError(f"Device {imei} not assigned to a route")

        # Update device last ping
        device.last_ping_at = datetime.utcnow()

        # Get route
        route_r = await self.db.execute(
            select(models.BusRoute).where(models.BusRoute.id == route_id)
        )
        route = route_r.scalars().first()
        stops = route.stops or [] if route else []

        # SOS — bypass everything
        if sos and route:
            await push_notifications.notify_sos(
                self.db, device.college_id, route_id,
                route.route_name or route.route_number,
            )
            return {"action": "sos", "route_id": route_id}

        # 1. Update Redis position
        await transport_state.update_live_position(route_id, lat, lng, speed, heading)

        # 2. Check if trip is active
        trip = await transport_state.get_trip_state(route_id)
        if not trip:
            return {"action": "position_updated", "route_id": route_id, "trip_active": False}

        # 3. Auto-geofence check
        current_node = await transport_state.get_current_node(route_id) or 0
        breached, node_idx, stop_name = geofence_engine.check_geofence_breach(
            lat, lng, stops, current_node,
            default_radius_m=settings.TRANSPORT_GEOFENCE_RADIUS_M,
        )
        if breached:
            await self.process_node_arrival(route_id, node_idx, device.college_id)

        # 4. Speed violation
        if geofence_engine.detect_speed_violation(speed, settings.TRANSPORT_SPEED_LIMIT_KMH):
            await push_notifications.notify_speed_violation(
                self.db, device.college_id,
                route.route_name or route.route_number,
                speed, settings.TRANSPORT_SPEED_LIMIT_KMH,
            )

        return {
            "action": "telemetry_processed",
            "route_id": route_id,
            "geofence_breached": breached,
            "node": node_idx if breached else current_node,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # BOARDING & ATTENDANCE
    # ═══════════════════════════════════════════════════════════════════════════

    async def record_boarding(
        self, student_id: str, route_id: str, college_id: str,
    ) -> Dict:
        """Record that a student boarded the bus. Awards reward points."""
        # Get active trip
        trip_state = await transport_state.get_trip_state(route_id)
        if not trip_state:
            raise ValueError("No active trip on this route")

        current_node = await transport_state.get_current_node(route_id) or 0

        # Create attendance record
        attendance = models.TransportAttendance(
            college_id=college_id,
            student_id=student_id,
            trip_id=trip_state["trip_id"],
            route_id=route_id,
            boarded_at_stop=current_node,
        )
        self.db.add(attendance)

        # Award reward points for riding the bus
        reward = models.RewardPointLog(
            college_id=college_id,
            student_id=student_id,
            points=2,
            reason="Bus boarding",
            category="transport",
            balance_after=0,  # Will be calculated properly
        )
        self.db.add(reward)

        await self.db.flush()

        return {
            "attendance_id": attendance.id,
            "trip_id": trip_state["trip_id"],
            "boarded_at_stop": current_node,
            "points_earned": 2,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # FLEET DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_fleet_dashboard(self, college_id: str) -> Dict:
        """Admin overview of the entire transport fleet."""
        # Total routes
        routes_r = await self.db.execute(
            select(func.count(models.BusRoute.id)).where(
                models.BusRoute.college_id == college_id,
                models.BusRoute.is_active == True,
                models.BusRoute.is_deleted == False,
            )
        )
        total_routes = routes_r.scalar() or 0

        # Total enrolled students
        enrolled_r = await self.db.execute(
            select(func.count(models.TransportEnrollment.id)).where(
                models.TransportEnrollment.college_id == college_id,
                models.TransportEnrollment.is_active == True,
                models.TransportEnrollment.is_deleted == False,
            )
        )
        total_enrolled = enrolled_r.scalar() or 0

        # Active trips (from Redis)
        active_trips = await transport_state.get_all_active_trips()

        # Today's completed trips
        today_r = await self.db.execute(
            select(func.count(models.TripSummary.id)).where(
                models.TripSummary.college_id == college_id,
                models.TripSummary.date == date.today(),
            )
        )
        completed_today = today_r.scalar() or 0

        # AIS 140 devices
        devices_r = await self.db.execute(
            select(func.count(models.AIS140Device.id)).where(
                models.AIS140Device.college_id == college_id,
                models.AIS140Device.is_deleted == False,
            )
        )
        total_devices = devices_r.scalar() or 0

        return {
            "total_routes": total_routes,
            "total_enrolled": total_enrolled,
            "active_trips": len(active_trips),
            "active_trip_details": active_trips,
            "completed_today": completed_today,
            "total_ais140_devices": total_devices,
        }

    async def get_trip_history(
        self, college_id: str,
        route_id: str = None, days: int = 7,
    ) -> List[Dict]:
        """Get trip summaries for the fleet."""
        from datetime import timedelta
        since = date.today() - timedelta(days=days)

        stmt = (
            select(models.TripSummary)
            .where(
                models.TripSummary.college_id == college_id,
                models.TripSummary.date >= since,
            )
        )
        if route_id:
            stmt = stmt.where(models.TripSummary.route_id == route_id)

        stmt = stmt.order_by(models.TripSummary.date.desc(), models.TripSummary.started_at.desc())

        result = await self.db.execute(stmt)
        summaries = result.scalars().all()

        return [
            {
                "id": s.id,
                "route_id": s.route_id,
                "direction": s.direction,
                "date": s.date.isoformat(),
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                "duration_minutes": s.duration_minutes,
                "stops_visited": s.stops_visited,
                "total_stops": s.total_stops,
                "max_speed_kmh": s.max_speed_kmh,
                "delay_minutes": s.delay_minutes,
            }
            for s in summaries
        ]
