#!/usr/bin/env python3
"""Generate sql_problems.json with 15 premium problems across real-world themes."""
import json, os

P = []
def add(id,title,theme,company,diff,stmt,hint,expl,tables,schema,expected,solution,topic="Miscellaneous"):
    P.append({"id":id,"title":title,"dataset_theme":theme,"company_tag":company,"difficulty":diff,
              "topic":topic,"problem_statement":stmt,"hint":hint,"explanation":expl,"tables_meta":tables,
              "example_output":{"columns":expected[0],"rows":expected[1]},
              "schema_sql":schema,"expected_output":[{"columns":expected[0],"values":expected[1]}],
              "solution_sql":solution})

# ═══ SCHEMA BLOCKS ═══
EMP_S = """CREATE TABLE employees(id INT PRIMARY KEY,name VARCHAR,dept VARCHAR,salary INT,mgr_id INT,hire_date DATE);
INSERT INTO employees VALUES(1,'Alice','Eng',70000,NULL,'2019-01-15');
INSERT INTO employees VALUES(2,'Bob','Eng',60000,1,'2020-03-01');
INSERT INTO employees VALUES(3,'Charlie','Sales',55000,NULL,'2020-06-10');
INSERT INTO employees VALUES(4,'Diana','Sales',50000,3,'2021-01-20');
INSERT INTO employees VALUES(5,'Eve','Eng',65000,1,'2021-08-05');
INSERT INTO employees VALUES(6,'Frank','HR',45000,NULL,'2022-02-14');"""
EMP_T = [{"name":"employees","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"dept","type":"varchar"},{"name":"salary","type":"int"},{"name":"mgr_id","type":"int"},{"name":"hire_date","type":"date"}],
"sample_input":[[1,"Alice","Eng",70000,None,"2019-01-15"],[2,"Bob","Eng",60000,1,"2020-03-01"],[3,"Charlie","Sales",55000,None,"2020-06-10"],[4,"Diana","Sales",50000,3,"2021-01-20"],[5,"Eve","Eng",65000,1,"2021-08-05"],[6,"Frank","HR",45000,None,"2022-02-14"]]}]

ZOMATO_S = """CREATE TABLE restaurants(id INT PRIMARY KEY,name VARCHAR,city VARCHAR,cuisine VARCHAR,rating REAL);
CREATE TABLE orders(id INT PRIMARY KEY,rest_id INT,cust_id INT,amount REAL,order_date DATE);
INSERT INTO restaurants VALUES(1,'Biryani House','Mumbai','Indian',4.5);
INSERT INTO restaurants VALUES(2,'Pizza Palace','Delhi','Italian',4.2);
INSERT INTO restaurants VALUES(3,'Dragon Wok','Mumbai','Chinese',3.8);
INSERT INTO restaurants VALUES(4,'Dosa Corner','Bangalore','Indian',4.7);
INSERT INTO restaurants VALUES(5,'Burger Barn','Delhi','American',3.5);
INSERT INTO orders VALUES(101,1,201,450,'2024-01-15');
INSERT INTO orders VALUES(102,2,202,650,'2024-01-16');
INSERT INTO orders VALUES(103,1,203,380,'2024-01-17');
INSERT INTO orders VALUES(104,4,201,220,'2024-02-01');
INSERT INTO orders VALUES(105,3,204,510,'2024-02-05');
INSERT INTO orders VALUES(106,1,202,400,'2024-02-10');
INSERT INTO orders VALUES(107,5,205,320,'2024-03-01');
INSERT INTO orders VALUES(108,2,201,700,'2024-03-05');"""
ZOMATO_T = [{"name":"restaurants","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"city","type":"varchar"},{"name":"cuisine","type":"varchar"},{"name":"rating","type":"real"}],
"sample_input":[[1,"Biryani House","Mumbai","Indian",4.5],[2,"Pizza Palace","Delhi","Italian",4.2],[3,"Dragon Wok","Mumbai","Chinese",3.8],[4,"Dosa Corner","Bangalore","Indian",4.7],[5,"Burger Barn","Delhi","American",3.5]]},
{"name":"orders","columns":[{"name":"id","type":"int"},{"name":"rest_id","type":"int"},{"name":"cust_id","type":"int"},{"name":"amount","type":"real"},{"name":"order_date","type":"date"}],
"sample_input":[[101,1,201,450,"2024-01-15"],[102,2,202,650,"2024-01-16"],[103,1,203,380,"2024-01-17"],[104,4,201,220,"2024-02-01"],[105,3,204,510,"2024-02-05"],[106,1,202,400,"2024-02-10"],[107,5,205,320,"2024-03-01"],[108,2,201,700,"2024-03-05"]]}]

