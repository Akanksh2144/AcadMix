"""
Seed mock quizzes for the Student quick-login user (22WJ8A6745).
Creates quizzes owned by the Teacher quick-login (T001), with questions, options,
and some pre-completed attempts so the student dashboard has data.

Usage:  python seed_mock_quizzes.py
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.future import select
from sqlalchemy import text
from app.core.config import settings

def uid(): return str(uuid.uuid4())

QUIZZES = [
    {
        "title": "Data Structures - Mid 1",
        "type": "mcq", "duration": 30, "total": 25, "status": "active",
        "questions": [
            {"text": "What is the time complexity of binary search?", "opts": ["O(n)", "O(log n)", "O(n^2)", "O(1)"], "correct": 1},
            {"text": "Which data structure uses LIFO?", "opts": ["Queue", "Stack", "Array", "Tree"], "correct": 1},
            {"text": "Maximum nodes in a binary tree of height h?", "opts": ["2h", "2^h", "2^(h+1) - 1", "h^2"], "correct": 2},
            {"text": "Which traversal gives sorted order in a BST?", "opts": ["Preorder", "Postorder", "Inorder", "Level order"], "correct": 2},
            {"text": "Worst case of quicksort occurs when?", "opts": ["Already sorted", "Reverse sorted", "Both A and B", "Random"], "correct": 2},
        ]
    },
    {
        "title": "DBMS - SQL Fundamentals",
        "type": "mcq", "duration": 20, "total": 20, "status": "active",
        "questions": [
            {"text": "Which SQL keyword removes duplicates?", "opts": ["UNIQUE", "DISTINCT", "DIFFERENT", "SINGLE"], "correct": 1},
            {"text": "A foreign key references which key?", "opts": ["Candidate key", "Super key", "Primary key", "Alternate key"], "correct": 2},
            {"text": "Which normal form eliminates transitive dependencies?", "opts": ["1NF", "2NF", "3NF", "BCNF"], "correct": 2},
            {"text": "JOIN that returns all rows from both tables?", "opts": ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"], "correct": 2},
        ]
    },
    {
        "title": "Operating Systems - Process Management",
        "type": "mcq", "duration": 25, "total": 25, "status": "active",
        "questions": [
            {"text": "Which scheduling is non-preemptive?", "opts": ["Round Robin", "FCFS", "SJF Preemptive", "Priority Preemptive"], "correct": 1},
            {"text": "Deadlock requires how many conditions?", "opts": ["2", "3", "4", "5"], "correct": 2},
            {"text": "Which page replacement algorithm is optimal?", "opts": ["FIFO", "LRU", "Optimal", "Clock"], "correct": 2},
        ]
    },
    {
        "title": "Computer Networks - Basics",
        "type": "mcq", "duration": 15, "total": 15, "status": "completed",
        "questions": [
            {"text": "Which layer handles routing?", "opts": ["Data Link", "Transport", "Network", "Session"], "correct": 2},
            {"text": "TCP is a _____ protocol.", "opts": ["Connectionless", "Connection-oriented", "Stateless", "Broadcast"], "correct": 1},
            {"text": "Default port number for HTTP?", "opts": ["21", "25", "80", "443"], "correct": 2},
        ]
    },
    {
        "title": "Python Programming - Quiz 1",
        "type": "mcq", "duration": 20, "total": 20, "status": "completed",
        "questions": [
            {"text": "Which keyword is used for function definition?", "opts": ["func", "function", "def", "define"], "correct": 2},
            {"text": "List is _____ in Python.", "opts": ["Immutable", "Mutable", "Static", "Constant"], "correct": 1},
            {"text": "What does len() return for 'Hello'?", "opts": ["4", "5", "6", "Error"], "correct": 1},
            {"text": "Which is used for inheritance?", "opts": ["class B(A):", "class B inherits A:", "class B extends A:", "class B : A"], "correct": 0},
        ]
    },
]


async def main():
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"statement_cache_size": 0}
    )
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as session:
        # Phase 1: Find student and teacher
        student_r = await session.execute(text(
            "SELECT u.id, u.college_id, u.name FROM users u "
            "JOIN user_profiles up ON u.id = up.user_id "
            "WHERE (up.roll_number = '22WJ8A6745' OR UPPER(u.email) = '22WJ8A6745') "
            "AND u.is_deleted = false LIMIT 1"
        ))
        student = student_r.first()
        if not student:
            print("[ERR] Student 22WJ8A6745 not found.")
            return

        teacher_r = await session.execute(text(
            "SELECT u.id, u.college_id, u.name FROM users u "
            "JOIN user_profiles up ON u.id = up.user_id "
            "WHERE (up.roll_number = 'T001' OR UPPER(u.email) = 'T001') "
            "AND u.is_deleted = false LIMIT 1"
        ))
        teacher = teacher_r.first()
        if not teacher:
            print("[ERR] Teacher T001 not found.")
            return

        sid, s_college, s_name = student
        tid, t_college, t_name = teacher
        cid = s_college  # institution college_id

        print(f"[INFO] Student: {s_name} (ID: {sid})")
        print(f"[INFO] Teacher: {t_name} (ID: {tid})")
        print(f"[INFO] College: {cid}")

        # Check existing
        existing = await session.execute(text(
            f"SELECT id FROM quizzes WHERE faculty_id = '{tid}' AND is_deleted = false LIMIT 1"
        ))
        if existing.first():
            print("[WARN] Quizzes already exist for T001. Skipping.")
            return

        now = datetime.now(timezone.utc)
        quiz_count = 0

        for qi, qdata in enumerate(QUIZZES):
            quiz_id = uid()

            # Insert quiz
            await session.execute(text(
                "INSERT INTO quizzes (id, college_id, faculty_id, title, duration_minutes, type, status, total_marks, created_at, is_deleted) "
                "VALUES (:id, :cid, :fid, :title, :dur, :type, :status, :total, :created, false)"
            ), {
                "id": quiz_id, "cid": cid, "fid": tid,
                "title": qdata["title"], "dur": qdata["duration"],
                "type": qdata["type"], "status": qdata["status"],
                "total": float(qdata["total"]),
                "created": now - timedelta(days=30 - qi * 5),
            })

            question_ids = []
            correct_option_ids = []
            marks_per_q = float(qdata["total"]) / len(qdata["questions"])

            # Insert questions
            for qn in qdata["questions"]:
                q_id = uid()
                await session.execute(text(
                    "INSERT INTO questions (id, college_id, quiz_id, type, marks, points, content, is_deleted) "
                    "VALUES (:id, :cid, :qzid, 'mcq', :marks, 1, :content, false)"
                ), {
                    "id": q_id, "cid": cid, "qzid": quiz_id,
                    "marks": marks_per_q,
                    "content": '{"question_text": "' + qn["text"].replace('"', '\\"') + '"}',
                })
                question_ids.append(q_id)

            # Insert options
            for qn_idx, qn in enumerate(qdata["questions"]):
                q_id = question_ids[qn_idx]
                correct_opt_id = None
                for oi, opt_text in enumerate(qn["opts"]):
                    opt_id = uid()
                    is_correct = (oi == qn["correct"])
                    await session.execute(text(
                        "INSERT INTO options (id, college_id, question_id, text, is_correct, is_deleted) "
                        "VALUES (:id, :cid, :qid, :txt, :corr, false)"
                    ), {"id": opt_id, "cid": cid, "qid": q_id, "txt": opt_text, "corr": is_correct})
                    if is_correct:
                        correct_opt_id = opt_id
                correct_option_ids.append(correct_opt_id)

            # For completed quizzes, create attempt + answers
            if qdata["status"] == "completed":
                attempt_id = uid()
                correct_count = int(len(question_ids) * random.uniform(0.7, 0.9))
                score = round((correct_count / len(question_ids)) * qdata["total"], 1)

                await session.execute(text(
                    "INSERT INTO quiz_attempts (id, college_id, quiz_id, student_id, status, start_time, end_time, final_score, telemetry_strikes, is_deleted) "
                    "VALUES (:id, :cid, :qzid, :sid, 'completed', :st, :et, :score, 0, false)"
                ), {
                    "id": attempt_id, "cid": cid, "qzid": quiz_id, "sid": sid,
                    "st": now - timedelta(days=10 - qi, hours=2),
                    "et": now - timedelta(days=10 - qi, hours=1, minutes=30),
                    "score": score,
                })

                for idx, (q_id, correct_opt) in enumerate(zip(question_ids, correct_option_ids)):
                    is_correct = idx < correct_count
                    marks = marks_per_q if is_correct else 0
                    await session.execute(text(
                        "INSERT INTO quiz_answers (id, college_id, attempt_id, question_id, selected_option_id, is_correct, marks_awarded, is_deleted) "
                        "VALUES (:id, :cid, :aid, :qid, :opt, :corr, :marks, false)"
                    ), {
                        "id": uid(), "cid": cid, "aid": attempt_id,
                        "qid": q_id, "opt": correct_opt if is_correct else None,
                        "corr": is_correct, "marks": marks,
                    })

            quiz_count += 1
            print(f"  [OK] {qdata['title']} ({qdata['status']}, {len(qdata['questions'])}q)")

        await session.commit()
        print(f"\n[DONE] Seeded {quiz_count} quizzes!")
        print(f"  Active: {sum(1 for q in QUIZZES if q['status'] == 'active')}")
        print(f"  Completed (with attempts): {sum(1 for q in QUIZZES if q['status'] == 'completed')}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
