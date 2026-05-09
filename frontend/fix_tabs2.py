import os
import glob
import re

pages_dir = r'c:\AcadMix\frontend\src\pages'

files = glob.glob(os.path.join(pages_dir, '*.tsx')) + glob.glob(os.path.join(pages_dir, '*.jsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The buttons are inside a tab bar container which we already changed to rounded-xl.
    # The buttons typically have "onClick={() => handleTabChange(tab.id)}" or "onClick={() => setActiveTab("
    # Let's just find <button ... rounded-full ...> inside the tab mapping.
    # A safer way: find all rounded-full inside <button ...> tags that are used for tabs.
    # Actually, changing ANY button that is rounded-full to rounded-xl is fine for the soft-UI.
    # Let's replace 'rounded-full' with 'rounded-xl' inside any <button tag.
    
    # We can match <button ... rounded-full ...>
    
    def replace_button(m):
        return m.group(0).replace('rounded-full', 'rounded-xl')
        
    new_content = re.sub(r'<button\b[^>]*?rounded-full[^>]*>', replace_button, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(filepath)}')

print('Done')
