import asyncio
from fastapi.testclient import TestClient
from app.main import app

def test():
    client = TestClient(app)
    
    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"college_id": "STF-0002", "password": "faculty123"},
        headers={"Host": "aits.localhost:8000"}
    )
    print("Login:", login_res.status_code)
    token = login_res.json()["data"]["access_token"]
    
    headers = {"Authorization": f"Bearer {token}", "Host": "aits.localhost:8000"}
    
    try:
        gen_res = client.post(
            "/api/v1/accreditation/reports/generate",
            json={"report_type": "NAAC", "academic_year": "2023-2024"},
            headers=headers
        )
        print("Generate:", gen_res.status_code)
        print(gen_res.text)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
