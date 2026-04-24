import re

with open('frontend/src/data/gen_problems.py', 'r', encoding='utf-8') as f:
    text = f.read()

# remove the loop
text = re.sub(r'for p in P:\s*p\["category"\] = classify\(p\)', '', text)

# add it back
text = text.replace('# Print category distribution', 'for p in P:\n    p["category"] = classify(p)\n\n# Print category distribution')

with open('frontend/src/data/gen_problems.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Done!')