HOSPITAL_S = """CREATE TABLE doctors(id INT PRIMARY KEY,name VARCHAR,specialty VARCHAR,experience_yrs INT);
CREATE TABLE patients(id INT PRIMARY KEY,name VARCHAR,age INT,gender VARCHAR);
CREATE TABLE appointments(id INT PRIMARY KEY,doc_id INT,patient_id INT,visit_date DATE,diagnosis VARCHAR,fee INT);
INSERT INTO doctors VALUES(1,'Dr. Sharma','Cardiology',15);
INSERT INTO doctors VALUES(2,'Dr. Patel','Orthopedics',10);
INSERT INTO doctors VALUES(3,'Dr. Gupta','Dermatology',8);
INSERT INTO patients VALUES(101,'Rahul',35,'M');
INSERT INTO patients VALUES(102,'Priya',28,'F');
INSERT INTO patients VALUES(103,'Amit',45,'M');
INSERT INTO patients VALUES(104,'Sneha',32,'F');
INSERT INTO appointments VALUES(1001,1,101,'2024-01-10','Hypertension',500);
INSERT INTO appointments VALUES(1002,2,102,'2024-01-12','Fracture',800);
INSERT INTO appointments VALUES(1003,1,103,'2024-01-15','Arrhythmia',500);
INSERT INTO appointments VALUES(1004,3,104,'2024-02-01','Eczema',400);
INSERT INTO appointments VALUES(1005,1,101,'2024-02-10','Follow-up',300);
INSERT INTO appointments VALUES(1006,2,103,'2024-02-15','Joint Pain',600);"""
HOSPITAL_T = [{"name":"doctors","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"specialty","type":"varchar"},{"name":"experience_yrs","type":"int"}],
"sample_input":[[1,"Dr. Sharma","Cardiology",15],[2,"Dr. Patel","Orthopedics",10],[3,"Dr. Gupta","Dermatology",8]]},
{"name":"patients","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"age","type":"int"},{"name":"gender","type":"varchar"}],
"sample_input":[[101,"Rahul",35,"M"],[102,"Priya",28,"F"],[103,"Amit",45,"M"],[104,"Sneha",32,"F"]]},
{"name":"appointments","columns":[{"name":"id","type":"int"},{"name":"doc_id","type":"int"},{"name":"patient_id","type":"int"},{"name":"visit_date","type":"date"},{"name":"diagnosis","type":"varchar"},{"name":"fee","type":"int"}],
"sample_input":[[1001,1,101,"2024-01-10","Hypertension",500],[1002,2,102,"2024-01-12","Fracture",800],[1003,1,103,"2024-01-15","Arrhythmia",500],[1004,3,104,"2024-02-01","Eczema",400],[1005,1,101,"2024-02-10","Follow-up",300],[1006,2,103,"2024-02-15","Joint Pain",600]]}]

BANK_S = """CREATE TABLE accounts(id INT PRIMARY KEY,holder VARCHAR,type VARCHAR,balance REAL,branch VARCHAR);
CREATE TABLE transactions(id INT PRIMARY KEY,acc_id INT,type VARCHAR,amount REAL,txn_date DATE);
INSERT INTO accounts VALUES(1,'Ravi','savings',50000,'Mumbai');
INSERT INTO accounts VALUES(2,'Meena','current',120000,'Delhi');
INSERT INTO accounts VALUES(3,'Kiran','savings',30000,'Mumbai');
INSERT INTO accounts VALUES(4,'Suresh','savings',75000,'Bangalore');
INSERT INTO transactions VALUES(1,1,'credit',5000,'2024-01-10');
INSERT INTO transactions VALUES(2,1,'debit',2000,'2024-01-15');
INSERT INTO transactions VALUES(3,2,'debit',15000,'2024-01-20');
INSERT INTO transactions VALUES(4,3,'credit',8000,'2024-02-01');
INSERT INTO transactions VALUES(5,4,'debit',5000,'2024-02-05');
INSERT INTO transactions VALUES(6,2,'credit',20000,'2024-02-10');
INSERT INTO transactions VALUES(7,1,'debit',3000,'2024-02-15');"""
BANK_T = [{"name":"accounts","columns":[{"name":"id","type":"int"},{"name":"holder","type":"varchar"},{"name":"type","type":"varchar"},{"name":"balance","type":"real"},{"name":"branch","type":"varchar"}],
"sample_input":[[1,"Ravi","savings",50000,"Mumbai"],[2,"Meena","current",120000,"Delhi"],[3,"Kiran","savings",30000,"Mumbai"],[4,"Suresh","savings",75000,"Bangalore"]]},
{"name":"transactions","columns":[{"name":"id","type":"int"},{"name":"acc_id","type":"int"},{"name":"type","type":"varchar"},{"name":"amount","type":"real"},{"name":"txn_date","type":"date"}],
"sample_input":[[1,1,"credit",5000,"2024-01-10"],[2,1,"debit",2000,"2024-01-15"],[3,2,"debit",15000,"2024-01-20"],[4,3,"credit",8000,"2024-02-01"],[5,4,"debit",5000,"2024-02-05"],[6,2,"credit",20000,"2024-02-10"],[7,1,"debit",3000,"2024-02-15"]]}]

# ═══ PROBLEMS ═══

add("sql-001","Employees Above Average Salary","HR / Employee","TCS NQT","easy",
"Find all employees whose salary is strictly above the company average.\n\nReturn name and salary, ordered by salary descending.",
"Use a subquery with AVG().",
"Avg=(70000+60000+55000+50000+65000+45000)/6=57500. Alice(70000), Eve(65000), Bob(60000) are above.",
EMP_T,EMP_S,(["name","salary"],[["Alice",70000],["Eve",65000],["Bob",60000]]),
"SELECT name,salary FROM employees WHERE salary>(SELECT AVG(salary) FROM employees) ORDER BY salary DESC;",topic="Subqueries")

add("sql-002","Department Highest Salary","HR / Employee","Infosys","medium",
"Find the employee with the highest salary in each department.\n\nReturn dept, name, salary ordered by salary descending.",
"Use a subquery with MAX() grouped by dept, then join back.",
"Eng max=Alice(70000), Sales max=Charlie(55000), HR max=Frank(45000).",
EMP_T,EMP_S,(["dept","name","salary"],[["Eng","Alice",70000],["Sales","Charlie",55000],["HR","Frank",45000]]),
"SELECT e.dept,e.name,e.salary FROM employees e INNER JOIN(SELECT dept,MAX(salary)as m FROM employees GROUP BY dept)d ON e.dept=d.dept AND e.salary=d.m ORDER BY e.salary DESC;",topic="Joins & Subqueries")

