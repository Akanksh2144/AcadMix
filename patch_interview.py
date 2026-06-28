import re

with open('backend/app/routers/interview.py', 'r') as f:
    content = f.read()

# 1. Add import
if 'from app.core.cache import _get_redis' not in content:
    content = content.replace('from app.services import interview_service, voice_service', 'from app.services import interview_service, voice_service\nfrom app.core.cache import _get_redis')

# 2. Remove _session_voices dict
content = re.sub(r'# Per-session voice lock.*?\n_session_voices: dict\[str, str\] = \{\}\n', '', content, flags=re.DOTALL)

# 3. Update start_interview
old_start = '''    # Lock the specific persona voice provided by the frontend for this session
    interview_id = result.get("interview_id") if isinstance(result, dict) else None
    if interview_id:
        voice_id = req.get("voice_id")
        if voice_id:
            _session_voices[interview_id] = voice_id
        else:
            interview_type = req.get("interview_type", "technical")
            _session_voices[interview_id] = voice_service.get_persona_voice(interview_type)
    return result'''

new_start = '''    # Lock the specific persona voice provided by the frontend for this session
    interview_id = result.get("interview_id") if isinstance(result, dict) else None
    if interview_id:
        voice_id = req.get("voice_id")
        if not voice_id:
            interview_type = req.get("interview_type", "technical")
            voice_id = voice_service.get_persona_voice(interview_type)
            
        redis = await _get_redis()
        if redis:
            await redis.set(f"interview_voice:{interview_id}", voice_id, ex=3600)
    return result'''
content = content.replace(old_start, new_start)

# 4. Update end_interview
old_end = '''    # Clean up session voice lock
    _session_voices.pop(interview_id, None)
    return await interview_service.end_interview(interview_id, user, session)'''

new_end = '''    # Clean up session voice lock from Redis
    redis = await _get_redis()
    if redis:
        await redis.delete(f"interview_voice:{interview_id}")
    return await interview_service.end_interview(interview_id, user, session)'''
content = content.replace(old_end, new_end)

# 5. Update speak_text
old_speak = '''    # Use the session's locked voice if available
    voice_id = _session_voices.get(interview_id)'''

new_speak = '''    # Fetch the session's locked voice from Redis if available
    redis = await _get_redis()
    voice_id = None
    if redis:
        raw_voice = await redis.get(f"interview_voice:{interview_id}")
        if raw_voice:
            voice_id = raw_voice.decode("utf-8") if isinstance(raw_voice, bytes) else raw_voice'''
content = content.replace(old_speak, new_speak)

with open('backend/app/routers/interview.py', 'w') as f:
    f.write(content)

print('Done updating interview.py')
