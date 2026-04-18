
import sys
import json

import sys

def solve(n, m, grid):
    """
    Approach: Fix left and right column boundaries, compress rows using prefix sums,
    then apply Kadane's algorithm on the 1D compressed array.
    Time: O(N * M^2), Space: O(N)
    """
    max_sum = -float('inf')
    
    for left in range(m):
        # row_sum[i] = sum of grid[i][left..right]
        row_sum = [0] * n
        
        for right in range(left, m):
            # Add the current right column to row_sum
            for i in range(n):
                row_sum[i] += grid[i][right]
            
            # Apply Kadane's algorithm on row_sum
            current = 0
            local_max = -float('inf')
            for val in row_sum:
                current += val
                if current > local_max:
                    local_max = current
                if current < 0:
                    current = 0
            
            if local_max > max_sum:
                max_sum = local_max
    
    return max_sum

# Reading input
def main():
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    grid = []
    for i in range(n):
        row = [int(data[idx + j]) for j in range(m)]
        idx += m
        grid.append(row)
    print(solve(n, m, grid))

main()


# Safe test evaluation logic
test_cases = json.loads(r'''[{"input_data": "(4, 5, [[1,2,-1,-4,-20],[-8,-3,4,2,1],[3,8,10,1,3],[-4,-1,1,7,-6]])", "step_by_step_trace": "Fix left=1, right=3: row_sum = [2+(-1)+(-4), -3+4+2, 8+10+1, -1+1+7] = [-3, 3, 19, 7]. Kadane: -3->0, 0+3=3, 3+19=22, 22+7=29. local_max=29. This is the global max=29.", "expected_output": "29", "is_hidden": false}, {"input_data": "(1, 1, [[5]])", "step_by_step_trace": "Single cell. left=0, right=0: row_sum=[5]. Kadane: current=5, local_max=5. max_sum=5.", "expected_output": "5", "is_hidden": false}, {"input_data": "(1, 1, [[-7]])", "step_by_step_trace": "Single cell, negative. left=0, right=0: row_sum=[-7]. Kadane: current=-7, local_max=-7 (initialized to -inf, updated to -7, then current reset to 0). max_sum=-7.", "expected_output": "-7", "is_hidden": false}, {"input_data": "(2, 2, [[1,-2],[-3,4]])", "step_by_step_trace": "left=0,right=0: row_sum=[1,-3]. Kadane: 1, then 1-3=-2<0 reset, local_max=1. left=0,right=1: row_sum=[1+(-2),-3+4]=[-1,1]. Kadane: -1<0 reset to 0, 0+1=1, local_max=1. left=1,right=1: row_sum=[-2,4]. Kadane: -2<0 reset, 4, local_max=4. max_sum=4.", "expected_output": "4", "is_hidden": false}, {"input_data": "(3, 3, [[-1,-2,-3],[-4,-5,-6],[-7,-8,-9]])", "step_by_step_trace": "All negative. Best single cell is -1. For each (left,right) pair, Kadane will find the maximum subarray which is the least negative. left=0,right=0: row_sum=[-1,-4,-7], Kadane local_max=-1. left=1,right=1: row_sum=[-2,-5,-8], local_max=-2. left=2,right=2: row_sum=[-3,-6,-9], local_max=-3. left=0,right=1: row_sum=[-3,-9,-15], local_max=-3. left=0,right=2: row_sum=[-6,-15,-24], local_max=-6. left=1,right=2: row_sum=[-5,-11,-15], local_max=-5. Overall max_sum=-1.", "expected_output": "-1", "is_hidden": false}, {"input_data": "(1, 5, [-2, 1, -3, 4, -1])", "step_by_step_trace": "1D Kadane on [-2,1,-3,4,-1]: best subarray is [4], sum=4. Verify: left=3,right=3: row_sum=[4], local_max=4. max_sum=4.", "expected_output": "4", "is_hidden": true}, {"input_data": "(3, 1, [[3],[-1],[2]])", "step_by_step_trace": "Only one column. row_sum=[3,-1,2]. Kadane: 3, 3-1=2, 2+2=4. local_max=4. max_sum=4.", "expected_output": "4", "is_hidden": true}, {"input_data": "(2, 4, [[1,2,3,4],[5,6,7,8]])", "step_by_step_trace": "All positive. Best is entire matrix. left=0,right=3: row_sum=[1+2+3+4,5+6+7+8]=[10,26]. Kadane: 10, 36. local_max=36. max_sum=36.", "expected_output": "36", "is_hidden": true}, {"input_data": "(3, 3, [[0,0,0],[0,100,0],[0,0,0]])", "step_by_step_trace": "Best is single cell 100. left=1,right=1: row_sum=[0,100,0]. Kadane: 0,100,100. local_max=100. max_sum=100.", "expected_output": "100", "is_hidden": true}, {"input_data": "(4, 4, [[-3,1,2,-1],[2,-1,-3,4],[-1,3,2,-2],[1,-2,1,3]])", "step_by_step_trace": "Try left=1,right=2: row_sum=[1+2,-1-3,3+2,-2+1]=[3,-4,5,-1]. Kadane: 3, 3-4=-1<0 reset, 5, 5-1=4. local_max=5. Try left=1,right=3: row_sum=[1+2-1,-1-3+4,3+2-2,-2+1+3]=[2,0,3,2]. Kadane: 2,2,5,7. local_max=7. Try left=0,right=2: row_sum=[-3+1+2,2-1-3,-1+3+2,1-2+1]=[0,-2,4,0]. Kadane: 0,0,4,4. local_max=4. Try left=0,right=3: row_sum=[-1,2,2,3]. Kadane: -1<0 reset,2,4,7. local_max=7. max_sum=7.", "expected_output": "7", "is_hidden": true}, {"input_data": "(1, 6, [2, -5, 6, -2, 7, -3])", "step_by_step_trace": "1D Kadane on [2,-5,6,-2,7,-3]. Subarray [6,-2,7]=11. Verify: 2, 2-5=-3<0 reset, 6, 6-2=4, 4+7=11, 11-3=8. local_max=11. max_sum=11.", "expected_output": "11", "is_hidden": true}, {"input_data": "(5, 1, [[-1],[2],[3],[-4],[5]])", "step_by_step_trace": "Single column. Kadane on [-1,2,3,-4,5]: -1<0 reset, 2, 5, 5-4=1, 1+5=6. local_max=6. max_sum=6.", "expected_output": "6", "is_hidden": true}, {"input_data": "(2, 3, [[-10000,10000,-10000],[10000,-10000,10000]])", "step_by_step_trace": "left=1,right=1: row_sum=[10000,-10000]. Kadane: 10000, 10000-10000=0. local_max=10000. left=0,right=2: row_sum=[-10000+10000-10000,10000-10000+10000]=[-10000,10000]. Kadane: -10000<0 reset, 10000. local_max=10000. max_sum=10000.", "expected_output": "10000", "is_hidden": true}, {"input_data": "(3, 4, [[1,-2,3,4],[-1,5,2,-3],[2,-1,4,1]])", "step_by_step_trace": "left=1,right=2: row_sum=[-2+3,5+2,-1+4]=[ 1,7,3]. Kadane: 1,8,11. local_max=11. left=0,right=2: row_sum=[1-2+3,-1+5+2,2-1+4]=[2,6,5]. Kadane: 2,8,13. local_max=13. left=1,right=3: row_sum=[-2+3+4,5+2-3,-1+4+1]=[5,4,4]. Kadane: 5,9,13. local_max=13. left=0,right=3: row_sum=[1-2+3+4,-1+5+2-3,2-1+4+1]=[6,3,6]. Kadane: 6,9,15. local_max=15. max_sum=15.", "expected_output": "15", "is_hidden": true}, {"input_data": "(2, 2, [[-1,-2],[-3,-4]])", "step_by_step_trace": "All negative. Best single cell is -1. left=0,right=0: row_sum=[-1,-3], Kadane local_max=-1. max_sum=-1.", "expected_output": "-1", "is_hidden": true}, {"input_data": "(3, 5, [[2,1,-3,-4,5],[0,6,3,4,1],[2,-2,-1,4,-5]])", "step_by_step_trace": "left=1,right=3: row_sum=[1-3-4,6+3+4,-2-1+4]=[\u22126,13,1]. Kadane: -6<0 reset, 13, 14. local_max=14. left=0,right=3: row_sum=[2+1-3-4,0+6+3+4,2-2-1+4]=[\u22124,13,3]. Kadane: -4<0 reset, 13, 16. local_max=16. left=1,right=4: row_sum=[1-3-4+5,6+3+4+1,-2-1+4-5]=[\u22121,14,-4]. Kadane: -1<0 reset, 14, 14-4=10. local_max=14. left=0,right=4: row_sum=[2+1-3-4+5,0+6+3+4+1,2-2-1+4-5]=[1,14,-2]. Kadane: 1,15,13. local_max=15. max_sum=16.", "expected_output": "16", "is_hidden": true}, {"input_data": "(4, 4, [[5,-4,-3,4],[-3,-4,4,5],[5,1,5,-4],[-3,2,-3,-3]])", "step_by_step_trace": "left=0,right=2: row_sum=[5-4-3,-3-4+4,5+1+5,-3+2-3]=[\u22122,-3,11,-4]. Kadane: -2<0 reset, -3<0 reset, 11, 11-4=7. local_max=11. left=0,right=1: row_sum=[5-4,-3-4,5+1,-3+2]=[1,-7,6,-1]. Kadane: 1, 1-7=-6<0 reset, 6, 6-1=5. local_max=6. left=2,right=3: row_sum=[-3+4,4+5,5-4,-3-3]=[ 1,9,1,-6]. Kadane: 1,10,11,5. local_max=11. left=0,right=3: row_sum=[5-4-3+4,-3-4+4+5,5+1+5-4,-3+2-3-3]=[2,2,7,-7]. Kadane: 2,4,11,4. local_max=11. max_sum=11.", "expected_output": "11", "is_hidden": true}, {"input_data": "(1, 4, [-1,-2,-3,-4])", "step_by_step_trace": "All negative 1D. Best single element is -1. left=0,right=0: row_sum=[-1], Kadane local_max=-1. max_sum=-1.", "expected_output": "-1", "is_hidden": true}, {"input_data": "(3, 3, [[1,2,3],[4,5,6],[7,8,9]])", "step_by_step_trace": "All positive. Best is entire matrix. left=0,right=2: row_sum=[1+2+3,4+5+6,7+8+9]=[6,15,24]. Kadane: 6,21,45. local_max=45. max_sum=45.", "expected_output": "45", "is_hidden": true}, {"input_data": "(2, 5, [[-1,3,-2,4,-5],[2,-1,3,-2,1]])", "step_by_step_trace": "left=1,right=3: row_sum=[3-2+4,-1+3-2]=[5,0]. Kadane: 5,5. local_max=5. left=0,right=3: row_sum=[-1+3-2+4,2-1+3-2]=[4,2]. Kadane: 4,6. local_max=6. left=1,right=2: row_sum=[3-2,-1+3]=[1,2]. Kadane: 1,3. local_max=3. left=0,right=2: row_sum=[-1+3-2,2-1+3]=[0,4]. Kadane: 0,4. local_max=4. left=2,right=3: row_sum=[-2+4,3-2]=[2,1]. Kadane: 2,3. local_max=3. max_sum=6.", "expected_output": "6", "is_hidden": true}]''')
pass_count = 0

# JSON eval safety constants for Python
true = True
false = False
null = None

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
