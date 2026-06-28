import re

with open('backend/app/services/interview_service.py', 'r') as f:
    content = f.read()

# 1. Update process_audio_evaluation
old_process = '''async def process_audio_evaluation(interview_id: str, content: bytes, content_type: str, user: dict, session: AsyncSession) -> dict:'''
new_process = '''async def process_audio_evaluation(interview_id: str, content: bytes, content_type: str, user: dict, session: AsyncSession, base_url: str) -> dict:'''
if old_process in content:
    content = content.replace(old_process, new_process)
else:
    print("Warning: old_process not found")

old_payload = '''        payload = {
            "audio_url": audio_url,
            "sentiment_analysis": True,
            "disfluencies": True,
        }'''
new_payload = '''        webhook_url = f"{base_url.rstrip('/')}/api/v1/interview/assemblyai_webhook"
        payload = {
            "audio_url": audio_url,
            "sentiment_analysis": True,
            "disfluencies": True,
            "webhook_url": webhook_url,
        }'''
if old_payload in content:
    content = content.replace(old_payload, new_payload)
else:
    print("Warning: old_payload not found")

# 2. Add handle_assemblyai_webhook
webhook_handler = '''

async def handle_assemblyai_webhook(payload: dict, session: AsyncSession) -> dict:
    """Process the AssemblyAI callback, fetch the transcript metrics, and merge into DB."""
    transcript_id = payload.get("transcript_id")
    status = payload.get("status")
    
    if not transcript_id or status != "completed":
        return {"message": "Ignored"}
        
    # Find the interview by JSON field
    from sqlalchemy import cast
    from sqlalchemy.dialects.postgresql import JSONB
    
    # We must do a manual text search or use jsonb contains
    # We will fetch recent interviews and filter manually if the direct query is complex, 
    # but a simple direct query is better:
    stmt = select(models.MockInterview).where(
        models.MockInterview.ai_feedback['assembly_ai_job_id'].astext == transcript_id
    )
    result = await session.execute(stmt)
    interview = result.scalars().first()
    
    if not interview:
        return {"message": "Interview not found for this transcript"}
        
    import httpx
    headers = {"authorization": settings.ASSEMBLYAI_API_KEY}
    transcript_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(transcript_url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            
            # Extract disfluencies and sentiment
            feedback = interview.ai_feedback or {}
            
            # Basic merging of Assembly AI insights
            feedback["assembly_ai_status"] = "completed"
            
            disfluencies_count = sum(1 for word in data.get("words", []) if word.get("text", "").lower() in ["um", "uh", "hmm", "mhm"])
            feedback["disfluencies_count"] = disfluencies_count
            
            # Could also aggregate sentiment here if needed
            
            interview.ai_feedback = feedback
            flag_modified(interview, "ai_feedback")
            await session.commit()
            
    return {"message": "Success"}
'''
if 'handle_assemblyai_webhook' not in content:
    content += webhook_handler

with open('backend/app/services/interview_service.py', 'w') as f:
    f.write(content)

print("Updated interview_service.py")
