import re
content = open('c:/AcadMix/frontend/src/components/vlsi/VLSIDesignStudio.tsx', 'r', encoding='utf-8').read()
content = re.sub(r'//.*', '', content)
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

balance = 0
for i, char in enumerate(content):
    if char == '[':
        balance += 1
    elif char == ']':
        balance -= 1
    if balance < 0:
        print(f'Mismatch ] at {i}')
        balance = 0
print(f'Final balance: {balance}')
