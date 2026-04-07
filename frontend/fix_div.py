import os, glob, re

files = glob.glob('C:/AcadMix/frontend/src/pages/*Dashboard.js')

for file in files:
    filename = os.path.basename(file)
    if 'IndustryDashboard.js' in filename or 'NodalOfficerDashboard.js' in filename: continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # The text is literally:
    #             ))}
    #           </div>
    #         </div>
    
    # We want to replace it with:
    #             ))}
    #           </div>

    content = re.sub(
        r'(\s*</button>\s*\)\)\}\s*)</div>\s*</div>',
        r'\1</div>',
        content
    )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed Extra Div in {filename}')
