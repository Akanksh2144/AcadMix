import asyncio
import sys
import os
import re

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import admin_session_ctx
from sqlalchemy import text
import json

async def patch():
    async with admin_session_ctx() as session:
        # Fetch all
        result = await session.execute(text('SELECT id, title, description FROM premium_coding_challenges'))
        rows = result.fetchall()
        
        for r in rows:
            desc = r.description
            title = r.title
            
            if title == "Microservice Request Scheduling: Minimize Deadline Misses":
                # Remove the giveaway
                desc = re.sub(r'This is a classic \*\*Greedy Job Scheduling\*\* problem: greedily assign each job \(sorted by deadline\) to the latest available time slot at or before its deadline\.', '', desc)
                if '### Constraints' not in desc:
                    desc += '\n\n---\n\n### Constraints\n- `1 <= N <= 10^5`\n- `1 <= deadlines[i] <= 10^5`\n'
                await session.execute(text('UPDATE premium_coding_challenges SET description = :desc WHERE id = :id'), {"desc": desc, "id": r.id})
                print("Patched Scheduling")
                
            elif title == "Microservice Dependency Cycle Detector":
                if '### Constraints' not in desc:
                    desc += '\n\n---\n\n### Constraints\n- `1 <= N <= 10^4`\n- `0 <= edges.length <= 10^5`\n- `edges[i] = [u, v]` where `0 <= u, v < N`\n- The graph may contain multiple disconnected components.\n- There are no duplicate edges or self-loops.\n'
                await session.execute(text('UPDATE premium_coding_challenges SET description = :desc WHERE id = :id'), {"desc": desc, "id": r.id})
                print("Patched Cycle Detector")
                
            elif title == "Microservice Request Batching Cost Optimizer":
                desc = """## Microservice Request Batching Cost Optimizer

A FinTech platform processes financial transactions through a chain of **N microservices**. Each microservice can handle requests in **batches**, and the cost of running a batch depends on the number of requests it processes.

You are given an array `cost` of length `N`, where `cost[i]` represents the **base processing fee** (in USD cents) charged by microservice `i`. However, the platform has a special **bulk discount rule**:

> If you skip paying for microservice `i`, you can use it **for free**, but only if you have **already paid** for the immediately preceding microservice (`i-1`) or the one before that (`i-2`).

More formally, you want to select a **subset of microservices to pay for**, such that:
- You **cannot skip two consecutive microservices** (i.e., you must pay for at least one of any two adjacent microservices).
- Note: This implies index 0 or index 1 MUST be paid for.
- Your goal is to **minimize the total cost** paid.

Return the **minimum total cost** to process all `N` microservices while satisfying the constraint.

---

### Example 1

```text
Input: cost = [10, 15, 20, 5, 30]

Output: 30

Explanation:
Optimal sequence of payments/skips to minimize cost:
- Pay for microservice 0 (cost = 10)
- Skip microservice 1 (valid since 0 was paid)
- Skip microservice 2 (Wait, we can't skip two consecutive. Must pay for either 1 or 2. Let's pay for 2. No, actually let's pay 3).
- The lowest cost path is: Pay 0 (10), Skip 1, Pay 2 (20), Skip 3, Skip 4. Actually let's look at the correct optimal:
- Pay 1 (15), Skip 2, Pay 3 (5), Pay 4 (30).
Let's restate strictly:
Optimal path: Pay 0 (10), skip 1, pay 2 (20), skip 3, skip 4. Wait, cost is 30. But we must satisfy the constraint.
Optimal exact path:
- Pay for microservice 0 (10)
- Skip microservice 1
- Skip microservice 2 is INVALID. So we pay 1 (15), skip 2, pay 3 (5), skip 4... Wait.
Let me just give a clean explanation without 'wait'.
Optimal choices: Pay for microservices 1 and 3.
- Skip 0 (valid, nothing to constraint before it, actually NO, you cannot skip 0 unless 1 is paid. Wait. If you skip 0, you MUST pay 1).
- Pay 1: 15
- Skip 2: (valid, 1 was paid)
- Pay 3: 5
- Skip 4: (valid, 3 was paid)
Total cost = 15 + 5 = 20.
```

### Example 2

```text
Input: cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]
Output: 6
Explanation:
Pay for indices 0, 2, 4, 6, 7, 9. 
Total cost = 1 + 1 + 1 + 1 + 1 + 1 = 6.
```

---

### Input Format

**First line:** A single integer `N` — the number of microservices.

**Second line:** `N` space-separated integers representing the `cost` array.

### Output Format

**Single integer** — the minimum total cost.

### Constraints
- `1 <= N <= 10^5`
- `1 <= cost[i] <= 10^4`
"""
                # Wait, my example explanation has to be clean. Let me fix the string literal in the code directly!
                clean_desc = """## Microservice Request Batching Cost Optimizer

A FinTech platform processes financial transactions through a chain of **N microservices**. Each microservice can handle requests in **batches**, and the cost of running a batch depends on the number of requests it processes.

You are given an array `cost` of length `N`, where `cost[i]` represents the **base processing fee** (in USD cents) charged by microservice `i`. However, the platform has a special **bulk discount rule**:

> You may skip paying for microservice `i` (getting it for free), but **you cannot skip two consecutive microservices**.

More formally, you must select a subset of indices to pay for such that no two skipped indices are adjacent. Your goal is to **minimize the total cost** paid.

Return the **minimum total cost** to process all N microservices.

---

### Example 1

```text
Input: cost = [10, 15, 20, 5, 30]
Output: 35
Explanation:
To minimize cost without skipping two consecutive microservices, we:
- Pay for microservice 0 (10)
- Pay for microservice 2 (20)
- Pay for microservice 3 (5)
We skipped microservice 1 (valid, 0 and 2 are paid) and skipped microservice 4 (valid, 3 is paid).
Total cost = 10 + 20 + 5 = 35.
```

### Example 2

```text
Input: cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]
Output: 6
Explanation:
We pay for microservices at indices 0, 2, 4, 6, 7, and 9. 
We skip indices 1, 3, 5, and 8. No two skips are consecutive.
Total cost = 1 + 1 + 1 + 1 + 1 + 1 = 6.
```

### Example 3

```text
Input: cost = [10, 15]
Output: 10
Explanation:
Pay for microservice 0 (10) and skip microservice 1.
Total = 10.
```

---

### Input Format

**First line:** A single integer `N` — the number of microservices.

**Second line:** `N` space-separated integers representing the `cost` array.

### Output Format

**Single integer** — the minimum total cost to process all microservices.

### Constraints
- `1 <= N <= 10^5`
- `1 <= cost[i] <= 10^4`
"""
                await session.execute(text('UPDATE premium_coding_challenges SET description = :desc WHERE id = :id'), {"desc": clean_desc, "id": r.id})
                print("Patched Batching Cost")

            elif title == "Optimal Microservice Request Routing with Budget Constraints":
                # Regular expression to replace the messy example explanation
                pattern = r"Option 1: Services \{0,1,2\}.*?Wait \— corrected output is 19.*?\)[\.]?"
                replacement = """Output: 19

Explanation:
We need to choose exactly 3 services in increasing index order with total cost <= 10.
The optimal selection is services at indices 0, 1, and 3:
- Cost = cost[0] + cost[1] + cost[3] = 2 + 3 + 4 = 9 (which is <= 10)
- Score = score[0] + score[1] + score[3] = 5 + 6 + 8 = 19
Other valid choices yield lower scores (e.g., indices {1,3,4} yields cost 9 and score 18).
The maximum possible score is 19."""
                new_desc = re.sub(pattern, replacement, desc, flags=re.DOTALL)
                # It originally says Output: 17 on the line above the options, so we need to replace starting there.
                pattern_full = r"Output: 17\s*Explanation:.*?Wait \— corrected output is 19\*\*.*?\)\."
                new_desc_full = re.sub(pattern_full, replacement, desc, flags=re.DOTALL)
                
                await session.execute(text('UPDATE premium_coding_challenges SET description = :desc WHERE id = :id'), {"desc": new_desc_full, "id": r.id})
                print("Patched Routing Budget")

            elif title == "Quantum Relay Network: Minimum Latency with K Relay Boosts":
                if '### Constraints' not in desc:
                    desc += '\n\n---\n\n### Constraints\n- `2 <= N <= 1000`\n- `1 <= M <= 5000`\n- `0 <= K <= 100`\n- `1 <= w <= 10^5`\n- `0 <= src, dst < N`\n- `src != dst`\n'
                await session.execute(text('UPDATE premium_coding_challenges SET description = :desc WHERE id = :id'), {"desc": desc, "id": r.id})
                print("Patched Quantum Relay")

        await session.commit()
        print("Success")

if __name__ == '__main__':
    asyncio.run(patch())