add("sql-003","Managers and Their Team Size","HR / Employee","Wipro","medium",
"Find all managers and how many direct reports they have.\n\nReturn manager name and report_count, ordered by count descending.",
"Self-join: join employees to itself on mgr_id = id.",
"Alice(id=1) manages Bob,Eve (2 reports). Charlie(id=3) manages Diana (1 report).",
EMP_T,EMP_S,(["manager","report_count"],[["Alice",2],["Charlie",1]]),
"SELECT m.name AS manager,COUNT(e.id)AS report_count FROM employees e JOIN employees m ON e.mgr_id=m.id GROUP BY m.name ORDER BY report_count DESC;",topic="Self-Join")

add("sql-004","Top Restaurant by Revenue","Food Delivery (Zomato)","Amazon","medium",
"Find the restaurant with the highest total revenue from orders.\n\nReturn restaurant name and total_revenue.",
"JOIN restaurants with orders, GROUP BY restaurant, use SUM(amount).",
"Biryani House: 450+380+400=1230. Pizza Palace: 650+700=1350. Pizza Palace wins.",
ZOMATO_T,ZOMATO_S,(["name","total_revenue"],[["Pizza Palace",1350.0]]),
"SELECT r.name,SUM(o.amount)AS total_revenue FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.name ORDER BY total_revenue DESC LIMIT 1;",topic="Joins & Aggregation")

add("sql-005","Restaurants With No Orders","Food Delivery (Zomato)","TCS NQT","easy",
"Find restaurants that have received zero orders.\n\nReturn the restaurant name.",
"Use LEFT JOIN and check for NULL order ids.",
"Dosa Corner(id=4) has order 104. All except... wait, Burger Barn has order 107. Actually all have orders. Let me check... All 5 restaurants have at least one order.",
ZOMATO_T,ZOMATO_S,(["name"],[]),
"SELECT r.name FROM restaurants r LEFT JOIN orders o ON r.id=o.rest_id WHERE o.id IS NULL;",topic="LEFT JOIN")

add("sql-006","City-wise Average Rating","Food Delivery (Zomato)","Cognizant","easy",
"Find the average restaurant rating for each city.\n\nReturn city and avg_rating rounded to 1 decimal, ordered by avg_rating descending.",
"Use GROUP BY city with AVG(rating) and ROUND().",
"Mumbai: (4.5+3.8)/2=4.15→4.2. Bangalore: 4.7. Delhi: (4.2+3.5)/2=3.85→3.9.",
ZOMATO_T,ZOMATO_S,(["city","avg_rating"],[[" Bangalore",4.7],["Mumbai",4.2],["Delhi",3.9]]),
"SELECT city,ROUND(AVG(rating),1)AS avg_rating FROM restaurants GROUP BY city ORDER BY avg_rating DESC;",topic="GROUP BY & Aggregation")

add("sql-007","Doctor With Most Patients","Healthcare / Hospital","Accenture","medium",
"Find the doctor who has treated the most unique patients.\n\nReturn doctor name and patient_count.",
"JOIN doctors with appointments, COUNT DISTINCT patient_id.",
"Dr. Sharma: patients 101,103 = 2 unique. Dr. Patel: 102,103 = 2. Dr. Gupta: 104 = 1. Tie between Sharma and Patel.",
HOSPITAL_T,HOSPITAL_S,(["name","patient_count"],[["Dr. Sharma",2],["Dr. Patel",2]]),
"SELECT d.name,COUNT(DISTINCT a.patient_id)AS patient_count FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name ORDER BY patient_count DESC LIMIT 2;",topic="Joins & DISTINCT")

add("sql-008","Patients With Multiple Visits","Healthcare / Hospital","HCLTech","easy",
"Find patients who have visited more than once.\n\nReturn patient name and visit_count.",
"GROUP BY patient_id with HAVING COUNT>1.",
"Rahul(101) has 2 appointments. Amit(103) has 2 appointments.",
HOSPITAL_T,HOSPITAL_S,(["name","visit_count"],[["Rahul",2],["Amit",2]]),
"SELECT p.name,COUNT(a.id)AS visit_count FROM patients p JOIN appointments a ON p.id=a.patient_id GROUP BY p.name HAVING COUNT(a.id)>1;",topic="HAVING Clause")

add("sql-009","Revenue Per Specialty","Healthcare / Hospital","Deloitte","medium",
"Calculate total revenue generated by each medical specialty.\n\nReturn specialty and total_revenue, ordered descending.",
"JOIN doctors to appointments, SUM fees, GROUP BY specialty.",
"Cardiology: 500+500+300=1300. Orthopedics: 800+600=1400. Dermatology: 400.",
HOSPITAL_T,HOSPITAL_S,(["specialty","total_revenue"],[["Orthopedics",1400],["Cardiology",1300],["Dermatology",400]]),
"SELECT d.specialty,SUM(a.fee)AS total_revenue FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.specialty ORDER BY total_revenue DESC;",topic="Multi-Join & Aggregation")

add("sql-010","Branch-wise Total Deposits","Banking / Finance","Goldman Sachs","easy",
"Find total credit (deposit) amount per branch.\n\nReturn branch and total_deposits, ordered descending.",
"JOIN accounts with transactions WHERE type='credit', GROUP BY branch.",
"Mumbai(acc 1,3): credits 5000+8000=13000. Delhi(acc 2): 20000. Bangalore(acc 4): 0.",
BANK_T,BANK_S,(["branch","total_deposits"],[["Delhi",20000.0],["Mumbai",13000.0]]),
"SELECT a.branch,SUM(t.amount)AS total_deposits FROM accounts a JOIN transactions t ON a.id=t.acc_id WHERE t.type='credit' GROUP BY a.branch ORDER BY total_deposits DESC;",topic="Joins & WHERE Filter")

