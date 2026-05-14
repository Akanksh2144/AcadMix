import re
content = open('c:/AcadMix/frontend/src/components/vlsi/VLSIDesignStudio.tsx', 'r', encoding='utf-8').read()
# Remove comments
content = re.sub(r'//.*', '', content)
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

open_p = content.count('(')
close_p = content.count(')')
open_b = content.count('{')
close_b = content.count('}')
open_s = content.count('[')
close_s = content.count(']')

print(f'Paren: {open_p} vs {close_p}')
print(f'Brace: {open_b} vs {close_b}')
print(f'Bracket: {open_s} vs {close_s}')
