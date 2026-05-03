from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

class InsightsQueryRequest(BaseModel):
    message: str = Field(..., description="The user's natural language question")
    session_history: List[ChatMessage] = Field(default_factory=list, description="Previous messages in the conversation")
    cached_sql: Optional[str] = Field(None, description="Pre-generated SQL to skip LLM generation")
    active_college_id: Optional[str] = Field(None, description="Only for Nodal Officers to query a specific slice")
    
class InsightsQueryResponse(BaseModel):
    summary: str = Field(..., description="Natural language summary of the results")
    data: List[Dict[str, Any]] = Field(default_factory=list, description="Row data from the database query")
    columns: List[str] = Field(default_factory=list, description="List of columns for table display")
    chart_suggestion: Optional[str] = Field(None, description="'bar_chart', 'grouped_bar', 'stacked_bar', 'line_chart', 'pie_chart', 'kpi_card' or None")
    x_column: Optional[str] = Field(None, description="Column for X-axis (category/label)")
    y_column: Optional[str] = Field(None, description="Primary numeric column for Y-axis")
    group_column: Optional[str] = Field(None, description="Secondary categorical dimension for multi-series charts")
    all_metrics: List[str] = Field(default_factory=list, description="All numeric column names for metric switching")
    metric_chart_map: Dict[str, str] = Field(default_factory=dict, description="Maps each metric to its best chart type (e.g., {'student_count': 'grouped_bar', 'avg_cgpa': 'bar_chart'})")
    exportable: bool = Field(True, description="True if the data can be exported to CSV")
    generated_sql: Optional[str] = Field(None, description="The SQL query that was executed (for debugging/transparency)")

class PinnedInsightCreate(BaseModel):
    title: str
    nl_query: str
    cached_sql: str
    chart_suggestion: Optional[str] = None
    active_college_id: Optional[str] = None

class PinnedInsightResponse(BaseModel):
    id: str
    title: str
    nl_query: str
    cached_sql: str
    chart_suggestion: Optional[str] = None
    role: str
    created_at: Any