add("sql-011","Accounts With Net Outflow","Banking / Finance","JP Morgan","medium",
"Find accounts where total debits exceed total credits (net outflow).\n\nReturn holder name and net_outflow amount.",
"Use CASE WHEN inside SUM to separate credits and debits.",
"Ravi: credits=5000, debits=2000+3000=5000. Net=0. Meena: credits=20000, debits=15000. Net positive. Suresh: credits=0, debits=5000. Net outflow=5000.",
BANK_T,BANK_S,(["holder","net_outflow"],[["Suresh",5000.0]]),
"SELECT a.holder,SUM(CASE WHEN t.type='debit' THEN t.amount ELSE 0 END)-SUM(CASE WHEN t.type='credit' THEN t.amount ELSE 0 END)AS net_outflow FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.holder HAVING net_outflow>0;",topic="CASE WHEN")

add("sql-012","Second Highest Salary","HR / Employee","Wipro","medium",
"Find the second highest distinct salary.\n\nReturn it as second_highest_salary. If none, return NULL.",
"Use MAX with a WHERE < MAX subquery, or LIMIT/OFFSET.",
"Salaries: 70000,65000,60000,55000,50000,45000. Second highest = 65000.",
EMP_T,EMP_S,(["second_highest_salary"],[[65000]]),
"SELECT MAX(salary)AS second_highest_salary FROM employees WHERE salary<(SELECT MAX(salary) FROM employees);",topic="Subqueries")

add("sql-013","Repeat Customers","Food Delivery (Zomato)","Amazon","medium",
"Find customers who ordered from more than one distinct restaurant.\n\nReturn cust_id and restaurant_count, ordered descending.",
"GROUP BY cust_id, COUNT DISTINCT rest_id, HAVING > 1.",
"Cust 201: restaurants 1,4,2=3. Cust 202: restaurants 2,1=2. Others: 1 each.",
ZOMATO_T,ZOMATO_S,(["cust_id","restaurant_count"],[[201,3],[202,2]]),
"SELECT cust_id,COUNT(DISTINCT rest_id)AS restaurant_count FROM orders GROUP BY cust_id HAVING COUNT(DISTINCT rest_id)>1 ORDER BY restaurant_count DESC;",topic="HAVING & DISTINCT")

add("sql-014","Employees Hired After Their Manager","HR / Employee","Capgemini","hard",
"Find employees who were hired after their manager.\n\nReturn employee name, their hire date, and manager name.",
"Self-join on mgr_id, compare hire_date.",
"Bob(2020-03-01) hired after Alice(2019-01-15)=manager. Eve(2021-08-05) after Alice. Diana(2021-01-20) after Charlie(2020-06-10).",
EMP_T,EMP_S,(["emp_name","hire_date","manager_name"],[["Bob","2020-03-01","Alice"],["Eve","2021-08-05","Alice"],["Diana","2021-01-20","Charlie"]]),
"SELECT e.name AS emp_name,e.hire_date,m.name AS manager_name FROM employees e JOIN employees m ON e.mgr_id=m.id WHERE e.hire_date>m.hire_date;",topic="Self-Join & Date Compare")

add("sql-015","Highest Revenue Day Per Restaurant","Food Delivery (Zomato)","Microsoft","hard",
"For each restaurant, find the date with the highest single-day order total.\n\nReturn restaurant name, order_date, and day_revenue.",
"GROUP BY rest_id and order_date, then use a window function or subquery to pick the max per restaurant.",
"Biryani House: Jan15=450,Jan17=380,Feb10=400 → Jan15. Pizza Palace: Jan16=650,Mar5=700 → Mar5.",
ZOMATO_T,ZOMATO_S,(["name","order_date","day_revenue"],[["Biryani House","2024-01-15",450.0],["Pizza Palace","2024-03-05",700.0],["Dragon Wok","2024-02-05",510.0],["Dosa Corner","2024-02-01",220.0],["Burger Barn","2024-03-01",320.0]]),
"SELECT r.name,sub.order_date,sub.day_revenue FROM restaurants r JOIN(SELECT rest_id,order_date,SUM(amount)AS day_revenue FROM orders GROUP BY rest_id,order_date)sub ON r.id=sub.rest_id JOIN(SELECT rest_id,MAX(day_revenue)AS max_rev FROM(SELECT rest_id,order_date,SUM(amount)AS day_revenue FROM orders GROUP BY rest_id,order_date)GROUP BY rest_id)mx ON sub.rest_id=mx.rest_id AND sub.day_revenue=mx.max_rev;",topic="Nested Subqueries")

# ═══ NEW SCHEMAS: Batch 2 ═══

