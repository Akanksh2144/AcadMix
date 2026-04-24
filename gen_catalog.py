#!/usr/bin/env python3
import json
from collections import defaultdict, Counter

data = json.load(open(r'c:\AcadMix\frontend\src\data\sql_problems.json', encoding='utf-8'))

# Group by category
cats = defaultdict(list)
for p in data:
    cats[p.get('category', 'Uncategorized')].append(p)

diff_counts = Counter(p['difficulty'] for p in data)
company_counts = Counter()
for p in data:
    for c in (p.get('company_tags') or [p.get('company_tag', '')]):
        if c:
            company_counts[c] += 1

lines = []
lines.append('# AcadMix SQL Practice Arena — Complete Problem Catalog')
lines.append('')
lines.append('> **%d problems** across **%d concept categories** for mass recruiter placement prep.' % (len(data), len(cats)))
lines.append('> Generated on 2026-04-23 | DataLemur-style challenges')
lines.append('')
lines.append('## Summary Statistics')
lines.append('')
lines.append('| Metric | Value |')
lines.append('|--------|-------|')
lines.append('| Total Problems | %d |' % len(data))
lines.append('| Easy | %d |' % diff_counts.get('easy', 0))
lines.append('| Medium | %d |' % diff_counts.get('medium', 0))
lines.append('| Hard | %d |' % diff_counts.get('hard', 0))
lines.append('| Categories | %d |' % len(cats))
lines.append('| Companies | %d |' % len(company_counts))
pg = sum(1 for p in data if p.get('backend_only'))
lines.append('| SQLite WASM | %d |' % (len(data) - pg))
lines.append('| PostgreSQL-only | %d |' % pg)
lines.append('')

lines.append('## Category Breakdown')
lines.append('')
lines.append('| Category | Easy | Medium | Hard | Total |')
lines.append('|----------|------|--------|------|-------|')
for cat in sorted(cats.keys()):
    probs = cats[cat]
    e = sum(1 for p in probs if p['difficulty'] == 'easy')
    m = sum(1 for p in probs if p['difficulty'] == 'medium')
    h = sum(1 for p in probs if p['difficulty'] == 'hard')
    lines.append('| %s | %d | %d | %d | %d |' % (cat, e, m, h, len(probs)))
lines.append('')

lines.append('## Company Coverage')
lines.append('')
lines.append('| Company | Problems |')
lines.append('|---------|----------|')
for c, count in sorted(company_counts.items(), key=lambda x: -x[1]):
    lines.append('| %s | %d |' % (c, count))
lines.append('')

lines.append('---')
lines.append('')

# Detailed listing by category
for cat in sorted(cats.keys()):
    probs = cats[cat]
    lines.append('## %s (%d problems)' % (cat, len(probs)))
    lines.append('')
    lines.append('| # | ID | Title | Difficulty | Companies | Dataset | Engine |')
    lines.append('|---|-----|-------|------------|-----------|---------|--------|')
    for i, p in enumerate(probs, 1):
        companies = ', '.join(p.get('company_tags') or [p.get('company_tag', '')])
        engine = 'PostgreSQL' if p.get('backend_only') else 'SQLite'
        title_clean = p['title'].replace('|', '/')
        lines.append('| %d | %s | %s | %s | %s | %s | %s |' % (
            i, p['id'], title_clean, p['difficulty'].upper(), companies, p['dataset_theme'], engine))
    lines.append('')

    # Detailed descriptions
    lines.append('### Problem Descriptions')
    lines.append('')
    for p in probs:
        stmt = p.get('problem_statement', '').split('\n')[0]
        diff_map = {'easy': '🟢', 'medium': '🟡', 'hard': '🔴'}
        diff_emoji = diff_map.get(p['difficulty'], '')
        engine_tag = ' ⚠️ PostgreSQL' if p.get('backend_only') else ''
        lines.append('**%s. %s** %s%s' % (p['id'], p['title'], diff_emoji, engine_tag))
        lines.append('> %s' % stmt)
        lines.append('')
    lines.append('---')
    lines.append('')

out_path = r'c:\AcadMix\docs\sql_problem_catalog.md'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('Done: wrote %d lines to catalog' % len(lines))
