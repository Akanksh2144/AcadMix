import re

with open('backend/app/workers/livekit_agent.py', 'r') as f:
    content = f.read()

old_logic = '''    for value in (target_role, company, interview_type):
        if value:
            add(value)

    resume_sample = (resume_context or "")[:6000]
    resume_lower = resume_sample.lower()
    for term in COMMON_DEEPGRAM_KEYTERMS:
        if term.lower() in resume_lower:
            add(term)

    for match in KEYTERM_PATTERN.finditer(resume_sample):
        add(match.group(0))

    for term in COMMON_DEEPGRAM_KEYTERMS:
        add(term)'''

new_logic = '''    for value in (target_role, company, interview_type):
        if value:
            add(value)

    # 1. Guarantee all COMMON core terms are included first (takes ~46 slots)
    for term in COMMON_DEEPGRAM_KEYTERMS:
        add(term)

    # 2. Extract specific technical terms from the resume to fill remaining slots (up to 80)
    resume_sample = (resume_context or "")[:6000]
    from collections import Counter
    resume_terms = []
    for match in KEYTERM_PATTERN.finditer(resume_sample):
        cleaned = _clean_keyterm(match.group(0))
        if cleaned:
            resume_terms.append(cleaned)
            
    # Add most frequent resume terms first
    term_counts = Counter(resume_terms)
    for term, _ in term_counts.most_common():
        if len(keyterms) >= MAX_DEEPGRAM_KEYTERMS:
            break
        add(term)'''

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('backend/app/workers/livekit_agent.py', 'w') as f:
        f.write(content)
    print("Done updating livekit_agent.py")
else:
    print("Could not find old logic in livekit_agent.py")