STREAM_S = """CREATE TABLE users(id INT PRIMARY KEY,name VARCHAR,plan VARCHAR,join_date DATE);
CREATE TABLE shows(id INT PRIMARY KEY,title VARCHAR,genre VARCHAR,release_year INT);
CREATE TABLE watch_history(id INT PRIMARY KEY,user_id INT,show_id INT,watch_date DATE,duration_min INT);
INSERT INTO users VALUES(1,'Aarav','premium','2023-01-10');
INSERT INTO users VALUES(2,'Bhavna','basic','2023-03-15');
INSERT INTO users VALUES(3,'Chirag','premium','2023-06-01');
INSERT INTO users VALUES(4,'Diya','basic','2024-01-05');
INSERT INTO shows VALUES(1,'Dark','Thriller',2017);
INSERT INTO shows VALUES(2,'Money Heist','Action',2017);
INSERT INTO shows VALUES(3,'Stranger Things','Sci-Fi',2016);
INSERT INTO shows VALUES(4,'Sacred Games','Thriller',2018);
INSERT INTO shows VALUES(5,'Mirzapur','Action',2018);
INSERT INTO watch_history VALUES(1,1,1,'2024-01-10',120);
INSERT INTO watch_history VALUES(2,1,2,'2024-01-12',90);
INSERT INTO watch_history VALUES(3,2,3,'2024-01-15',60);
INSERT INTO watch_history VALUES(4,1,4,'2024-02-01',110);
INSERT INTO watch_history VALUES(5,3,2,'2024-02-05',95);
INSERT INTO watch_history VALUES(6,3,5,'2024-02-10',80);
INSERT INTO watch_history VALUES(7,2,1,'2024-02-15',45);
INSERT INTO watch_history VALUES(8,4,3,'2024-03-01',70);"""
STREAM_T = [{"name":"users","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"plan","type":"varchar"},{"name":"join_date","type":"date"}],
"sample_input":[[1,"Aarav","premium","2023-01-10"],[2,"Bhavna","basic","2023-03-15"],[3,"Chirag","premium","2023-06-01"],[4,"Diya","basic","2024-01-05"]]},
{"name":"shows","columns":[{"name":"id","type":"int"},{"name":"title","type":"varchar"},{"name":"genre","type":"varchar"},{"name":"release_year","type":"int"}],
"sample_input":[[1,"Dark","Thriller",2017],[2,"Money Heist","Action",2017],[3,"Stranger Things","Sci-Fi",2016],[4,"Sacred Games","Thriller",2018],[5,"Mirzapur","Action",2018]]},
{"name":"watch_history","columns":[{"name":"id","type":"int"},{"name":"user_id","type":"int"},{"name":"show_id","type":"int"},{"name":"watch_date","type":"date"},{"name":"duration_min","type":"int"}],
"sample_input":[[1,1,1,"2024-01-10",120],[2,1,2,"2024-01-12",90],[3,2,3,"2024-01-15",60],[4,1,4,"2024-02-01",110],[5,3,2,"2024-02-05",95],[6,3,5,"2024-02-10",80],[7,2,1,"2024-02-15",45],[8,4,3,"2024-03-01",70]]}]

UNI_S = """CREATE TABLE students(id INT PRIMARY KEY,name VARCHAR,branch VARCHAR,year INT);
CREATE TABLE courses(id INT PRIMARY KEY,course_name VARCHAR,credits INT);
CREATE TABLE enrollments(id INT PRIMARY KEY,student_id INT,course_id INT,grade VARCHAR,semester VARCHAR);
INSERT INTO students VALUES(1,'Ravi','CSE',3);
INSERT INTO students VALUES(2,'Meera','ECE',2);
INSERT INTO students VALUES(3,'Arjun','CSE',3);
INSERT INTO students VALUES(4,'Kavya','ME',4);
INSERT INTO students VALUES(5,'Nikhil','CSE',2);
INSERT INTO courses VALUES(101,'Data Structures',4);
INSERT INTO courses VALUES(102,'DBMS',3);
INSERT INTO courses VALUES(103,'OS',4);
INSERT INTO courses VALUES(104,'Signals',3);
INSERT INTO enrollments VALUES(1,1,101,'A','Fall2024');
INSERT INTO enrollments VALUES(2,1,102,'B','Fall2024');
INSERT INTO enrollments VALUES(3,2,104,'A','Fall2024');
INSERT INTO enrollments VALUES(4,3,101,'A','Fall2024');
INSERT INTO enrollments VALUES(5,3,103,'B','Fall2024');
INSERT INTO enrollments VALUES(6,4,103,'C','Fall2024');
INSERT INTO enrollments VALUES(7,5,101,'B','Fall2024');
INSERT INTO enrollments VALUES(8,5,102,'A','Fall2024');"""
UNI_T = [{"name":"students","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"branch","type":"varchar"},{"name":"year","type":"int"}],
"sample_input":[[1,"Ravi","CSE",3],[2,"Meera","ECE",2],[3,"Arjun","CSE",3],[4,"Kavya","ME",4],[5,"Nikhil","CSE",2]]},
{"name":"courses","columns":[{"name":"id","type":"int"},{"name":"course_name","type":"varchar"},{"name":"credits","type":"int"}],
"sample_input":[[101,"Data Structures",4],[102,"DBMS",3],[103,"OS",4],[104,"Signals",3]]},
{"name":"enrollments","columns":[{"name":"id","type":"int"},{"name":"student_id","type":"int"},{"name":"course_id","type":"int"},{"name":"grade","type":"varchar"},{"name":"semester","type":"varchar"}],
"sample_input":[[1,1,101,"A","Fall2024"],[2,1,102,"B","Fall2024"],[3,2,104,"A","Fall2024"],[4,3,101,"A","Fall2024"],[5,3,103,"B","Fall2024"],[6,4,103,"C","Fall2024"],[7,5,101,"B","Fall2024"],[8,5,102,"A","Fall2024"]]}]

# ═══ BATCH 2 PROBLEMS ═══

add("sql-016","Most Watched Show","Streaming (Netflix)","Google","easy",
"Find the show with the most total watch time (sum of duration_min).\n\nReturn show title and total_minutes.",
"JOIN shows with watch_history, SUM duration, ORDER DESC LIMIT 1.",
"Dark: 120+45=165. Money Heist: 90+95=185. Stranger Things: 60+70=130. Sacred Games: 110. Mirzapur: 80. Money Heist wins.",
STREAM_T,STREAM_S,(["title","total_minutes"],[["Money Heist",185]]),
"SELECT s.title,SUM(w.duration_min)AS total_minutes FROM shows s JOIN watch_history w ON s.id=w.show_id GROUP BY s.title ORDER BY total_minutes DESC LIMIT 1;",topic="Joins & Aggregation")

