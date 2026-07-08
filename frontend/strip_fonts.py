import os

files_to_clean = [
    r'C:\AcadMix\frontend\src\components\system-design\ChallengeSelector.tsx',
    r'C:\AcadMix\frontend\src\components\system-design\ComponentPalette.tsx',
    r'C:\AcadMix\frontend\src\components\system-design\MetricsPanel.tsx',
    r'C:\AcadMix\frontend\src\pages\SystemDesignArena.tsx'
]

for file_path in files_to_clean:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all Caveat references safely without regex
    content = content.replace('font-[Caveat]', '')
    content = content.replace('font-caveat', '')
    content = content.replace("fontFamily: \"'Caveat', cursive\",", "")
    content = content.replace("fontFamily: \"'Caveat', cursive\"", "")
    content = content.replace(", fontFamily: \"'Caveat', cursive\"", "")
    content = content.replace(" fontFamily: \"'Caveat', cursive\"", "")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Done!')
