import os
import glob
import re

pages_dir = r'c:\AcadMix\frontend\src\pages'

files = glob.glob(os.path.join(pages_dir, '*.tsx')) + glob.glob(os.path.join(pages_dir, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The tabs often have: px-5 py-2.5 rounded-full
    # Or px-4 py-2 rounded-full
    
    new_content = re.sub(
        r'(px-\d+(?:\.\d+)?\s+py-\d+(?:\.\d+)?\s+)rounded-full',
        r'\1rounded-xl',
        content
    )
    
    # Also in case it's reversed: rounded-full px-5 py-2.5
    new_content = re.sub(
        r'rounded-full(\s+px-\d+(?:\.\d+)?\s+py-\d+(?:\.\d+)?)',
        r'rounded-xl\1',
        new_content
    )

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(filepath)}')

print('Done')