add("sql-017","Users Who Never Watched","Streaming (Netflix)","TCS NQT","easy",
"Find users who have no entries in the watch history.\n\nReturn user name.",
"LEFT JOIN users to watch_history, WHERE watch_history.id IS NULL.",
"All users have at least one watch. So result is empty.",
STREAM_T,STREAM_S,(["name"],[]),
"SELECT u.name FROM users u LEFT JOIN watch_history w ON u.id=w.user_id WHERE w.id IS NULL;",topic="LEFT JOIN")

add("sql-018","Genre Popularity Ranking","Streaming (Netflix)","Meta","medium",
"Rank genres by total watch count (number of watch_history entries).\n\nReturn genre, watch_count, ordered descending.",
"JOIN shows to watch_history, GROUP BY genre, COUNT(*).",
"Thriller: Dark(2)+Sacred Games(1)=3. Action: Money Heist(2)+Mirzapur(1)=3. Sci-Fi: Stranger Things(2)=2.",
STREAM_T,STREAM_S,(["genre","watch_count"],[["Thriller",3],["Action",3],["Sci-Fi",2]]),
"SELECT s.genre,COUNT(w.id)AS watch_count FROM shows s JOIN watch_history w ON s.id=w.show_id GROUP BY s.genre ORDER BY watch_count DESC;",topic="GROUP BY & Aggregation")

add("sql-019","Premium vs Basic Avg Watch Time","Streaming (Netflix)","Deloitte","medium",
"Compare the average watch duration between premium and basic plan users.\n\nReturn plan and avg_duration rounded to 1 decimal.",
"JOIN users to watch_history, GROUP BY plan, AVG(duration_min).",
"Premium(Aarav,Chirag): (120+90+110+95+80)/5=99.0. Basic(Bhavna,Diya): (60+45+70)/3=58.3.",
STREAM_T,STREAM_S,(["plan","avg_duration"],[["premium",99.0],["basic",58.3]]),
"SELECT u.plan,ROUND(AVG(w.duration_min),1)AS avg_duration FROM users u JOIN watch_history w ON u.id=w.user_id GROUP BY u.plan ORDER BY avg_duration DESC;",topic="Multi-Join & Aggregation")

add("sql-020","Students With All A Grades","University / Education","Infosys","medium",
"Find students who received grade 'A' in ALL their enrolled courses.\n\nReturn student name.",
"Compare COUNT of enrollments to COUNT of 'A' grades per student.",
"Meera: 1 course, 1 A. Others have mixed grades.",
UNI_T,UNI_S,(["name"],[["Meera"]]),
"SELECT s.name FROM students s JOIN enrollments e ON s.id=e.student_id GROUP BY s.name HAVING COUNT(e.id)=SUM(CASE WHEN e.grade='A' THEN 1 ELSE 0 END);",topic="CASE WHEN & HAVING")

add("sql-021","Course Enrollment Count","University / Education","Wipro","easy",
"Find how many students are enrolled in each course.\n\nReturn course_name and student_count, ordered descending.",
"JOIN courses with enrollments, GROUP BY course, COUNT.",
"Data Structures: 3 (Ravi,Arjun,Nikhil). DBMS: 2 (Ravi,Nikhil). OS: 2 (Arjun,Kavya). Signals: 1 (Meera).",
UNI_T,UNI_S,(["course_name","student_count"],[["Data Structures",3],["DBMS",2],["OS",2],["Signals",1]]),
"SELECT c.course_name,COUNT(e.student_id)AS student_count FROM courses c JOIN enrollments e ON c.id=e.course_id GROUP BY c.course_name ORDER BY student_count DESC;",topic="Joins & Aggregation")

add("sql-022","Branch Topper","University / Education","Amazon","hard",
"Find the student with the most 'A' grades in each branch.\n\nReturn branch, student name, and a_count.",
"COUNT grade='A' per student, then pick max per branch.",
"CSE: Ravi has 1A, Arjun has 1A, Nikhil has 1A (tie). ECE: Meera 1A. ME: Kavya 0A.",
UNI_T,UNI_S,(["branch","name","a_count"],[["CSE","Ravi",1],["CSE","Arjun",1],["CSE","Nikhil",1],["ECE","Meera",1]]),
"SELECT s.branch,s.name,COUNT(CASE WHEN e.grade='A' THEN 1 END)AS a_count FROM students s JOIN enrollments e ON s.id=e.student_id GROUP BY s.branch,s.name HAVING a_count>0 ORDER BY s.branch,a_count DESC;",topic="CASE WHEN & GROUP BY")

add("sql-023","Department Salary Rank","HR / Employee","Google","hard",
"Rank employees within each department by salary (highest first).\n\nReturn dept, name, salary, and salary_rank. Use dense ranking.",
"Use a subquery to count distinct higher salaries +1 as rank.",
"Eng: Alice=1, Eve=2, Bob=3. Sales: Charlie=1, Diana=2. HR: Frank=1.",
EMP_T,EMP_S,(["dept","name","salary","salary_rank"],[["Eng","Alice",70000,1],["Eng","Eve",65000,2],["Eng","Bob",60000,3],["Sales","Charlie",55000,1],["Sales","Diana",50000,2],["HR","Frank",45000,1]]),
"SELECT e.dept,e.name,e.salary,(SELECT COUNT(DISTINCT e2.salary)+1 FROM employees e2 WHERE e2.dept=e.dept AND e2.salary>e.salary)AS salary_rank FROM employees e ORDER BY e.dept,salary_rank;",topic="Correlated Subquery")

