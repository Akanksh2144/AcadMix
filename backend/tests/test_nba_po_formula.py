import pytest

def calculate_po_attainment(direct_score, indirect_score, direct_weight=0.8, indirect_weight=0.2):
    """
    Weighted PO Attainment Formula for NBA.
    NBA Tier II guidelines often default to 80% direct and 20% indirect.
    """
    if direct_score is None and indirect_score is None:
        return None
        
    direct = direct_score or 0.0
    indirect = indirect_score or 0.0
    
    return round((direct * direct_weight) + (indirect * indirect_weight), 2)


def calculate_course_po_average(co_attainments, co_po_mappings):
    """
    Calculates the course-level PO attainment by averaging the mapped CO attainments.
    If a CO maps to a PO, that CO's attainment is included in the average for that PO.
    """
    po_sums = {}
    po_counts = {}
    
    for co_id, attainment in co_attainments.items():
        if attainment is None:
            continue
            
        mappings = co_po_mappings.get(co_id, {})
        for po_code, mapping_strength in mappings.items():
            if mapping_strength and mapping_strength > 0:
                po_sums[po_code] = po_sums.get(po_code, 0.0) + attainment
                po_counts[po_code] = po_counts.get(po_code, 0) + 1
                
    result = {}
    for po_code, total in po_sums.items():
        if po_counts[po_code] > 0:
            result[po_code] = round(total / po_counts[po_code], 2)
            
    return result


class TestNBAPOFormula:
    
    def test_calculate_po_attainment_standard_weights(self):
        # 80% of 2.5 + 20% of 2.0 = 2.0 + 0.4 = 2.4
        result = calculate_po_attainment(2.5, 2.0, 0.8, 0.2)
        assert result == 2.4

    def test_calculate_po_attainment_custom_weights(self):
        # 70% of 3.0 + 30% of 2.0 = 2.1 + 0.6 = 2.7
        result = calculate_po_attainment(3.0, 2.0, 0.7, 0.3)
        assert result == 2.7

    def test_calculate_po_attainment_missing_indirect(self):
        # 80% of 2.5 + 20% of 0.0 = 2.0
        result = calculate_po_attainment(2.5, None)
        assert result == 2.0

    def test_calculate_po_attainment_all_none(self):
        result = calculate_po_attainment(None, None)
        assert result is None

    def test_calculate_course_po_average(self):
        co_attainments = {
            "CO1": 2.5,
            "CO2": 3.0,
            "CO3": 2.0,
            "CO4": None  # Should be ignored
        }
        
        co_po_mappings = {
            "CO1": {"PO1": 3, "PO2": 2, "PO3": 0},
            "CO2": {"PO1": 2, "PO3": 1},
            "CO3": {"PO1": 3, "PO2": 1, "PO4": 3},
            "CO4": {"PO5": 3}
        }
        
        result = calculate_course_po_average(co_attainments, co_po_mappings)
        
        # PO1 maps to CO1(2.5), CO2(3.0), CO3(2.0). Avg = 7.5 / 3 = 2.5
        assert result["PO1"] == 2.5
        # PO2 maps to CO1(2.5), CO3(2.0). Avg = 4.5 / 2 = 2.25
        assert result["PO2"] == 2.25
        # PO3 maps to CO2(3.0). Avg = 3.0
        assert result["PO3"] == 3.0
        # PO4 maps to CO3(2.0). Avg = 2.0
        assert result["PO4"] == 2.0
        # PO5 maps to CO4, but CO4 has None attainment, so PO5 should not be in result
        assert "PO5" not in result
