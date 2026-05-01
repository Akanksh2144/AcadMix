# Insights Engine - Diverse Query Tests

## Query: `List the top 10 students who have both CGPA above 9.0 and have unpaid fee invoices`

- **Source/Route:** complex:pro-repaired
- **Rows Returned:** 10
- **Execution Time:** 45609ms
- **AI Summary:** The top 10 students with a CGPA above 9.0 and unpaid fee invoices are listed, with Sahithi Agarwal and Eswar Rao achieving a perfect 10.0 CGPA.
- **SQL:**
```sql
WITH students_with_unpaid_fees AS (
    SELECT DISTINCT i.student_id
    FROM student_fee_invoices i
    LEFT JOIN fee_payments fp ON i.id = fp.invoice_id AND fp.status = 'success' AND fp.is_deleted = false AND fp.college_id = i.college_id
    WHERE i.is_deleted = false AND i.college_id = current_setting('app.college_id')
    GROUP BY i.id, i.total_amount
    HAVING COALESCE(SUM(fp.amount_paid), 0) < i.total_amount
)
SELECT u.name AS student_name, p.roll_number, p.department, ROUND(SUM(sg.credits_earned * gp.points)::numeric / NULLIF(SUM(sg.credits_earned), 0), 2) AS cgpa
FROM semester_grades sg
JOIN users u ON sg.student_id = u.id
JOIN user_profiles p ON u.id = p.user_id
JOIN (VALUES ('O',10),('A+',9),('A',8),('B+',7),('B',6),('C',5),('D',4),('F',0)) AS gp(grade, points) ON sg.grade = gp.grade
WHERE sg.student_id IN (SELECT student_id FROM students_with_unpaid_fees)
AND sg.is_deleted = false AND u.is_deleted = false AND p.is_deleted = false AND sg.college_id = current_setting('app.college_id')
GROUP BY u.id, u.name, p.roll_number, p.department
HAVING ROUND(SUM(sg.credits_earned * gp.points)::numeric / NULLIF(SUM(sg.credits_earned), 0), 2) > 9.0
ORDER BY cgpa DESC
LIMIT 10
```

**Sample Record:**
```json
{
  "cgpa": 10,
  "department": "CSE",
  "roll_number": "25A81A050107",
  "student_name": "Sahithi Agarwal"
}
```

## Query: `Show me the pass rate and average CGPA for each department for the 2021-25 batch.`

- **Source/Route:** complex:pro
- **Rows Returned:** 0
- **Execution Time:** 19665ms
- **AI Summary:** The bar chart displays the pass rate and average CGPA for each department for the 2021-25 batch, allowing for easy comparison of academic performance across different disciplines.
- **SQL:**
```sql
WITH student_stats AS (
    SELECT
        p.department,
        p.user_id,
        ROUND(SUM(sg.credits_earned * gp.points)::numeric / NULLIF(SUM(sg.credits_earned), 0), 2) AS cgpa,
        bool_or(sg.grade = 'F') AS has_failed
    FROM
        user_profiles p
    JOIN
        semester_grades sg ON p.user_id = sg.student_id
    JOIN
        (VALUES ('O', 10), ('A+', 9), ('A', 8), ('B+', 7), ('B', 6), ('C', 5), ('D', 4), ('F', 0)) AS gp(grade, points) ON sg.grade = gp.grade
    WHERE
        p.batch = '2021-25'
        AND p.is_deleted = false
        AND sg.is_deleted = false
        AND p.college_id = current_setting('app.college_id')
    GROUP BY
        p.department, p.user_id
)
SELECT
    s.department,
    ROUND(COUNT(CASE WHEN NOT s.has_failed THEN 1 END) * 100.0 / COUNT(s.user_id), 2) AS pass_rate,
    ROUND(AVG(s.cgpa)::numeric, 2) AS average_cgpa
FROM
    student_stats s
GROUP BY
    s.department
ORDER BY
    s.department
```

**Warning:** Valid SQL generated, but no data matches the query.

## Query: `Which faculty members are teaching subjects where no students have attended yet?`

**FAILED (500):** {"error":"Query failed after repair: canceling statement due to statement timeout"}

## Query: `List the hostels where occupancy is below 80%.`

- **Source/Route:** mv:hostel
- **Rows Returned:** 5
- **Execution Time:** 2463ms
- **AI Summary:** The hostels with occupancy below 80% are Boys Hostel Annexe (42.86%), Boys Hostel Block A (41.94%), Boys Hostel Block B (52.48%), Girls Hostel Block C (41.94%), and Girls Hostel Block D (31.19%). All listed hostels have occupancy significantly below the 80% threshold.
- **SQL:**
```sql

```

**Sample Record:**
```json
{
  "hostel_name": "Boys Hostel Annexe",
  "gender_type": "male",
  "total_capacity": 280,
  "occupied": 120,
  "vacant": 160,
  "occupancy_pct": 42.86
}
```

## Query: `How many students applied for placements but got rejected, grouped by their department?`

- **Source/Route:** complex:pro
- **Rows Returned:** 0
- **Execution Time:** 10719ms
- **AI Summary:** This data is not available in the provided sample. To answer how many students applied for placements but were rejected, grouped by department, we would need data that includes application status (applied, accepted, rejected) and the department of each student.
- **SQL:**
```sql
SELECT p.department, COUNT(DISTINCT pa.student_id) AS rejected_count FROM placement_applications pa JOIN users u ON pa.student_id = u.id JOIN user_profiles p ON u.id = p.user_id WHERE pa.status = 'rejected' AND pa.is_deleted = false AND u.is_deleted = false AND p.is_deleted = false AND pa.college_id = current_setting('app.college_id') GROUP BY p.department ORDER BY rejected_count DESC
```

**Warning:** Valid SQL generated, but no data matches the query.