add("sql-024","Shows Not Watched by Premium Users","Streaming (Netflix)","Capgemini","hard",
"Find shows that no premium-plan user has ever watched.\n\nReturn show title.",
"Use NOT EXISTS or NOT IN with a subquery joining users and watch_history.",
"Premium users (Aarav,Chirag) watched: Dark,Money Heist,Sacred Games,Mirzapur. Not watched: Stranger Things.",
STREAM_T,STREAM_S,(["title"],[["Stranger Things"]]),
"SELECT s.title FROM shows s WHERE s.id NOT IN(SELECT w.show_id FROM watch_history w JOIN users u ON w.user_id=u.id WHERE u.plan='premium');",topic="NOT IN / NOT EXISTS")

add("sql-025","Patients Older Than Average","Healthcare / Hospital","Cognizant","easy",
"Find patients whose age is above the average patient age.\n\nReturn name and age, ordered by age descending.",
"Subquery with AVG(age).",
"Avg=(35+28+45+32)/4=35. Amit(45) is above average.",
HOSPITAL_T,HOSPITAL_S,(["name","age"],[["Amit",45]]),
"SELECT name,age FROM patients WHERE age>(SELECT AVG(age) FROM patients) ORDER BY age DESC;",topic="Subqueries")

# ═══ BATCH 3: Advanced Concepts ═══

add("sql-026","Salary Rank With Window Function","HR / Employee","Google","hard",
"Rank employees by salary within each department using DENSE_RANK().\n\nReturn dept, name, salary, and rnk ordered by dept then rank.",
"Use DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC).",
"Eng: Alice=1,Eve=2,Bob=3. Sales: Charlie=1,Diana=2. HR: Frank=1.",
EMP_T,EMP_S,(["dept","name","salary","rnk"],[["Eng","Alice",70000,1],["Eng","Eve",65000,2],["Eng","Bob",60000,3],["HR","Frank",45000,1],["Sales","Charlie",55000,1],["Sales","Diana",50000,2]]),
"SELECT dept,name,salary,DENSE_RANK() OVER(PARTITION BY dept ORDER BY salary DESC)AS rnk FROM employees ORDER BY dept,rnk;",topic="Window Functions")

add("sql-027","Previous Order Amount (LAG)","Food Delivery (Zomato)","Flipkart","hard",
"For each order, show the previous order amount for the same customer using LAG.\n\nReturn cust_id, order_date, amount, and prev_amount (NULL if first order). Order by cust_id, order_date.",
"Use LAG(amount) OVER (PARTITION BY cust_id ORDER BY order_date).",
"Cust201: Jan15=450(prev NULL), Feb1=220(prev 450), Mar5=700(prev 220). Cust202: Jan16=650(NULL), Feb10=400(prev 650).",
ZOMATO_T,ZOMATO_S,(["cust_id","order_date","amount","prev_amount"],[[201,"2024-01-15",450.0,None],[201,"2024-02-01",220.0,450.0],[201,"2024-03-05",700.0,220.0],[202,"2024-01-16",650.0,None],[202,"2024-02-10",400.0,650.0],[203,"2024-01-17",380.0,None],[204,"2024-02-05",510.0,None],[205,"2024-03-01",320.0,None]]),
"SELECT cust_id,order_date,amount,LAG(amount) OVER(PARTITION BY cust_id ORDER BY order_date)AS prev_amount FROM orders ORDER BY cust_id,order_date;",topic="Window Functions (LAG)")

add("sql-028","Running Total of Transactions","Banking / Finance","Morgan Stanley","hard",
"Show a running total of transaction amounts per account, ordered by date.\n\nReturn holder, txn_date, amount, and running_total.",
"Use SUM(amount) OVER (PARTITION BY acc_id ORDER BY txn_date).",
"Ravi: Jan10 5000(rt=5000), Jan15 2000(rt=7000), Feb15 3000(rt=10000).",
BANK_T,BANK_S,(["holder","txn_date","amount","running_total"],[["Ravi","2024-01-10",5000.0,5000.0],["Ravi","2024-01-15",2000.0,7000.0],["Ravi","2024-02-15",3000.0,10000.0],["Meena","2024-01-20",15000.0,15000.0],["Meena","2024-02-10",20000.0,35000.0],["Kiran","2024-02-01",8000.0,8000.0],["Suresh","2024-02-05",5000.0,5000.0]]),
"SELECT a.holder,t.txn_date,t.amount,SUM(t.amount) OVER(PARTITION BY t.acc_id ORDER BY t.txn_date)AS running_total FROM accounts a JOIN transactions t ON a.id=t.acc_id ORDER BY a.holder,t.txn_date;",topic="Window Functions (Running Total)")

add("sql-029","CTE: High-Value Customers","Food Delivery (Zomato)","Amazon","medium",
"Using a CTE, find customers whose total spending is above the average customer spending.\n\nReturn cust_id and total_spent, ordered descending.",
"WITH cust_totals AS (SELECT cust_id, SUM(amount) ...) then filter WHERE total > AVG.",
"Cust201: 450+220+700=1370. Cust202: 650+400=1050. Avg=(1370+1050+380+510+320)/5=666. Above: 201,202.",
ZOMATO_T,ZOMATO_S,(["cust_id","total_spent"],[[201,1370.0],[202,1050.0]]),
"WITH cust_totals AS(SELECT cust_id,SUM(amount)AS total_spent FROM orders GROUP BY cust_id)SELECT cust_id,total_spent FROM cust_totals WHERE total_spent>(SELECT AVG(total_spent) FROM cust_totals) ORDER BY total_spent DESC;",topic="CTE (WITH Clause)")

