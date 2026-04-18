
import sys
import json

from collections import deque
from typing import Optional, List

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(level_order: list) -> Optional[TreeNode]:
    if not level_order or level_order[0] is None:
        return None
    root = TreeNode(level_order[0])
    queue = deque([root])
    i = 1
    while queue and i < len(level_order):
        node = queue.popleft()
        if i < len(level_order) and level_order[i] is not None:
            node.left = TreeNode(level_order[i])
            queue.append(node.left)
        i += 1
        if i < len(level_order) and level_order[i] is not None:
            node.right = TreeNode(level_order[i])
            queue.append(node.right)
        i += 1
    return root

def solve(level_order: list) -> list:
    root = build_tree(level_order)
    if not root:
        return []
    
    result = []
    queue = deque([root])
    left_to_right = True  # Floor 1 is odd -> L to R
    
    while queue:
        level_size = len(queue)
        level_nodes = deque()
        
        for _ in range(level_size):
            node = queue.popleft()
            if left_to_right:
                level_nodes.append(node.val)
            else:
                level_nodes.appendleft(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        
        result.append(list(level_nodes))
        left_to_right = not left_to_right
    
    return result


# Safe test evaluation logic
test_cases = json.loads(r'''[{"input_data": "[1, 2, 3, 4, 5, 6, 7]", "step_by_step_trace": "Tree:\n        1\n       / \\\n      2   3\n     / \\ / \\\n    4  5 6  7\nFloor 1 (L->R): process node 1 \u2192 appendright \u2192 level_nodes=[1]. Queue after: [2,3]. left_to_right flips to False.\nFloor 2 (R->L): process node 2 \u2192 appendleft \u2192 [2]; process node 3 \u2192 appendleft \u2192 [3,2]. Queue after: [4,5,6,7]. left_to_right flips to True.\nFloor 3 (L->R): process 4\u2192append\u2192[4], 5\u2192append\u2192[4,5], 6\u2192append\u2192[4,5,6], 7\u2192append\u2192[4,5,6,7]. Queue empty.\nResult: [[1],[3,2],[4,5,6,7]]", "expected_output": "[[1], [3, 2], [4, 5, 6, 7]]", "is_hidden": false}, {"input_data": "[1]", "step_by_step_trace": "Tree has only root=1. Floor 1 (L->R): process node 1 \u2192 appendright \u2192 [1]. Queue empty. Result: [[1]]", "expected_output": "[[1]]", "is_hidden": false}, {"input_data": "[]", "step_by_step_trace": "level_order is empty. build_tree returns None. root is None \u2192 return []. Result: []", "expected_output": "[]", "is_hidden": false}, {"input_data": "[1, 2, null, 3, null, null, null]", "step_by_step_trace": "Build tree: root=1, left=2, right=None. Node 2: left=3, right=None.\nTree: 1->left=2->left=3.\nFloor 1 (L->R): node 1 \u2192 append \u2192 [1]. Queue:[2]. flip to False.\nFloor 2 (R->L): node 2 \u2192 appendleft \u2192 [2]. Queue:[3]. flip to True.\nFloor 3 (L->R): node 3 \u2192 append \u2192 [3]. Queue empty.\nResult: [[1],[2],[3]]", "expected_output": "[[1], [2], [3]]", "is_hidden": false}, {"input_data": "[3, 9, 20, null, null, 15, 7]", "step_by_step_trace": "Build tree: root=3, left=9, right=20. Node 9: left=null, right=null. Node 20: left=15, right=7.\nFloor 1 (L->R): node 3 \u2192 append \u2192 [3]. Queue:[9,20]. flip False.\nFloor 2 (R->L): node 9 \u2192 appendleft \u2192 [9]; node 20 \u2192 appendleft \u2192 [20,9]. Queue:[15,7]. flip True.\nFloor 3 (L->R): node 15 \u2192 append \u2192 [15]; node 7 \u2192 append \u2192 [15,7]. Queue empty.\nResult: [[3],[20,9],[15,7]]", "expected_output": "[[3], [20, 9], [15, 7]]", "is_hidden": false}, {"input_data": "[1, 2, 3]", "step_by_step_trace": "Floor1 L->R: [1]. Floor2 R->L: node2 appendleft->[2], node3 appendleft->[3,2]. Result: [[1],[3,2]]", "expected_output": "[[1], [3, 2]]", "is_hidden": true}, {"input_data": "[1, null, 2, null, null, null, 3]", "step_by_step_trace": "Build: root=1, right=2, node2 right=3. Floor1 L->R:[1]. Floor2 R->L: node2 appendleft->[2]. Floor3 L->R: node3 append->[3]. Result:[[1],[2],[3]]", "expected_output": "[[1], [2], [3]]", "is_hidden": true}, {"input_data": "[5, 3, 8, 1, 4, 7, 9]", "step_by_step_trace": "Floor1 L->R:[5]. Floor2 R->L: node3 appendleft->[3], node8 appendleft->[8,3]. Floor3 L->R: nodes 1,4,7,9 appended->[1,4,7,9]. Result:[[5],[8,3],[1,4,7,9]]", "expected_output": "[[5], [8, 3], [1, 4, 7, 9]]", "is_hidden": true}, {"input_data": "[10, 5, 15, 3, 7, 12, 20]", "step_by_step_trace": "Floor1 L->R:[10]. Floor2 R->L:[15,5]. Floor3 L->R:[3,7,12,20]. Result:[[10],[15,5],[3,7,12,20]]", "expected_output": "[[10], [15, 5], [3, 7, 12, 20]]", "is_hidden": true}, {"input_data": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]", "step_by_step_trace": "Floor1 L->R:[1]. Floor2 R->L:[3,2]. Floor3 L->R:[4,5,6,7]. Floor4 R->L: nodes 8,9,10,11,12,13,14,15 processed with appendleft \u2192 [15,14,13,12,11,10,9,8]. Result:[[1],[3,2],[4,5,6,7],[15,14,13,12,11,10,9,8]]", "expected_output": "[[1], [3, 2], [4, 5, 6, 7], [15, 14, 13, 12, 11, 10, 9, 8]]", "is_hidden": true}, {"input_data": "[-1, -2, -3, -4, -5]", "step_by_step_trace": "Build: root=-1, left=-2, right=-3. Node -2: left=-4, right=-5. Floor1 L->R:[-1]. Floor2 R->L:[-3,-2]. Floor3 L->R:[-4,-5]. Result:[[-1],[-3,-2],[-4,-5]]", "expected_output": "[[-1], [-3, -2], [-4, -5]]", "is_hidden": true}, {"input_data": "[0]", "step_by_step_trace": "Single node 0. Floor1 L->R:[0]. Result:[[0]]", "expected_output": "[[0]]", "is_hidden": true}, {"input_data": "[1, 2, null, 4, 5]", "step_by_step_trace": "Build: root=1,left=2,right=None. Node2: left=4,right=5. Floor1 L->R:[1]. Floor2 R->L: node2 appendleft->[2]. Floor3 L->R: node4 append->[4], node5 append->[4,5]. Result:[[1],[2],[4,5]]", "expected_output": "[[1], [2], [4, 5]]", "is_hidden": true}, {"input_data": "[100, 50, 150, 25, 75, 125, 175, 10, 30]", "step_by_step_trace": "Floor1 L->R:[100]. Floor2 R->L:[150,50]. Floor3 L->R:[25,75,125,175]. Floor4 R->L: nodes 10,30 \u2192 appendleft each \u2192 node10 appendleft->[10], node30 appendleft->[30,10]. Result:[[100],[150,50],[25,75,125,175],[30,10]]", "expected_output": "[[100], [150, 50], [25, 75, 125, 175], [30, 10]]", "is_hidden": true}, {"input_data": "[1, null, 2, null, null, null, 3, null, null, null, null, null, null, null, 4]", "step_by_step_trace": "Build: i=0 root=1; i=1 node1.left=null, i=2 node1.right=2; queue=[node2]; i=3 node2.left=null, i=4 node2.right=null; queue empty but i=5..14 ignored since queue empty. Tree: 1->right=2 only. Floor1 L->R:[1]. Floor2 R->L: node2 appendleft->[2]. Result:[[1],[2]]", "expected_output": "[[1], [2]]", "is_hidden": true}, {"input_data": "[7, 3, 15, 1, 5, 9, 20, null, null, null, null, null, null, 18, 22]", "step_by_step_trace": "Build: root=7,left=3,right=15. Node3:left=1,right=5. Node15:left=9,right=20. Node1:left=null,right=null. Node5:left=null,right=null. Node9:left=null,right=null. Node20:left=18,right=22. Floor1 L->R:[7]. Floor2 R->L:[15,3]. Floor3 L->R:[1,5,9,20]. Floor4 R->L: nodes 18,22 \u2192 node18 appendleft->[18], node22 appendleft->[22,18]. Result:[[7],[15,3],[1,5,9,20],[22,18]]", "expected_output": "[[7], [15, 3], [1, 5, 9, 20], [22, 18]]", "is_hidden": true}, {"input_data": "[2, 1, 3, null, null, null, 4, null, null, null, null, null, null, null, 5]", "step_by_step_trace": "Build: root=2,left=1,right=3. Node1:left=null,right=null. Node3:left=null,right=4. Node4:left=null,right=null (indices 13,14 but queue processes node4 at i=13: null, i=14: 5 \u2192 node4.right=5). Wait re-check: queue after floor1=[node1,node3]. Process node1: i=3 null(left), i=4 null(right). Process node3: i=5 null(left), i=6 val=4 \u2192 node3.right=TreeNode(4), queue=[node4]. Process node4: i=7..14, i=13 null(left), i=14 val=5 \u2192 node4.right=TreeNode(5). Floor1 L->R:[2]. Floor2 R->L:[3,1]. Floor3 L->R: only node4 (node3.right) \u2192 [4]. Floor4 R->L: node5 appendleft->[5]. Result:[[2],[3,1],[4],[5]]", "expected_output": "[[2], [3, 1], [4], [5]]", "is_hidden": true}, {"input_data": "[1, 2, 3, null, 4, null, 5]", "step_by_step_trace": "Build: root=1,left=2,right=3. Node2:left=null,right=4. Node3:left=null,right=5. Floor1 L->R:[1]. Floor2 R->L:[3,2]. Floor3 L->R: node4 append->[4], node5 append->[4,5]. Result:[[1],[3,2],[4,5]]", "expected_output": "[[1], [3, 2], [4, 5]]", "is_hidden": true}, {"input_data": "[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5]", "step_by_step_trace": "Build: root=6,left=2,right=8. Node2:left=0,right=4. Node8:left=7,right=9. Node0:left=null,right=null. Node4:left=3,right=5. Floor1 L->R:[6]. Floor2 R->L:[8,2]. Floor3 L->R:[0,4,7,9]. Floor4 R->L: nodes 3,5 \u2192 node3 appendleft->[3], node5 appendleft->[5,3]. Result:[[6],[8,2],[0,4,7,9],[5,3]]", "expected_output": "[[6], [8, 2], [0, 4, 7, 9], [5, 3]]", "is_hidden": true}, {"input_data": "[1, 2, 3, 4, null, null, 5, 6, null, null, null, null, 7]", "step_by_step_trace": "Build: root=1,left=2,right=3. Node2:left=4,right=null. Node3:left=null,right=5. Node4:left=6,right=null. Node5:left=null,right=7. Floor1 L->R:[1]. Floor2 R->L:[3,2]. Floor3 L->R:[4,5]. Floor4 R->L: node6 appendleft->[6], node7 appendleft->[7,6]. Result:[[1],[3,2],[4,5],[7,6]]", "expected_output": "[[1], [3, 2], [4, 5], [7, 6]]", "is_hidden": true}]''')
pass_count = 0

for idx, tc in enumerate(test_cases):
    try:
        raw_inp = tc['input_data']
        args = eval(raw_inp) if raw_inp.strip().startswith('(') else (eval(raw_inp),)
            
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
