import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings
from app.models.interview_prep import SQLProblem

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # TCS specific problem
        tcs_prob = SQLProblem(
            title="TCS NQT: Employee Highest Salary by Department",
            dataset_theme="Corporate HR",
            company_tag="TCS",
            difficulty="medium",
            problem_statement="Write a query to find the employee with the highest salary in each department. Return department_name, employee_name, and salary.",
            schema_sql="""
CREATE TABLE departments (
    id INTEGER PRIMARY KEY,
    name TEXT
);
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT,
    salary INTEGER,
    dept_id INTEGER
);
INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'HR'), (3, 'Sales');
INSERT INTO employees (id, name, salary, dept_id) VALUES 
(1, 'Aarav', 120000, 1),
(2, 'Vivaan', 90000, 1),
(3, 'Aditya', 150000, 1),
(4, 'Vihaan', 60000, 2),
(5, 'Arjun', 65000, 2),
(6, 'Sai', 80000, 3);
            """,
            hint="Try using a window function like RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) or a GROUP BY with a JOIN.",
            expected_query="SELECT d.name, e.name, e.salary FROM employees e JOIN departments d ON e.dept_id = d.id WHERE e.salary = (SELECT MAX(salary) FROM employees WHERE dept_id = e.dept_id)",
            expected_output=[
                {"columns": ["name", "name", "salary"], "values": [["Engineering", "Aditya", 150000], ["HR", "Arjun", 65000], ["Sales", "Sai", 80000]]}
            ]
        )
        session.add(tcs_prob)
        await session.commit()
        print("Seed Complete!")

if __name__ == "__main__":
    asyncio.run(seed())
