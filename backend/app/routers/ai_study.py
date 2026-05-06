from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services.ai_service import ai_service

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
        # We need to construct the prompt from the messages
        # Since ai_service.generate_text is a simple text-in-text-out function for now,
        # we'll format the conversation history into a single prompt.
        conversation_history = f"System: {system_prompt}\n\n"
        for msg in request.messages:
            role = "Student" if msg.role == "user" else "AI Tutor"
            conversation_history += f"{role}: {msg.content}\n\n"
            
        conversation_history += "AI Tutor:"
        
        response_text = await ai_service.generate_text(conversation_history)
        
        return {
            "role": "assistant",
            "content": response_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
