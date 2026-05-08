from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.llm_gateway import gateway

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None
    course_id: Optional[str] = None

@router.post("/study-assistant/chat")
async def chat_with_study_assistant(
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
    """
    Chat with the AI Study Assistant.
    Provides context-aware tutoring based on the provided context (e.g., syllabus, notes).
    """
    system_prompt = "You are AcadMix AI, an expert academic tutor and study assistant. Your goal is to help students learn effectively. Explain concepts clearly, encourage active recall, and use the Socratic method when appropriate."
    
    if request.context:
        system_prompt += f"\n\nHere is some context material the student is studying. Use this to inform your answers:\n{request.context}"
        
    try:
        llm_messages = [{"role": "system", "content": system_prompt}]
        for msg in request.messages:
            role = msg.role if msg.role in ["user", "system", "assistant"] else "user"
            llm_messages.append({"role": role, "content": msg.content})
            
        response_text = await gateway.complete("ami_coach", messages=llm_messages)
        
        return {
            "role": "assistant",
            "content": response_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
