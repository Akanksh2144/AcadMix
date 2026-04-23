# AcadMix SQL Practice Arena — Complete Problem Catalog

> **444 problems** across **19 concept categories** for mass recruiter placement prep.
> Generated on 2026-04-23 | DataLemur-style challenges

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Problems | 444 |
| Easy | 155 |
| Medium | 194 |
| Hard | 95 |
| Categories | 19 |
| Companies | 42 |
| SQLite WASM | 429 |
| PostgreSQL-only | 15 |

## Category Breakdown

| Category | Easy | Medium | Hard | Total |
|----------|------|--------|------|-------|
| Advanced Analytics | 0 | 0 | 5 | 5 |
| Aggregate Functions | 42 | 24 | 3 | 69 |
| Array Functions | 2 | 2 | 1 | 5 |
| Common Table Expressions (CTE) or Subquery | 5 | 13 | 7 | 25 |
| Conditional Logic | 14 | 18 | 1 | 33 |
| Control Flow Functions | 3 | 3 | 1 | 7 |
| Data Generation | 2 | 2 | 1 | 5 |
| Date-Time Functions | 9 | 20 | 10 | 39 |
| Distinct and Unique Handling | 5 | 5 | 0 | 10 |
| Existence Check | 0 | 2 | 3 | 5 |
| Filtering & Sorting | 22 | 2 | 4 | 28 |
| General SQL | 1 | 1 | 0 | 2 |
| Joins | 17 | 44 | 13 | 74 |
| Mathematical Functions | 1 | 7 | 10 | 18 |
| Null Handling | 3 | 0 | 0 | 3 |
| Set Operations | 4 | 6 | 1 | 11 |
| String Functions | 15 | 5 | 0 | 20 |
| Top N Results | 9 | 9 | 4 | 22 |
| Window Functions | 1 | 31 | 31 | 63 |

## Company Coverage

| Company | Problems |
|---------|----------|
| TCS NQT | 46 |
| Infosys | 44 |
| Wipro | 43 |
| Capgemini | 40 |
| Cognizant | 40 |
| HCLTech | 39 |
| Accenture | 38 |
| Deloitte | 38 |
| Zoho | 32 |
| TCS Digital | 31 |
| Amazon | 17 |
| Google | 13 |
| Flipkart | 9 |
| Microsoft | 8 |
| Goldman Sachs | 7 |
| Meta | 7 |
| Swiggy | 7 |
| Uber | 6 |
| Adobe | 5 |
| Razorpay | 5 |
| SAP | 5 |
| Freshworks | 5 |
| JP Morgan | 4 |
| Paytm | 4 |
| PhonePe | 4 |
| Oracle | 4 |
| Atlassian | 4 |
| Salesforce | 4 |
| ServiceNow | 4 |
| Myntra | 4 |
| Juspay | 4 |
| Ola | 4 |
| CRED | 4 |
| Morgan Stanley | 3 |
| Zomato | 3 |
| HDFC | 2 |
| ICICI | 2 |
| Tech Mahindra | 1 |
| Kotak | 1 |
| Walmart | 1 |
| Practo | 1 |
| Apollo | 1 |

---

## Advanced Analytics (5 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-159 | Multi-Schema Summary Dashboard | HARD | Deloitte | HR / Employee | SQLite |
| 2 | sql-160 | Grand Analytics: User 360° View | HARD | Google | Payments (Paytm) | SQLite |
| 3 | sql-180 | Grand Finale: Cross-Schema Business Intelligence | HARD | Amazon | E-Commerce (Flipkart) | SQLite |
| 4 | sql-427 | Complete Transaction Audit Trail | HARD | Zoho | Banking / Finance | SQLite |
| 5 | sql-429 | Full Platform Analytics Dashboard | HARD | Zoho | E-Commerce (Flipkart) | SQLite |

### Problem Descriptions

**sql-159. Multi-Schema Summary Dashboard** 🔴
> Create a single-row executive dashboard showing: total employees, total departments, avg salary (rounded), highest salary, lowest salary, salary range, and total payroll.

**sql-160. Grand Analytics: User 360° View** 🔴
> Build a comprehensive user profile: name, city, total transactions, successful count, failed count, success rate, total spent, avg transaction, preferred method, and spending tier.

**sql-180. Grand Finale: Cross-Schema Business Intelligence** 🔴
> Build a comprehensive BI report from the E-Commerce schema: for each customer, show their name, city, email domain, total orders, total spent, avg order (rounded), first order date, last order date, days as customer, favorite category, and customer segment (VIP/Regular/New).

**sql-427. Complete Transaction Audit Trail** 🔴
> Show each transaction with its running balance, previous balance, and change.

**sql-429. Full Platform Analytics Dashboard** 🔴
> Create a one-row analytics dashboard: total_orders, total_revenue, avg_order_value, unique_customers, total_products_sold.

---

