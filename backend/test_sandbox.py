from app.routers.challenges import _build_python_sandbox
code = 'def solve(n, arr):\n    print(\
Running!\)\n    return [0, 1, 2, 3]'
cases = [{'input_data': '(4, [[1,0],[2,0]])', 'expected_output': '[0, 1, 2, 3]'}]
s = _build_python_sandbox(code, cases)
exec(s)
