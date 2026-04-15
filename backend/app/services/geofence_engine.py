"""
Geofence & ETA Engine
======================
Pure math — no external dependencies, no PostGIS.
Uses Haversine formula for distance calculations.
"""

import math
from typing import Optional, Tuple, List, Dict
from datetime import datetime


# Earth's radius in meters
EARTH_RADIUS_M = 6_371_000


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS coordinates.
    Returns distance in meters.
    """
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_M * c


def check_geofence_breach(
    lat: float, lng: float,
    stops: List[Dict], current_node: int,
    default_radius_m: int = 100,
) -> Tuple[bool, int, str]:
    """
    Check if GPS coordinates breach any UPCOMING stop geofence.
    Only checks stops after current_node (bus moves forward).

    Returns:
        (breached: bool, stop_index: int, stop_name: str)
    """
    for i, stop in enumerate(stops):
        if i <= current_node:
            continue  # Skip already-visited stops

        stop_lat = stop.get("lat", 0)
        stop_lng = stop.get("lng", 0)
        radius = stop.get("geofence_radius_m", default_radius_m)

        distance = haversine_distance(lat, lng, stop_lat, stop_lng)

        if distance <= radius:
            return True, i, stop.get("name", f"Stop {i}")

    return False, -1, ""


def calculate_eta_simple(
    current_lat: float, current_lng: float,
    target_lat: float, target_lng: float,
    avg_speed_kmh: float = 30,
) -> int:
    """
    Simple distance-based ETA calculation.
    Returns estimated minutes to reach target.
    Default 30 km/h for city traffic.
    """
    if avg_speed_kmh <= 0:
        avg_speed_kmh = 30

    distance_m = haversine_distance(current_lat, current_lng, target_lat, target_lng)
    distance_km = distance_m / 1000
    hours = distance_km / avg_speed_kmh
    minutes = int(math.ceil(hours * 60))

    return max(1, minutes)  # At least 1 minute


def calculate_eta_from_schedule(
    current_node: int,
    target_node: int,
    avg_stop_times: List[str],
    departure_time: str,
) -> Optional[int]:
    """
    ETA based on historical average arrival times per stop.
    avg_stop_times: ["07:15", "07:22", "07:30", ...] — expected arrival at each stop.

    Returns estimated minutes from now, or None if data insufficient.
    """
    if not avg_stop_times or target_node >= len(avg_stop_times):
        return None

    try:
        target_time_str = avg_stop_times[target_node]
        now = datetime.now()

        # Parse target time
        parts = target_time_str.split(":")
        target_hour, target_min = int(parts[0]), int(parts[1])
        target_dt = now.replace(hour=target_hour, minute=target_min, second=0, microsecond=0)

        diff = (target_dt - now).total_seconds() / 60
        return max(1, int(diff)) if diff > 0 else 0

    except (IndexError, ValueError):
        return None


def detect_speed_violation(speed_kmh: float, limit: int = 80) -> bool:
    """Check if current speed exceeds the safety limit."""
    return speed_kmh > limit


def detect_route_deviation(
    lat: float, lng: float,
    stops: List[Dict],
    max_deviation_m: int = 500,
) -> bool:
    """
    Check if bus has deviated from its route.
    Calculates minimum distance to ANY stop on the route.
    If minimum distance > max_deviation_m, bus is off-route.
    """
    min_dist = float("inf")

    for stop in stops:
        dist = haversine_distance(lat, lng, stop.get("lat", 0), stop.get("lng", 0))
        min_dist = min(min_dist, dist)

    return min_dist > max_deviation_m


def find_nearest_stop(lat: float, lng: float, stops: List[Dict]) -> Tuple[int, str, float]:
    """
    Find the nearest stop to current coordinates.
    Returns (stop_index, stop_name, distance_m).
    """
    nearest_idx = 0
    nearest_name = ""
    nearest_dist = float("inf")

    for i, stop in enumerate(stops):
        dist = haversine_distance(lat, lng, stop.get("lat", 0), stop.get("lng", 0))
        if dist < nearest_dist:
            nearest_dist = dist
            nearest_idx = i
            nearest_name = stop.get("name", f"Stop {i}")

    return nearest_idx, nearest_name, nearest_dist


def get_students_to_notify(
    node_index: int,
    total_stops: int,
    n_ahead: int = 2,
) -> List[int]:
    """
    Get the stop indices of students who should be notified.
    N-2 rule: notify students at the next N stops ahead.
    
    For first stops exception: if node_index == 0 (trip just started),
    returns stops 0 and 1.
    
    Returns list of stop indices to notify.
    """
    targets = []
    for offset in range(1, n_ahead + 1):
        target = node_index + offset
        if target < total_stops:
            targets.append(target)
    return targets
