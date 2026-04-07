import os, glob, re

files = glob.glob('C:/AcadMix/frontend/src/pages/*Dashboard.js')

for file in files:
    filename = os.path.basename(file)
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add UserProfileModal import if not there
    if 'UserProfileModal' not in content:
        content = re.sub(
            r"(import React.*?from 'react';)",
            r"\1\nimport UserProfileModal from '../components/UserProfileModal';",
            content
        )

    # 2. Add showProfile state if not there
    if 'showProfile' not in content:
        # Find const [dashboard, setDashboard] or const [activeTab
        content = re.sub(
            r"(const \[activeTab[^;]+;)",
            r"\1\n  const [showProfile, setShowProfile] = useState(false);",
            content
        )

    # 3. Replace the plain span displaying user name with the universal Profile Pill
    # Look for: <span className="btn-ghost !px-4 !py-2 text-sm">{user?.name...}</span>
    pill_code = """<button onClick={() => setShowProfile(true)} className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-left border border-slate-100 dark:border-white/5">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <UserCircle size={18} weight="duotone" className="text-indigo-500" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user?.name}</p>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-500 leading-tight mt-0.5">{user?.id || user?.role}</p>
              </div>
            </button>"""
            
    # Some older panels might only have a span or p with user.name
    # <span className="btn-ghost !px-4 !py-2 text-sm">{user?.name}</span>
    # <span className="btn-ghost !px-4 !py-2 text-sm">{user?.name || '...'}</span>
    content = re.sub(
        r'<span className="btn-ghost !px-4 !py-2 text-sm">\{user\?\.name[^<]*\}</span>',
        pill_code,
        content
    )

    # 4. Embed <AnimatePresence>{showProfile && <UserProfileModal ... />}</AnimatePresence>
    # right before the last closing </div> inside the return.
    if '<UserProfileModal' not in content:
        content = re.sub(
            r'(</div>\s*</div>\s*);\s*};',
            r'  <AnimatePresence>\n        {showProfile && <UserProfileModal user={user} onClose={() => setShowProfile(false)} />}\n      </AnimatePresence>\n    \1',
            content
        )

    # Ensure UserCircle is imported!
    if 'UserCircle' not in content and 'UserProfileModal' in content:
        # Let's just blindly add UserCircle to phosphor-icons/react imports
        content = re.sub(
            r"from ('|\")@phosphor-icons/react('|\");",
            r", UserCircle } \from \1@phosphor-icons/react\2;",
            content
        )
        # Fix double commas if they happen
        content = re.sub(r",\s*,\s*UserCircle", ", UserCircle", content)
        content = re.sub(r"}\s*, UserCircle", ", UserCircle }", content) # Need to put it inside the braces
        # Wait, the above is dangerous. Let's do it safer:
        content = re.sub(
            r"(import \{[^}]+)\} from ['\"]@phosphor-icons/react['\"];",
            r"\1, UserCircle } from '@phosphor-icons/react';",
            content
        )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
