import httpx

res = httpx.post('http://localhost:8000/api/v1/auth/login', json={'email': 'student1@example.com', 'password': 'password123'})
print(res.json())
token = res.json().get('access_token')

res2 = httpx.post(
    'http://localhost:8000/api/v1/resume-vault/upload', 
    headers={'Authorization': f'Bearer {token}'}, 
    files={'file': ('test.pdf', b'%PDF-1.4', 'application/pdf')}
)
print(res2.status_code, res2.text)
