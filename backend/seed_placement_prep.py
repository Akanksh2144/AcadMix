import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings
from app.models.interview_prep import AptitudeQuestion, CompanyQuestionBank, CompanyInterviewExperience

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # Clear existing data first
        await session.execute(AptitudeQuestion.__table__.delete())
        await session.execute(CompanyQuestionBank.__table__.delete())
        await session.execute(CompanyInterviewExperience.__table__.delete())

        # ── 1. Seed Aptitude Questions ──
        apt_questions = [
            # Quantitative Easy
            AptitudeQuestion(
                category="Quantitative",
                subcategory="Time, Speed & Distance",
                difficulty="easy",
                question_text="A car travels at 60 km/h for 2 hours, and then at 80 km/h for 3 hours. What is its average speed for the entire journey?",
                options={"A": "70 km/h", "B": "72 km/h", "C": "75 km/h", "D": "68 km/h"},
                correct_option="B",
                explanation="Total distance = (60 * 2) + (80 * 3) = 120 + 240 = 360 km. Total time = 2 + 3 = 5 hours. Average speed = Total Distance / Total Time = 360 / 5 = 72 km/h."
            ),
            # Quantitative Medium
            AptitudeQuestion(
                category="Quantitative",
                subcategory="Time & Work",
                difficulty="medium",
                question_text="A and B can complete a work in 10 days and 15 days respectively. If they work together, how many days will they take to complete the same work?",
                options={"A": "5 days", "B": "6 days", "C": "7.5 days", "D": "8 days"},
                correct_option="B",
                explanation="Work done by A in 1 day = 1/10. Work done by B in 1 day = 1/15. Work done by both in 1 day = 1/10 + 1/15 = (3 + 2)/30 = 5/30 = 1/6. Therefore, they will take 6 days together."
            ),
            # Quantitative Hard
            AptitudeQuestion(
                category="Quantitative",
                subcategory="Boats & Streams",
                difficulty="hard",
                question_text="The ratio of the speed of a boat in still water to the speed of the stream is 5:1. If the boat takes 3 hours to travel 36 km downstream and back, find the speed of the boat in still water.",
                options={"A": "12 km/h", "B": "20 km/h", "C": "25 km/h", "D": "30 km/h"},
                correct_option="C",
                explanation="Let speed of boat in still water be 5x and stream speed be x. Downstream speed = 6x, Upstream speed = 4x. Time = Distance / Speed. So, 36/(6x) + 36/(4x) = 3 => 6/x + 9/x = 3 => 15/x = 3 => x = 5. Speed of boat in still water = 5x = 25 km/h."
            ),
            # Logical Easy
            AptitudeQuestion(
                category="Logical",
                subcategory="Series Completion",
                difficulty="easy",
                question_text="Look at this series: 2, 4, 8, 16, 32, ... What number should come next?",
                options={"A": "48", "B": "64", "C": "96", "D": "128"},
                correct_option="B",
                explanation="Each number is multiplied by 2 to get the next term. 32 * 2 = 64."
            ),
            # Logical Medium
            AptitudeQuestion(
                category="Logical",
                subcategory="Coding & Decoding",
                difficulty="medium",
                question_text="If in a certain code language, COLD is coded as DPME, how is HOT coded?",
                options={"A": "IPU", "B": "TOH", "C": "GNS", "D": "JPV"},
                correct_option="A",
                explanation="Each letter is shifted to its next alphabet: C -> D, O -> P, L -> M, D -> E (+1 shift). Similarly, H -> I, O -> P, T -> U. So HOT is coded as IPU."
            ),
            # Logical Hard
            AptitudeQuestion(
                category="Logical",
                subcategory="Blood Relations",
                difficulty="hard",
                question_text="A is the brother of B. B is the sister of C. C is the father of D. How is D related to A?",
                options={"A": "Brother", "B": "Sister", "C": "Nephew/Niece", "D": "Uncle"},
                correct_option="C",
                explanation="Since A, B, and C are siblings (A is brother, B is sister), and C is the father of D, A is D's uncle. Therefore, D is either the nephew (if male) or niece (if female) of A."
            ),
            # Verbal Easy
            AptitudeQuestion(
                category="Verbal",
                subcategory="Synonyms",
                difficulty="easy",
                question_text="Choose the synonym of 'ABANDON':",
                options={"A": "Keep", "B": "Forsake", "C": "Cherish", "D": "Adopt"},
                correct_option="B",
                explanation="To abandon means to leave completely or desert. 'Forsake' shares this exact meaning."
            ),
            # Verbal Medium
            AptitudeQuestion(
                category="Verbal",
                subcategory="Subject-Verb Agreement",
                difficulty="medium",
                question_text="Fill in the blank: Neither the teacher nor the students ______ present at the auditorium.",
                options={"A": "was", "B": "were", "C": "is", "D": "has"},
                correct_option="B",
                explanation="When subject parts are connected by 'neither... nor', the verb agrees with the part closest to it. Since 'students' is plural, the plural verb 'were' is correct."
            ),
            # Verbal Hard
            AptitudeQuestion(
                category="Verbal",
                subcategory="Sentence Correction",
                difficulty="hard",
                question_text="Identify the grammatically correct sentence from the following options:",
                options={
                    "A": "He is one of those men who is never satisfied.",
                    "B": "He is one of those men who are never satisfied.",
                    "C": "He is one of those man who are never satisfied.",
                    "D": "He is one of those men whom is never satisfied."
                },
                correct_option="B",
                explanation="The relative pronoun 'who' refers back to the plural noun 'men' (antecedent), requiring a plural verb 'are'. Option B is correct."
            )
        ]
        session.add_all(apt_questions)

        # ── 2. Seed Company Question Banks ──
        tcs_bank = CompanyQuestionBank(
            company_name="TCS",
            exam_name="TCS NQT",
            exam_pattern={
                "sections": ["Numerical Ability", "Verbal Ability", "Reasoning Ability", "Programming Logic", "Coding"],
                "total_questions": 3,
                "duration_minutes": 90
            },
            questions=[
                {
                    "id": "tcs_q1",
                    "question_text": "What is the output of the following C code snippet?\n\n```c\n#include <stdio.h>\nint main() {\n    int a = 5, b = 2;\n    float res = a / b;\n    printf(\"%.1f\", res);\n    return 0;\n}\n```",
                    "options": {"A": "2.5", "B": "2.0", "C": "2", "D": "Runtime Error"},
                    "correct_option": "B",
                    "section": "Programming Logic",
                    "explanation": "Because both 'a' and 'b' are integers, integer division occurs first, yielding 2. Then, 2 is converted to a float (2.0) during assignment to 'res'. printf displays '2.0'."
                },
                {
                    "id": "tcs_q2",
                    "question_text": "In DBMS, which of the following refers to the property that ensures database transactions are completed fully or not at all?",
                    "options": {"A": "Atomicity", "B": "Consistency", "C": "Isolation", "D": "Durability"},
                    "correct_option": "A",
                    "section": "Programming Logic",
                    "explanation": "Atomicity ensures that all actions within a transaction are completed successfully, or none of them are committed."
                },
                {
                    "id": "tcs_q3",
                    "question_text": "A shopkeeper sells an article at a discount of 20% and still makes a profit of 12%. If the cost price of the article is Rs 200, find its marked price.",
                    "options": {"A": "Rs 250", "B": "Rs 280", "C": "Rs 300", "D": "Rs 320"},
                    "correct_option": "B",
                    "section": "Numerical Ability",
                    "explanation": "Cost Price (CP) = 200. Profit = 12%, so Selling Price (SP) = 200 * 1.12 = 224. Marked Price (MP) with 20% discount satisfies: MP * 0.8 = 224 => MP = 224 / 0.8 = 280."
                }
            ]
        )

        infosys_bank = CompanyQuestionBank(
            company_name="Infosys",
            exam_name="Infosys SP/DSE Exam",
            exam_pattern={
                "sections": ["Hands-on Coding", "Web UI & DBMS Concepts"],
                "total_questions": 2,
                "duration_minutes": 180
            },
            questions=[
                {
                    "id": "infy_q1",
                    "question_text": "Given a sorted array of distinct integers, write a function to find if there exists an element 'i' such that A[i] = i. What is the optimal time complexity to solve this?",
                    "options": {"A": "O(N)", "B": "O(log N)", "C": "O(N log N)", "D": "O(1)"},
                    "correct_option": "B",
                    "section": "Hands-on Coding",
                    "explanation": "Using a modified Binary Search, we can check mid-points. If A[mid] == mid, we found it. If A[mid] > mid, since elements are distinct and sorted, the solution must lie on the left. If A[mid] < mid, it lies on the right. This takes O(log N) time."
                },
                {
                    "id": "infy_q2",
                    "question_text": "Which HTTP status code is returned when a client makes a request to a resource but does not have authentication credentials?",
                    "options": {"A": "400 Bad Request", "B": "401 Unauthorized", "C": "403 Forbidden", "D": "404 Not Found"},
                    "correct_option": "B",
                    "section": "Web UI & DBMS Concepts",
                    "explanation": "HTTP 401 Unauthorized is used when authentication is required and has failed or has not yet been provided."
                }
            ]
        )

        amazon_bank = CompanyQuestionBank(
            company_name="Amazon",
            exam_name="Amazon Online Assessment (SDE)",
            exam_pattern={
                "sections": ["Coding Challenge", "System Design MCQ", "Workstyle Assessment"],
                "total_questions": 2,
                "duration_minutes": 120
            },
            questions=[
                {
                    "id": "amzn_q1",
                    "question_text": "You are designing a distributed rate limiter. Which data structure/algorithm is most commonly used to track request timestamps within a sliding window?",
                    "options": {"A": "Hash Map with Chaining", "B": "Token Bucket or Sliding Window Log", "C": "Red-Black Tree", "D": "B-Tree"},
                    "correct_option": "B",
                    "section": "System Design MCQ",
                    "explanation": "The Token Bucket algorithm or a Sliding Window Log (often implemented via Redis sorted sets) are standard ways to implement distributed rate limiting."
                },
                {
                    "id": "amzn_q2",
                    "question_text": "Which of the following data structures is optimal for implementing an LRU (Least Recently Used) Cache with O(1) operations?",
                    "options": {"A": "Singly Linked List + Hash Map", "B": "Doubly Linked List + Hash Map", "C": "Binary Search Tree + Array", "D": "Min-Heap + Hash Map"},
                    "correct_option": "B",
                    "section": "Coding Challenge",
                    "explanation": "An LRU Cache requires fast insertion, lookup, and deletion. A Hash Map gives O(1) lookups, while a Doubly Linked List allows O(1) deletion and updates to the head/tail."
                }
            ]
        )
        session.add_all([tcs_bank, infosys_bank, amazon_bank])

        # ── 3. Seed Company Interview Experiences ──
        experiences = [
            CompanyInterviewExperience(
                company_name="TCS",
                target_role="Ninja & Digital Engineer",
                year=2024,
                difficulty_rating=3,
                rounds=[
                    {"round": 1, "type": "Online Cognitive & Coding Test", "details": "NQT contained 80 cognitive questions and 2 coding questions (medium difficulty - array manipulation and strings)."},
                    {"round": 2, "type": "Technical Interview", "details": "Interviewer asked about DBMS normalization, SQL joins, difference between C++ and Java, and a quick walkthrough of my final year project. 25 minutes long."},
                    {"round": 3, "type": "HR & Managerial Round", "details": "Standard questions about relocation, night shifts, team conflicts, and personal hobbies. Friendly atmosphere."}
                ]
            ),
            CompanyInterviewExperience(
                company_name="Infosys",
                target_role="Specialist Programmer (SP)",
                year=2024,
                difficulty_rating=4,
                rounds=[
                    {"round": 1, "type": "HackWithInfy Contest", "details": "Cleared Round 2 of HackWithInfy. Had 3 coding problems. Solved 2 fully and 1 partially to secure the SP interview call."},
                    {"round": 2, "type": "Technical & HR Combined", "details": "Focus on DSA (Graph algorithms, dynamic programming explanation). Asked to write code for finding cycles in a directed graph. Followed by basic OOPs concepts and general project description."}
                ]
            ),
            CompanyInterviewExperience(
                company_name="Amazon",
                target_role="Software Development Engineer (SDE) Intern",
                year=2024,
                difficulty_rating=5,
                rounds=[
                    {"round": 1, "type": "Online Assessment (OA)", "details": "2 coding problems on HackerRank (sliding window and DP). Plus 15 workstyle/leadership principle questions."},
                    {"round": 2, "type": "Technical Round 1", "details": "DS/Algo focused. Problem 1: Merge K Sorted Lists. Problem 2: Course Schedule (Topological Sort). Interviewer was very focused on clean code, edge cases, and time/space complexity analysis."},
                    {"round": 3, "type": "Technical Round 2 (Bar Raiser)", "details": "Systems-oriented and Leadership Principles. Walked through system architecture of my projects. Asked how I handled a time when a teammate wasn't contributing. Problem: Design a hit counter."}
                ]
            )
        ]
        session.add_all(experiences)

        await session.commit()
        print("Placement Prep Seed Complete!")

if __name__ == "__main__":
    asyncio.run(seed())
