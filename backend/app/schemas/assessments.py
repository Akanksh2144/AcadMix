from pydantic import BaseModel, Field
from typing import List, Optional

class AIGenerationRequest(BaseModel):
    prompt: str = Field(..., description="The context or instructions from the faculty on what quiz to generate.")
    num_questions: int = Field(default=5, ge=1, le=20)
    include_mcq: bool = True
    include_short: bool = False
    
class AIQuestionOptionResponse(BaseModel):
    id: str
    text: str
    
class AIQuestionResponse(BaseModel):
    question_text: str = Field(description="The actual question string.")
    question_type: str = Field(description="Format: mcq, short_answer")
    co_id: str = Field(description="The UUID of the CourseOutcome this question targets strictly.")
    po_id: str = Field(description="The UUID of the ProgramOutcome mapped to the targeted CourseOutcome.")
    bloom_level: str = Field(description="Bloom's Taxonomy category (e.g., Remember, Apply).")
    marks: float = Field(default=1.0)
    
    # Specifics for MCQs
    options: Optional[List[AIQuestionOptionResponse]] = None
    answer_key: Optional[str] = Field(None, description="The 'id' of the correct option if MCQ, or a sample correct string for short_answer.")

class AIGeneratedAssessmentResponse(BaseModel):
    title: str = Field(description="The generated title of the Quiz.")
    questions: List[AIQuestionResponse]
    
class AIGenerationResultWrapper(BaseModel):
    assessment: AIGeneratedAssessmentResponse
    warnings: List[str] = []

class AssessmentCommitRequest(BaseModel):
    type: str = "quiz"
    title: str = Field(..., description="The title of the assessment.")
    prompt_used: Optional[str] = None
    questions: List[AIQuestionResponse]