## Aggregate Functions (69 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-001 | Employees Above Average Salary | EASY | TCS NQT, Infosys, Wipro, Capgemini | HR / Employee | SQLite |
| 2 | sql-006 | City-wise Average Rating | EASY | Cognizant | Food Delivery (Zomato) | SQLite |
| 3 | sql-008 | Patients With Multiple Visits | EASY | HCLTech | Healthcare / Hospital | SQLite |
| 4 | sql-012 | Second Highest Salary | MEDIUM | Wipro, TCS NQT, Infosys, Accenture, HCLTech, Cognizant, Capgemini | HR / Employee | SQLite |
| 5 | sql-018 | Genre Popularity Ranking | MEDIUM | Meta | Streaming (Netflix) | SQLite |
| 6 | sql-025 | Patients Older Than Average | EASY | Cognizant | Healthcare / Hospital | SQLite |
| 7 | sql-053 | Find Duplicate Cities | EASY | Myntra | E-Commerce (Flipkart) | SQLite |
| 8 | sql-070 | HAVING Multiple Conditions | MEDIUM | JP Morgan | Banking / Finance | SQLite |
| 9 | sql-071 | MIN and MAX in Same Query | EASY | Uber | Ride-Sharing (Ola) | SQLite |
| 10 | sql-075 | Derived Table: Above-Avg Riders | MEDIUM | Deloitte | Ride-Sharing (Ola) | SQLite |
| 11 | sql-092 | Multiple GROUP BY Columns | MEDIUM | Freshworks | Ride-Sharing (Ola) | SQLite |
| 12 | sql-097 | Repeat Buyers: Customer Cohort | HARD | Amazon | E-Commerce (Flipkart) | SQLite |
| 13 | sql-102 | Second Highest Salary (LC #176) | EASY | Infosys, TCS NQT, Wipro, HCLTech, Capgemini | HR / Employee | SQLite |
| 14 | sql-111 | Funnel: Cart to Purchase | HARD | Flipkart | E-Commerce (Flipkart) | SQLite |
| 15 | sql-114 | Failed Transactions by Payment Method | MEDIUM | Razorpay | Payments (Paytm) | SQLite |
| 16 | sql-115 | Peak Order Hours | EASY | Swiggy | Food Delivery (Zomato) | SQLite |
| 17 | sql-118 | Friend Request Acceptance Rate | MEDIUM | Meta | Social Media (Instagram) | SQLite |
| 18 | sql-126 | Daily Active Transacting Users | EASY | Paytm | Payments (Paytm) | SQLite |
| 19 | sql-133 | Department-Wise Employee Count | EASY | Infosys, TCS NQT, Wipro, HCLTech, Cognizant, Capgemini | HR / Employee | SQLite |
| 20 | sql-142 | Department With Highest Average Salary | EASY | HCLTech | HR / Employee | SQLite |
| 21 | sql-153 | Account Balance After All Transactions | MEDIUM | JP Morgan | Banking / Finance | SQLite |
| 22 | sql-163 | HAVING Multiple Conditions | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 23 | sql-188 | Departments With More Than 2 Employees | EASY | TCS NQT, Infosys, Wipro, HCLTech | HR / Employee | SQLite |
| 24 | sql-190 | Total Salary Expense Per Department | EASY | TCS Digital | HR / Employee | SQLite |
| 25 | sql-197 | COUNT(*) vs COUNT(column) Difference | EASY | HCLTech | HR / Employee | SQLite |
| 26 | sql-199 | Min and Max Salary Per Department | EASY | HCLTech, TCS NQT, Infosys, Wipro, Capgemini | HR / Employee | SQLite |
| 27 | sql-214 | Average Fare Per City | EASY | TCS NQT | Ride-Sharing (Ola) | SQLite |
| 28 | sql-219 | Department With Lowest Average Salary | MEDIUM | TCS NQT | HR / Employee | SQLite |
| 29 | sql-229 | Patients With Exactly One Visit | EASY | TCS NQT | Healthcare / Hospital | SQLite |
| 30 | sql-230 | Total Employee Count | EASY | TCS NQT | HR / Employee | SQLite |
| 31 | sql-231 | Average Order Value Per Customer | EASY | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 32 | sql-237 | All Departments Even Empty Ones | EASY | TCS Digital | HR / Employee | SQLite |
| 33 | sql-241 | Average Rating Per Cuisine | EASY | TCS Digital | Food Delivery (Zomato) | SQLite |
| 34 | sql-246 | Count Logins Per User | EASY | TCS Digital | Login / Activity | SQLite |
| 35 | sql-249 | Customers Who Placed 2+ Orders | MEDIUM | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 36 | sql-255 | High-Value Customers Over 10K | MEDIUM | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 37 | sql-256 | Departments With Avg Salary Above 50K | MEDIUM | Infosys | HR / Employee | SQLite |
| 38 | sql-266 | Count Products Per Category | EASY | Infosys | E-Commerce (Flipkart) | SQLite |
| 39 | sql-278 | Count Male vs Female Patients | EASY | Wipro | Healthcare / Hospital | SQLite |
| 40 | sql-282 | Total Fee Per Doctor | EASY | Wipro | Healthcare / Hospital | SQLite |
| 41 | sql-285 | Average Transaction Amount Per Branch | MEDIUM | Wipro | Banking / Finance | SQLite |
| 42 | sql-291 | Profile Followers Count | EASY | Wipro | Social Media (Instagram) | SQLite |
| 43 | sql-294 | Students Enrolled in 2+ Courses | MEDIUM | Wipro | University / Education | SQLite |
| 44 | sql-299 | Average Fare Per Ride City | EASY | HCLTech | Ride-Sharing (Ola) | SQLite |
| 45 | sql-308 | Count Transactions Per Type | EASY | HCLTech | Banking / Finance | SQLite |
| 46 | sql-310 | Riders Sorted by Total Fare | EASY | HCLTech | Ride-Sharing (Ola) | SQLite |
| 47 | sql-312 | Student Average Grade | EASY | HCLTech | University / Education | SQLite |
| 48 | sql-313 | Average Order Quantity Per Product | EASY | HCLTech | E-Commerce (Flipkart) | SQLite |
| 49 | sql-318 | Average Experience Per Specialty | EASY | HCLTech | Healthcare / Hospital | SQLite |
| 50 | sql-320 | Count Appointments Per Specialty | EASY | Cognizant | Healthcare / Hospital | SQLite |
| 51 | sql-321 | Highest Single Order Total | EASY | Cognizant | E-Commerce (Flipkart) | SQLite |
| 52 | sql-325 | Average Patient Age Per Gender | EASY | Cognizant | Healthcare / Hospital | SQLite |
| 53 | sql-326 | Orders With Multiple Line Items | MEDIUM | Cognizant | E-Commerce (Flipkart) | SQLite |
| 54 | sql-334 | Accounts With Balance Above 50K | EASY | Cognizant | Banking / Finance | SQLite |
| 55 | sql-338 | Order Status Distribution | EASY | Cognizant | E-Commerce (Flipkart) | SQLite |
| 56 | sql-347 | Account Balance Summary | HARD | Accenture | Banking / Finance | SQLite |
| 57 | sql-350 | Patients Treated by Multiple Doctors | MEDIUM | Accenture | Healthcare / Hospital | SQLite |
| 58 | sql-352 | Cheapest and Most Expensive Per Order | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 59 | sql-363 | Total Quantity Sold Per Product | EASY | Capgemini | E-Commerce (Flipkart) | SQLite |
| 60 | sql-364 | Patients With Multiple Appointments | MEDIUM | Capgemini | Healthcare / Hospital | SQLite |
| 61 | sql-365 | Restaurant City Distribution | EASY | Capgemini | Food Delivery (Zomato) | SQLite |
| 62 | sql-370 | Doctors With Below-Average Fees | MEDIUM | Capgemini | Healthcare / Hospital | SQLite |
| 63 | sql-378 | High-Frequency Login Users | MEDIUM | Capgemini | Login / Activity | SQLite |
| 64 | sql-388 | Doctor Appointment Count Summary | EASY | Deloitte | Healthcare / Hospital | SQLite |
| 65 | sql-401 | Account Type Distribution | EASY | Deloitte | Banking / Finance | SQLite |
| 66 | sql-405 | Employee Salary Summary Statistics | MEDIUM | Zoho | HR / Employee | SQLite |
| 67 | sql-409 | Riders With Rides in Multiple Cities | MEDIUM | Zoho | Ride-Sharing (Ola) | SQLite |
| 68 | sql-416 | Total Amount Per Transaction Type | EASY | Zoho | Banking / Finance | SQLite |
| 69 | sql-425 | Drivers With Above-Average Fare | MEDIUM | Zoho | Ride-Sharing (Ola) | SQLite |

### Problem Descriptions

**sql-001. Employees Above Average Salary** 🟢
> Find all employees whose salary is strictly above the company average.

**sql-006. City-wise Average Rating** 🟢
> Find the average restaurant rating for each city.

**sql-008. Patients With Multiple Visits** 🟢
> Find patients who have visited more than once.

**sql-012. Second Highest Salary** 🟡
> Find the second highest distinct salary.

**sql-018. Genre Popularity Ranking** 🟡
> Rank genres by total watch count (number of watch_history entries).

**sql-025. Patients Older Than Average** 🟢
> Find patients whose age is above the average patient age.

**sql-053. Find Duplicate Cities** 🟢
> Find cities with more than one customer.

**sql-070. HAVING Multiple Conditions** 🟡
> Find branches where total credits exceed 10000 AND total debits exceed 2000.

**sql-071. MIN and MAX in Same Query** 🟢
> Find the cheapest and most expensive completed ride fare, plus the fare range.

**sql-075. Derived Table: Above-Avg Riders** 🟡
> Using a derived table (inline subquery in FROM), find riders whose average fare exceeds the overall average.

**sql-092. Multiple GROUP BY Columns** 🟡
> Count rides grouped by both driver city and ride status.

**sql-097. Repeat Buyers: Customer Cohort** 🔴
> Classify customers into cohorts: 'One-Timer' (1 order), 'Repeat' (2-3 orders), 'Loyal' (4+ orders). Exclude cancelled.

**sql-102. Second Highest Salary (LC #176)** 🟢
> Find the second highest distinct salary. Return NULL if only one distinct salary exists.

**sql-111. Funnel: Cart to Purchase** 🔴
> Simulate a conversion funnel. From the orders table, count orders by status to show: total_orders, delivered (purchased), shipped (in progress), cancelled (dropped).

**sql-114. Failed Transactions by Payment Method** 🟡
> Count total and failed transactions per payment method. Calculate failure rate.

**sql-115. Peak Order Hours** 🟢
> Find which hour of the day has the most orders. Since our orders use dates not times, find the day with the most orders.

**sql-118. Friend Request Acceptance Rate** 🟡
> From the follows table, calculate the mutual follow (acceptance) rate: what percentage of follows are reciprocated?

**sql-126. Daily Active Transacting Users** 🟢
> Count the number of distinct users who made a successful payment on each day.

**sql-133. Department-Wise Employee Count** 🟢
> Count the number of employees in each department.

**sql-142. Department With Highest Average Salary** 🟢
> Find the department with the highest average salary.

**sql-153. Account Balance After All Transactions** 🟡
> Calculate each account's effective balance after applying all credits and debits.

**sql-163. HAVING Multiple Conditions** 🟡
> Find product categories where the total revenue exceeds 5000 AND the average order amount exceeds 1000.

**sql-188. Departments With More Than 2 Employees** 🟢
> Find departments that have more than 2 employees.

**sql-190. Total Salary Expense Per Department** 🟢
> Calculate the total salary expense for each department.

**sql-197. COUNT(*) vs COUNT(column) Difference** 🟢
> Show the difference between COUNT(*) and COUNT(mgr_id) on the employees table.

**sql-199. Min and Max Salary Per Department** 🟢
> Find the minimum and maximum salary in each department.

**sql-214. Average Fare Per City** 🟢
> Calculate the average ride fare for each city.

**sql-219. Department With Lowest Average Salary** 🟡
> Find the department with the lowest average salary.

**sql-229. Patients With Exactly One Visit** 🟢
> Find patients who visited the doctor exactly once.

**sql-230. Total Employee Count** 🟢
> Count the total number of employees in the company.

**sql-231. Average Order Value Per Customer** 🟢
> Calculate the average order value for each customer.

**sql-237. All Departments Even Empty Ones** 🟢
> List all departments. If a department has employees, show the count; otherwise show 0.

**sql-241. Average Rating Per Cuisine** 🟢
> Calculate the average restaurant rating for each cuisine type.

**sql-246. Count Logins Per User** 🟢
> Count the number of login events for each user.

**sql-249. Customers Who Placed 2+ Orders** 🟡
> Find customers who have placed 2 or more orders.

**sql-255. High-Value Customers Over 10K** 🟡
> Find customers whose total spending exceeds 10,000.

**sql-256. Departments With Avg Salary Above 50K** 🟡
> Find departments where the average salary exceeds 50,000.

**sql-266. Count Products Per Category** 🟢
> Count the number of products in each category.

**sql-278. Count Male vs Female Patients** 🟢
> Count how many patients are male vs female.

**sql-282. Total Fee Per Doctor** 🟢
> Calculate total appointment fees collected by each doctor.

**sql-285. Average Transaction Amount Per Branch** 🟡
> Calculate the average transaction amount for each bank branch.

**sql-291. Profile Followers Count** 🟢
> Count followers for each profile (from the follows table).

**sql-294. Students Enrolled in 2+ Courses** 🟡
> Find students enrolled in 2 or more courses.

**sql-299. Average Fare Per Ride City** 🟢
> Calculate average fare grouped by pickup city.

**sql-308. Count Transactions Per Type** 🟢
> Count how many credit vs debit transactions exist.

**sql-310. Riders Sorted by Total Fare** 🟢
> Sort riders by their total fare spent across all rides.

**sql-312. Student Average Grade** 🟢
> Calculate the average grade for each student.

**sql-313. Average Order Quantity Per Product** 🟢
> Find the average quantity ordered per product.

**sql-318. Average Experience Per Specialty** 🟢
> Calculate average years of experience per medical specialty.

**sql-320. Count Appointments Per Specialty** 🟢
> Count the number of appointments for each medical specialty.

**sql-321. Highest Single Order Total** 🟢
> Find the single highest order total.

**sql-325. Average Patient Age Per Gender** 🟢
> Calculate the average patient age for each gender.

**sql-326. Orders With Multiple Line Items** 🟡
> Find orders that contain more than 1 line item.

**sql-334. Accounts With Balance Above 50K** 🟢
> Find bank accounts with balance exceeding 50,000.

**sql-338. Order Status Distribution** 🟢
> Count orders by their status.

**sql-347. Account Balance Summary** 🔴
> Show each account's balance, total credits, total debits, and net balance.

**sql-350. Patients Treated by Multiple Doctors** 🟡
> Find patients who have been treated by more than 1 different doctor.

**sql-352. Cheapest and Most Expensive Per Order** 🟡
> For each order, find the cheapest and most expensive product.

**sql-363. Total Quantity Sold Per Product** 🟢
> Find total quantity sold for each product.

**sql-364. Patients With Multiple Appointments** 🟡
> Find patients who have had more than 1 appointment.

**sql-365. Restaurant City Distribution** 🟢
> Count restaurants per city.

**sql-370. Doctors With Below-Average Fees** 🟡
> Find doctors whose average appointment fee is below the overall average fee.

**sql-378. High-Frequency Login Users** 🟡
> Find users who logged in more than 3 times.

**sql-388. Doctor Appointment Count Summary** 🟢
> Count total appointments per doctor.

**sql-401. Account Type Distribution** 🟢
> Count accounts by account type.

**sql-405. Employee Salary Summary Statistics** 🟡
> Show min, max, average, and total salary across all employees.

**sql-409. Riders With Rides in Multiple Cities** 🟡
> Find riders who have taken rides from more than 1 pickup city.

**sql-416. Total Amount Per Transaction Type** 🟢
> Calculate total amount for credits vs debits.

**sql-425. Drivers With Above-Average Fare** 🟡
> Find drivers whose average fare per ride exceeds the overall average fare.

---

## Array Functions (5 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-191 | ARRAY_AGG: Products Per Order | EASY | Amazon, Flipkart | E-Commerce / Shopping | PostgreSQL |
| 2 | sql-192 | ARRAY_AGG DISTINCT: Unique Categories Per Customer | MEDIUM | Google, Microsoft | E-Commerce / Shopping | PostgreSQL |
| 3 | sql-193 | UNNEST: Expand Tags to Rows | MEDIUM | Meta, Uber | E-Commerce / Shopping | PostgreSQL |
| 4 | sql-194 | array_length: Count Tags Per Product | EASY | Deloitte, Cognizant | E-Commerce / Shopping | PostgreSQL |
| 5 | sql-195 | ANY + ARRAY_AGG: Cross-Selling | HARD | Amazon, Google, Walmart | E-Commerce / Shopping | PostgreSQL |

### Problem Descriptions

**sql-191. ARRAY_AGG: Products Per Order** 🟢 ⚠️ PostgreSQL
> For each order, list all product names purchased as a sorted array.

**sql-192. ARRAY_AGG DISTINCT: Unique Categories Per Customer** 🟡 ⚠️ PostgreSQL
> For each customer, list the distinct product categories they have ordered as a sorted array.

**sql-193. UNNEST: Expand Tags to Rows** 🟡 ⚠️ PostgreSQL
> Given a table of products with a tags array column, expand (unnest) each product's tags into individual rows.

**sql-194. array_length: Count Tags Per Product** 🟢 ⚠️ PostgreSQL
> For each product, show how many tags it has. Return name, tag_count. Order by tag_count DESC, name.

**sql-195. ANY + ARRAY_AGG: Cross-Selling** 🔴 ⚠️ PostgreSQL
> Find pairs of products that were bought together in at least one order. Return product_a, product_b (alphabetically: product_a < product_b) and times_together. Order by times_together DESC, product_a.

---

## Common Table Expressions (CTE) or Subquery (25 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-023 | Department Salary Rank | HARD | Google | HR / Employee | SQLite |
| 2 | sql-029 | CTE: High-Value Customers | MEDIUM | Amazon | Food Delivery (Zomato) | SQLite |
| 3 | sql-035 | EXISTS: Students Enrolled in Data Structures | MEDIUM | Flipkart | University / Education | SQLite |
| 4 | sql-040 | Multi-CTE: Customer Lifetime Value | HARD | Oracle | E-Commerce (Flipkart) | SQLite |
| 5 | sql-056 | Recursive CTE: Number Sequence | HARD | Juspay | HR / Employee | SQLite |
| 6 | sql-068 | IN Subquery: Doctors Who Treated Seniors | MEDIUM | HCLTech | Healthcare / Hospital | SQLite |
| 7 | sql-084 | Scalar Subquery in SELECT | MEDIUM | Cognizant | Food Delivery (Zomato) | SQLite |
| 8 | sql-088 | Nested 3-Level Subquery | HARD | TCS NQT | University / Education | SQLite |
| 9 | sql-100 | Grand Pipeline: Complete E-Commerce Report | HARD | Goldman Sachs | E-Commerce (Flipkart) | SQLite |
| 10 | sql-129 | Salary Above Department Average (Correlated) | MEDIUM | Accenture | HR / Employee | SQLite |
| 11 | sql-138 | Recursive CTE: Org Chart Levels | HARD | SAP | HR / Employee | SQLite |
| 12 | sql-162 | EXISTS: Departments With High Earners | MEDIUM | Cognizant | HR / Employee | SQLite |
| 13 | sql-191 | Salary Above Company Average | EASY | Infosys, TCS NQT, Wipro, Accenture, Capgemini | HR / Employee | SQLite |
| 14 | sql-201 | Average Salary Comparison: Above vs Below | MEDIUM | Cognizant | HR / Employee | SQLite |
| 15 | sql-202 | Employees Sharing Same Department as 'Alice' | EASY | Cognizant, TCS NQT, Wipro | HR / Employee | SQLite |
| 16 | sql-205 | Customers With Orders Above Average Total | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 17 | sql-207 | Employees in Same City as Company HQ | MEDIUM | Capgemini | Ride-Sharing (Ola) | SQLite |
| 18 | sql-212 | Employees Hired Same Year as Alice | EASY | TCS NQT | HR / Employee | SQLite |
| 19 | sql-225 | Rides With Above-Average Fare | MEDIUM | TCS NQT | Ride-Sharing (Ola) | SQLite |
| 20 | sql-244 | Products Costing Above Average | MEDIUM | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 21 | sql-263 | Restaurants With Below-Average Rating | EASY | Infosys | Food Delivery (Zomato) | SQLite |
| 22 | sql-276 | Total Fees Collected Per Specialty | MEDIUM | Infosys | Healthcare / Hospital | SQLite |
| 23 | sql-300 | Products Below Average Price | MEDIUM | HCLTech | E-Commerce (Flipkart) | SQLite |
| 24 | sql-333 | Total Fare Collected Per City | EASY | Cognizant | Ride-Sharing (Ola) | SQLite |
| 25 | sql-402 | Manager Hierarchy Depth | HARD | Deloitte | HR / Employee | SQLite |

### Problem Descriptions

**sql-023. Department Salary Rank** 🔴
> Rank employees within each department by salary (highest first).

**sql-029. CTE: High-Value Customers** 🟡
> Using a CTE, find customers whose total spending is above the average customer spending.

**sql-035. EXISTS: Students Enrolled in Data Structures** 🟡
> Using EXISTS, find students who are enrolled in 'Data Structures'.

**sql-040. Multi-CTE: Customer Lifetime Value** 🔴
> Using multiple CTEs, find each customer's total spending and order count (exclude cancelled orders), then rank them.

**sql-056. Recursive CTE: Number Sequence** 🔴
> Using a recursive CTE, generate a sequence of numbers from 1 to 6 (one for each employee).

**sql-068. IN Subquery: Doctors Who Treated Seniors** 🟡
> Find doctors who have treated patients older than 35.

**sql-084. Scalar Subquery in SELECT** 🟡
> For each restaurant, show its rating and the overall average rating using a scalar subquery.

**sql-088. Nested 3-Level Subquery** 🔴
> Find student names who got grade 'A' in courses taught in the 'CSE' department.

**sql-100. Grand Pipeline: Complete E-Commerce Report** 🔴
> Build a complete business report using a multi-CTE pipeline:

**sql-129. Salary Above Department Average (Correlated)** 🟡
> Using a correlated subquery, find employees whose salary is above their department's average.

**sql-138. Recursive CTE: Org Chart Levels** 🔴
> Using a recursive CTE, simulate organizational levels. Assign level 1 to the highest-paid employee, level 2 to next tier, etc., based on salary bands (each 10K range).

**sql-162. EXISTS: Departments With High Earners** 🟡
> Find departments that have at least one employee earning more than 60000 using EXISTS.

**sql-191. Salary Above Company Average** 🟢
> Find employees whose salary is above the company-wide average.

**sql-201. Average Salary Comparison: Above vs Below** 🟡
> Classify each employee as 'Above Average' or 'Below Average' based on company-wide average salary.

**sql-202. Employees Sharing Same Department as 'Alice'** 🟢
> Find all employees in the same department as Alice (excluding Alice herself).

**sql-205. Customers With Orders Above Average Total** 🟡
> Find customers whose order total exceeds the average order total across all orders.

**sql-207. Employees in Same City as Company HQ** 🟡
> Find riders whose city matches any driver's city.

**sql-212. Employees Hired Same Year as Alice** 🟢
> Find employees hired in the same year as Alice.

**sql-225. Rides With Above-Average Fare** 🟡
> Find all rides where the fare exceeds the overall average fare.

**sql-244. Products Costing Above Average** 🟡
> Find products whose price is above the average product price.

**sql-263. Restaurants With Below-Average Rating** 🟢
> Find restaurants whose rating is below the overall average.

**sql-276. Total Fees Collected Per Specialty** 🟡
> Calculate total fees collected per medical specialty.

**sql-300. Products Below Average Price** 🟡
> Find products whose price is below the average product price.

**sql-333. Total Fare Collected Per City** 🟢
> Calculate total fare revenue per pickup city.

**sql-402. Manager Hierarchy Depth** 🔴
> Find the management chain depth for each employee (how many levels above them).

---

## Conditional Logic (33 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-011 | Accounts With Net Outflow | MEDIUM | JP Morgan | Banking / Finance | SQLite |
| 2 | sql-020 | Students With All A Grades | MEDIUM | Infosys | University / Education | SQLite |
| 3 | sql-022 | Branch Topper | HARD | Amazon | University / Education | SQLite |
| 4 | sql-045 | Custom Sort: Priority Status | MEDIUM | Swiggy | E-Commerce (Flipkart) | SQLite |
| 5 | sql-051 | Pivot: Orders by Status | MEDIUM | Salesforce | E-Commerce (Flipkart) | SQLite |
| 6 | sql-060 | Conditional COUNT: Rides by Status | EASY | Freshworks | Ride-Sharing (Ola) | SQLite |
| 7 | sql-072 | Nested CASE: Grade Classification | MEDIUM | Infosys | University / Education | SQLite |
| 8 | sql-093 | CASE in WHERE Clause | MEDIUM | Swiggy | Food Delivery (Zomato) | SQLite |
| 9 | sql-094 | Simulated UPDATE: Salary Hike | MEDIUM | Accenture | HR / Employee | SQLite |
| 10 | sql-107 | Exchange Seat IDs (LC #626) | MEDIUM | Meta | University / Education | SQLite |
| 11 | sql-119 | Credit Score Bucketing | EASY | CRED | Payments (Paytm) | SQLite |
| 12 | sql-149 | Multi-Condition CASE: Risk Rating | MEDIUM | TCS NQT | Banking / Finance | SQLite |
| 13 | sql-164 | Conditional ORDER BY | EASY | TCS NQT | HR / Employee | SQLite |
| 14 | sql-172 | Count Distinct With Condition | EASY | ServiceNow | Login / Activity | SQLite |
| 15 | sql-178 | Conditional Aggregation: Pass/Fail Count | EASY | Zoho | University / Education | SQLite |
| 16 | sql-194 | DELETE vs TRUNCATE Simulation: Count After Filter | EASY | Wipro, TCS NQT, Infosys | HR / Employee | SQLite |
| 17 | sql-209 | Customer Segmentation by Order Count | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 18 | sql-220 | Employees With 'a' in Name | EASY | TCS NQT | HR / Employee | SQLite |
| 19 | sql-224 | Count NULL vs Non-NULL Managers | EASY | TCS NQT | HR / Employee | SQLite |
| 20 | sql-240 | Mark Old Orders as Archived | MEDIUM | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 21 | sql-280 | Employee Names in Uppercase | EASY | Wipro | HR / Employee | SQLite |
| 22 | sql-287 | Replace Dept Code With Full Name | EASY | Wipro | HR / Employee | SQLite |
| 23 | sql-292 | Employees Hired on Weekday vs Weekend | MEDIUM | Wipro | HR / Employee | SQLite |
| 24 | sql-336 | Student GPA Classification | EASY | Cognizant | University / Education | SQLite |
| 25 | sql-339 | Customer Order Frequency Label | MEDIUM | Cognizant | E-Commerce (Flipkart) | SQLite |
| 26 | sql-355 | Employee Salary Band | EASY | Accenture | HR / Employee | SQLite |
| 27 | sql-371 | Order Size Classification | EASY | Capgemini | E-Commerce (Flipkart) | SQLite |
| 28 | sql-380 | Delivered vs Pending Revenue | MEDIUM | Capgemini | E-Commerce (Flipkart) | SQLite |
| 29 | sql-391 | Customer Lifetime Value Tier | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 30 | sql-411 | Restaurant Order Frequency | MEDIUM | Zoho | Food Delivery (Zomato) | SQLite |
| 31 | sql-414 | Product Price Tier Count | EASY | Zoho | E-Commerce (Flipkart) | SQLite |
| 32 | sql-415 | Employee Seniority Band | MEDIUM | Zoho | HR / Employee | SQLite |
| 33 | sql-418 | Order Item Count Distribution | MEDIUM | Zoho | E-Commerce (Flipkart) | SQLite |

### Problem Descriptions

**sql-011. Accounts With Net Outflow** 🟡
> Find accounts where total debits exceed total credits (net outflow).

**sql-020. Students With All A Grades** 🟡
> Find students who received grade 'A' in ALL their enrolled courses.

**sql-022. Branch Topper** 🔴
> Find the student with the most 'A' grades in each branch.

**sql-045. Custom Sort: Priority Status** 🟡
> List all orders sorted by status priority: 'shipped' first, then 'delivered', then 'cancelled'.

**sql-051. Pivot: Orders by Status** 🟡
> Pivot report: each customer's order count by status.

**sql-060. Conditional COUNT: Rides by Status** 🟢
> Count total rides, completed rides, and cancelled rides in a single query.

**sql-072. Nested CASE: Grade Classification** 🟡
> Classify each enrollment into 'Excellent' (A), 'Good' (B), 'Average' (C), or 'Below Average' (other).

**sql-093. CASE in WHERE Clause** 🟡
> Find restaurants that are considered 'premium' (rating >= 4.5) OR have the cuisine 'Chinese'.

**sql-094. Simulated UPDATE: Salary Hike** 🟡
> Show what each employee's salary would be after a 10% hike for Engineering dept and 5% for others.

**sql-107. Exchange Seat IDs (LC #626)** 🟡
> Swap adjacent student seat IDs: student in seat 1↔2, 3↔4, etc. If odd total, last student stays.

**sql-119. Credit Score Bucketing** 🟢
> Classify users by their total successful spending into credit buckets: 'Platinum' (>3000), 'Gold' (1000-3000), 'Silver' (<1000).

**sql-149. Multi-Condition CASE: Risk Rating** 🟡
> Assign a risk rating to each account based on balance: 'High Risk' (balance < 30000), 'Medium Risk' (30000-60000), 'Low Risk' (>60000).

**sql-164. Conditional ORDER BY** 🟢
> Sort employees: Engineers first (by salary descending), then others (by name ascending).

**sql-172. Count Distinct With Condition** 🟢
> Count how many distinct users logged in more than twice in January 2024.

**sql-178. Conditional Aggregation: Pass/Fail Count** 🟢
> Count students who passed (grade A or B) vs failed (grade C or below) per course.

**sql-194. DELETE vs TRUNCATE Simulation: Count After Filter** 🟢
> Count how many employees would remain if we deleted all employees in 'HR' department.

**sql-209. Customer Segmentation by Order Count** 🟡
> Segment customers into 'Frequent' (3+ orders), 'Regular' (2 orders), or 'New' (1 order).

**sql-220. Employees With 'a' in Name** 🟢
> Find all employees whose name contains the letter 'a' (case-insensitive).

**sql-224. Count NULL vs Non-NULL Managers** 🟢
> Count how many employees have a manager vs those who don't.

**sql-240. Mark Old Orders as Archived** 🟡
> Simulate marking orders before Feb 2024 as 'Archived' and others as 'Active'.

**sql-280. Employee Names in Uppercase** 🟢
> Display all employee names in uppercase.

**sql-287. Replace Dept Code With Full Name** 🟢
> Replace department abbreviations: 'Eng' → 'Engineering', 'HR' → 'Human Resources'.

**sql-292. Employees Hired on Weekday vs Weekend** 🟡
> Classify each employee's hire date as 'Weekday' or 'Weekend'.

**sql-336. Student GPA Classification** 🟢
> Classify students by GPA: 'Distinction' (>=3.5), 'First Class' (>=3.0), 'Second Class' (others).

**sql-339. Customer Order Frequency Label** 🟡
> Label customers as 'Power User' (3+), 'Active' (2), or 'Casual' (1) based on order count.

**sql-355. Employee Salary Band** 🟢
> Classify employees into salary bands: 'High' (>=65K), 'Medium' (>=50K), 'Low' (<50K).

**sql-371. Order Size Classification** 🟢
> Classify orders: 'Small' (<1000), 'Medium' (1000-10000), 'Large' (>10000).

**sql-380. Delivered vs Pending Revenue** 🟡
> Compare total revenue from delivered orders vs non-delivered.

**sql-391. Customer Lifetime Value Tier** 🟡
> Classify customers by total spending: 'Platinum' (>50K), 'Gold' (>5K), 'Silver' (<=5K).

**sql-411. Restaurant Order Frequency** 🟡
> Count how many orders each restaurant received and label frequency: 'High' (3+), 'Medium' (2), 'Low' (1).

**sql-414. Product Price Tier Count** 🟢
> Count products in each price tier: 'Budget' (<1000), 'Mid' (1000-50000), 'Premium' (>50000).

**sql-415. Employee Seniority Band** 🟡
> Classify employees by tenure: 'Senior' (hired before 2020), 'Mid' (2020-2021), 'Junior' (2022+).

**sql-418. Order Item Count Distribution** 🟡
> Show how many orders have 1 item, 2 items, 3+ items.

---

## Control Flow Functions (7 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-033 | Handle NULL Manager | MEDIUM | Accenture | HR / Employee | SQLite |
| 2 | sql-087 | COALESCE: Multi-Fallback | EASY | Wipro | Healthcare / Hospital | SQLite |
| 3 | sql-186 | COALESCE: Fill Missing Manager | EASY | TCS NQT, Infosys, Cognizant | HR / Employee | SQLite |
| 4 | sql-187 | IIF: Pass/Fail Salary Check | EASY | Wipro, HCLTech, Tech Mahindra | HR / Employee | SQLite |
| 5 | sql-188 | NULLIF: Avoid Division by Zero | MEDIUM | HDFC, ICICI, Kotak | Banking / Finance | SQLite |
| 6 | sql-189 | COALESCE Chain: Multi-Field Fallback | MEDIUM | Deloitte, Accenture | Healthcare / Hospital | SQLite |
| 7 | sql-190 | IIF + COALESCE: Tiered Commission | HARD | Zomato, Swiggy, Flipkart | Food Delivery / Zomato | SQLite |

### Problem Descriptions

**sql-033. Handle NULL Manager** 🟡
> List all employees with their manager name. If an employee has no manager, show 'No Manager' instead of NULL.

**sql-087. COALESCE: Multi-Fallback** 🟢
> Show each patient's diagnosis. If NULL, show 'Under Observation'.

**sql-186. COALESCE: Fill Missing Manager** 🟢
> List every employee with their manager's name. If an employee has no manager (mgr_id IS NULL), display 'Self' instead of NULL.

**sql-187. IIF: Pass/Fail Salary Check** 🟢
> Mark each employee as 'Above Avg' if their salary is above the company average, otherwise 'Below Avg'.

**sql-188. NULLIF: Avoid Division by Zero** 🟡
> For each account, calculate the ratio of total credits to total debits. If an account has zero debits, show NULL instead of causing a division error.

**sql-189. COALESCE Chain: Multi-Field Fallback** 🟡
> Show each patient's primary contact info. Use the diagnosis from their latest appointment, falling back to 'No visits' if they have none. Also show fee with a default of 0.

**sql-190. IIF + COALESCE: Tiered Commission** 🔴
> Calculate commission for each restaurant: 5% on orders above 500, 3% on orders between 300–500, 1% on orders below 300. For restaurants with no orders, show commission as 0.

---

## Data Generation (5 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-196 | generate_series: Number Sequence | EASY | TCS NQT, Infosys | Utility / General | PostgreSQL |
| 2 | sql-197 | generate_series: Date Calendar | EASY | Wipro, Capgemini | Utility / General | PostgreSQL |
| 3 | sql-198 | generate_series: Fill Missing Months | MEDIUM | HDFC, ICICI, Goldman Sachs | Banking / Finance | PostgreSQL |
| 4 | sql-199 | generate_series: Hourly Slots | MEDIUM | Practo, Apollo | Healthcare / Hospital | PostgreSQL |
| 5 | sql-200 | generate_series: Gap Detection | HARD | Amazon, Microsoft, Uber | E-Commerce / Shopping | PostgreSQL |

### Problem Descriptions

**sql-196. generate_series: Number Sequence** 🟢 ⚠️ PostgreSQL
> Generate a sequence of numbers from 1 to 10. Return a single column 'n'.

**sql-197. generate_series: Date Calendar** 🟢 ⚠️ PostgreSQL
> Generate all dates in January 2024 (2024-01-01 through 2024-01-31). Return a single column 'day'.

**sql-198. generate_series: Fill Missing Months** 🟡 ⚠️ PostgreSQL
> Show monthly transaction totals for January–March 2024. Include months with zero transactions.

**sql-199. generate_series: Hourly Slots** 🟡 ⚠️ PostgreSQL
> Generate all hourly appointment slots from 9 AM to 5 PM (9:00, 10:00, ..., 17:00) for 2024-01-10. Show which slots have appointments booked.

**sql-200. generate_series: Gap Detection** 🔴 ⚠️ PostgreSQL
> Detect missing order IDs in the orders_pg table. Orders should be sequential (1,2,3,...). Find all IDs in the expected range that are missing.

---

## Date-Time Functions (39 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-031 | Monthly Order Count | EASY | Paytm | Food Delivery (Zomato) | SQLite |
| 2 | sql-039 | Orders in Date Range (BETWEEN) | EASY | PhonePe | E-Commerce (Flipkart) | SQLite |
| 3 | sql-047 | Days Since Last Post | HARD | Salesforce | Social Media (Instagram) | SQLite |
| 4 | sql-085 | Complex Date Filter: Q1 High-Value | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 5 | sql-090 | GROUP BY Expression: Order Month | MEDIUM | Salesforce | E-Commerce (Flipkart) | SQLite |
| 6 | sql-106 | Month-over-Month Revenue Growth | HARD | Goldman Sachs | E-Commerce (Flipkart) | SQLite |
| 7 | sql-121 | Best-Selling Product Per Month | HARD | Amazon | E-Commerce (Flipkart) | SQLite |
| 8 | sql-127 | Driver Utilization: Rides Per Driver Per Month | HARD | Uber | Ride-Sharing (Ola) | SQLite |
| 9 | sql-130 | Fiscal Quarter Revenue Report | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 10 | sql-147 | Cross-Month Retention | HARD | Google | Login / Activity | SQLite |
| 11 | sql-154 | Weekday vs Weekend Orders | MEDIUM | Swiggy | Food Delivery (Zomato) | SQLite |
| 12 | sql-155 | Signup-to-First-Login Time | MEDIUM | Zoho | Login / Activity | SQLite |
| 13 | sql-157 | Payment Volume MoM Growth | HARD | PhonePe | Payments (Paytm) | SQLite |
| 14 | sql-158 | Average Rides Per Rider Per Month | MEDIUM | Ola | Ride-Sharing (Ola) | SQLite |
| 15 | sql-165 | Pivot: Monthly Revenue Columns | HARD | SAP | E-Commerce (Flipkart) | SQLite |
| 16 | sql-173 | Year-Month Grouping | MEDIUM | JP Morgan | Banking / Finance | SQLite |
| 17 | sql-174 | Customers Who Ordered Every Month | HARD | Myntra | E-Commerce (Flipkart) | SQLite |
| 18 | sql-179 | Dense Data: Fill Gaps in Date Sequence | HARD | Adobe | Login / Activity | SQLite |
| 19 | sql-189 | Employees Hired Before 2021 | EASY | TCS Digital | HR / Employee | SQLite |
| 20 | sql-204 | Weekend Orders Only | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 21 | sql-208 | Revenue Trend: Orders Per Month | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 22 | sql-226 | Orders in January 2024 | EASY | TCS NQT | E-Commerce (Flipkart) | SQLite |
| 23 | sql-243 | Rides in February 2024 | EASY | TCS Digital | Ride-Sharing (Ola) | SQLite |
| 24 | sql-247 | Monthly Revenue for Restaurants | MEDIUM | TCS Digital | Food Delivery (Zomato) | SQLite |
| 25 | sql-248 | Doctors With 10+ Years Experience | EASY | TCS Digital | Healthcare / Hospital | SQLite |
| 26 | sql-268 | Employee Tenure in Days | MEDIUM | Infosys | HR / Employee | SQLite |
| 27 | sql-288 | First Order Date Per Customer | EASY | Wipro | E-Commerce (Flipkart) | SQLite |
| 28 | sql-293 | Customers Who Ordered in All 3 Months | HARD | Wipro | E-Commerce (Flipkart) | SQLite |
| 29 | sql-295 | Hired Weekday Distribution | MEDIUM | Wipro | HR / Employee | SQLite |
| 30 | sql-306 | Latest Appointment Per Doctor | MEDIUM | HCLTech | Healthcare / Hospital | SQLite |
| 31 | sql-309 | Revenue Per Quarter | MEDIUM | HCLTech | E-Commerce (Flipkart) | SQLite |
| 32 | sql-311 | Inactive Users (No Recent Login) | MEDIUM | HCLTech | Login / Activity | SQLite |
| 33 | sql-330 | Total Rides Per Month | MEDIUM | Cognizant | Ride-Sharing (Ola) | SQLite |
| 34 | sql-346 | Orders Placed on Same Date | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 35 | sql-362 | Employees Hired After 2020 | EASY | Capgemini | HR / Employee | SQLite |
| 36 | sql-376 | Average Salary by Hire Year | MEDIUM | Capgemini | HR / Employee | SQLite |
| 37 | sql-392 | Employee Hire Month Distribution | EASY | Deloitte | HR / Employee | SQLite |
| 38 | sql-400 | Customer Recency Score | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 39 | sql-403 | Monthly Active Users | MEDIUM | Deloitte | Login / Activity | SQLite |

### Problem Descriptions

**sql-031. Monthly Order Count** 🟢
> Find the number of orders placed in each month.

**sql-039. Orders in Date Range (BETWEEN)** 🟢
> Find all orders placed in February 2024.

**sql-047. Days Since Last Post** 🔴
> For each user's post, calculate days since their previous post using LAG and JULIANDAY.

**sql-085. Complex Date Filter: Q1 High-Value** 🟡
> Find delivered orders from Q1 2024 (Jan-Mar) with total > 1000.

**sql-090. GROUP BY Expression: Order Month** 🟡
> Group orders by month name and show total revenue per month.

**sql-106. Month-over-Month Revenue Growth** 🔴
> Calculate MoM revenue growth percentage.

**sql-121. Best-Selling Product Per Month** 🔴
> Find the best-selling product (by quantity) for each month.

**sql-127. Driver Utilization: Rides Per Driver Per Month** 🔴
> Calculate each driver's ride count per month and their utilization rate compared to the busiest driver that month.

**sql-130. Fiscal Quarter Revenue Report** 🟡
> Generate a quarterly revenue report. Map months to fiscal quarters: Q1(Jan-Mar), Q2(Apr-Jun), Q3(Jul-Sep), Q4(Oct-Dec).

**sql-147. Cross-Month Retention** 🔴
> Find users who logged in during BOTH the first week (Jan 10-16) AND the second week (Jan 17-23) of January 2024.

**sql-154. Weekday vs Weekend Orders** 🟡
> Categorize orders into 'Weekday' vs 'Weekend' based on order_date and compare revenue.

**sql-155. Signup-to-First-Login Time** 🟡
> Calculate the number of days between each user's signup date and their first login.

**sql-157. Payment Volume MoM Growth** 🔴
> Calculate the month-over-month growth in total successful payment volume.

**sql-158. Average Rides Per Rider Per Month** 🟡
> Calculate the average number of rides per active rider per month.

**sql-165. Pivot: Monthly Revenue Columns** 🔴
> Pivot monthly revenue into columns: show each customer with their Jan, Feb, Mar spending as separate columns.

**sql-173. Year-Month Grouping** 🟡
> Group transactions by year-month and show count and total per month.

**sql-174. Customers Who Ordered Every Month** 🔴
> Find customers who placed at least one order in every month available in the data (Jan, Feb, Mar).

**sql-179. Dense Data: Fill Gaps in Date Sequence** 🔴
> Identify which dates in January 10-20 had NO logins at all.

**sql-189. Employees Hired Before 2021** 🟢
> Find all employees hired before January 1, 2021.

**sql-204. Weekend Orders Only** 🟡
> Find orders placed on weekends (Saturday=6 or Sunday=0 in SQLite strftime('%w')).

**sql-208. Revenue Trend: Orders Per Month** 🟡
> Calculate total revenue and order count per month.

**sql-226. Orders in January 2024** 🟢
> Find all orders placed in January 2024.

**sql-243. Rides in February 2024** 🟢
> Find all rides that took place in February 2024.

**sql-247. Monthly Revenue for Restaurants** 🟡
> Calculate total order revenue per month for restaurants.

**sql-248. Doctors With 10+ Years Experience** 🟢
> Find doctors who have 10 or more years of experience.

**sql-268. Employee Tenure in Days** 🟡
> Calculate how many days each employee has been with the company (from hire_date to '2024-06-01').

**sql-288. First Order Date Per Customer** 🟢
> Find the date of each customer's first order.

**sql-293. Customers Who Ordered in All 3 Months** 🔴
> Find customers who placed orders in all three months (Jan, Feb, Mar 2024).

**sql-295. Hired Weekday Distribution** 🟡
> Count how many employees were hired on each day of the week.

**sql-306. Latest Appointment Per Doctor** 🟡
> Find each doctor's most recent appointment date.

**sql-309. Revenue Per Quarter** 🟡
> Calculate total order revenue per quarter of 2024.

**sql-311. Inactive Users (No Recent Login)** 🟡
> Find users who have not logged in since '2024-01-15'.

**sql-330. Total Rides Per Month** 🟡
> Count total rides per month.

**sql-346. Orders Placed on Same Date** 🟡
> Find dates where multiple orders were placed.

**sql-362. Employees Hired After 2020** 🟢
> Find employees hired after January 1, 2020.

**sql-376. Average Salary by Hire Year** 🟡
> Calculate average salary per hire year.

**sql-392. Employee Hire Month Distribution** 🟢
> Count how many employees were hired in each month (1-12).

**sql-400. Customer Recency Score** 🟡
> Calculate days since each customer's last order (from '2024-04-01').

**sql-403. Monthly Active Users** 🟡
> Count unique users who logged in each month.

---

## Distinct and Unique Handling (10 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-013 | Repeat Customers | MEDIUM | Amazon | Food Delivery (Zomato) | SQLite |
| 2 | sql-067 | COUNT DISTINCT vs COUNT(*) | EASY | Wipro | Food Delivery (Zomato) | SQLite |
| 3 | sql-195 | DISTINCT Departments | EASY | Wipro, TCS NQT, Infosys, HCLTech | HR / Employee | SQLite |
| 4 | sql-260 | Products Ordered More Than Once | MEDIUM | Infosys | E-Commerce (Flipkart) | SQLite |
| 5 | sql-265 | Unique Cities of Riders | EASY | Infosys | Ride-Sharing (Ola) | SQLite |
| 6 | sql-315 | Multi-City Restaurant Chains | MEDIUM | HCLTech | Food Delivery (Zomato) | SQLite |
| 7 | sql-340 | Doctors Treating Multiple Patients | MEDIUM | Cognizant | Healthcare / Hospital | SQLite |
| 8 | sql-372 | Unique Diagnoses in Hospital | EASY | Capgemini | Healthcare / Hospital | SQLite |
| 9 | sql-399 | Distinct Categories Ordered Per Customer | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 10 | sql-420 | Doctors Sorted by Unique Patient Count | EASY | Zoho | Healthcare / Hospital | SQLite |

### Problem Descriptions

**sql-013. Repeat Customers** 🟡
> Find customers who ordered from more than one distinct restaurant.

**sql-067. COUNT DISTINCT vs COUNT(*)** 🟢
> Show the total number of orders vs the number of unique customers who ordered.

**sql-195. DISTINCT Departments** 🟢
> List all unique departments from the employees table.

**sql-260. Products Ordered More Than Once** 🟡
> Find products that appear in more than one order.

**sql-265. Unique Cities of Riders** 🟢
> List all unique cities where riders are located.

**sql-315. Multi-City Restaurant Chains** 🟡
> Find cuisines that have restaurants in more than 1 city.

**sql-340. Doctors Treating Multiple Patients** 🟡
> Find doctors who have treated 2 or more unique patients.

**sql-372. Unique Diagnoses in Hospital** 🟢
> List all unique diagnoses recorded in appointments.

**sql-399. Distinct Categories Ordered Per Customer** 🟡
> Count how many distinct product categories each customer has ordered from.

**sql-420. Doctors Sorted by Unique Patient Count** 🟢
> Sort doctors by the number of unique patients they've treated.

---

## Existence Check (5 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-024 | Shows Not Watched by Premium Users | HARD | Capgemini | Streaming (Netflix) | SQLite |
| 2 | sql-079 | NOT EXISTS: Idle Drivers | MEDIUM | Google | Ride-Sharing (Ola) | SQLite |
| 3 | sql-274 | Doctors Who Treated Only Female Patients | HARD | Infosys | Healthcare / Hospital | SQLite |
| 4 | sql-337 | Users Who Both Posted and Commented | MEDIUM | Cognizant | Social Media (Instagram) | SQLite |
| 5 | sql-367 | Orders With Electronics Only | HARD | Capgemini | E-Commerce (Flipkart) | SQLite |

### Problem Descriptions

**sql-024. Shows Not Watched by Premium Users** 🔴
> Find shows that no premium-plan user has ever watched.

**sql-079. NOT EXISTS: Idle Drivers** 🟡
> Find drivers who have never completed a ride using NOT EXISTS.

**sql-274. Doctors Who Treated Only Female Patients** 🔴
> Find doctors who have ONLY treated female patients (never treated a male).

**sql-337. Users Who Both Posted and Commented** 🟡
> Find users who have both created a post AND left a comment.

**sql-367. Orders With Electronics Only** 🔴
> Find orders that contain ONLY electronics products (no other category).

---

## Filtering & Sorting (28 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-064 | Complex WHERE: High-Value Mumbai Rides | MEDIUM | Juspay | Ride-Sharing (Ola) | SQLite |
| 2 | sql-074 | OR/AND Precedence: Filter Rides | MEDIUM | Capgemini | Ride-Sharing (Ola) | SQLite |
| 3 | sql-077 | CAST: Fare as Integer | EASY | Paytm | Ride-Sharing (Ola) | SQLite |
| 4 | sql-112 | Customer Churn: No Order in 30+ Days | HARD | Flipkart | E-Commerce (Flipkart) | SQLite |
| 5 | sql-117 | Longest Consecutive Login Streak | HARD | Google | Login / Activity | SQLite |
| 6 | sql-137 | Session Gap: Days Between Logins | HARD | Adobe | Login / Activity | SQLite |
| 7 | sql-171 | BETWEEN With NOT: Exclude Mid-Range | EASY | Infosys | HR / Employee | SQLite |
| 8 | sql-187 | Odd-Numbered Rows Only | EASY | TCS NQT | HR / Employee | SQLite |
| 9 | sql-211 | Salary Raise Simulation: 10% Hike for Eng | EASY | TCS NQT | HR / Employee | SQLite |
| 10 | sql-218 | Employees Between Salary Range | EASY | TCS NQT | HR / Employee | SQLite |
| 11 | sql-222 | Customers From Mumbai or Delhi | EASY | TCS NQT | E-Commerce (Flipkart) | SQLite |
| 12 | sql-232 | Restaurants Rated Above 4.0 | EASY | TCS Digital | Food Delivery (Zomato) | SQLite |
| 13 | sql-238 | Cancelled Orders | EASY | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 14 | sql-257 | Employees Not in Engineering | EASY | Infosys | HR / Employee | SQLite |
| 15 | sql-277 | Employees Earning Exactly 60000 | EASY | Wipro | HR / Employee | SQLite |
| 16 | sql-279 | Products in Price Range 1K-10K | EASY | Wipro | E-Commerce (Flipkart) | SQLite |
| 17 | sql-284 | Restaurants Not in Mumbai | EASY | Wipro | Food Delivery (Zomato) | SQLite |
| 18 | sql-289 | Drivers With Rating Above 4.5 | EASY | Wipro | Ride-Sharing (Ola) | SQLite |
| 19 | sql-298 | Patients Over Age 40 | EASY | HCLTech | Healthcare / Hospital | SQLite |
| 20 | sql-303 | Rides With Mumbai Pickup | EASY | HCLTech | Ride-Sharing (Ola) | SQLite |
| 21 | sql-305 | Orders With Total Above 5000 | EASY | HCLTech | E-Commerce (Flipkart) | SQLite |
| 22 | sql-317 | Consecutive ID Gaps in Employees | HARD | HCLTech | HR / Employee | SQLite |
| 23 | sql-319 | Employees in Sales Department | EASY | Cognizant | HR / Employee | SQLite |
| 24 | sql-322 | Riders From Delhi | EASY | Cognizant | Ride-Sharing (Ola) | SQLite |
| 25 | sql-323 | Products Sorted by Price Descending | EASY | Cognizant | E-Commerce (Flipkart) | SQLite |
| 26 | sql-328 | Employees Earning 50K to 65K | EASY | Cognizant | HR / Employee | SQLite |
| 27 | sql-389 | Rides Costing Above 200 | EASY | Deloitte | Ride-Sharing (Ola) | SQLite |
| 28 | sql-406 | Restaurants Serving Indian Cuisine | EASY | Zoho | Food Delivery (Zomato) | SQLite |

### Problem Descriptions

**sql-064. Complex WHERE: High-Value Mumbai Rides** 🟡
> Find completed rides in Mumbai (pickup or dropoff in Andheri, Bandra, Dadar, Worli, Powai) with fare > 200.

**sql-074. OR/AND Precedence: Filter Rides** 🟡
> Find rides that are either: (completed AND fare > 300) OR (cancelled).

**sql-077. CAST: Fare as Integer** 🟢
> Show each completed ride's fare cast as an integer (truncated, not rounded).

**sql-112. Customer Churn: No Order in 30+ Days** 🔴
> Find customers whose last order was more than 30 days before the most recent order date in the system (2024-03-15).

**sql-117. Longest Consecutive Login Streak** 🔴
> Find the longest consecutive login streak for each user.

**sql-137. Session Gap: Days Between Logins** 🔴
> For each user, calculate the average gap (in days) between consecutive logins.

**sql-171. BETWEEN With NOT: Exclude Mid-Range** 🟢
> Find employees whose salary is NOT between 50000 and 65000.

**sql-187. Odd-Numbered Rows Only** 🟢
> Select only odd-numbered rows from the employees table (by id).

**sql-211. Salary Raise Simulation: 10% Hike for Eng** 🟢
> Show what each Engineering employee's salary would be after a 10% raise.

**sql-218. Employees Between Salary Range** 🟢
> Find employees with salary between 50000 and 65000 (inclusive).

**sql-222. Customers From Mumbai or Delhi** 🟢
> Find customers who live in Mumbai or Delhi.

**sql-232. Restaurants Rated Above 4.0** 🟢
> Find all restaurants with a rating above 4.0.

**sql-238. Cancelled Orders** 🟢
> Find all orders with status 'cancelled'.

**sql-257. Employees Not in Engineering** 🟢
> Find all employees who are NOT in the Engineering department.

**sql-277. Employees Earning Exactly 60000** 🟢
> Find employees whose salary is exactly 60,000.

**sql-279. Products in Price Range 1K-10K** 🟢
> Find products priced between 1,000 and 10,000.

**sql-284. Restaurants Not in Mumbai** 🟢
> Find all restaurants that are NOT located in Mumbai.

**sql-289. Drivers With Rating Above 4.5** 🟢
> Find drivers whose rating exceeds 4.5.

**sql-298. Patients Over Age 40** 🟢
> Find all patients older than 40.

**sql-303. Rides With Mumbai Pickup** 🟢
> Find all rides that started in Mumbai.

**sql-305. Orders With Total Above 5000** 🟢
> Find all orders where the total exceeds 5,000.

**sql-317. Consecutive ID Gaps in Employees** 🔴
> Find gaps in the employee ID sequence (missing IDs between min and max).

**sql-319. Employees in Sales Department** 🟢
> Find all employees in the Sales department.

**sql-322. Riders From Delhi** 🟢
> Find all riders who live in Delhi.

**sql-323. Products Sorted by Price Descending** 🟢
> List all products sorted by price from highest to lowest.

**sql-328. Employees Earning 50K to 65K** 🟢
> Find employees with salary between 50,000 and 65,000.

**sql-389. Rides Costing Above 200** 🟢
> Find all rides with fare above 200.

**sql-406. Restaurants Serving Indian Cuisine** 🟢
> Find all restaurants that serve Indian cuisine.

---

## General SQL (2 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-101 | Nth Highest Salary (N=3) | MEDIUM | TCS NQT, Infosys, Wipro, HCLTech, Cognizant, Accenture, Capgemini, Deloitte, Zoho | HR / Employee | SQLite |
| 2 | sql-217 | Display With Column Aliases | EASY | TCS NQT | HR / Employee | SQLite |

### Problem Descriptions

**sql-101. Nth Highest Salary (N=3)** 🟡
> Find the 3rd highest salary from the employees table. If fewer than 3 distinct salaries exist, return NULL.

**sql-217. Display With Column Aliases** 🟢
> Display employee info with friendly column names: 'Full Name', 'Department', 'Annual Salary'.

---

## Joins (74 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-002 | Department Highest Salary | MEDIUM | Infosys, TCS NQT, HCLTech | HR / Employee | SQLite |
| 2 | sql-003 | Managers and Their Team Size | MEDIUM | Wipro, Cognizant, Accenture | HR / Employee | SQLite |
| 3 | sql-004 | Top Restaurant by Revenue | MEDIUM | Amazon | Food Delivery (Zomato) | SQLite |
| 4 | sql-005 | Restaurants With No Orders | EASY | TCS NQT, Infosys, Wipro | Food Delivery (Zomato) | SQLite |
| 5 | sql-007 | Doctor With Most Patients | MEDIUM | Accenture | Healthcare / Hospital | SQLite |
| 6 | sql-009 | Revenue Per Specialty | MEDIUM | Deloitte | Healthcare / Hospital | SQLite |
| 7 | sql-010 | Branch-wise Total Deposits | EASY | Goldman Sachs | Banking / Finance | SQLite |
| 8 | sql-014 | Employees Hired After Their Manager | HARD | Capgemini, Deloitte, Accenture | HR / Employee | SQLite |
| 9 | sql-016 | Most Watched Show | EASY | Google | Streaming (Netflix) | SQLite |
| 10 | sql-017 | Users Who Never Watched | EASY | TCS NQT | Streaming (Netflix) | SQLite |
| 11 | sql-019 | Premium vs Basic Avg Watch Time | MEDIUM | Deloitte | Streaming (Netflix) | SQLite |
| 12 | sql-021 | Course Enrollment Count | EASY | Wipro | University / Education | SQLite |
| 13 | sql-034 | Three-Table Join: Patient Diagnosis by Doctor | MEDIUM | Deloitte | Healthcare / Hospital | SQLite |
| 14 | sql-041 | Cross Join: All Customer-Product Pairs | MEDIUM | SAP | E-Commerce (Flipkart) | SQLite |
| 15 | sql-048 | 4-Table Join: Post Comments | MEDIUM | Zomato | Social Media (Instagram) | SQLite |
| 16 | sql-062 | Fare Per Km: Best Value Rides | MEDIUM | Ola | Ride-Sharing (Ola) | SQLite |
| 17 | sql-063 | Driver Earnings Summary | MEDIUM | CRED | Ride-Sharing (Ola) | SQLite |
| 18 | sql-065 | Engagement Score: Posts + Comments | HARD | Freshworks | Social Media (Instagram) | SQLite |
| 19 | sql-082 | Same-City Customer Pairs | MEDIUM | Flipkart | E-Commerce (Flipkart) | SQLite |
| 20 | sql-089 | Anti-Join: Riders Without Rides | MEDIUM | Razorpay | Ride-Sharing (Ola) | SQLite |
| 21 | sql-099 | Riders Who Are Also Drivers (Name Match) | HARD | Flipkart | Ride-Sharing (Ola) | SQLite |
| 22 | sql-103 | Employee Earns More Than Manager (LC #181) | EASY | Microsoft, TCS NQT, Infosys, Wipro, Accenture, Capgemini | HR / Employee | SQLite |
| 23 | sql-104 | Restaurants With No Orders (LC #183 Pattern) | EASY | Amazon, TCS NQT, Infosys, Cognizant | Food Delivery (Zomato) | SQLite |
| 24 | sql-120 | Surge Pricing: Rides Above 2x Average | MEDIUM | Uber | Ride-Sharing (Ola) | SQLite |
| 25 | sql-122 | Items Frequently Bought Together | HARD | Amazon | E-Commerce (Flipkart) | SQLite |
| 26 | sql-123 | Restaurant With Highest Average Order | MEDIUM | Swiggy | Food Delivery (Zomato) | SQLite |
| 27 | sql-125 | Simulate Return Rate by Category | MEDIUM | Myntra | E-Commerce (Flipkart) | SQLite |
| 28 | sql-128 | SLA Breach: Late Appointments | MEDIUM | ServiceNow | Healthcare / Hospital | SQLite |
| 29 | sql-132 | Employees With Same Salary | MEDIUM | Cognizant | HR / Employee | SQLite |
| 30 | sql-139 | Suspicious Transactions: Above 3x Personal Average | HARD | Goldman Sachs | Payments (Paytm) | SQLite |
| 31 | sql-140 | YoY Transaction Volume Change | HARD | Morgan Stanley | Banking / Finance | SQLite |
| 32 | sql-141 | Employees Joined in Last 6 Months | EASY | TCS Digital | HR / Employee | SQLite |
| 33 | sql-148 | Products With No Sales | EASY | Flipkart | E-Commerce (Flipkart) | SQLite |
| 34 | sql-150 | Doctors With Most Appointments | EASY | HCLTech | Healthcare / Hospital | SQLite |
| 35 | sql-152 | Viewers Who Watched All Genres | HARD | Oracle | Streaming (Netflix) | SQLite |
| 36 | sql-167 | NULL-Safe Join: All Patients With Optional Appointments | EASY | Wipro | Healthcare / Hospital | SQLite |
| 37 | sql-186 | Employee Earns More Than Manager | MEDIUM | TCS NQT, Infosys, Wipro, Accenture, Capgemini, Deloitte | HR / Employee | SQLite |
| 38 | sql-193 | Employees Never Assigned a Project | MEDIUM | Infosys | E-Commerce (Flipkart) | SQLite |
| 39 | sql-198 | Employees Joined in Each Year | EASY | HCLTech | HR / Employee | SQLite |
| 40 | sql-203 | Multi-Table: Customer Orders With Product Names | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 41 | sql-210 | Library Schema: Books Not Borrowed | MEDIUM | Zoho | University / Education | SQLite |
| 42 | sql-215 | Count Orders Per Customer | EASY | TCS NQT | E-Commerce (Flipkart) | SQLite |
| 43 | sql-216 | Products Never Ordered | MEDIUM | TCS NQT | E-Commerce (Flipkart) | SQLite |
| 44 | sql-221 | Total Revenue Per Restaurant | MEDIUM | TCS NQT | Food Delivery (Zomato) | SQLite |
| 45 | sql-233 | Count Rides Per Driver | EASY | TCS Digital | Ride-Sharing (Ola) | SQLite |
| 46 | sql-234 | Employees With Same Salary | MEDIUM | TCS Digital | HR / Employee | SQLite |
| 47 | sql-236 | Customers Who Ordered Electronics | MEDIUM | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 48 | sql-242 | Patients Diagnosed With Hypertension | EASY | TCS Digital | Healthcare / Hospital | SQLite |
| 49 | sql-253 | Shows Watched by User 1 | EASY | TCS Digital | Streaming (Netflix) | SQLite |
| 50 | sql-254 | Total Transaction Amount Per Account | MEDIUM | TCS Digital | Banking / Finance | SQLite |
| 51 | sql-262 | Employees With No Subordinates | MEDIUM | Infosys | HR / Employee | SQLite |
| 52 | sql-267 | Accounts With No Transactions | MEDIUM | Infosys | Banking / Finance | SQLite |
| 53 | sql-286 | Rider and Driver From Same City | MEDIUM | Wipro | Ride-Sharing (Ola) | SQLite |
| 54 | sql-290 | Total Orders Per City | MEDIUM | Wipro | E-Commerce (Flipkart) | SQLite |
| 55 | sql-301 | Doctors With No Appointments | MEDIUM | HCLTech | Healthcare / Hospital | SQLite |
| 56 | sql-316 | Posts Without Any Comments | MEDIUM | HCLTech | Social Media (Instagram) | SQLite |
| 57 | sql-329 | Full Order Details (3-Table Join) | MEDIUM | Cognizant | E-Commerce (Flipkart) | SQLite |
| 58 | sql-341 | Customer Full Order History | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 59 | sql-360 | Customers Without Any Orders | EASY | Accenture | E-Commerce (Flipkart) | SQLite |
| 60 | sql-369 | Riders Who Never Took a Ride | MEDIUM | Capgemini | Ride-Sharing (Ola) | SQLite |
| 61 | sql-381 | Employees With Manager Name | MEDIUM | Capgemini | HR / Employee | SQLite |
| 62 | sql-383 | Products Not Ordered By Anyone | MEDIUM | Capgemini | E-Commerce (Flipkart) | SQLite |
| 63 | sql-395 | Restaurants With No Orders | MEDIUM | Deloitte | Food Delivery (Zomato) | SQLite |
| 64 | sql-396 | Patient Readmission Check | HARD | Deloitte | Healthcare / Hospital | SQLite |
| 65 | sql-397 | Total Credits Per Branch | MEDIUM | Deloitte | Banking / Finance | SQLite |
| 66 | sql-404 | Courses With No Enrollments | MEDIUM | Deloitte | University / Education | SQLite |
| 67 | sql-407 | Employees Earning More Than Manager | HARD | Zoho | HR / Employee | SQLite |
| 68 | sql-417 | Show Genre Popularity | MEDIUM | Zoho | Streaming (Netflix) | SQLite |
| 69 | sql-422 | Employees With Same Department as Manager | MEDIUM | Zoho | HR / Employee | SQLite |
| 70 | sql-181 | FULL OUTER JOIN: All Employees & Departments | HARD | Google | HR / Employee | PostgreSQL |
| 71 | sql-182 | FULL OUTER JOIN: Unmatched Only | MEDIUM | Microsoft | HR / Employee | PostgreSQL |
| 72 | sql-183 | FULL OUTER JOIN: Budget Utilization | HARD | Deloitte | HR / Employee | PostgreSQL |
| 73 | sql-184 | FULL OUTER JOIN: Customer-Order Reconciliation | HARD | Amazon | E-Commerce (Flipkart) | PostgreSQL |
| 74 | sql-185 | FULL OUTER JOIN: Cross-Table Coverage Report | HARD | SAP | HR / Employee | PostgreSQL |

### Problem Descriptions

**sql-002. Department Highest Salary** 🟡
> Find the employee with the highest salary in each department.

**sql-003. Managers and Their Team Size** 🟡
> Find all managers and how many direct reports they have.

**sql-004. Top Restaurant by Revenue** 🟡
> Find the restaurant with the highest total revenue from orders.

**sql-005. Restaurants With No Orders** 🟢
> Find restaurants that have received zero orders.

**sql-007. Doctor With Most Patients** 🟡
> Find the doctor who has treated the most unique patients.

**sql-009. Revenue Per Specialty** 🟡
> Calculate total revenue generated by each medical specialty.

**sql-010. Branch-wise Total Deposits** 🟢
> Find total credit (deposit) amount per branch.

**sql-014. Employees Hired After Their Manager** 🔴
> Find employees who were hired after their manager.

**sql-016. Most Watched Show** 🟢
> Find the show with the most total watch time (sum of duration_min).

**sql-017. Users Who Never Watched** 🟢
> Find users who have no entries in the watch history.

**sql-019. Premium vs Basic Avg Watch Time** 🟡
> Compare the average watch duration between premium and basic plan users.

**sql-021. Course Enrollment Count** 🟢
> Find how many students are enrolled in each course.

**sql-034. Three-Table Join: Patient Diagnosis by Doctor** 🟡
> Join all three tables to show which doctor diagnosed which patient and what the diagnosis was.

**sql-041. Cross Join: All Customer-Product Pairs** 🟡
> Generate all possible customer-product combinations.

**sql-048. 4-Table Join: Post Comments** 🟡
> Join all four tables to show post author username, content, commenter full name, and comment.

**sql-062. Fare Per Km: Best Value Rides** 🟡
> Find the fare per kilometer for each completed ride.

**sql-063. Driver Earnings Summary** 🟡
> For each driver, show total earnings, ride count, and average fare from completed rides.

**sql-065. Engagement Score: Posts + Comments** 🔴
> Calculate an engagement score for each user: (total_likes + comment_count * 5).

**sql-082. Same-City Customer Pairs** 🟡
> Find all pairs of customers who live in the same city.

**sql-089. Anti-Join: Riders Without Rides** 🟡
> Using LEFT JOIN + WHERE NULL pattern, find riders who have no completed rides.

**sql-099. Riders Who Are Also Drivers (Name Match)** 🔴
> Find people whose name appears in BOTH the riders table AND the drivers table.

**sql-103. Employee Earns More Than Manager (LC #181)** 🟢
> Given that employees have a manager_id, find employees who earn more than their manager. Since our schema doesn't have manager_id, use departments: find employees who earn more than the average of their department.

**sql-104. Restaurants With No Orders (LC #183 Pattern)** 🟢
> Find restaurants that have never received an order.

**sql-120. Surge Pricing: Rides Above 2x Average** 🟡
> Identify completed rides where the fare exceeded twice the overall average fare (surge-priced).

**sql-122. Items Frequently Bought Together** 🔴
> Find pairs of products that appear in the same order. Show each unique pair once.

**sql-123. Restaurant With Highest Average Order** 🟡
> Find the restaurant with the highest average order amount.

**sql-125. Simulate Return Rate by Category** 🟡
> Treat 'cancelled' orders as returns. Calculate the return rate per product category.

**sql-128. SLA Breach: Late Appointments** 🟡
> Find appointments where the doctor saw the patient more than 2 days after the appointment date (simulated SLA breach). Since we only have appointment_date, find appointments where the date is before '2024-01-10' as overdue.

**sql-132. Employees With Same Salary** 🟡
> Find pairs of employees who have the same salary.

**sql-139. Suspicious Transactions: Above 3x Personal Average** 🔴
> Flag successful transactions where the amount exceeds 3 times the user's own average successful payment.

**sql-140. YoY Transaction Volume Change** 🔴
> Compare total transaction volume per account type (savings/current) between different months, simulating YoY.

**sql-141. Employees Joined in Last 6 Months** 🟢
> Find employees who joined after June 2023 (hire_date > '2023-06-01'). Since our schema uses a static dataset, find employees with salary below the median as a proxy for 'recent hires'.

**sql-148. Products With No Sales** 🟢
> Find products that have never been ordered.

**sql-150. Doctors With Most Appointments** 🟢
> Find the doctor with the most appointments.

**sql-152. Viewers Who Watched All Genres** 🔴
> Find users who have watched shows from every genre in the shows table.

**sql-167. NULL-Safe Join: All Patients With Optional Appointments** 🟢
> List ALL patients with their appointment details. Patients without appointments should still appear with NULL.

**sql-186. Employee Earns More Than Manager** 🟡
> Find employees who earn MORE than their direct manager.

**sql-193. Employees Never Assigned a Project** 🟡
> Find customers who have never placed an order.

**sql-198. Employees Joined in Each Year** 🟢
> Count how many employees were hired in each year.

**sql-203. Multi-Table: Customer Orders With Product Names** 🟡
> Join customers, orders, order_items, and products to show who bought what.

**sql-210. Library Schema: Books Not Borrowed** 🟡
> Find courses that have zero enrollments.

**sql-215. Count Orders Per Customer** 🟢
> Count how many orders each customer has placed.

**sql-216. Products Never Ordered** 🟡
> Find products that have never been ordered by anyone.

**sql-221. Total Revenue Per Restaurant** 🟡
> Find total order revenue for each restaurant.

**sql-233. Count Rides Per Driver** 🟢
> Count how many rides each driver has completed.

**sql-234. Employees With Same Salary** 🟡
> Find pairs of employees who have the exact same salary.

**sql-236. Customers Who Ordered Electronics** 🟡
> Find customers who ordered at least one product in the 'Electronics' category.

**sql-242. Patients Diagnosed With Hypertension** 🟢
> Find all patients who were diagnosed with Hypertension.

**sql-253. Shows Watched by User 1** 🟢
> Find all shows watched by user with id=1.

**sql-254. Total Transaction Amount Per Account** 🟡
> Calculate the total transaction amount for each account.

**sql-262. Employees With No Subordinates** 🟡
> Find employees who are not a manager to anyone (no one reports to them).

**sql-267. Accounts With No Transactions** 🟡
> Find bank accounts that have zero transactions.

**sql-286. Rider and Driver From Same City** 🟡
> Find all rider-driver pairs where both are from the same city.

**sql-290. Total Orders Per City** 🟡
> Count total orders placed from each customer city.

**sql-301. Doctors With No Appointments** 🟡
> Find doctors who have no scheduled appointments.

**sql-316. Posts Without Any Comments** 🟡
> Find posts that have received no comments.

**sql-329. Full Order Details (3-Table Join)** 🟡
> Show order details: customer name, product name, quantity, order date.

**sql-341. Customer Full Order History** 🟡
> Show each customer's order count, total spent, and average order value.

**sql-360. Customers Without Any Orders** 🟢
> Find customers who have never placed an order.

**sql-369. Riders Who Never Took a Ride** 🟡
> Find riders who have never taken a ride.

**sql-381. Employees With Manager Name** 🟡
> Show each employee alongside their manager's name.

**sql-383. Products Not Ordered By Anyone** 🟡
> Find products that have never been ordered.

**sql-395. Restaurants With No Orders** 🟡
> Find restaurants that have received zero orders.

**sql-396. Patient Readmission Check** 🔴
> Find patients who visited the same doctor more than once (potential readmission).

**sql-397. Total Credits Per Branch** 🟡
> Calculate total credit amount per bank branch.

**sql-404. Courses With No Enrollments** 🟡
> Find courses that have zero student enrollments.

**sql-407. Employees Earning More Than Manager** 🔴
> Find employees who earn more than their direct manager.

**sql-417. Show Genre Popularity** 🟡
> Count watch events per show genre.

**sql-422. Employees With Same Department as Manager** 🟡
> Find employees whose department matches their manager's department.

**sql-181. FULL OUTER JOIN: All Employees & Departments** 🔴 ⚠️ PostgreSQL
> Use FULL OUTER JOIN to show all employees AND all departments, even if unmatched.

**sql-182. FULL OUTER JOIN: Unmatched Only** 🟡 ⚠️ PostgreSQL
> Use FULL OUTER JOIN to find departments with no employees AND employees in departments not in the departments table (orphans).

**sql-183. FULL OUTER JOIN: Budget Utilization** 🔴 ⚠️ PostgreSQL
> Using FULL OUTER JOIN, compare each department's budget against its actual payroll (SUM of salaries).

**sql-184. FULL OUTER JOIN: Customer-Order Reconciliation** 🔴 ⚠️ PostgreSQL
> Use FULL OUTER JOIN to reconcile customers with their orders. Show ALL customers (even with no orders) and ALL orders (even with orphan customer IDs).

**sql-185. FULL OUTER JOIN: Cross-Table Coverage Report** 🔴 ⚠️ PostgreSQL
> Create a full coverage report: for every department (from both tables), show the department name, count of employees, budget, and whether it's 'Staffed', 'Empty', or 'Unbudgeted'.

---

## Mathematical Functions (18 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-015 | Highest Revenue Day Per Restaurant | HARD | Microsoft | Food Delivery (Zomato) | SQLite |
| 2 | sql-055 | Category Revenue Percentage | HARD | ServiceNow | E-Commerce (Flipkart) | SQLite |
| 3 | sql-059 | ABS: Fare vs Average Deviation | MEDIUM | Zoho | Ride-Sharing (Ola) | SQLite |
| 4 | sql-110 | DAU over MAU Ratio | HARD | Meta | Social Media (Instagram) | SQLite |
| 5 | sql-124 | Cuisine-Wise Revenue Share | MEDIUM | Zomato | Food Delivery (Zomato) | SQLite |
| 6 | sql-145 | Pareto: Top 20% Revenue Customers | HARD | Oracle | E-Commerce (Flipkart) | SQLite |
| 7 | sql-166 | Percentage Change: Salary vs Company Average | MEDIUM | Accenture | HR / Employee | SQLite |
| 8 | sql-169 | Median Salary Calculation | HARD | Goldman Sachs | HR / Employee | SQLite |
| 9 | sql-170 | Complex Analytics: Rider Engagement Score | HARD | Razorpay | Ride-Sharing (Ola) | SQLite |
| 10 | sql-272 | Revenue Per City From E-Commerce | MEDIUM | Infosys | E-Commerce (Flipkart) | SQLite |
| 11 | sql-314 | Credit vs Debit Ratio Per Account | HARD | HCLTech | Banking / Finance | SQLite |
| 12 | sql-344 | Total Revenue Per Product | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 13 | sql-349 | Top 3 Products by Revenue | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 14 | sql-379 | Restaurant Revenue Share Percent | HARD | Capgemini | Food Delivery (Zomato) | SQLite |
| 15 | sql-384 | Employees Earning Above Dept Median | HARD | Capgemini | HR / Employee | SQLite |
| 16 | sql-385 | Total Revenue by Order Status | EASY | Deloitte | E-Commerce (Flipkart) | SQLite |
| 17 | sql-408 | Order Items Revenue Breakdown | MEDIUM | Zoho | E-Commerce (Flipkart) | SQLite |
| 18 | sql-410 | Employee Salary Deviation From Median | HARD | Zoho | HR / Employee | SQLite |

### Problem Descriptions

**sql-015. Highest Revenue Day Per Restaurant** 🔴
> For each restaurant, find the date with the highest single-day order total.

**sql-055. Category Revenue Percentage** 🔴
> Calculate what percentage of total order_items revenue each category contributes.

**sql-059. ABS: Fare vs Average Deviation** 🟡
> For each completed ride, show how much the fare deviates from the average fare (absolute value).

**sql-110. DAU over MAU Ratio** 🔴
> Calculate the Daily Active Users to Monthly Active Users ratio for January 2024. DAU = average distinct daily users. MAU = total distinct users in the month.

**sql-124. Cuisine-Wise Revenue Share** 🟡
> Calculate what percentage of total revenue each cuisine type generates.

**sql-145. Pareto: Top 20% Revenue Customers** 🔴
> Find customers who contribute to the top 20% of total revenue (Pareto principle).

**sql-166. Percentage Change: Salary vs Company Average** 🟡
> For each employee, show how much their salary deviates from the company-wide average, as a percentage.

**sql-169. Median Salary Calculation** 🔴
> Calculate the median salary from the employees table.

**sql-170. Complex Analytics: Rider Engagement Score** 🔴
> Calculate a rider engagement score: (ride_count * 10) + (avg_fare * 0.1) + (distinct_drivers * 5). Rank riders by score.

**sql-272. Revenue Per City From E-Commerce** 🟡
> Calculate total order revenue per customer city.

**sql-314. Credit vs Debit Ratio Per Account** 🔴
> For each account, show total credits, total debits, and the credit-to-debit ratio.

**sql-344. Total Revenue Per Product** 🟡
> Calculate total revenue per product (price × quantity sold).

**sql-349. Top 3 Products by Revenue** 🟡
> Find the top 3 products by total revenue.

**sql-379. Restaurant Revenue Share Percent** 🔴
> Show each restaurant's revenue as a percentage of total platform revenue.

**sql-384. Employees Earning Above Dept Median** 🔴
> Find employees whose salary exceeds the median salary of their department.

**sql-385. Total Revenue by Order Status** 🟢
> Calculate total revenue grouped by order status.

**sql-408. Order Items Revenue Breakdown** 🟡
> Show total revenue per order with product breakdown count.

**sql-410. Employee Salary Deviation From Median** 🔴
> Show each employee's salary deviation from the company median salary.

---

## Null Handling (3 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-044 | IFNULL: Safe Division | EASY | PhonePe | Banking / Finance | SQLite |
| 2 | sql-196 | Employees With NULL Manager | EASY | Wipro, TCS NQT, Cognizant, Deloitte | HR / Employee | SQLite |
| 3 | sql-386 | Employees With No Manager | EASY | Deloitte | HR / Employee | SQLite |

### Problem Descriptions

**sql-044. IFNULL: Safe Division** 🟢
> For each account, show the average transaction amount. If an account has no transactions, show 0.

**sql-196. Employees With NULL Manager** 🟢
> Find employees who have no manager (mgr_id is NULL).

**sql-386. Employees With No Manager** 🟢
> Find employees who have no manager (mgr_id IS NULL).

---

## Set Operations (11 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-030 | UNION: Combined Activity Feed | MEDIUM | Uber | Streaming (Netflix) | SQLite |
| 2 | sql-042 | EXCEPT: Products Never Ordered | MEDIUM | Adobe | E-Commerce (Flipkart) | SQLite |
| 3 | sql-052 | Pagination: Page 2 of Posts | EASY | Atlassian | Social Media (Instagram) | SQLite |
| 4 | sql-054 | Mutual Followers | HARD | Google | Social Media (Instagram) | SQLite |
| 5 | sql-080 | Multiple UNION: All Names | MEDIUM | SAP | Ride-Sharing (Ola) | SQLite |
| 6 | sql-081 | Summary Row with UNION | MEDIUM | Morgan Stanley | Banking / Finance | SQLite |
| 7 | sql-161 | EXCEPT: Riders Not In January | MEDIUM | Capgemini | Ride-Sharing (Ola) | SQLite |
| 8 | sql-177 | INTERSECT: Users Who Logged In Jan 10 AND Jan 11 | MEDIUM | Microsoft | Login / Activity | SQLite |
| 9 | sql-206 | UNION: Combine Riders and Drivers | EASY | Capgemini | Ride-Sharing (Ola) | SQLite |
| 10 | sql-258 | Youngest and Oldest Patient | EASY | Infosys | Healthcare / Hospital | SQLite |
| 11 | sql-304 | UNION: All People in Ride System | EASY | HCLTech | Ride-Sharing (Ola) | SQLite |

### Problem Descriptions

**sql-030. UNION: Combined Activity Feed** 🟡
> Create a unified activity log combining user registrations and watch events.

**sql-042. EXCEPT: Products Never Ordered** 🟡
> Find products that have never been ordered by any customer.

**sql-052. Pagination: Page 2 of Posts** 🟢
> Get the 2nd page of posts (3 per page) ordered by likes descending.

**sql-054. Mutual Followers** 🔴
> Find pairs of users who mutually follow each other.

**sql-080. Multiple UNION: All Names** 🟡
> Combine all driver names and rider names into a single list with their role.

**sql-081. Summary Row with UNION** 🟡
> Show each branch's total balance AND a grand total row at the bottom.

**sql-161. EXCEPT: Riders Not In January** 🟡
> Find riders who took rides in February or March but NOT in January.

**sql-177. INTERSECT: Users Who Logged In Jan 10 AND Jan 11** 🟡
> Find users who logged in on BOTH January 10 AND January 11 using INTERSECT.

**sql-206. UNION: Combine Riders and Drivers** 🟢
> Create a unified list of all people in the ride-sharing system (both riders and drivers).

**sql-258. Youngest and Oldest Patient** 🟢
> Find the youngest and oldest patient.

**sql-304. UNION: All People in Ride System** 🟢
> Create a combined list of all riders and drivers with their role.

---

## String Functions (20 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-032 | Find Indian Cuisine Restaurants | EASY | TCS Digital | Food Delivery (Zomato) | SQLite |
| 2 | sql-038 | Gmail Users Only | EASY | Swiggy | E-Commerce (Flipkart) | SQLite |
| 3 | sql-043 | Duplicate Email Domains | MEDIUM | Razorpay | E-Commerce (Flipkart) | SQLite |
| 4 | sql-046 | GROUP_CONCAT: List All Followers | MEDIUM | Atlassian | Social Media (Instagram) | SQLite |
| 5 | sql-058 | REPLACE: Clean Email Domain | EASY | CRED | E-Commerce (Flipkart) | SQLite |
| 6 | sql-061 | UPPER/LOWER: Standardize Usernames | EASY | Zoho | Social Media (Instagram) | SQLite |
| 7 | sql-066 | LENGTH: Short Usernames | EASY | Meta | Social Media (Instagram) | SQLite |
| 8 | sql-076 | SUBSTR: Extract First Name | EASY | TCS Digital | HR / Employee | SQLite |
| 9 | sql-131 | Employees Starting With 'A' | EASY | Wipro | HR / Employee | SQLite |
| 10 | sql-146 | Extract Email Domain | EASY | Capgemini | E-Commerce (Flipkart) | SQLite |
| 11 | sql-168 | String Report: Comma-Separated Employees | MEDIUM | Atlassian | HR / Employee | SQLite |
| 12 | sql-200 | Concatenate First and Last Name | EASY | Cognizant | Social Media (Instagram) | SQLite |
| 13 | sql-250 | Combine Name and Department | EASY | TCS Digital | HR / Employee | SQLite |
| 14 | sql-252 | Posts With More Than 50 Likes | EASY | TCS Digital | Social Media (Instagram) | SQLite |
| 15 | sql-269 | Find Duplicate Customer Emails | MEDIUM | Infosys | E-Commerce (Flipkart) | SQLite |
| 16 | sql-273 | Average Likes Per User | EASY | Infosys | Social Media (Instagram) | SQLite |
| 17 | sql-275 | Average Post Likes Above 100 | MEDIUM | Infosys | Social Media (Instagram) | SQLite |
| 18 | sql-283 | Shortest and Longest Employee Name | EASY | Wipro | HR / Employee | SQLite |
| 19 | sql-335 | Employee Name Length | EASY | Cognizant | HR / Employee | SQLite |
| 20 | sql-348 | Employee Name Starting With Vowel | EASY | Accenture | HR / Employee | SQLite |

### Problem Descriptions

**sql-032. Find Indian Cuisine Restaurants** 🟢
> Find all restaurants whose cuisine contains the word 'Indian'.

**sql-038. Gmail Users Only** 🟢
> Find all customers whose email ends with '@gmail.com'.

**sql-043. Duplicate Email Domains** 🟡
> Find email domains that are used by more than one customer.

**sql-046. GROUP_CONCAT: List All Followers** 🟡
> For each user, show a comma-separated list of their followers' usernames.

**sql-058. REPLACE: Clean Email Domain** 🟢
> Replace 'gmail.com' with 'company.com' in all customer emails.

**sql-061. UPPER/LOWER: Standardize Usernames** 🟢
> Show each profile with username in UPPER case and full_name in LOWER case.

**sql-066. LENGTH: Short Usernames** 🟢
> Find profiles where the username is shorter than 10 characters.

**sql-076. SUBSTR: Extract First Name** 🟢
> Extract just the first name from each employee (characters before any space, but since names are single words, just return first 3 characters as initials).

**sql-131. Employees Starting With 'A'** 🟢
> Find all employees whose name starts with the letter 'A'.

**sql-146. Extract Email Domain** 🟢
> Extract just the domain from each customer's email address.

**sql-168. String Report: Comma-Separated Employees** 🟡
> For each department, create a comma-separated list of employee names.

**sql-200. Concatenate First and Last Name** 🟢
> Create a full display name by combining username with ' (@' and username and ')' format.

**sql-250. Combine Name and Department** 🟢
> Create a display string combining name and department like 'Alice (Eng)'.

**sql-252. Posts With More Than 50 Likes** 🟢
> Find posts that received more than 50 likes.

**sql-269. Find Duplicate Customer Emails** 🟡
> Find email domains that are used by more than one customer.

**sql-273. Average Likes Per User** 🟢
> Calculate the average number of likes per user's posts.

**sql-275. Average Post Likes Above 100** 🟡
> Find users whose average post likes exceed 100.

**sql-283. Shortest and Longest Employee Name** 🟢
> Find the employee with the shortest name and the one with the longest name.

**sql-335. Employee Name Length** 🟢
> Show each employee's name and the length of their name.

**sql-348. Employee Name Starting With Vowel** 🟢
> Find employees whose name starts with a vowel (A, E, I, O, U).

---

## Top N Results (22 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-098 | Top-2 Posts Per User (With Ties) | HARD | Meta | Social Media (Instagram) | SQLite |
| 2 | sql-108 | Department Top 3 Salaries (LC #185) | HARD | Amazon, TCS Digital, Deloitte, Zoho | HR / Employee | SQLite |
| 3 | sql-156 | Top Spender Per City | MEDIUM | CRED | Payments (Paytm) | SQLite |
| 4 | sql-192 | Highest Salary Per Department | MEDIUM | Infosys, TCS NQT, HCLTech, Cognizant, Deloitte | HR / Employee | SQLite |
| 5 | sql-213 | Top 3 Highest Paid Employees | EASY | TCS NQT | HR / Employee | SQLite |
| 6 | sql-228 | Top 2 Cuisines by Restaurant Count | MEDIUM | TCS NQT | Food Delivery (Zomato) | SQLite |
| 7 | sql-239 | Driver With Highest Total Earnings | MEDIUM | TCS Digital | Ride-Sharing (Ola) | SQLite |
| 8 | sql-245 | Student With Highest GPA | EASY | TCS Digital | University / Education | SQLite |
| 9 | sql-264 | Top Selling Product by Quantity | MEDIUM | Infosys | E-Commerce (Flipkart) | SQLite |
| 10 | sql-270 | Courses With Most Enrollments | EASY | Infosys | University / Education | SQLite |
| 11 | sql-296 | Top 5 Highest Paid Employees | EASY | HCLTech | HR / Employee | SQLite |
| 12 | sql-297 | Restaurant With Most Orders | MEDIUM | HCLTech | Food Delivery (Zomato) | SQLite |
| 13 | sql-302 | Customer Who Spent Most Overall | MEDIUM | HCLTech | E-Commerce (Flipkart) | SQLite |
| 14 | sql-324 | First Employee Hired | EASY | Cognizant | HR / Employee | SQLite |
| 15 | sql-345 | Most Popular Cuisine | EASY | Accenture | Food Delivery (Zomato) | SQLite |
| 16 | sql-356 | Most Commented Post | MEDIUM | Accenture | Social Media (Instagram) | SQLite |
| 17 | sql-357 | Show With Most Watch Events | EASY | Accenture | Streaming (Netflix) | SQLite |
| 18 | sql-375 | Top Rider by Total Spend | EASY | Capgemini | Ride-Sharing (Ola) | SQLite |
| 19 | sql-394 | Top 2 Earners Per Department | HARD | Deloitte | HR / Employee | SQLite |
| 20 | sql-412 | Top Earning Department | EASY | Zoho | HR / Employee | SQLite |
| 21 | sql-424 | Students With Top Grade in Any Course | HARD | Zoho | University / Education | SQLite |
| 22 | sql-428 | Top Commented Users | MEDIUM | Zoho | Social Media (Instagram) | SQLite |

### Problem Descriptions

**sql-098. Top-2 Posts Per User (With Ties)** 🔴
> Find each user's top 2 most-liked posts, keeping ties.

**sql-108. Department Top 3 Salaries (LC #185)** 🔴
> Find the top 3 earners in each department. Include ties.

**sql-156. Top Spender Per City** 🟡
> Find the highest spender (successful payments) in each city.

**sql-192. Highest Salary Per Department** 🟡
> Find the employee with the highest salary in each department.

**sql-213. Top 3 Highest Paid Employees** 🟢
> Find the 3 highest-paid employees.

**sql-228. Top 2 Cuisines by Restaurant Count** 🟡
> Find the top 2 cuisines that have the most restaurants.

**sql-239. Driver With Highest Total Earnings** 🟡
> Find the driver who earned the most total fare across all rides.

**sql-245. Student With Highest GPA** 🟢
> Find the student with the highest GPA.

**sql-264. Top Selling Product by Quantity** 🟡
> Find the product with the highest total quantity sold.

**sql-270. Courses With Most Enrollments** 🟢
> Find the course with the most student enrollments.

**sql-296. Top 5 Highest Paid Employees** 🟢
> Find the 5 highest-paid employees.

**sql-297. Restaurant With Most Orders** 🟡
> Find the restaurant that received the most orders.

**sql-302. Customer Who Spent Most Overall** 🟡
> Find the customer who spent the most money across all orders.

**sql-324. First Employee Hired** 🟢
> Find the employee who was hired first.

**sql-345. Most Popular Cuisine** 🟢
> Find the cuisine with the most restaurants.

**sql-356. Most Commented Post** 🟡
> Find the post with the most comments.

**sql-357. Show With Most Watch Events** 🟢
> Find the show that has been watched the most times.

**sql-375. Top Rider by Total Spend** 🟢
> Find the rider who spent the most on rides.

**sql-394. Top 2 Earners Per Department** 🔴
> Find the top 2 highest-paid employees in each department.

**sql-412. Top Earning Department** 🟢
> Find the department with the highest total salary.

**sql-424. Students With Top Grade in Any Course** 🔴
> Find students who scored the highest grade in at least one course.

**sql-428. Top Commented Users** 🟡
> Find the top 3 users by total comments they've written.

---

## Window Functions (63 problems)

| # | ID | Title | Difficulty | Companies | Dataset | Engine |
|---|-----|-------|------------|-----------|---------|--------|
| 1 | sql-026 | Salary Rank With Window Function | HARD | Google | HR / Employee | SQLite |
| 2 | sql-027 | Previous Order Amount (LAG) | HARD | Flipkart | Food Delivery (Zomato) | SQLite |
| 3 | sql-028 | Running Total of Transactions | HARD | Morgan Stanley | Banking / Finance | SQLite |
| 4 | sql-036 | Next Order Date (LEAD) | HARD | Adobe | E-Commerce (Flipkart) | SQLite |
| 5 | sql-037 | Top Product Per Category (ROW_NUMBER) | HARD | Razorpay | E-Commerce (Flipkart) | SQLite |
| 6 | sql-049 | NTILE: Salary Quartiles | HARD | ServiceNow | HR / Employee | SQLite |
| 7 | sql-050 | FIRST_VALUE: Cheapest In Category | MEDIUM | Myntra | E-Commerce (Flipkart) | SQLite |
| 8 | sql-057 | LAST_VALUE: Most Expensive Ride Per Rider | HARD | Ola | Ride-Sharing (Ola) | SQLite |
| 9 | sql-069 | PERCENT_RANK: Salary Percentile | HARD | Goldman Sachs | HR / Employee | SQLite |
| 10 | sql-073 | Multi-Table CTE: Top Driver Per City | HARD | Microsoft | Ride-Sharing (Ola) | SQLite |
| 11 | sql-078 | Cumulative Order Total | HARD | Amazon | E-Commerce (Flipkart) | SQLite |
| 12 | sql-083 | RANK vs DENSE_RANK | HARD | Oracle | Streaming (Netflix) | SQLite |
| 13 | sql-086 | Moving Average: 2-Ride Window | HARD | Amazon | Ride-Sharing (Ola) | SQLite |
| 14 | sql-091 | Running Percentage of Total | HARD | Adobe | Social Media (Instagram) | SQLite |
| 15 | sql-095 | CTE + Window Combo: Ranked Monthly Revenue | HARD | Microsoft | E-Commerce (Flipkart) | SQLite |
| 16 | sql-096 | Full Analytics: Driver Scorecard | HARD | Google | Ride-Sharing (Ola) | SQLite |
| 17 | sql-105 | Consecutive Numbers (LC #180) | HARD | Google | Social Media (Instagram) | SQLite |
| 18 | sql-109 | Delete Duplicate Emails (Keep Lowest ID) | MEDIUM | Wipro, TCS NQT, Infosys, Cognizant | HR / Employee | SQLite |
| 19 | sql-113 | User's First Transaction | MEDIUM | Paytm | Payments (Paytm) | SQLite |
| 20 | sql-116 | Rolling 3-Payment Average | HARD | PhonePe | Payments (Paytm) | SQLite |
| 21 | sql-134 | Lead Conversion: Order Status Pipeline | MEDIUM | Salesforce | E-Commerce (Flipkart) | SQLite |
| 22 | sql-135 | Payment Resolution: Time to Retry | HARD | Freshworks | Payments (Paytm) | SQLite |
| 23 | sql-136 | Payment Method Preference Per User | MEDIUM | Juspay | Payments (Paytm) | SQLite |
| 24 | sql-143 | Rider's 3rd Ride Ever | MEDIUM | Ola | Ride-Sharing (Ola) | SQLite |
| 25 | sql-144 | Users Inactive for 7+ Days | MEDIUM | Atlassian | Login / Activity | SQLite |
| 26 | sql-151 | Customer Lifetime Value Ranking | HARD | Amazon | E-Commerce (Flipkart) | SQLite |
| 27 | sql-175 | Cumulative User Signups | MEDIUM | Freshworks | Login / Activity | SQLite |
| 28 | sql-176 | Window: Difference From Previous Row | MEDIUM | Juspay | Payments (Paytm) | SQLite |
| 29 | sql-223 | Latest Hire Per Department | MEDIUM | TCS NQT | HR / Employee | SQLite |
| 30 | sql-227 | Rank Employees by Salary | MEDIUM | TCS NQT | HR / Employee | SQLite |
| 31 | sql-235 | Most Expensive Product Per Category | MEDIUM | TCS Digital | E-Commerce (Flipkart) | SQLite |
| 32 | sql-251 | Running Total of Salaries | MEDIUM | TCS Digital | HR / Employee | SQLite |
| 33 | sql-259 | Second Highest Salary Per Department | HARD | Infosys | HR / Employee | SQLite |
| 34 | sql-261 | Customer Total Spending Rank | MEDIUM | Infosys | E-Commerce (Flipkart) | SQLite |
| 35 | sql-271 | Salary Percentile Ranking | HARD | Infosys | HR / Employee | SQLite |
| 36 | sql-281 | Latest Order Per Customer | MEDIUM | Wipro | E-Commerce (Flipkart) | SQLite |
| 37 | sql-307 | Employee Salary vs Department Average | MEDIUM | HCLTech | HR / Employee | SQLite |
| 38 | sql-327 | Rank Restaurants by Rating | MEDIUM | Cognizant | Food Delivery (Zomato) | SQLite |
| 39 | sql-331 | Running Count of Orders | MEDIUM | Cognizant | E-Commerce (Flipkart) | SQLite |
| 40 | sql-332 | Second Cheapest Product | MEDIUM | Cognizant | E-Commerce (Flipkart) | SQLite |
| 41 | sql-342 | Highest Rated Restaurant Per City | MEDIUM | Accenture | Food Delivery (Zomato) | SQLite |
| 42 | sql-343 | Employee Salary Quartile | HARD | Accenture | HR / Employee | SQLite |
| 43 | sql-351 | Employee Salary vs Previous (LAG) | HARD | Accenture | HR / Employee | SQLite |
| 44 | sql-353 | Restaurant Revenue Rank Per City | HARD | Accenture | Food Delivery (Zomato) | SQLite |
| 45 | sql-354 | Monthly Order Trend | MEDIUM | Accenture | E-Commerce (Flipkart) | SQLite |
| 46 | sql-358 | Cumulative Account Balance | HARD | Accenture | Banking / Finance | SQLite |
| 47 | sql-359 | Driver Ride Count Rank | MEDIUM | Accenture | Ride-Sharing (Ola) | SQLite |
| 48 | sql-361 | Salary Difference From Company Average | MEDIUM | Accenture | HR / Employee | SQLite |
| 49 | sql-366 | Employee Salary Cumulative Percent | HARD | Capgemini | HR / Employee | SQLite |
| 50 | sql-368 | Average Rating vs City Average | MEDIUM | Capgemini | Food Delivery (Zomato) | SQLite |
| 51 | sql-373 | Employee Row Number by Hire Date | EASY | Capgemini | HR / Employee | SQLite |
| 52 | sql-374 | Days Between Restaurant Orders | HARD | Capgemini | Food Delivery (Zomato) | SQLite |
| 53 | sql-377 | Cheapest Product in Each Order | MEDIUM | Capgemini | E-Commerce (Flipkart) | SQLite |
| 54 | sql-382 | Nth Highest Salary (3rd) | HARD | Capgemini | HR / Employee | SQLite |
| 55 | sql-387 | Orders Per Customer With Running Total | HARD | Deloitte | E-Commerce (Flipkart) | SQLite |
| 56 | sql-390 | Products With Price Rank | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 57 | sql-393 | Average Order Value Trend | MEDIUM | Deloitte | E-Commerce (Flipkart) | SQLite |
| 58 | sql-398 | Employee Next Salary (LEAD) | MEDIUM | Deloitte | HR / Employee | SQLite |
| 59 | sql-413 | Patient Appointment Timeline | MEDIUM | Zoho | Healthcare / Hospital | SQLite |
| 60 | sql-419 | Account Balance vs Branch Average | MEDIUM | Zoho | Banking / Finance | SQLite |
| 61 | sql-421 | Cumulative Order Revenue | HARD | Zoho | E-Commerce (Flipkart) | SQLite |
| 62 | sql-423 | Restaurant Rating Percentile | HARD | Zoho | Food Delivery (Zomato) | SQLite |
| 63 | sql-426 | Year-Over-Year Employee Growth | MEDIUM | Zoho | HR / Employee | SQLite |

### Problem Descriptions

**sql-026. Salary Rank With Window Function** 🔴
> Rank employees by salary within each department using DENSE_RANK().

**sql-027. Previous Order Amount (LAG)** 🔴
> For each order, show the previous order amount for the same customer using LAG.

**sql-028. Running Total of Transactions** 🔴
> Show a running total of transaction amounts per account, ordered by date.

**sql-036. Next Order Date (LEAD)** 🔴
> For each customer order, show the date of their NEXT order using LEAD.

**sql-037. Top Product Per Category (ROW_NUMBER)** 🔴
> Find the most expensive product in each category using ROW_NUMBER.

**sql-049. NTILE: Salary Quartiles** 🔴
> Divide employees into salary quartiles using NTILE(4).

**sql-050. FIRST_VALUE: Cheapest In Category** 🟡
> For each product, show the cheapest product name in its category using FIRST_VALUE.

**sql-057. LAST_VALUE: Most Expensive Ride Per Rider** 🔴
> For each ride, show the rider's most expensive ride fare using LAST_VALUE.

**sql-069. PERCENT_RANK: Salary Percentile** 🔴
> Calculate the percent rank of each employee's salary.

**sql-073. Multi-Table CTE: Top Driver Per City** 🔴
> Using CTEs, find the top-earning driver in each city from completed rides.

**sql-078. Cumulative Order Total** 🔴
> Show each order with a running cumulative total across all orders sorted by date.

**sql-083. RANK vs DENSE_RANK** 🔴
> Compare RANK() and DENSE_RANK() for shows ordered by total watch time.

**sql-086. Moving Average: 2-Ride Window** 🔴
> For each rider, calculate a 2-ride moving average of fare (current + previous ride).

**sql-091. Running Percentage of Total** 🔴
> Show each post's likes as a running percentage of total likes across all posts.

**sql-095. CTE + Window Combo: Ranked Monthly Revenue** 🔴
> Using a CTE to calculate monthly revenue, then rank months by revenue.

**sql-096. Full Analytics: Driver Scorecard** 🔴
> Build a driver scorecard: for each driver show name, city, total completed rides, total earnings, average fare (rounded), their city rank by earnings, and whether they are 'Top Earner' (rank 1) or 'Regular'.

**sql-105. Consecutive Numbers (LC #180)** 🔴
> Find users who posted on at least 3 consecutive days.

**sql-109. Delete Duplicate Emails (Keep Lowest ID)** 🟡
> Show which employee records to KEEP if we had duplicates — keep the row with the lowest ID per department.

**sql-113. User's First Transaction** 🟡
> Find each user's first successful payment.

**sql-116. Rolling 3-Payment Average** 🔴
> For each successful payment by Aarav (user_id=1), show a rolling average of the last 3 payments.

**sql-134. Lead Conversion: Order Status Pipeline** 🟡
> Create a sales pipeline view: show how many orders are at each stage, and what percentage each stage is of total.

**sql-135. Payment Resolution: Time to Retry** 🔴
> For users who had a failed payment followed by a successful one, calculate the time gap in days between failure and next success.

**sql-136. Payment Method Preference Per User** 🟡
> Find each user's most-used payment method (by count of successful payments).

**sql-143. Rider's 3rd Ride Ever** 🟡
> Find each rider's 3rd ride (by date). Only include riders who have at least 3 rides.

**sql-144. Users Inactive for 7+ Days** 🟡
> Find users whose gap between any two consecutive logins exceeds 7 days.

**sql-151. Customer Lifetime Value Ranking** 🔴
> Rank customers by their lifetime value (total spending minus cancelled orders). Include order count.

**sql-175. Cumulative User Signups** 🟡
> Show a cumulative count of user signups over time.

**sql-176. Window: Difference From Previous Row** 🟡
> For Aarav's successful payments, show each payment and the difference from the previous payment amount.

**sql-223. Latest Hire Per Department** 🟡
> Find the most recently hired employee in each department.

**sql-227. Rank Employees by Salary** 🟡
> Assign a rank to each employee based on salary (highest=1). Use DENSE_RANK.

**sql-235. Most Expensive Product Per Category** 🟡
> Find the most expensive product in each category.

**sql-251. Running Total of Salaries** 🟡
> Calculate a running total of salaries ordered by hire date.

**sql-259. Second Highest Salary Per Department** 🔴
> Find the second highest salary in each department. If a dept has only 1 employee, exclude it.

**sql-261. Customer Total Spending Rank** 🟡
> Rank customers by their total spending using DENSE_RANK.

**sql-271. Salary Percentile Ranking** 🔴
> Calculate the percentile rank of each employee's salary.

**sql-281. Latest Order Per Customer** 🟡
> Find the most recent order for each customer.

**sql-307. Employee Salary vs Department Average** 🟡
> Show each employee's salary compared to their department average.

**sql-327. Rank Restaurants by Rating** 🟡
> Rank all restaurants by rating using DENSE_RANK.

**sql-331. Running Count of Orders** 🟡
> Show a running count of orders by order date.

**sql-332. Second Cheapest Product** 🟡
> Find the second cheapest product.

**sql-342. Highest Rated Restaurant Per City** 🟡
> Find the highest-rated restaurant in each city.

**sql-343. Employee Salary Quartile** 🔴
> Divide employees into 4 salary quartiles using NTILE.

**sql-351. Employee Salary vs Previous (LAG)** 🔴
> Show each employee's salary and the previous employee's salary (ordered by hire date) using LAG.

**sql-353. Restaurant Revenue Rank Per City** 🔴
> Rank restaurants by revenue within their city.

**sql-354. Monthly Order Trend** 🟡
> Count orders per month and show the month-over-month difference.

**sql-358. Cumulative Account Balance** 🔴
> Show running balance per account: add credits, subtract debits.

**sql-359. Driver Ride Count Rank** 🟡
> Rank drivers by their total number of completed rides.

**sql-361. Salary Difference From Company Average** 🟡
> Show each employee's salary difference from the company-wide average.

**sql-366. Employee Salary Cumulative Percent** 🔴
> Show each employee's salary as a percentage of the total payroll.

**sql-368. Average Rating vs City Average** 🟡
> For each restaurant, show its rating and the average rating of its city.

**sql-373. Employee Row Number by Hire Date** 🟢
> Assign row numbers to employees ordered by hire date.

**sql-374. Days Between Restaurant Orders** 🔴
> For each order, show the number of days since the previous order (for the same restaurant).

**sql-377. Cheapest Product in Each Order** 🟡
> Find the cheapest product in each order.

**sql-382. Nth Highest Salary (3rd)** 🔴
> Find the employee with the 3rd highest salary.

**sql-387. Orders Per Customer With Running Total** 🔴
> For each customer, show orders with a running total of their spending.

**sql-390. Products With Price Rank** 🟡
> Rank products by price within their category.

**sql-393. Average Order Value Trend** 🟡
> Show average order value per month with month-over-month change.

**sql-398. Employee Next Salary (LEAD)** 🟡
> Show each employee and the next employee's salary (by hire date) using LEAD.

**sql-413. Patient Appointment Timeline** 🟡
> Show each patient's appointments in chronological order with a row number.

**sql-419. Account Balance vs Branch Average** 🟡
> Show each account's balance compared to its branch average.

**sql-421. Cumulative Order Revenue** 🔴
> Show a running total of order revenue by date.

**sql-423. Restaurant Rating Percentile** 🔴
> Show each restaurant's rating percentile rank.

**sql-426. Year-Over-Year Employee Growth** 🟡
> Count employees hired per year.

---
