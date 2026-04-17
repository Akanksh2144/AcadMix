import asyncio
from sqlalchemy.future import select
from httpx import ASGITransport, AsyncClient

from app.main import app
from database import AsyncSessionLocal
from app.models.core import User
from app.core.security import create_access_token

async def run():
    async with AsyncSessionLocal() as session:
        # Get a student
        st_res = await session.execute(select(User).where(User.role == "student"))
        student = st_res.scalars().first()
        
        # Get a teacher
        te_res = await session.execute(select(User).where(User.role == "teacher"))
        teacher = te_res.scalars().first()
        
        # Get an HOD
        hod_res = await session.execute(select(User).where(User.role == "hod"))
        hod = hod_res.scalars().first()

    if not student or not teacher or not hod:
        print("Missing required users in DB")
        return

    st_token = create_access_token(student.id, student.role, student.college_id)
    te_token = create_access_token(teacher.id, teacher.role, teacher.college_id)
    hod_token = create_access_token(hod.id, hod.role, hod.college_id)

    print("----- Boot Check: SUCCESS (No Import Errors)")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        print(f"\n----- 3. Results (results.py) for STU: {student.id} -----")
        r1 = await client.get(f"/api/results/semester/{student.id}", headers={"Authorization": f"Bearer {st_token}"})
        print(f"Status: {r1.status_code}")
        if r1.status_code == 200:
            data = r1.json().get("data", r1.json())
            if isinstance(data, list) and data:
                print("Keys:", data[0].keys())
                print("Subject shape:", data[0].get("subjects", [{}])[0])
            else:
                print("Empty Array or dict")
        else:
            print(r1.text)

        print(f"\n----- 4. Student Profile (student_core.py) for STU: {student.id} -----")
        r2 = await client.get(f"/api/students/{student.id}/profile", headers={"Authorization": f"Bearer {hod_token}"})
        print(f"Status: {r2.status_code}")
        if r2.status_code == 200:
            data = r2.json().get("data", r2.json())
            if data.get("quiz_attempts"):
                print("Quiz Attempt Shape:", data["quiz_attempts"][0])
            else:
                print("No quiz attempts")
            print("Mid marks count:", len(data.get("mid_marks", [])))
            if data.get("mid_marks"):
                print("Mid marks sample:", data["mid_marks"][0])
        else:
            print(r2.text)

        print(f"\n----- 5. Class Analytics (analytics.py) for TEA: {teacher.id} -----")
        r3 = await client.get("/api/analytics/teacher/class-results", headers={"Authorization": f"Bearer {te_token}"})
        print(f"Status: {r3.status_code}")
        if r3.status_code == 200:
            data = r3.json().get("data", r3.json())
            if data.get("assignedClasses"):
                print("Assigned Classes sample:", data["assignedClasses"][0])
            else:
                print("No assigned classes")
            print("Quiz Results Keys:", list(data.get("quizResults", {}).keys()))
            if data.get("quizResults") and list(data["quizResults"].values()) and list(data["quizResults"].values())[0]:
                print("Quiz result sample:", list(data["quizResults"].values())[0][0])
            print("Mid marks Keys:", list(data.get("midMarks", {}).keys()))
            if data.get("midMarks") and list(data["midMarks"].values()) and list(data["midMarks"].values())[0]:
                print("Mid mark sample:", list(data["midMarks"].values())[0])
        else:
            print(r3.text)

if __name__ == "__main__":
    asyncio.run(run())
