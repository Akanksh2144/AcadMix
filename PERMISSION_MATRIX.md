# AcadMix — Permission Matrix (Role × Route × Guard)

> **Generated**: April 2026  
> **Purpose**: Single source of truth for what each role can access.  
> **Convention**: `require_role()` = explicit role guard · `get_current_user` = any authenticated user · ⚠️ = needs review

---

## Guard Types

| Guard | Meaning |
|-------|---------|
| `require_role("x","y")` | Only roles x, y allowed |
| `get_current_user` | Any authenticated user — **review if appropriate** |
| `require_permission(mod, act)` | Module+action permission check (admin bypass) |

---

## 🔐 Auth & Health

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/auth/login` | POST | None (public) | — |
| `/api/auth/register` | POST | `require_role` | admin |
| `/api/auth/refresh` | POST | Cookie-based | — |
| `/api/health` | GET | None (public) | — |
| `/api/health/db` | GET | None (public) | — |

---

## 👤 User Management (`users.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/users` | GET | `require_role` | admin |
| `/api/users` | POST | `require_role` | admin |
| `/api/users/{id}` | DELETE | `require_role` | admin |
| `/api/users/students` | GET | `require_role` | admin, teacher, hod, exam_cell |
| `/api/users/teachers` | GET | `require_role` | admin, teacher, hod, exam_cell |
| `/api/users/roles` | GET | `require_role` | admin |
| `/api/users/departments` | GET | `require_role` | admin |
| `/api/users/users/{id}/permissions` | PUT | `require_role` | admin |
| `/api/users/bulk-import` | POST | `require_role` | admin, super_admin |
| `/api/users/{user_id}/force-password` | POST | `require_role` | admin, super_admin |
| `/api/users/{user_id}/anonymize` | POST | `require_role` | admin, super_admin |

---

## 📝 Quizzes (`quizzes.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/quizzes` | GET | `get_current_user` | Any authenticated |
| `/api/quizzes` | POST | `require_role` | teacher, hod, admin |
| `/api/quizzes/{id}` | GET | `get_current_user` | Any authenticated |
| `/api/quizzes/{id}` | PUT | `require_role` | teacher, hod, admin |
| `/api/quizzes/{id}` | DELETE | `require_role` | teacher, hod, admin |
| `/api/quizzes/{id}/publish` | PATCH | `require_role` | teacher, hod, admin |

---

## 📊 Quiz Attempts (`attempts.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/attempts/start` | POST | `get_current_user` | Any authenticated |
| `/api/attempts/{id}/submit` | POST | `get_current_user` | Any authenticated |
| `/api/attempts/{id}` | GET | `get_current_user` | Any authenticated |
| `/api/attempts/student-attempts` | GET | `get_current_user` | Any authenticated |
| `/api/attempts/{id}/proctoring` | POST | `get_current_user` | Any authenticated |

---

## 📈 Results (`results.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/results/semester/{student_id}` | GET | `get_current_user` + role whitelist | student (own), teacher, hod, exam_cell, admin, super_admin, principal, parent (linked), nodal_officer |
| `/api/results/semester` | POST | `require_role` | teacher, admin |

---

## ✅ Marks (`marks.py`, `marks_extra.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/marks/submit` | POST | `require_role` | teacher, hod |
| `/api/marks/entries` | GET | `require_role` | teacher, hod, exam_cell, admin |
| `/api/marks/submissions` | GET | `require_role` | teacher, hod, exam_cell, admin |
| `/api/marks/submissions/{id}/approve` | PATCH | `require_role` | hod, admin |
| `/api/marks/submissions/{id}/reject` | PATCH | `require_role` | hod, admin |

---

## 🏛️ HOD (`hod_core.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/hod/*` | ALL | `require_role` | hod, admin |

---

## 👨‍🏫 Faculty (`faculty_core.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/faculty/*` | ALL | `require_role` | teacher, hod, admin |

---

## 🎓 Student (`student_core.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/student/*` | ALL | `require_role` | student, admin |

---

## 🏫 Principal (`principal.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/principal/*` | ALL | `require_role` | principal, admin |
| `/api/principal/reports/placement` | GET | `require_role` | principal, admin |
| `/api/principal/reports/annual` | GET | `require_role` | principal, admin |

---

## 📋 Exam Cell (`exam_cell_core.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/exam-cell/*` | ALL | `require_role` | exam_cell, admin |

---

## 🏢 Admin Core (`admin_core.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/admin/*` | ALL | `require_role` | admin, super_admin |

---

## 💻 Code Execution (`code_execution.py`)

| Route | Method | Guard | Rate Limit | Roles |
|-------|--------|-------|------------|-------|
| `/api/execute` | POST | `get_current_user` | 30/min | Any authenticated |
| `/api/review` | POST | `get_current_user` | 10/min | Any authenticated |
| `/api/review_status/{task_id}` | GET | `get_current_user` | — | Any authenticated |
| `/api/coach` | POST | `get_current_user` | 20/min | Any authenticated |

---

## 🏠 Dashboards (`dashboards.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/dashboard` | GET | `get_current_user` | Any authenticated |

---

## 📢 Announcements (`announcements.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/announcements` | GET | `get_current_user` | Any authenticated |
| `/api/announcements` | POST | `require_role` | admin, hod, principal |

---

## 📅 Attendance (`attendance.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/attendance/*` | ALL | `require_role` | teacher, hod, admin |

---

## 🌐 Nodal Officer (`nodal_routes.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/nodal/*` | ALL | `require_role` | nodal_officer |
| `/api/admin/circulars*` | ALL | `require_role` | admin, super_admin |
| `/api/admin/submissions*` | ALL | `require_role` | admin, super_admin |
| `/api/admin/inspections*` | ALL | `require_role` | admin, super_admin |

---

## 💰 Fees (`fees.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/fees/*` | ALL | `require_role` | student, admin, parent |

---

## 🏥 Hostel (`hostel.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/hostel/*` | GET | `require_role` | warden, admin, student |
| `/api/hostel/gate-pass*` | POST | `require_role` | student, warden, admin |

---

## 🚌 Transport (`transport.py`, `transport_admin.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/transport/*` (student) | ALL | `require_role` | student, admin, parent |
| `/api/transport-admin/*` | ALL | `require_role` | admin, transport_admin |

---

## 📚 Library (`library.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/library/*` | ALL | `require_role` | librarian, admin, student |

---

## 💼 Placements (`placements.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/placements/*` | ALL | `require_role` | tpo, tp_officer, admin, student |

---

## 🎓 TPO (`tpo.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/tpo/*` | ALL | `require_role` | tpo, tp_officer, admin |
| `/api/tpo/placement-report` | GET | `require_role` | tpo, tp_officer, admin, principal |

---

## 🎓 Alumni (`alumni.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/alumni/*` | ALL | `require_role` | alumni, admin, tpo |

---

## 🏭 Industry (`industry.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/industry/*` | ALL | `require_role` | industry, admin, tpo |

---

## 👴 Retired Faculty (`retired_faculty.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/retired-faculty/*` | ALL | `require_role` | retired_faculty, admin |

---

## 🧑‍🔬 Expert (`expert.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/expert/*` | ALL | `require_role` | expert, admin |

---

## 👨‍👩‍👧 Parents (`parents.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/parent/*` | ALL | `require_role` | parent, admin |

---

## 🏫 Grievances (`grievances.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/grievances` | POST | `get_current_user` | Any authenticated |
| `/api/grievances` | GET | `get_current_user` | Any authenticated |
| `/api/grievances/{id}` | PATCH | `require_role` | admin, hod |

---

## 📋 Leaves (`leaves.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/leaves/*` | ALL | `get_current_user` | Any authenticated (self-service) |
| `/api/leaves/{id}/approve` | PATCH | `require_role` | hod, principal, admin |

---

## 🔔 Notifications (`notifications.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/notifications` | GET | `get_current_user` | Any authenticated |
| `/api/notifications/{id}/read` | PATCH | `get_current_user` | Any authenticated |

---

## 🎯 Career Tools (`career_tools.py`, `resume.py`, `interview.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/resume/*` | ALL | `get_current_user` | Any authenticated (student-focused) |
| `/api/interview/*` | ALL | `get_current_user` | Any authenticated (student-focused) |

---

## 🔒 Visitors (`visitors.py`)

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/visitors/*` | ALL | `require_role` | admin, security, warden |
| `/api/visitors/pre-approve` | POST | `require_role` | admin, security, warden, teacher, hod |
| `/api/visitors/search` | GET | `require_role` | admin, security, warden, teacher, hod |

---

## ⚠️ Endpoints Using Only `get_current_user` (Review Needed)

These endpoints allow **any authenticated user** without role restriction:

| Router | Endpoints | Risk |
|--------|-----------|------|
| `attempts.py` | Quiz start/submit | Low — students need this |
| `dashboards.py` | Dashboard data | Low — role-filtered in response |
| `code_execution.py` | Execute/review/coach | Medium — rate-limited |
| `grievances.py` | Create/list grievances | Low — self-service |
| `leaves.py` | Create/list leaves | Low — self-service |
| `notifications.py` | List/read notifications | Low — self-service |
| `career_tools.py` | Resume/interview tools | Low — student-focused |

---

*This matrix should be reviewed whenever new routes or roles are added.*
