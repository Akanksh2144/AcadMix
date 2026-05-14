import re
content = open('c:/AcadMix/frontend/src/components/vlsi/VLSIDesignStudio.tsx', 'r', encoding='utf-8').read()
content = re.sub(r'//.*', '', content)
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

stack = []
for i, char in enumerate(content):
    if char == '[':
        stack.append(i)
    elif char == ']':
        if stack:
            stack.pop()
        else:
            print(f'Extra ] at {i}')

for start in stack:
    line_no = content.count('\n', 0, start) + 1
    print(f'Unclosed [ at line {line_no}, char {start}: context="{content[start:start+20]}"')
