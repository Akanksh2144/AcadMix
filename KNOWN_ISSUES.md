# Known Issues Tracker

## Analytics / Class Results
* **`totalStudents` returns 0 for classes**
  * **Description:** In the `class_results_analytics` endpoint, `totalStudents` on assigned class cards may return `0` despite students being registered.
  * **Root Cause:** This is a data population issue, not a query bug. The `UserProfile` rows for students either are not being reliably created upon registration, or the `department`/`batch`/`section` fields are null at registration time.
  * **Fix Required:** Ensure registration and enrollment flows properly populate the `UserProfile` table with section and batch geometry so the SQL `GROUP BY` aggregations capture the accurate count of enrolled students.
