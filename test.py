import urllib.request, json, os

url = 'https://acadmix-code-runner.fly.dev/run'
headers = {
    'Content-Type': 'application/json',
    'x-internal-token': os.environ.get('CODE_RUNNER_TOKEN', 'acadmix_dev_runner_token_8x19z')
}

code = """using System;
class Solution {
    static void Main(string[] args) {
        Console.WriteLine("Hello C#");
    }
}
"""

data = json.dumps({'language': 'csharp', 'code': code, 'test_input': ''})
req = urllib.request.Request(url, data=data.encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
