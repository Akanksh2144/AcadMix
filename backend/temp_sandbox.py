
import sys
import json
from collections import deque

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
        
    def __eq__(self, other):
        if not isinstance(other, ListNode):
            return False
        return self.val == other.val and self.next == other.next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
        
    def __eq__(self, other):
        if not isinstance(other, TreeNode):
            return False
        return self.val == other.val and self.left == other.left and self.right == other.right

def build_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head

def build_tree(arr):
    if not arr: return None
    root = TreeNode(arr[0])
    queue = deque([root])
    i = 1
    while queue and i < len(arr):
        node = queue.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

import heapq

def solve(N, M, src, dst, edges):
    # Build adjacency list: graph[u] = list of (v, fee, multiplier)
    graph = [[] for _ in range(N)]
    for u, v, f, m in edges:
        graph[u].append((v, f, m))
    
    # Dijkstra: state = (current_cost, node)
    INF = float('inf')
    dist = [INF] * N
    dist[src] = 0.0
    
    # Min-heap: (cost, node)
    heap = [(0.0, src)]
    
    while heap:
        cost, u = heapq.heappop(heap)
        
        if u == dst:
            return f"{cost:.6f}"
        
        if cost > dist[u]:
            continue
        
        for v, fee, mult in graph[u]:
            new_cost = (cost + fee) * mult
            if new_cost < dist[v]:
                dist[v] = new_cost
                heapq.heappush(heap, (new_cost, v))
    
    return "-1"


# Safe test evaluation logic
test_cases = json.loads(r'''[{"input_data": "(4, 5, 0, 3, [(0,1,10,1.5),(0,2,20,1.0),(1,3,5,2.0),(2,3,10,1.2),(1,2,0,1.0)])", "step_by_step_trace": "Path 0\u21922\u21923: (0+20)*1.0=20.0, (20+10)*1.2=36.0. Path 0\u21921\u21923: (0+10)*1.5=15.0, (15+5)*2.0=40.0. Path 0\u21921\u21922\u21923: (0+10)*1.5=15.0, (15+0)*1.0=15.0, (15+10)*1.2=30.0. Minimum is 30.000000. Wait \u2014 let me retrace in step_by_step only: 0\u21921\u21922\u21923: cost after 0\u21921: (0+10)*1.5=15.0; cost after 1\u21922: (15+0)*1.0=15.0; cost after 2\u21923: (15+10)*1.2=30.0. So answer is 30.000000.", "expected_output": "30.000000", "is_hidden": false}, {"input_data": "(3, 2, 0, 2, [(0,1,5,2.0),(1,0,3,1.0)])", "step_by_step_trace": "Node 2 has no incoming edges. dist[2] remains INF. Return -1.", "expected_output": "-1", "is_hidden": false}, {"input_data": "(2, 1, 0, 1, [(0,1,100,1.0)])", "step_by_step_trace": "Only one edge 0\u21921: cost=(0+100)*1.0=100.0. dist[1]=100.0. Answer: 100.000000.", "expected_output": "100.000000", "is_hidden": false}, {"input_data": "(5, 7, 0, 4, [(0,1,0,1.0),(0,2,10,1.0),(1,2,0,1.0),(1,3,20,1.0),(2,4,50,2.0),(3,4,5,1.0),(2,3,5,1.0)])", "step_by_step_trace": "Path 0\u21921\u21923\u21924: (0+0)*1.0=0,(0+20)*1.0=20,(20+5)*1.0=25. Path 0\u21921\u21922\u21923\u21924: 0,0,(0+5)*1.0=5,(5+5)*1.0=10. Path 0\u21922\u21923\u21924: (0+10)*1.0=10,(10+5)*1.0=15,(15+5)*1.0=20. Path 0\u21921\u21922\u21924: 0,0,(0+50)*2.0=100. Best is 0\u21921\u21922\u21923\u21924=10.000000.", "expected_output": "10.000000", "is_hidden": true}, {"input_data": "(2, 1, 1, 0, [(0,1,50,1.5)])", "step_by_step_trace": "Edge goes 0\u21921 only. src=1, dst=0. No path from 1 to 0. Return -1.", "expected_output": "-1", "is_hidden": true}, {"input_data": "(6, 8, 0, 5, [(0,1,1,1.0),(0,2,1,1.0),(1,3,1,1.0),(2,3,1,1.0),(3,4,0,10.0),(3,5,100,1.0),(4,5,1,1.0),(1,5,1000,1.0)])", "step_by_step_trace": "Path 0\u21921\u21923\u21925: (0+1)*1.0=1,(1+1)*1.0=2,(2+100)*1.0=102. Path 0\u21921\u21923\u21924\u21925: 1,2,(2+0)*10.0=20,(20+1)*1.0=21. Path 0\u21922\u21923\u21924\u21925: 1,2,20,21. Path 0\u21921\u21925: (0+1)*1.0=1,(1+1000)*1.0=1001. Minimum=21.000000.", "expected_output": "21.000000", "is_hidden": true}, {"input_data": "(3, 3, 0, 2, [(0,1,0,1.0),(1,0,0,1.0),(0,2,500000,1.0)])", "step_by_step_trace": "Cycle 0\u21921\u21920 has cost 0 but never reaches 2. Only path to 2 is 0\u21922: (0+500000)*1.0=500000.0. Answer: 500000.000000.", "expected_output": "500000.000000", "is_hidden": true}, {"input_data": "(4, 6, 0, 3, [(0,1,10,2.0),(0,2,5,3.0),(1,2,0,1.0),(2,1,0,1.0),(1,3,1,1.0),(2,3,1,1.0)])", "step_by_step_trace": "0\u21921: (0+10)*2.0=20. 0\u21922: (0+5)*3.0=15. 0\u21921\u21922: (20+0)*1.0=20. 0\u21922\u21921: (15+0)*1.0=15. dist[1]=min(20,15)=15 via 0\u21922\u21921. dist[2]=min(15,20)=15 via 0\u21922. 0\u21921\u21923: (20+1)*1.0=21. 0\u21922\u21923: (15+1)*1.0=16. 0\u21922\u21921\u21923: (15+1)*1.0=16. Minimum to node 3 = 16.000000.", "expected_output": "16.000000", "is_hidden": true}, {"input_data": "(1000, 1, 0, 999, [(0,1,1,1.0)])", "step_by_step_trace": "Only edge is 0\u21921. Node 999 unreachable. Return -1.", "expected_output": "-1", "is_hidden": true}, {"input_data": "(5, 5, 2, 4, [(0,1,10,1.0),(1,2,10,1.0),(2,3,0,1.0),(3,4,0,1.0),(2,4,1,10.0)])", "step_by_step_trace": "src=2,dst=4. Path 2\u21923\u21924: (0+0)*1.0=0,(0+0)*1.0=0. Path 2\u21924: (0+1)*10.0=10. Minimum=0.000000.", "expected_output": "0.000000", "is_hidden": true}]''')
pass_count = 0

# JSON eval safety constants for Python
true = True
false = False
null = None

for idx, tc in enumerate(test_cases):
    try:
        raw_inp = tc['input_data']
        parsed = eval(raw_inp)
        args = parsed if isinstance(parsed, tuple) and not str(raw_inp).strip().startswith('build_') else (parsed,)
            
        result = solve(*args)
        expected = eval(tc['expected_output'])
        
        if result != expected:
            print(f"Test case {idx} failed. Expected {expected}, got {result}")
            sys.exit(1)
        pass_count += 1
            
    except Exception as e:
        print(f"Execution error on test case {idx}: {e}")
        sys.exit(1)
        
print("OK")
