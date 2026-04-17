import asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.future import select

from database import AsyncSessionLocal
from app.main import app
from app.models.core import User, College, UserProfile
from app.models.evaluation import SemesterGrade, generate_uuid
from app.core.security import create_access_token

async def seed_and_test():
    async with AsyncSessionLocal() as session:
        col_res = await session.execute(select(College).limit(1))
        college = col_res.scalars().first()

        st_id = generate_uuid()
        user = User(id=st_id, college_id=college.id, role="student", email="tester@edge.com", password_hash="123", name="EdgeCase Tester")
        prof = UserProfile(user_id=st_id, college_id=college.id, department="CS", section="Z", batch="2026")
        
        session.add(user)
        session.add(prof)

        # Semester 1 (Normal Grades)
        session.add(SemesterGrade(college_id=college.id, student_id=st_id, semester=1, course_id="CS101", credits_earned=3, grade="O"))  # 10 * 3 = 30
        session.add(SemesterGrade(college_id=college.id, student_id=st_id, semester=1, course_id="CS102", credits_earned=4, grade="A"))  # 8 * 4 = 32
        # S1 SGPA: 62 / 7 = 8.86

        # Semester 2 (Has F and AB)
        session.add(SemesterGrade(college_id=college.id, student_id=st_id, semester=2, course_id="CS201", credits_earned=3, grade="F"))  # 0 * 3 = 0
        session.add(SemesterGrade(college_id=college.id, student_id=st_id, semester=2, course_id="CS202", credits_earned=4, grade="AB")) # 0 * 4 = 0
        session.add(SemesterGrade(college_id=college.id, student_id=st_id, semester=2, course_id="CS203", credits_earned=3, grade="A+")) # 9 * 3 = 27
        # S2 SGPA: 27 / 10 = 2.7
        # Cumulative points = 62 + 27 = 89
        # Cumulative credits = 7 + 10 = 17
        # CGPA: 89 / 17 = 5.24

        await session.commit()
    
    st_token = create_access_token(st_id, "student", college.id)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(f"/api/results/semester/{st_id}", headers={"Authorization": f"Bearer {st_token}"})
        data = res.json().get("data", res.json())
        
        print("\n--- STAGING VALIDATION REPORT ---")
        for sem in data:
            print(f"Semester {sem['semester']}: SGPA = {sem['sgpa']}, Cumulative CGPA = {sem['cgpa']}")
            for subj in sem['subjects']:
                mark_display = subj.get("mid1_marks") if subj.get("mid1_marks") is not None else "null"
                print(f"  {subj['name']} (Grade: {subj['grade']}, Status: {subj['status']}) - Mid1: {mark_display}")

if __name__ == "__main__":
    asyncio.run(seed_and_test())
