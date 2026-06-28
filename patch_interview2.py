import re

with open('backend/app/routers/interview.py', 'r') as f:
    content = f.read()

# Fix import
if ' Request' not in content and 'from fastapi import' in content:
    content = content.replace('from fastapi import APIRouter, Depends, HTTPException, UploadFile, File', 'from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request')
elif ' Request,' not in content and ' Request' not in content:
    content = content.replace('from fastapi import', 'from fastapi import Request,')

# Fix evaluate_audio
old_eval = '''@router.post("/interview/{interview_id}/audio_eval")
async def evaluate_audio(
    interview_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Asynchronously evaluate the final audio recording using Assembly AI."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Audio file cannot be empty")
    
    # We pass this to the interview service which will handle the AssemblyAI call and DB update
    return await interview_service.process_audio_evaluation(interview_id, content, file.content_type, user, session)'''

new_eval = '''@router.post("/interview/{interview_id}/audio_eval")
async def evaluate_audio(
    interview_id: str,
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Asynchronously evaluate the final audio recording using Assembly AI."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Audio file cannot be empty")
    
    base_url = str(request.base_url)
    # We pass this to the interview service which will handle the AssemblyAI call and DB update
    return await interview_service.process_audio_evaluation(interview_id, content, file.content_type, user, session, base_url)'''

if old_eval in content:
    content = content.replace(old_eval, new_eval)
else:
    print("Warning: old_eval not found in interview.py")

# Add webhook
webhook_code = '''

@router.post("/interview/assemblyai_webhook")
async def assemblyai_webhook(request: Request, session: AsyncSession = Depends(get_db)):
    """Handle async callbacks from AssemblyAI for audio evaluation."""
    payload = await request.json()
    return await interview_service.handle_assemblyai_webhook(payload, session)
'''
if 'assemblyai_webhook' not in content:
    content += webhook_code

with open('backend/app/routers/interview.py', 'w') as f:
    f.write(content)

print("Updated interview.py")
