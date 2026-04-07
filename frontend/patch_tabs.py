import os, glob, re

color_map = {
    'StudentDashboard.js': 'text-cyan-600 dark:text-cyan-400',
    'TeacherDashboard.js': 'text-blue-600 dark:text-blue-400',
    'HodDashboard.js': 'text-purple-600 dark:text-purple-400',
    'AdminDashboard.js': 'text-indigo-600 dark:text-indigo-400',
    'ParentDashboard.js': 'text-emerald-600 dark:text-emerald-400',
    'TPODashboard.js': 'text-rose-600 dark:text-rose-400',
    'ExamCellDashboard.js': 'text-amber-600 dark:text-amber-400',
    'AlumniDashboard.js': 'text-pink-600 dark:text-pink-400',
}

files = glob.glob('C:/AcadMix/frontend/src/pages/*Dashboard.js')

for file in files:
    filename = os.path.basename(file)
    if 'IndustryDashboard.js' in filename or 'NodalOfficerDashboard.js' in filename: continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Outer container replace two divs with one
    content = re.sub(
        r'<div className="mb-8 overflow-x-auto"[^>]*>\s*<div className="flex items-center gap-1\.5[^"]*">',
        '<div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl mb-8 hide-scrollbar">',
        content
    )
    
    # 2. Button class mapping
    content = re.sub(
        r'className={`px-3\.5 py-2 rounded-\[14px\] text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 \${',
        'className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${',
        content
    )

    # 3. Active color state
    active_color = color_map.get(filename, 'text-indigo-600 dark:text-indigo-400')
    content = re.sub(
        r'("|\')bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md("|\')',
        f"'bg-white dark:bg-[#1A202C] {active_color} shadow-sm'",
        content
    )

    # 4. Inactive color state
    content = re.sub(
        r'("|\')text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50("|\')',
        "'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'",
        content
    )
    content = re.sub(
        r'("|\')text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50("|\')',
        "'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'",
        content
    )
    
    # Let's fix the extra closing </div> for the outer container. We replaced two open tags with one.
    # We can try to locate the end of the tabs using regex to just remove one adjacent </div></div>
    content = re.sub(
        r'</button>\s*</map>\s*</div>\s*</div>',  # Map block ends usually here, but wait...
        'wait',
        content
    )
    # Actually, look for the mapped buttons closure:
    # 
    #       </button>
    #     ))}
    #   </div>
    # </div>
    # 
    # We can replace:
    content = re.sub(
        r'(\s*</button>\s*\}\)\}\s*)</div>\s*</div>',
        r'\1</div>',
        content
    )
    
    # We must also make sure the icons exist. But wait, in the old maps we just did {tab.label}.
    # Industry uses: `<item.icon>` -> wait, we replaced `className={` prefix, but not the contents inside the button!
    # So `tab.icon` or just `{tab.label}` will stay as it is! No harm done. 

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Processed {filename}')

