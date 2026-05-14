content = open('c:/AcadMix/frontend/src/components/vlsi/VLSIDesignStudio.tsx', 'r', encoding='utf-8').read()
lines = content.split('\n')
balance = 0
for i, line in enumerate(lines):
    old_balance = balance
    balance += line.count('(') - line.count(')')
    if balance < 0:
        print(f'Line {i+1} goes NEGATIVE: {line.strip()}')
        balance = 0
    # print(f'Line {i+1}: {old_balance} -> {balance} | {line.strip()}')
