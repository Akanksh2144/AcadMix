content = open('c:/AcadMix/frontend/src/components/vlsi/VLSIDesignStudio.tsx', 'r', encoding='utf-8').read()
balance = 0
for i, char in enumerate(content):
    if char == '(':
        balance += 1
    elif char == ')':
        balance -= 1
    if balance < 0:
        # Find line number
        line_no = content.count('\n', 0, i) + 1
        print(f'Negative balance at line {line_no}, char {i}: balance={balance}')
        # Show surrounding text
        start = max(0, i - 20)
        end = min(len(content), i + 20)
        print(f'Context: "{content[start:end]}"')
        balance = 0 # reset to find more
