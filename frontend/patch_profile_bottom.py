import os, glob, re

files = glob.glob('C:/AcadMix/frontend/src/pages/*Dashboard.js')

for file in files:
    filename = os.path.basename(file)
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Append <UserProfileModal> right before the final `</div>\n    </div>\n  );\n};`
    if '<UserProfileModal' not in content and 'StudentDashboard' not in filename and 'TeacherDashboard' not in filename:
        content = re.sub(
            r'(</div>\s*</div>\s*\);\s*};)',
            r'  <AnimatePresence>\n        {showProfile && <UserProfileModal user={user} onClose={() => setShowProfile(false)} />}\n      </AnimatePresence>\n    \1',
            content
        )
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
