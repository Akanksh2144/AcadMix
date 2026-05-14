content = open('c:/AcadMix/frontend/src/components/vlsi/VLSIDesignStudio.tsx', 'r', encoding='utf-8').read()
balance = 0
for i, char in enumerate(content):
    if char == '(':
        balance += 1
        # print(f'Line {content.count("\n", 0, i)+1}: ( balance={balance}')
    elif char == ')':
        balance -= 1
        # print(f'Line {content.count("\n", 0, i)+1}: ) balance={balance}')
    if balance < 0:
        line_no = content.count('\n', 0, i) + 1
        print(f'MISMATCH at line {line_no}, char {i}: context="{content[i-10:i+10]}"')
        balance = 0
