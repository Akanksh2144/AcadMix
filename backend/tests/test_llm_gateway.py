import pytest
from unittest.mock import AsyncMock, patch
from app.services.llm_gateway import gateway

@pytest.mark.asyncio
async def test_erp_escalation_tier1_success():
    """Test that a standard query routes to Tier 1 (erp_insights) and returns successfully."""
    with patch.object(gateway, 'complete', new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = "SELECT * FROM students;"
        
        result = await gateway.complete_erp("Show me all students", [{"role": "user", "content": "Show me all students"}])
        
        assert result == "SELECT * FROM students;"
        mock_complete.assert_called_once_with("erp_insights", [{"role": "user", "content": "Show me all students"}], json_mode=False)


@pytest.mark.asyncio
async def test_erp_escalation_markdown_parsing():
    """Test that valid SQL wrapped in markdown fences does not falsely trigger escalation."""
    with patch.object(gateway, 'complete', new_callable=AsyncMock) as mock_complete:
        # Tier 1 returns valid SQL wrapped in markdown
        mock_complete.return_value = "```sql\nSELECT * FROM students;\n```"
        
        result = await gateway.complete_erp("Get students", [])
        
        # It should ONLY hit Tier 1, successfully parsing the SELECT and returning the raw result
        assert mock_complete.call_count == 1
        assert mock_complete.call_args_list[0][0][0] == "erp_insights"
        assert result == "```sql\nSELECT * FROM students;\n```"


@pytest.mark.asyncio
async def test_erp_escalation_direct_tier2_complex_keyword():
    """Test that a query containing a complex signal like 'trend' directly routes to Tier 2."""
    with patch.object(gateway, 'complete', new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = "SELECT * FROM trends;"
        
        result = await gateway.complete_erp("Show me the trend of marks", [])
        
        mock_complete.assert_called_once_with("erp_complex", [], json_mode=False)


@pytest.mark.asyncio
async def test_erp_escalation_tier2_fallback_from_prose():
    """Test fallback from Tier 1 to Tier 2 when Tier 1 returns non-SQL prose."""
    with patch.object(gateway, 'complete', new_callable=AsyncMock) as mock_complete:
        # First call (Tier 1) returns prose. Second call (Tier 2) returns valid SQL.
        mock_complete.side_effect = ["Here is the query you asked for: SELECT *", "SELECT * FROM students;"]
        
        result = await gateway.complete_erp("Get students", [])
        
        assert mock_complete.call_count == 2
        assert mock_complete.call_args_list[0][0][0] == "erp_insights"
        assert mock_complete.call_args_list[1][0][0] == "erp_complex"
        assert result == "SELECT * FROM students;"
        

@pytest.mark.asyncio
async def test_erp_escalation_tier3_fallback():
    """Test full escalation chain: Tier 1 fails -> Tier 2 fails -> Tier 3 succeeds."""
    with patch.object(gateway, 'complete', new_callable=AsyncMock) as mock_complete:
        # Tier 1 expresses inability, Tier 2 expresses inability, Tier 3 succeeds
        mock_complete.side_effect = ["I am unable to do this", "I CANNOT process this", "SELECT * FROM complex_table;"]
        
        result = await gateway.complete_erp("Complex join thing", [])
        
        assert mock_complete.call_count == 3
        assert mock_complete.call_args_list[0][0][0] == "erp_insights"
        assert mock_complete.call_args_list[1][0][0] == "erp_complex"
        assert mock_complete.call_args_list[2][0][0] == "erp_last_resort"
        assert result == "SELECT * FROM complex_table;"
        

@pytest.mark.asyncio
async def test_erp_escalation_tier2_high_join_count():
    """Test escalation to Tier 2 when Tier 1 generates a query with 3+ JOINs (complex Logic)."""
    with patch.object(gateway, 'complete', new_callable=AsyncMock) as mock_complete:
        mock_complete.side_effect = [
            "SELECT a FROM t1 JOIN t2 ON x JOIN t3 ON y JOIN t4 ON z;", 
            "SELECT a FROM verified_table;"
        ]
        
        result = await gateway.complete_erp("Get students across departments and history", [])
        
        assert mock_complete.call_count == 2
        assert mock_complete.call_args_list[0][0][0] == "erp_insights"
        assert mock_complete.call_args_list[1][0][0] == "erp_complex"
        assert result == "SELECT a FROM verified_table;"
