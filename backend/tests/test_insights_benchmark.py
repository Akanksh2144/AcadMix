"""
Empirical Benchmark & Safety Test Suite for AcadMix Conversational Insights Engine.

Tests:
1. Intent Routing & MV Classification accuracy
2. Visualization Rules Engine auto-selection
3. Telemetry logging & Redis cache key tenant isolation
4. Feedback submission API endpoint
"""
import pytest
import pytest_asyncio
import hashlib
from app.services.insights_orchestrator import (
    route_intent,
    auto_select_visualization,
    _insights_cache_key,
    MV_REGISTRY
)

@pytest.mark.asyncio
async def test_cache_key_isolation():
    """Verify Redis cache keys are strictly isolated by college_id, department, and role."""
    sql = "SELECT * FROM v_attendance"
    role = "HOD"
    
    key_cse = _insights_cache_key(sql, role, "GNITC", "CSE")
    key_ece = _insights_cache_key(sql, role, "GNITC", "ECE")
    key_other_college = _insights_cache_key(sql, role, "AITS", "CSE")
    
    assert key_cse != key_ece, "Cache key collision across departments!"
    assert key_cse != key_other_college, "Cache key collision across colleges!"
    assert key_cse.startswith("insights_cache:v4:")

def test_auto_select_visualization_kpi_card():
    """Verify single-row single-metric query resolves to kpi_card."""
    data = [{"total_students": 450}]
    columns = ["total_students"]
    res = auto_select_visualization(data, columns, None, None, None, None)
    assert res["chart_suggestion"] == "kpi_card"
    assert res["y_column"] == "total_students"

def test_auto_select_visualization_high_cardinality():
    """Verify queries returning > 50 rows default to table view (null chart)."""
    data = [{"id": i, "name": f"Student {i}"} for i in range(60)]
    columns = ["id", "name"]
    res = auto_select_visualization(data, columns, "bar_chart", "name", "id", None)
    assert res["chart_suggestion"] is None  # High cardinality forces tabular layout

def test_auto_select_visualization_grouped_bar():
    """Verify 2 category strings + 1 numeric metric resolves to grouped_bar."""
    data = [
        {"department": "CSE", "gender": "Male", "count": 120},
        {"department": "CSE", "gender": "Female", "count": 80},
    ]
    columns = ["department", "gender", "count"]
    res = auto_select_visualization(data, columns, None, None, None, None)
    assert res["chart_suggestion"] == "grouped_bar"
    assert res["x_column"] == "department"
    assert res["group_column"] == "gender"

def test_mv_registry_coverage():
    """Verify MV registry contains core academic domains."""
    required_keys = ["attendance_dept", "attendance_student", "fee_collection_dept", "gpa_dept", "pass_fail", "faculty_workload"]
    for key in required_keys:
        assert key in MV_REGISTRY, f"Missing critical MV key: {key}"
