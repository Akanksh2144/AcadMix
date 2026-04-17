import httpx
import asyncio

URL = "http://localhost:8000/api/v1"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Industry debugging
        print("Logging in as IND001...")
        resp = await client.post(f"{URL}/auth/login", json={"college_id": "IND001", "password": "industry123"})
        ind_token = resp.json()
        print(ind_token)
        if "access_token" in ind_token:
            headers = {"Authorization": f"Bearer {ind_token['access_token']}"}
            dash = await client.get(f"{URL}/industry/dashboard", headers=headers)
            print("Industry Dashboard:", dash.status_code, dash.text)
            mous = await client.get(f"{URL}/industry/mous", headers=headers)
            print("Industry MOUs:", mous.status_code, mous.text)

        # 2. Principal debugging
        print("\nLogging in as PRIN001...")
        resp = await client.post(f"{URL}/auth/login", json={"college_id": "PRIN001", "password": "teacher123"})
        prin_token = resp.json()
        if "access_token" in prin_token:
            headers = {"Authorization": f"Bearer {prin_token['access_token']}"}
            att = await client.get(f"{URL}/principal/reports/attendance-compliance?academic_year=2025-2026", headers=headers)
            print("Principal Attendance:", att.status_code, att.text)
            st = await client.get(f"{URL}/principal/reports/staff-profiles", headers=headers)
            print("Principal Staff Profile:", st.status_code, st.text)
            gr = await client.get(f"{URL}/principal/grievances?status=pending", headers=headers)
            print("Principal Grievances:", gr.status_code, gr.text)
            act = await client.get(f"{URL}/principal/activity-reports", headers=headers)
            print("Principal Activities:", act.status_code, act.text)

        # 3. Retired Faculty debugging
        print("\nLogging in as RF001...")
        resp = await client.post(f"{URL}/auth/login", json={"college_id": "RF001", "password": "retired123"})
        print("Retired Faculty Login Response:", resp.status_code, resp.text)


asyncio.run(main())
