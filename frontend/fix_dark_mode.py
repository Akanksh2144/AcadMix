import os, re

pages_dir = r"c:\AcadeMix\frontend\src\pages"

# Pages to fix (all except StudentDashboard and LoginPage which are already done)
pages = [
    "QuizResults.js", "SemesterResults.js", "Analytics.js", "Leaderboard.js",
    "AvailableQuizzes.js", "Placements.js", "CodePlayground.js", "QuizAttempt.js",
    "TeacherDashboard.js", "TeacherQuizzes.js", "HodDashboard.js", "QuizBuilder.js",
    "LiveMonitor.js", "QuizCalendar.js", "ClassResults.js", "MarksEntry.js",
    "ExamCellDashboard.js", "AdminDashboard.js", "UserManagement.js", "StudentManagement.js"
]

DARK_BG = " dark:bg-[#0B0F19] transition-colors duration-300"

for page in pages:
    filepath = os.path.join(pages_dir, page)
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {page}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix 1: Add dark:bg to all min-h-screen bg-[#F8FAFC] containers
    # But skip if already has dark:bg
    content = re.sub(
        r'(min-h-screen bg-\[#F8FAFC\])(?! dark:)',
        r'\1' + DARK_BG,
        content
    )
    
    # Fix 2: Add dark:text to headings that use text-slate-900
    content = content.replace('text-slate-900"', 'text-slate-900 dark:text-white"')
    content = content.replace("text-slate-900'", "text-slate-900 dark:text-white'")
    
    # Fix 3: Add dark variant to bg-white cards/containers
    # bg-white rounded -> dark bg
    content = re.sub(
        r'(bg-white(?:/\d+)? rounded-[23]xl[^"]*border border-slate-100(?:/50)?)(?! dark:)',
        r'\1 dark:bg-[#1A202C] dark:border-white/[0.06]',
        content
    )
    
    # Fix 4: bg-white with just rounded (simpler cards)
    content = re.sub(
        r'(bg-white rounded-(?:2|3)xl)(?![^"]*dark:)',
        r'\1 dark:bg-[#1A202C]',
        content
    )
    
    # Fix 5: Simple bg-white with shadow 
    content = re.sub(
        r'(bg-white rounded-xl)(?![^"]*dark:)',
        r'\1 dark:bg-[#1A202C]',
        content
    )
    
    # Fix 6: text-slate-800 headings
    content = re.sub(
        r'(text-slate-800)(?![^"]*dark:text)',
        r'\1 dark:text-slate-100',
        content
    )
    
    # Fix 7: text-slate-700 body text
    content = re.sub(
        r'(text-slate-700)(?![^"]*dark:text)',
        r'\1 dark:text-slate-300',
        content
    )
    
    # Fix 8: text-slate-600 secondary text
    content = re.sub(
        r'(text-slate-600)(?![^"]*dark:text)',
        r'\1 dark:text-slate-400',
        content
    )
    
    # Fix 9: text-slate-500 subtle text
    content = re.sub(
        r'(text-slate-500)(?![^"]*dark:text)',
        r'\1 dark:text-slate-400',
        content
    )
    
    # Fix 10: bg-slate-50 backgrounds (form fields, badges)
    content = re.sub(
        r'(bg-slate-50)(?![^"]*dark:bg)',
        r'\1 dark:bg-slate-800/50',
        content
    )
    
    # Fix 11: bg-white without rounded (plain white backgrounds)
    content = re.sub(
        r'(className="[^"]*)(bg-white)(?![^"]*dark:bg)([^"]*")',
        r'\1\2 dark:bg-[#1A202C]\3',
        content
    )
    
    # Fix 12: border-slate-100 or border-slate-200
    content = re.sub(
        r'(border-slate-(?:100|200))(?![^"]*dark:border)',
        r'\1 dark:border-slate-700',
        content
    )
    
    # Fix 13: bg-indigo-50 buttons/badges
    content = re.sub(
        r'(bg-indigo-50)(?![^"]*dark:bg)',
        r'\1 dark:bg-indigo-500/15',
        content
    )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"FIXED: {page}")
    else:
        print(f"NO CHANGES: {page}")
