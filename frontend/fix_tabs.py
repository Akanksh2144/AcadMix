import os
import glob
import re

pages_dir = r'c:\AcadMix\frontend\src\pages'

files = glob.glob(os.path.join(pages_dir, '*.tsx')) + glob.glob(os.path.join(pages_dir, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace in the container:
    new_content = re.sub(
        r'(<div\s+className="[^"]*flex overflow-x-auto[^"]*?)rounded-full([^"]*hide-scrollbar[^"]*")>',
        r'\1rounded-xl\2>',
        content
    )
    
    new_content = re.sub(
        r'(<div\s+className="[^"]*flex overflow-x-auto[^"]*?)rounded-2xl([^"]*hide-scrollbar[^"]*")>',
        r'\1rounded-xl\2>',
        new_content
    )

    new_content = re.sub(
        r'(<button[^>]+className="[^"]*?)rounded-full([^"]*?")>',
        r'\1rounded-xl\2>',
        new_content
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(filepath)}')

print('Done')