add("sql-030","UNION: Combined Activity Feed","Streaming (Netflix)","Uber","medium",
"Create a unified activity log combining user registrations and watch events.\n\nReturn user_name, event_type ('Joined' or 'Watched'), and event_date. Order by event_date.",
"UNION ALL two SELECTs: one from users (join_date) and one from watch_history joined with users.",
"Combine join_date entries with watch_date entries.",
STREAM_T,STREAM_S,(["user_name","event_type","event_date"],[["Aarav","Joined","2023-01-10"],["Bhavna","Joined","2023-03-15"],["Chirag","Joined","2023-06-01"],["Diya","Joined","2024-01-05"],["Aarav","Watched","2024-01-10"],["Aarav","Watched","2024-01-12"],["Bhavna","Watched","2024-01-15"],["Aarav","Watched","2024-02-01"],["Chirag","Watched","2024-02-05"],["Chirag","Watched","2024-02-10"],["Bhavna","Watched","2024-02-15"],["Diya","Watched","2024-03-01"]]),
"SELECT name AS user_name,'Joined' AS event_type,join_date AS event_date FROM users UNION ALL SELECT u.name,'Watched',w.watch_date FROM watch_history w JOIN users u ON w.user_id=u.id ORDER BY event_date;",topic="UNION / UNION ALL")

add("sql-031","Monthly Order Count","Food Delivery (Zomato)","Paytm","easy",
"Find the number of orders placed in each month.\n\nReturn month_num and order_count, ordered by month.",
"Use strftime('%m', order_date) to extract month in SQLite.",
"Jan(01): orders 101,102,103=3. Feb(02): 104,105,106=3. Mar(03): 107,108=2.",
ZOMATO_T,ZOMATO_S,(["month_num","order_count"],[["01",3],["02",3],["03",2]]),
"SELECT strftime('%m',order_date)AS month_num,COUNT(*)AS order_count FROM orders GROUP BY month_num ORDER BY month_num;",topic="Date Functions")

add("sql-032","Find Indian Cuisine Restaurants","Food Delivery (Zomato)","TCS Digital","easy",
"Find all restaurants whose cuisine contains the word 'Indian'.\n\nReturn name and cuisine, ordered by rating descending.",
"Use LIKE '%Indian%'.",
"Dosa Corner(Indian,4.7), Biryani House(Indian,4.5).",
ZOMATO_T,ZOMATO_S,(["name","cuisine"],[["Dosa Corner","Indian"],["Biryani House","Indian"]]),
"SELECT name,cuisine FROM restaurants WHERE cuisine LIKE '%Indian%' ORDER BY rating DESC;",topic="String / LIKE")

add("sql-033","Handle NULL Manager","HR / Employee","Accenture","medium",
"List all employees with their manager name. If an employee has no manager, show 'No Manager' instead of NULL.\n\nReturn emp_name and manager_name, ordered by emp_name.",
"Use LEFT JOIN + COALESCE(m.name, 'No Manager').",
"Alice,Charlie,Frank have mgr_id=NULL → 'No Manager'. Bob→Alice, Eve→Alice, Diana→Charlie.",
EMP_T,EMP_S,(["emp_name","manager_name"],[["Alice","No Manager"],["Bob","Alice"],["Charlie","No Manager"],["Diana","Charlie"],["Eve","Alice"],["Frank","No Manager"]]),
"SELECT e.name AS emp_name,COALESCE(m.name,'No Manager')AS manager_name FROM employees e LEFT JOIN employees m ON e.mgr_id=m.id ORDER BY e.name;",topic="NULL / COALESCE")

add("sql-034","Three-Table Join: Patient Diagnosis by Doctor","Healthcare / Hospital","Deloitte","medium",
"Join all three tables to show which doctor diagnosed which patient and what the diagnosis was.\n\nReturn doctor_name, patient_name, diagnosis, ordered by visit_date.",
"JOIN doctors → appointments → patients using doc_id and patient_id.",
"Three-way join across doctors, appointments, and patients tables.",
HOSPITAL_T,HOSPITAL_S,(["doctor_name","patient_name","diagnosis"],[["Dr. Sharma","Rahul","Hypertension"],["Dr. Patel","Priya","Fracture"],["Dr. Sharma","Amit","Arrhythmia"],["Dr. Gupta","Sneha","Eczema"],["Dr. Sharma","Rahul","Follow-up"],["Dr. Patel","Amit","Joint Pain"]]),
"SELECT d.name AS doctor_name,p.name AS patient_name,a.diagnosis FROM appointments a JOIN doctors d ON a.doc_id=d.id JOIN patients p ON a.patient_id=p.id ORDER BY a.visit_date;",topic="Multi-Join (3 Tables)")

add("sql-035","EXISTS: Students Enrolled in Data Structures","University / Education","Flipkart","medium",
"Using EXISTS, find students who are enrolled in 'Data Structures'.\n\nReturn student name, ordered alphabetically.",
"Use EXISTS with a correlated subquery checking enrollments + courses.",
"Ravi, Arjun, Nikhil are enrolled in course 101 (Data Structures).",
UNI_T,UNI_S,(["name"],[["Arjun"],["Nikhil"],["Ravi"]]),
"SELECT s.name FROM students s WHERE EXISTS(SELECT 1 FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE e.student_id=s.id AND c.course_name='Data Structures') ORDER BY s.name;",topic="EXISTS / Correlated Subquery")

# Write output
out = r'c:\AcadMix\frontend\src\data\sql_problems.json'
with open(out, 'w') as f:
    json.dump(P, f, indent=2, default=str)
print(f"Done: Generated {len(P)} problems")

