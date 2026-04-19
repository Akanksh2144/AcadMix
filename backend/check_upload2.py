import httpx

res = httpx.post('http://localhost:8000/api/v1/auth/login', data={'username': 'student1@example.com', 'password': 'password123'})
print("Login:", res.status_code)
token = res.json().get('access_token')

for i in range(2):
    res2 = httpx.post(
        'http://localhost:8000/api/v1/resume-vault/upload', 
        headers={'Authorization': f'Bearer {token}'}, 
        files={'file': (f'test{i}.pdf', b'%PDF-1.4', 'application/pdf')}
    )
    print(f"Upload {i}:", res2.status_code, res2.text)
