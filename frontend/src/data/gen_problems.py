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

# ═══ NEW SCHEMA: E-Commerce ═══

ECOM_S = """CREATE TABLE customers(id INT PRIMARY KEY,name VARCHAR,email VARCHAR,city VARCHAR,signup_date DATE);
CREATE TABLE products(id INT PRIMARY KEY,product_name VARCHAR,category VARCHAR,price REAL);
CREATE TABLE orders(id INT PRIMARY KEY,customer_id INT,order_date DATE,total REAL,status VARCHAR);
CREATE TABLE order_items(id INT PRIMARY KEY,order_id INT,product_id INT,qty INT,price REAL);
INSERT INTO customers VALUES(1,'Ankit','ankit@gmail.com','Mumbai','2023-01-15');
INSERT INTO customers VALUES(2,'Priya','priya@yahoo.com','Delhi','2023-03-20');
INSERT INTO customers VALUES(3,'Rohan','rohan@gmail.com','Bangalore','2023-06-10');
INSERT INTO customers VALUES(4,'Sneha','sneha@outlook.com','Mumbai','2024-01-05');
INSERT INTO customers VALUES(5,'Vikram','vikram@gmail.com','Chennai','2023-09-12');
INSERT INTO products VALUES(101,'Laptop',  'Electronics',55000);
INSERT INTO products VALUES(102,'Headphones','Electronics',2500);
INSERT INTO products VALUES(103,'T-Shirt','Fashion',799);
INSERT INTO products VALUES(104,'Sneakers','Fashion',3200);
INSERT INTO products VALUES(105,'Python Book','Books',450);
INSERT INTO orders VALUES(1001,1,'2024-01-10',57500,'delivered');
INSERT INTO orders VALUES(1002,2,'2024-01-15',3299,'delivered');
INSERT INTO orders VALUES(1003,1,'2024-02-05',799,'delivered');
INSERT INTO orders VALUES(1004,3,'2024-02-20',55450,'shipped');
INSERT INTO orders VALUES(1005,2,'2024-03-01',2500,'cancelled');
INSERT INTO orders VALUES(1006,4,'2024-03-10',6900,'delivered');
INSERT INTO orders VALUES(1007,5,'2024-03-15',450,'delivered');
INSERT INTO order_items VALUES(1,1001,101,1,55000);
INSERT INTO order_items VALUES(2,1001,102,1,2500);
INSERT INTO order_items VALUES(3,1002,103,1,799);
INSERT INTO order_items VALUES(4,1002,102,1,2500);
INSERT INTO order_items VALUES(5,1003,103,1,799);
INSERT INTO order_items VALUES(6,1004,101,1,55000);
INSERT INTO order_items VALUES(7,1004,105,1,450);
INSERT INTO order_items VALUES(8,1005,102,1,2500);
INSERT INTO order_items VALUES(9,1006,104,1,3200);
INSERT INTO order_items VALUES(10,1006,103,1,799);
INSERT INTO order_items VALUES(11,1006,102,1,2500);
INSERT INTO order_items VALUES(12,1007,105,1,450);"""
ECOM_T = [{"name":"customers","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"email","type":"varchar"},{"name":"city","type":"varchar"},{"name":"signup_date","type":"date"}],
"sample_input":[[1,"Ankit","ankit@gmail.com","Mumbai","2023-01-15"],[2,"Priya","priya@yahoo.com","Delhi","2023-03-20"],[3,"Rohan","rohan@gmail.com","Bangalore","2023-06-10"],[4,"Sneha","sneha@outlook.com","Mumbai","2024-01-05"],[5,"Vikram","vikram@gmail.com","Chennai","2023-09-12"]]},
{"name":"products","columns":[{"name":"id","type":"int"},{"name":"product_name","type":"varchar"},{"name":"category","type":"varchar"},{"name":"price","type":"real"}],
"sample_input":[[101,"Laptop","Electronics",55000],[102,"Headphones","Electronics",2500],[103,"T-Shirt","Fashion",799],[104,"Sneakers","Fashion",3200],[105,"Python Book","Books",450]]},
{"name":"orders","columns":[{"name":"id","type":"int"},{"name":"customer_id","type":"int"},{"name":"order_date","type":"date"},{"name":"total","type":"real"},{"name":"status","type":"varchar"}],
"sample_input":[[1001,1,"2024-01-10",57500,"delivered"],[1002,2,"2024-01-15",3299,"delivered"],[1003,1,"2024-02-05",799,"delivered"],[1004,3,"2024-02-20",55450,"shipped"],[1005,2,"2024-03-01",2500,"cancelled"],[1006,4,"2024-03-10",6900,"delivered"],[1007,5,"2024-03-15",450,"delivered"]]},
{"name":"order_items","columns":[{"name":"id","type":"int"},{"name":"order_id","type":"int"},{"name":"product_id","type":"int"},{"name":"qty","type":"int"},{"name":"price","type":"real"}],
"sample_input":[[1,1001,101,1,55000],[2,1001,102,1,2500],[3,1002,103,1,799],[4,1002,102,1,2500],[5,1003,103,1,799],[6,1004,101,1,55000],[7,1004,105,1,450],[8,1005,102,1,2500],[9,1006,104,1,3200],[10,1006,103,1,799],[11,1006,102,1,2500],[12,1007,105,1,450]]}]

# ═══ BATCH 4: E-Commerce + Advanced Concepts ═══

add("sql-036","Next Order Date (LEAD)","E-Commerce (Flipkart)","Adobe","hard",
"For each customer order, show the date of their NEXT order using LEAD.\n\nReturn customer_id, order_date, and next_order_date (NULL if last). Order by customer_id, order_date.",
"Use LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date).",
"Ankit: Jan10→Feb05, Feb05→NULL. Priya: Jan15→Mar01, Mar01→NULL.",
ECOM_T,ECOM_S,(["customer_id","order_date","next_order_date"],[[1,"2024-01-10","2024-02-05"],[1,"2024-02-05",None],[2,"2024-01-15","2024-03-01"],[2,"2024-03-01",None],[3,"2024-02-20",None],[4,"2024-03-10",None],[5,"2024-03-15",None]]),
"SELECT customer_id,order_date,LEAD(order_date) OVER(PARTITION BY customer_id ORDER BY order_date)AS next_order_date FROM orders ORDER BY customer_id,order_date;",topic="Window Functions (LEAD)")

add("sql-037","Top Product Per Category (ROW_NUMBER)","E-Commerce (Flipkart)","Razorpay","hard",
"Find the most expensive product in each category using ROW_NUMBER.\n\nReturn category, product_name, and price.",
"Use ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC), filter rn=1.",
"Electronics: Laptop(55000). Fashion: Sneakers(3200). Books: Python Book(450).",
ECOM_T,ECOM_S,(["category","product_name","price"],[["Books","Python Book",450.0],["Electronics","Laptop",55000.0],["Fashion","Sneakers",3200.0]]),
"SELECT category,product_name,price FROM(SELECT category,product_name,price,ROW_NUMBER() OVER(PARTITION BY category ORDER BY price DESC)AS rn FROM products)WHERE rn=1;",topic="Window Functions (ROW_NUMBER)")

add("sql-038","Gmail Users Only","E-Commerce (Flipkart)","Swiggy","easy",
"Find all customers whose email ends with '@gmail.com'.\n\nReturn name and email, ordered by name.",
"Use LIKE '%@gmail.com'.",
"Ankit, Rohan, Vikram have gmail addresses.",
ECOM_T,ECOM_S,(["name","email"],[["Ankit","ankit@gmail.com"],["Rohan","rohan@gmail.com"],["Vikram","vikram@gmail.com"]]),
"SELECT name,email FROM customers WHERE email LIKE '%@gmail.com' ORDER BY name;",topic="String / LIKE")

add("sql-039","Orders in Date Range (BETWEEN)","E-Commerce (Flipkart)","PhonePe","easy",
"Find all orders placed in February 2024.\n\nReturn order id, customer_id, order_date, and total. Order by order_date.",
"Use BETWEEN '2024-02-01' AND '2024-02-29'.",
"Orders 1003(Feb05) and 1004(Feb20) fall in February.",
ECOM_T,ECOM_S,(["id","customer_id","order_date","total"],[[1003,1,"2024-02-05",799.0],[1004,3,"2024-02-20",55450.0]]),
"SELECT id,customer_id,order_date,total FROM orders WHERE order_date BETWEEN '2024-02-01' AND '2024-02-29' ORDER BY order_date;",topic="BETWEEN / Date Range")

add("sql-040","Multi-CTE: Customer Lifetime Value","E-Commerce (Flipkart)","Oracle","hard",
"Using multiple CTEs, find each customer's total spending and order count (exclude cancelled orders), then rank them.\n\nReturn name, total_spent, order_count, and spending_rank.",
"WITH order_stats AS (...), ranked AS (... DENSE_RANK() OVER ...).",
"Ankit: 57500+799=58299(2 orders). Rohan: 55450(1). Sneha: 6900(1). Priya: 3299(1). Vikram: 450(1).",
ECOM_T,ECOM_S,(["name","total_spent","order_count","spending_rank"],[["Ankit",58299.0,2,1],["Rohan",55450.0,1,2],["Sneha",6900.0,1,3],["Priya",3299.0,1,4],["Vikram",450.0,1,5]]),
"WITH order_stats AS(SELECT customer_id,SUM(total)AS total_spent,COUNT(*)AS order_count FROM orders WHERE status!='cancelled' GROUP BY customer_id),ranked AS(SELECT os.*,DENSE_RANK() OVER(ORDER BY total_spent DESC)AS spending_rank FROM order_stats os)SELECT c.name,r.total_spent,r.order_count,r.spending_rank FROM ranked r JOIN customers c ON r.customer_id=c.id ORDER BY r.spending_rank;",topic="Multiple CTEs")

add("sql-041","Cross Join: All Customer-Product Pairs","E-Commerce (Flipkart)","SAP","medium",
"Generate all possible customer-product combinations.\n\nReturn customer name, product_name. Order by customer name, product_name. LIMIT 10.",
"Use CROSS JOIN between customers and products.",
"5 customers × 5 products = 25 total pairs. First 10 shown.",
ECOM_T,ECOM_S,(["name","product_name"],[["Ankit","Headphones"],["Ankit","Laptop"],["Ankit","Python Book"],["Ankit","Sneakers"],["Ankit","T-Shirt"],["Priya","Headphones"],["Priya","Laptop"],["Priya","Python Book"],["Priya","Sneakers"],["Priya","T-Shirt"]]),
"SELECT c.name,p.product_name FROM customers c CROSS JOIN products p ORDER BY c.name,p.product_name LIMIT 10;",topic="Cross Join")

add("sql-042","EXCEPT: Products Never Ordered","E-Commerce (Flipkart)","Adobe","medium",
"Find products that have never been ordered by any customer.\n\nReturn product_name.",
"Use EXCEPT or NOT IN between products and order_items.",
"All products appear in order_items, so result is empty (Sneakers=104 appears in order 1006).",
ECOM_T,ECOM_S,(["product_name"],[]),
"SELECT product_name FROM products WHERE id NOT IN(SELECT DISTINCT product_id FROM order_items);",topic="EXCEPT / NOT IN")

add("sql-043","Duplicate Email Domains","E-Commerce (Flipkart)","Razorpay","medium",
"Find email domains that are used by more than one customer.\n\nReturn domain and user_count, ordered descending.",
"Use SUBSTR + INSTR to extract domain, then GROUP BY + HAVING > 1.",
"gmail.com: Ankit,Rohan,Vikram=3. Others have 1 each.",
ECOM_T,ECOM_S,(["domain","user_count"],[["gmail.com",3]]),
"SELECT SUBSTR(email,INSTR(email,'@')+1)AS domain,COUNT(*)AS user_count FROM customers GROUP BY domain HAVING COUNT(*)>1 ORDER BY user_count DESC;",topic="String Functions & HAVING")

add("sql-044","IFNULL: Safe Division","Banking / Finance","PhonePe","easy",
"For each account, show the average transaction amount. If an account has no transactions, show 0.\n\nReturn holder and avg_txn, ordered by holder.",
"LEFT JOIN accounts to transactions, use IFNULL(AVG(amount), 0).",
"All accounts have transactions. Kiran: avg=8000. Meena: avg=17500. Ravi: avg=3333.33. Suresh: avg=5000.",
BANK_T,BANK_S,(["holder","avg_txn"],[["Kiran",8000.0],["Meena",17500.0],["Ravi",3333.33],["Suresh",5000.0]]),
"SELECT a.holder,ROUND(IFNULL(AVG(t.amount),0),2)AS avg_txn FROM accounts a LEFT JOIN transactions t ON a.id=t.acc_id GROUP BY a.holder ORDER BY a.holder;",topic="IFNULL / NULL Handling")

add("sql-045","Custom Sort: Priority Status","E-Commerce (Flipkart)","Swiggy","medium",
"List all orders sorted by status priority: 'shipped' first, then 'delivered', then 'cancelled'.\n\nReturn order id, order_date, total, and status.",
"Use ORDER BY CASE WHEN status='shipped' THEN 1 WHEN status='delivered' THEN 2 ELSE 3 END.",
"Shipped(1004) → Delivered(1001,1002,1003,1006,1007) → Cancelled(1005).",
ECOM_T,ECOM_S,(["id","order_date","total","status"],[[1004,"2024-02-20",55450.0,"shipped"],[1001,"2024-01-10",57500.0,"delivered"],[1002,"2024-01-15",3299.0,"delivered"],[1003,"2024-02-05",799.0,"delivered"],[1006,"2024-03-10",6900.0,"delivered"],[1007,"2024-03-15",450.0,"delivered"],[1005,"2024-03-01",2500.0,"cancelled"]]),
"SELECT id,order_date,total,status FROM orders ORDER BY CASE WHEN status='shipped' THEN 1 WHEN status='delivered' THEN 2 ELSE 3 END,order_date;",topic="ORDER BY with CASE")

# ═══ NEW SCHEMA: Social Media ═══

SOCIAL_S = """CREATE TABLE profiles(id INT PRIMARY KEY,username VARCHAR,full_name VARCHAR,city VARCHAR,joined DATE);
CREATE TABLE posts(id INT PRIMARY KEY,user_id INT,content VARCHAR,post_date DATE,likes INT);
CREATE TABLE follows(id INT PRIMARY KEY,follower_id INT,following_id INT,follow_date DATE);
CREATE TABLE comments(id INT PRIMARY KEY,post_id INT,user_id INT,comment VARCHAR,comment_date DATE);
INSERT INTO profiles VALUES(1,'ankit_dev','Ankit Sharma','Mumbai','2023-01-10');
INSERT INTO profiles VALUES(2,'priya_codes','Priya Patel','Delhi','2023-02-15');
INSERT INTO profiles VALUES(3,'rohan_js','Rohan Gupta','Bangalore','2023-04-20');
INSERT INTO profiles VALUES(4,'sneha_ml','Sneha Iyer','Chennai','2023-07-01');
INSERT INTO profiles VALUES(5,'vikram_sql','Vikram Singh','Mumbai','2023-09-05');
INSERT INTO posts VALUES(1,1,'Learning React today!','2024-01-10',25);
INSERT INTO posts VALUES(2,1,'SQL is amazing','2024-01-15',42);
INSERT INTO posts VALUES(3,2,'My first open source PR!','2024-01-20',88);
INSERT INTO posts VALUES(4,3,'Built a REST API','2024-02-05',15);
INSERT INTO posts VALUES(5,2,'Python vs JavaScript','2024-02-10',56);
INSERT INTO posts VALUES(6,4,'Deep learning notes','2024-02-15',33);
INSERT INTO posts VALUES(7,5,'SQL window functions','2024-03-01',71);
INSERT INTO posts VALUES(8,1,'Deployed to production!','2024-03-05',95);
INSERT INTO follows VALUES(1,1,2,'2023-03-01');
INSERT INTO follows VALUES(2,1,3,'2023-05-10');
INSERT INTO follows VALUES(3,2,1,'2023-03-05');
INSERT INTO follows VALUES(4,2,4,'2023-08-15');
INSERT INTO follows VALUES(5,3,1,'2023-06-01');
INSERT INTO follows VALUES(6,3,2,'2023-06-01');
INSERT INTO follows VALUES(7,4,2,'2023-09-01');
INSERT INTO follows VALUES(8,5,1,'2023-10-01');
INSERT INTO follows VALUES(9,5,3,'2023-10-01');
INSERT INTO comments VALUES(1,2,2,'Great post!','2024-01-15');
INSERT INTO comments VALUES(2,3,1,'Congrats!','2024-01-20');
INSERT INTO comments VALUES(3,3,4,'Amazing work','2024-01-21');
INSERT INTO comments VALUES(4,5,3,'I prefer Python','2024-02-11');
INSERT INTO comments VALUES(5,7,1,'Nice writeup','2024-03-01');
INSERT INTO comments VALUES(6,8,2,'Awesome!','2024-03-05');
INSERT INTO comments VALUES(7,8,3,'Well done','2024-03-06');
INSERT INTO comments VALUES(8,8,5,'Ship it!','2024-03-06');"""
SOCIAL_T = [{"name":"profiles","columns":[{"name":"id","type":"int"},{"name":"username","type":"varchar"},{"name":"full_name","type":"varchar"},{"name":"city","type":"varchar"},{"name":"joined","type":"date"}],
"sample_input":[[1,"ankit_dev","Ankit Sharma","Mumbai","2023-01-10"],[2,"priya_codes","Priya Patel","Delhi","2023-02-15"],[3,"rohan_js","Rohan Gupta","Bangalore","2023-04-20"],[4,"sneha_ml","Sneha Iyer","Chennai","2023-07-01"],[5,"vikram_sql","Vikram Singh","Mumbai","2023-09-05"]]},
{"name":"posts","columns":[{"name":"id","type":"int"},{"name":"user_id","type":"int"},{"name":"content","type":"varchar"},{"name":"post_date","type":"date"},{"name":"likes","type":"int"}],
"sample_input":[[1,1,"Learning React today!","2024-01-10",25],[2,1,"SQL is amazing","2024-01-15",42],[3,2,"My first open source PR!","2024-01-20",88],[4,3,"Built a REST API","2024-02-05",15],[5,2,"Python vs JavaScript","2024-02-10",56]]},
{"name":"follows","columns":[{"name":"id","type":"int"},{"name":"follower_id","type":"int"},{"name":"following_id","type":"int"},{"name":"follow_date","type":"date"}],
"sample_input":[[1,1,2,"2023-03-01"],[2,1,3,"2023-05-10"],[3,2,1,"2023-03-05"],[4,2,4,"2023-08-15"],[5,3,1,"2023-06-01"],[6,3,2,"2023-06-01"]]},
{"name":"comments","columns":[{"name":"id","type":"int"},{"name":"post_id","type":"int"},{"name":"user_id","type":"int"},{"name":"comment","type":"varchar"},{"name":"comment_date","type":"date"}],
"sample_input":[[1,2,2,"Great post!","2024-01-15"],[2,3,1,"Congrats!","2024-01-20"],[3,3,4,"Amazing work","2024-01-21"],[4,5,3,"I prefer Python","2024-02-11"],[5,7,1,"Nice writeup","2024-03-01"]]}]

# ═══ BATCH 5: Social Media + Advanced ═══

add("sql-046","GROUP_CONCAT: List All Followers","Social Media (Instagram)","Atlassian","medium",
"For each user, show a comma-separated list of their followers' usernames.\n\nReturn username and followers_list, ordered by username.",
"JOIN follows with profiles, use GROUP_CONCAT.",
"ankit_dev is followed by priya_codes,rohan_js,vikram_sql.",
SOCIAL_T,SOCIAL_S,(["username","followers_list"],[["ankit_dev","priya_codes,rohan_js,vikram_sql"],["priya_codes","ankit_dev,rohan_js,sneha_ml"],["rohan_js","ankit_dev,vikram_sql"],["sneha_ml","priya_codes"]]),
"SELECT p.username,GROUP_CONCAT(fp.username)AS followers_list FROM profiles p JOIN follows f ON p.id=f.following_id JOIN profiles fp ON f.follower_id=fp.id GROUP BY p.username ORDER BY p.username;",topic="GROUP_CONCAT / String Aggregation")

add("sql-047","Days Since Last Post","Social Media (Instagram)","Salesforce","hard",
"For each user's post, calculate days since their previous post using LAG and JULIANDAY.\n\nReturn username, post_date, content, and days_gap (NULL for first). Order by username, post_date.",
"Use LAG(post_date) OVER (...) and JULIANDAY difference.",
"Ankit: Jan10→NULL, Jan15→5, Mar05→50.",
SOCIAL_T,SOCIAL_S,(["username","post_date","content","days_gap"],[["ankit_dev","2024-01-10","Learning React today!",None],["ankit_dev","2024-01-15","SQL is amazing",5],["ankit_dev","2024-03-05","Deployed to production!",50],["priya_codes","2024-01-20","My first open source PR!",None],["priya_codes","2024-02-10","Python vs JavaScript",21],["rohan_js","2024-02-05","Built a REST API",None],["sneha_ml","2024-02-15","Deep learning notes",None],["vikram_sql","2024-03-01","SQL window functions",None]]),
"SELECT p2.username,p.post_date,p.content,CAST(JULIANDAY(p.post_date)-JULIANDAY(LAG(p.post_date) OVER(PARTITION BY p.user_id ORDER BY p.post_date))AS INT)AS days_gap FROM posts p JOIN profiles p2 ON p.user_id=p2.id ORDER BY p2.username,p.post_date;",topic="Date Arithmetic (JULIANDAY)")

add("sql-048","4-Table Join: Post Comments","Social Media (Instagram)","Zomato","medium",
"Join all four tables to show post author username, content, commenter full name, and comment.\n\nOrder by comment_date.",
"JOIN posts→profiles (author), comments→profiles (commenter).",
"4-way join across profiles, posts, comments, and profiles again.",
SOCIAL_T,SOCIAL_S,(["author","content","commenter","comment"],[["ankit_dev","SQL is amazing","Priya Patel","Great post!"],["priya_codes","My first open source PR!","Ankit Sharma","Congrats!"],["priya_codes","My first open source PR!","Sneha Iyer","Amazing work"],["priya_codes","Python vs JavaScript","Rohan Gupta","I prefer Python"],["vikram_sql","SQL window functions","Ankit Sharma","Nice writeup"],["ankit_dev","Deployed to production!","Priya Patel","Awesome!"],["ankit_dev","Deployed to production!","Rohan Gupta","Well done"],["ankit_dev","Deployed to production!","Vikram Singh","Ship it!"]]),
"SELECT author_p.username AS author,po.content,cp.full_name AS commenter,c.comment FROM comments c JOIN posts po ON c.post_id=po.id JOIN profiles author_p ON po.user_id=author_p.id JOIN profiles cp ON c.user_id=cp.id ORDER BY c.comment_date;",topic="Multi-Join (4 Tables)")

add("sql-049","NTILE: Salary Quartiles","HR / Employee","ServiceNow","hard",
"Divide employees into salary quartiles using NTILE(4).\n\nReturn name, salary, and quartile, ordered by salary descending.",
"Use NTILE(4) OVER (ORDER BY salary DESC).",
"6 employees into 4 tiles: Q1 gets 2, Q2 gets 2, Q3 gets 1, Q4 gets 1.",
EMP_T,EMP_S,(["name","salary","quartile"],[["Alice",70000,1],["Eve",65000,1],["Bob",60000,2],["Charlie",55000,2],["Diana",50000,3],["Frank",45000,3]]),
"SELECT name,salary,NTILE(4) OVER(ORDER BY salary DESC)AS quartile FROM employees ORDER BY salary DESC;",topic="Window Functions (NTILE)")

add("sql-050","FIRST_VALUE: Cheapest In Category","E-Commerce (Flipkart)","Myntra","medium",
"For each product, show the cheapest product name in its category using FIRST_VALUE.\n\nReturn product_name, category, price, cheapest_in_category. Order by category, price.",
"Use FIRST_VALUE(product_name) OVER (PARTITION BY category ORDER BY price).",
"Electronics cheapest=Headphones. Fashion cheapest=T-Shirt. Books=Python Book.",
ECOM_T,ECOM_S,(["product_name","category","price","cheapest_in_category"],[["Python Book","Books",450.0,"Python Book"],["Headphones","Electronics",2500.0,"Headphones"],["Laptop","Electronics",55000.0,"Headphones"],["T-Shirt","Fashion",799.0,"T-Shirt"],["Sneakers","Fashion",3200.0,"T-Shirt"]]),
"SELECT product_name,category,price,FIRST_VALUE(product_name) OVER(PARTITION BY category ORDER BY price)AS cheapest_in_category FROM products ORDER BY category,price;",topic="Window Functions (FIRST_VALUE)")

add("sql-051","Pivot: Orders by Status","E-Commerce (Flipkart)","Salesforce","medium",
"Pivot report: each customer's order count by status.\n\nReturn name, delivered_count, shipped_count, cancelled_count. Order by name.",
"Use SUM(CASE WHEN status=... THEN 1 ELSE 0 END).",
"Ankit: 2 delivered. Priya: 1 delivered, 1 cancelled.",
ECOM_T,ECOM_S,(["name","delivered_count","shipped_count","cancelled_count"],[["Ankit",2,0,0],["Priya",1,0,1],["Rohan",0,1,0],["Sneha",1,0,0],["Vikram",1,0,0]]),
"SELECT c.name,SUM(CASE WHEN o.status='delivered' THEN 1 ELSE 0 END)AS delivered_count,SUM(CASE WHEN o.status='shipped' THEN 1 ELSE 0 END)AS shipped_count,SUM(CASE WHEN o.status='cancelled' THEN 1 ELSE 0 END)AS cancelled_count FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY c.name;",topic="Pivot with CASE WHEN")

add("sql-052","Pagination: Page 2 of Posts","Social Media (Instagram)","Atlassian","easy",
"Get the 2nd page of posts (3 per page) ordered by likes descending.\n\nReturn content and likes.",
"Use ORDER BY likes DESC LIMIT 3 OFFSET 3.",
"Page 1: 95,88,71. Page 2: 56,42,33.",
SOCIAL_T,SOCIAL_S,(["content","likes"],[["Python vs JavaScript",56],["SQL is amazing",42],["Deep learning notes",33]]),
"SELECT content,likes FROM posts ORDER BY likes DESC LIMIT 3 OFFSET 3;",topic="LIMIT / OFFSET Pagination")

add("sql-053","Find Duplicate Cities","E-Commerce (Flipkart)","Myntra","easy",
"Find cities with more than one customer.\n\nReturn city and customer_count, ordered descending.",
"GROUP BY city, HAVING COUNT > 1.",
"Mumbai: Ankit,Sneha = 2.",
ECOM_T,ECOM_S,(["city","customer_count"],[["Mumbai",2]]),
"SELECT city,COUNT(*)AS customer_count FROM customers GROUP BY city HAVING COUNT(*)>1 ORDER BY customer_count DESC;",topic="Duplicate Detection")

add("sql-054","Mutual Followers","Social Media (Instagram)","Google","hard",
"Find pairs of users who mutually follow each other.\n\nReturn user_a and user_b (alphabetically), no duplicates.",
"Self-join follows on follower↔following symmetry.",
"ankit_dev↔priya_codes, ankit_dev↔rohan_js are mutual.",
SOCIAL_T,SOCIAL_S,(["user_a","user_b"],[["ankit_dev","priya_codes"],["ankit_dev","rohan_js"]]),
"SELECT p1.username AS user_a,p2.username AS user_b FROM follows f1 JOIN follows f2 ON f1.follower_id=f2.following_id AND f1.following_id=f2.follower_id JOIN profiles p1 ON f1.follower_id=p1.id JOIN profiles p2 ON f1.following_id=p2.id WHERE p1.username<p2.username ORDER BY user_a;",topic="Self-Join / INTERSECT Logic")

add("sql-055","Category Revenue Percentage","E-Commerce (Flipkart)","ServiceNow","hard",
"Calculate what percentage of total order_items revenue each category contributes.\n\nReturn category, category_revenue, pct (rounded to 1 decimal). Order by pct descending.",
"SUM per category / total SUM * 100.",
"Electronics dominates with ~94.8%.",
ECOM_T,ECOM_S,(["category","category_revenue","pct"],[["Electronics",117500.0,94.8],["Fashion",5597.0,4.5],["Books",900.0,0.7]]),
"SELECT p.category,SUM(oi.price)AS category_revenue,ROUND(SUM(oi.price)*100.0/(SELECT SUM(price) FROM order_items),1)AS pct FROM order_items oi JOIN products p ON oi.product_id=p.id GROUP BY p.category ORDER BY pct DESC;",topic="Percentage Calculation")

# ═══ NEW SCHEMA: Ride-Sharing ═══

RIDE_S = """CREATE TABLE drivers(id INT PRIMARY KEY,name VARCHAR,city VARCHAR,rating REAL,joined DATE);
CREATE TABLE riders(id INT PRIMARY KEY,name VARCHAR,city VARCHAR,signup_date DATE);
CREATE TABLE rides(id INT PRIMARY KEY,rider_id INT,driver_id INT,pickup VARCHAR,dropoff VARCHAR,fare REAL,distance_km REAL,ride_date DATE,status VARCHAR);
INSERT INTO drivers VALUES(1,'Ramesh','Mumbai',4.8,'2022-06-01');
INSERT INTO drivers VALUES(2,'Sunil','Mumbai',4.5,'2023-01-10');
INSERT INTO drivers VALUES(3,'Kavita','Delhi',4.9,'2022-03-15');
INSERT INTO drivers VALUES(4,'Mohan','Bangalore',4.2,'2023-05-20');
INSERT INTO drivers VALUES(5,'Lakshmi','Chennai',4.7,'2022-11-01');
INSERT INTO riders VALUES(1,'Aarav','Mumbai','2023-01-05');
INSERT INTO riders VALUES(2,'Bhavna','Delhi','2023-03-15');
INSERT INTO riders VALUES(3,'Chirag','Mumbai','2023-06-01');
INSERT INTO riders VALUES(4,'Diya','Bangalore','2023-09-10');
INSERT INTO riders VALUES(5,'Eshan','Chennai','2024-01-01');
INSERT INTO rides VALUES(1,1,1,'Andheri','Bandra',250,8.5,'2024-01-10','completed');
INSERT INTO rides VALUES(2,1,2,'Bandra','Dadar',180,5.2,'2024-01-12','completed');
INSERT INTO rides VALUES(3,2,3,'CP','Nehru Place',320,12.0,'2024-01-15','completed');
INSERT INTO rides VALUES(4,3,1,'Worli','Andheri',400,15.3,'2024-01-20','completed');
INSERT INTO rides VALUES(5,1,1,'Dadar','Andheri',200,7.0,'2024-02-01','completed');
INSERT INTO rides VALUES(6,4,4,'Koramangala','Whitefield',550,22.0,'2024-02-05','completed');
INSERT INTO rides VALUES(7,2,3,'Saket','CP',280,10.5,'2024-02-10','cancelled');
INSERT INTO rides VALUES(8,5,5,'T Nagar','Adyar',150,4.0,'2024-02-15','completed');
INSERT INTO rides VALUES(9,3,2,'Andheri','Powai',350,13.0,'2024-03-01','completed');
INSERT INTO rides VALUES(10,1,1,'Bandra','Worli',220,6.5,'2024-03-05','completed');"""
RIDE_T = [{"name":"drivers","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"city","type":"varchar"},{"name":"rating","type":"real"},{"name":"joined","type":"date"}],
"sample_input":[[1,"Ramesh","Mumbai",4.8,"2022-06-01"],[2,"Sunil","Mumbai",4.5,"2023-01-10"],[3,"Kavita","Delhi",4.9,"2022-03-15"],[4,"Mohan","Bangalore",4.2,"2023-05-20"],[5,"Lakshmi","Chennai",4.7,"2022-11-01"]]},
{"name":"riders","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"city","type":"varchar"},{"name":"signup_date","type":"date"}],
"sample_input":[[1,"Aarav","Mumbai","2023-01-05"],[2,"Bhavna","Delhi","2023-03-15"],[3,"Chirag","Mumbai","2023-06-01"],[4,"Diya","Bangalore","2023-09-10"],[5,"Eshan","Chennai","2024-01-01"]]},
{"name":"rides","columns":[{"name":"id","type":"int"},{"name":"rider_id","type":"int"},{"name":"driver_id","type":"int"},{"name":"pickup","type":"varchar"},{"name":"dropoff","type":"varchar"},{"name":"fare","type":"real"},{"name":"distance_km","type":"real"},{"name":"ride_date","type":"date"},{"name":"status","type":"varchar"}],
"sample_input":[[1,1,1,"Andheri","Bandra",250,8.5,"2024-01-10","completed"],[2,1,2,"Bandra","Dadar",180,5.2,"2024-01-12","completed"],[3,2,3,"CP","Nehru Place",320,12.0,"2024-01-15","completed"],[4,3,1,"Worli","Andheri",400,15.3,"2024-01-20","completed"],[5,1,1,"Dadar","Andheri",200,7.0,"2024-02-01","completed"]]}]

# ═══ BATCH 6: Ride-Sharing + Mixed Advanced ═══

add("sql-056","Recursive CTE: Number Sequence","HR / Employee","Juspay","hard",
"Using a recursive CTE, generate a sequence of numbers from 1 to 6 (one for each employee).\n\nReturn the number as n.",
"WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 6).",
"Simple recursive generation: 1,2,3,4,5,6.",
EMP_T,EMP_S,(["n"],[[1],[2],[3],[4],[5],[6]]),
"WITH RECURSIVE seq(n) AS(SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n<6)SELECT n FROM seq;",topic="Recursive CTE")

add("sql-057","LAST_VALUE: Most Expensive Ride Per Rider","Ride-Sharing (Ola)","Ola","hard",
"For each ride, show the rider's most expensive ride fare using LAST_VALUE.\n\nReturn rider name, ride_date, fare, and max_fare. Order by rider name, ride_date.",
"Use LAST_VALUE(fare) OVER (PARTITION BY rider_id ORDER BY fare ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING).",
"Aarav's max fare across all rides is 250.",
RIDE_T,RIDE_S,(["name","ride_date","fare","max_fare"],[["Aarav","2024-01-10",250.0,250.0],["Aarav","2024-01-12",180.0,250.0],["Aarav","2024-02-01",200.0,250.0],["Aarav","2024-03-05",220.0,250.0],["Bhavna","2024-01-15",320.0,320.0],["Bhavna","2024-02-10",280.0,320.0],["Chirag","2024-01-20",400.0,400.0],["Chirag","2024-03-01",350.0,400.0],["Diya","2024-02-05",550.0,550.0],["Eshan","2024-02-15",150.0,150.0]]),
"SELECT r2.name,r.ride_date,r.fare,LAST_VALUE(r.fare) OVER(PARTITION BY r.rider_id ORDER BY r.fare ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)AS max_fare FROM rides r JOIN riders r2 ON r.rider_id=r2.id ORDER BY r2.name,r.ride_date;",topic="Window Functions (LAST_VALUE)")

add("sql-058","REPLACE: Clean Email Domain","E-Commerce (Flipkart)","CRED","easy",
"Replace 'gmail.com' with 'company.com' in all customer emails.\n\nReturn name and updated_email, ordered by name.",
"Use REPLACE(email, 'gmail.com', 'company.com').",
"Ankit: ankit@company.com. Priya stays yahoo. Rohan: rohan@company.com.",
ECOM_T,ECOM_S,(["name","updated_email"],[["Ankit","ankit@company.com"],["Priya","priya@yahoo.com"],["Rohan","rohan@company.com"],["Sneha","sneha@outlook.com"],["Vikram","vikram@company.com"]]),
"SELECT name,REPLACE(email,'gmail.com','company.com')AS updated_email FROM customers ORDER BY name;",topic="String Functions (REPLACE)")

add("sql-059","ABS: Fare vs Average Deviation","Ride-Sharing (Ola)","Zoho","medium",
"For each completed ride, show how much the fare deviates from the average fare (absolute value).\n\nReturn ride_id, fare, and deviation rounded to 1 decimal. Order by deviation descending.",
"Use ABS(fare - (SELECT AVG(fare) FROM rides WHERE status='completed')).",
"Avg completed fare = (250+180+320+400+200+550+150+350+220)/9 ≈ 291.1.",
RIDE_T,RIDE_S,(["id","fare","deviation"],[[6,550.0,258.9],[4,400.0,108.9],[9,350.0,58.9],[3,320.0,28.9],[1,250.0,41.1],[10,220.0,71.1],[5,200.0,91.1],[2,180.0,111.1],[8,150.0,141.1]]),
"SELECT id,fare,ROUND(ABS(fare-(SELECT AVG(fare) FROM rides WHERE status='completed')),1)AS deviation FROM rides WHERE status='completed' ORDER BY deviation DESC;",topic="Math Functions (ABS)")

add("sql-060","Conditional COUNT: Rides by Status","Ride-Sharing (Ola)","Freshworks","easy",
"Count total rides, completed rides, and cancelled rides in a single query.\n\nReturn total_rides, completed, cancelled.",
"Use COUNT(*) and SUM(CASE WHEN ...).",
"Total=10, Completed=9, Cancelled=1.",
RIDE_T,RIDE_S,(["total_rides","completed","cancelled"],[[10,9,1]]),
"SELECT COUNT(*)AS total_rides,SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)AS completed,SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END)AS cancelled FROM rides;",topic="Conditional Aggregation")

add("sql-061","UPPER/LOWER: Standardize Usernames","Social Media (Instagram)","Zoho","easy",
"Show each profile with username in UPPER case and full_name in LOWER case.\n\nReturn upper_user and lower_name, ordered by upper_user.",
"Use UPPER() and LOWER().",
"ANKIT_DEV, ankit sharma, etc.",
SOCIAL_T,SOCIAL_S,(["upper_user","lower_name"],[["ANKIT_DEV","ankit sharma"],["PRIYA_CODES","priya patel"],["ROHAN_JS","rohan gupta"],["SNEHA_ML","sneha iyer"],["VIKRAM_SQL","vikram singh"]]),
"SELECT UPPER(username)AS upper_user,LOWER(full_name)AS lower_name FROM profiles ORDER BY upper_user;",topic="String Functions (UPPER/LOWER)")

add("sql-062","Fare Per Km: Best Value Rides","Ride-Sharing (Ola)","Ola","medium",
"Find the fare per kilometer for each completed ride.\n\nReturn rider name, pickup, dropoff, fare_per_km (rounded to 1). Order by fare_per_km ascending.",
"fare / distance_km, JOIN with riders.",
"Cheapest per km first.",
RIDE_T,RIDE_S,(["name","pickup","dropoff","fare_per_km"],[["Diya","Koramangala","Whitefield",25.0],["Aarav","Andheri","Bandra",29.4],["Chirag","Worli","Andheri",26.1],["Chirag","Andheri","Powai",26.9],["Aarav","Dadar","Andheri",28.6],["Aarav","Bandra","Worli",33.8],["Aarav","Bandra","Dadar",34.6],["Bhavna","CP","Nehru Place",26.7],["Eshan","T Nagar","Adyar",37.5]]),
"SELECT r2.name,r.pickup,r.dropoff,ROUND(r.fare/r.distance_km,1)AS fare_per_km FROM rides r JOIN riders r2 ON r.rider_id=r2.id WHERE r.status='completed' ORDER BY fare_per_km;",topic="Math / Division")

add("sql-063","Driver Earnings Summary","Ride-Sharing (Ola)","CRED","medium",
"For each driver, show total earnings, ride count, and average fare from completed rides.\n\nReturn driver name, total_earnings, ride_count, avg_fare (rounded to 0). Order by total_earnings descending.",
"JOIN drivers to rides, GROUP BY driver, filter completed.",
"Ramesh: 4 rides totaling 1070.",
RIDE_T,RIDE_S,(["name","total_earnings","ride_count","avg_fare"],[["Ramesh",1070.0,4,268],["Kavita",600.0,1,600],["Mohan",550.0,1,550],["Sunil",530.0,2,265],["Lakshmi",150.0,1,150]]),
"SELECT d.name,SUM(r.fare)AS total_earnings,COUNT(*)AS ride_count,ROUND(AVG(r.fare))AS avg_fare FROM drivers d JOIN rides r ON d.id=r.driver_id WHERE r.status='completed' GROUP BY d.name ORDER BY total_earnings DESC;",topic="Multi-Aggregation")

add("sql-064","Complex WHERE: High-Value Mumbai Rides","Ride-Sharing (Ola)","Juspay","medium",
"Find completed rides in Mumbai (pickup or dropoff in Andheri, Bandra, Dadar, Worli, Powai) with fare > 200.\n\nReturn ride_id, pickup, dropoff, fare. Order by fare descending.",
"Use WHERE status='completed' AND fare > 200 AND (pickup IN (...) OR dropoff IN (...)).",
"Filter by multiple Mumbai locations and fare threshold.",
RIDE_T,RIDE_S,(["id","pickup","dropoff","fare"],[[4,"Worli","Andheri",400.0],[9,"Andheri","Powai",350.0],[1,"Andheri","Bandra",250.0],[10,"Bandra","Worli",220.0]]),
"SELECT id,pickup,dropoff,fare FROM rides WHERE status='completed' AND fare>200 AND(pickup IN('Andheri','Bandra','Dadar','Worli','Powai')OR dropoff IN('Andheri','Bandra','Dadar','Worli','Powai'))ORDER BY fare DESC;",topic="Complex WHERE Clause")

add("sql-065","Engagement Score: Posts + Comments","Social Media (Instagram)","Freshworks","hard",
"Calculate an engagement score for each user: (total_likes + comment_count * 5).\n\nReturn username, total_likes, comment_count, engagement_score. Order by score descending.",
"LEFT JOIN posts and comments to profiles, aggregate both.",
"ankit_dev: likes=25+42+95=162, comments received=1+3=4, score=162+20=182.",
SOCIAL_T,SOCIAL_S,(["username","total_likes","comments_received","engagement_score"],[["ankit_dev",162,4,182],["priya_codes",144,1,149],["vikram_sql",71,1,76],["sneha_ml",33,0,33],["rohan_js",15,0,15]]),
"SELECT pr.username,IFNULL(SUM(DISTINCT p.likes),0)AS total_likes,COUNT(DISTINCT c.id)AS comments_received,IFNULL(SUM(DISTINCT p.likes),0)+COUNT(DISTINCT c.id)*5 AS engagement_score FROM profiles pr LEFT JOIN posts p ON pr.id=p.user_id LEFT JOIN comments c ON p.id=c.post_id GROUP BY pr.username ORDER BY engagement_score DESC;",topic="Complex Aggregation")

# ═══ BATCH 7: Mixed Advanced (Existing Companies Only) ═══

add("sql-066","LENGTH: Short Usernames","Social Media (Instagram)","Meta","easy",
"Find profiles where the username is shorter than 10 characters.\n\nReturn username and name_length, ordered by name_length.",
"Use LENGTH(username) < 10.",
"rohan_js=8, sneha_ml=8, ankit_dev=9.",
SOCIAL_T,SOCIAL_S,(["username","name_length"],[["rohan_js",8],["sneha_ml",8],["ankit_dev",9]]),
"SELECT username,LENGTH(username)AS name_length FROM profiles WHERE LENGTH(username)<10 ORDER BY name_length;",topic="String Functions (LENGTH)")

add("sql-067","COUNT DISTINCT vs COUNT(*)","Food Delivery (Zomato)","Wipro","easy",
"Show the total number of orders vs the number of unique customers who ordered.\n\nReturn total_orders and unique_customers.",
"COUNT(*) vs COUNT(DISTINCT cust_id).",
"8 total orders, 5 unique customers.",
ZOMATO_T,ZOMATO_S,(["total_orders","unique_customers"],[[8,5]]),
"SELECT COUNT(*)AS total_orders,COUNT(DISTINCT cust_id)AS unique_customers FROM orders;",topic="COUNT DISTINCT vs COUNT(*)")

add("sql-068","IN Subquery: Doctors Who Treated Seniors","Healthcare / Hospital","HCLTech","medium",
"Find doctors who have treated patients older than 35.\n\nReturn doctor name, ordered alphabetically.",
"Use WHERE id IN (SELECT doc_id FROM appointments WHERE patient_id IN (...)).",
"Patients >35: Amit(45). Amit was treated by Dr. Sharma and Dr. Patel.",
HOSPITAL_T,HOSPITAL_S,(["name"],[["Dr. Patel"],["Dr. Sharma"]]),
"SELECT DISTINCT d.name FROM doctors d WHERE d.id IN(SELECT a.doc_id FROM appointments a WHERE a.patient_id IN(SELECT id FROM patients WHERE age>35))ORDER BY d.name;",topic="IN with Subquery")

add("sql-069","PERCENT_RANK: Salary Percentile","HR / Employee","Goldman Sachs","hard",
"Calculate the percent rank of each employee's salary.\n\nReturn name, salary, and pct_rank (rounded to 2 decimal). Order by salary descending.",
"Use PERCENT_RANK() OVER (ORDER BY salary).",
"Alice(70K)=1.0, Eve(65K)=0.8, Bob(60K)=0.6, ...",
EMP_T,EMP_S,(["name","salary","pct_rank"],[["Alice",70000,1.0],["Eve",65000,0.8],["Bob",60000,0.6],["Charlie",55000,0.4],["Diana",50000,0.2],["Frank",45000,0.0]]),
"SELECT name,salary,ROUND(PERCENT_RANK() OVER(ORDER BY salary),2)AS pct_rank FROM employees ORDER BY salary DESC;",topic="Window Functions (PERCENT_RANK)")

add("sql-070","HAVING Multiple Conditions","Banking / Finance","JP Morgan","medium",
"Find branches where total credits exceed 10000 AND total debits exceed 2000.\n\nReturn branch, total_credits, total_debits.",
"GROUP BY branch with two HAVING conditions using AND.",
"Mumbai: credits=13000, debits=5000 (both pass).",
BANK_T,BANK_S,(["branch","total_credits","total_debits"],[["Mumbai",13000.0,5000.0]]),
"SELECT a.branch,SUM(CASE WHEN t.type='credit' THEN t.amount ELSE 0 END)AS total_credits,SUM(CASE WHEN t.type='debit' THEN t.amount ELSE 0 END)AS total_debits FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.branch HAVING total_credits>10000 AND total_debits>2000;",topic="HAVING Multiple Conditions")

add("sql-071","MIN and MAX in Same Query","Ride-Sharing (Ola)","Uber","easy",
"Find the cheapest and most expensive completed ride fare, plus the fare range.\n\nReturn min_fare, max_fare, and fare_range.",
"Use MIN(), MAX(), and MAX()-MIN().",
"Min=150, Max=550, Range=400.",
RIDE_T,RIDE_S,(["min_fare","max_fare","fare_range"],[[150.0,550.0,400.0]]),
"SELECT MIN(fare)AS min_fare,MAX(fare)AS max_fare,MAX(fare)-MIN(fare)AS fare_range FROM rides WHERE status='completed';",topic="MIN / MAX Aggregation")

add("sql-072","Nested CASE: Grade Classification","University / Education","Infosys","medium",
"Classify each enrollment into 'Excellent' (A), 'Good' (B), 'Average' (C), or 'Below Average' (other).\n\nReturn student name, course_name, grade, and classification. Order by student name.",
"Use CASE WHEN grade='A' THEN 'Excellent' WHEN 'B' THEN 'Good' ...",
"Map each grade to a label.",
UNI_T,UNI_S,(["name","course_name","grade","classification"],[["Arjun","Data Structures","A","Excellent"],["Arjun","OS","B","Good"],["Kavya","OS","C","Average"],["Meera","Signals","A","Excellent"],["Nikhil","Data Structures","B","Good"],["Nikhil","DBMS","A","Excellent"],["Ravi","Data Structures","A","Excellent"],["Ravi","DBMS","B","Good"]]),
"SELECT s.name,c.course_name,e.grade,CASE WHEN e.grade='A' THEN 'Excellent' WHEN e.grade='B' THEN 'Good' WHEN e.grade='C' THEN 'Average' ELSE 'Below Average' END AS classification FROM enrollments e JOIN students s ON e.student_id=s.id JOIN courses c ON e.course_id=c.id ORDER BY s.name;",topic="Nested CASE WHEN")

add("sql-073","Multi-Table CTE: Top Driver Per City","Ride-Sharing (Ola)","Microsoft","hard",
"Using CTEs, find the top-earning driver in each city from completed rides.\n\nReturn city, driver_name, and total_earnings.",
"WITH earnings AS (...), ranked AS (... ROW_NUMBER() ...) WHERE rn=1.",
"Mumbai: Ramesh(1070). Delhi: Kavita(600). Bangalore: Mohan(550). Chennai: Lakshmi(150).",
RIDE_T,RIDE_S,(["city","driver_name","total_earnings"],[["Bangalore","Mohan",550.0],["Chennai","Lakshmi",150.0],["Delhi","Kavita",600.0],["Mumbai","Ramesh",1070.0]]),
"WITH earnings AS(SELECT d.id,d.name,d.city,SUM(r.fare)AS total_earnings FROM drivers d JOIN rides r ON d.id=r.driver_id WHERE r.status='completed' GROUP BY d.id),ranked AS(SELECT *,ROW_NUMBER() OVER(PARTITION BY city ORDER BY total_earnings DESC)AS rn FROM earnings)SELECT city,name AS driver_name,total_earnings FROM ranked WHERE rn=1 ORDER BY city;",topic="Multi-Table CTE + ROW_NUMBER")

add("sql-074","OR/AND Precedence: Filter Rides","Ride-Sharing (Ola)","Capgemini","medium",
"Find rides that are either: (completed AND fare > 300) OR (cancelled).\n\nReturn ride_id, status, fare. Order by ride_id.",
"Parentheses matter: (status='completed' AND fare>300) OR status='cancelled'.",
"Completed>300: rides 3,4,6,9. Cancelled: ride 7.",
RIDE_T,RIDE_S,(["id","status","fare"],[[3,"completed",320.0],[4,"completed",400.0],[6,"completed",550.0],[7,"cancelled",280.0],[9,"completed",350.0]]),
"SELECT id,status,fare FROM rides WHERE(status='completed' AND fare>300)OR status='cancelled' ORDER BY id;",topic="WHERE OR/AND Precedence")

add("sql-075","Derived Table: Above-Avg Riders","Ride-Sharing (Ola)","Deloitte","medium",
"Using a derived table (inline subquery in FROM), find riders whose average fare exceeds the overall average.\n\nReturn rider name and avg_fare (rounded to 0). Order by avg_fare descending.",
"SELECT FROM (SELECT rider_id, AVG(fare) ...) WHERE avg_fare > (overall avg).",
"Overall avg ≈ 291. Diya(550), Chirag(375), Bhavna(300) are above.",
RIDE_T,RIDE_S,(["name","avg_fare"],[["Diya",550],["Chirag",375],["Bhavna",300]]),
"SELECT r2.name,ROUND(sub.avg_fare)AS avg_fare FROM(SELECT rider_id,AVG(fare)AS avg_fare FROM rides WHERE status='completed' GROUP BY rider_id)sub JOIN riders r2 ON sub.rider_id=r2.id WHERE sub.avg_fare>(SELECT AVG(fare) FROM rides WHERE status='completed')ORDER BY avg_fare DESC;",topic="Derived Table / Inline View")

# ═══ BATCH 8: Mixed Advanced II ═══

add("sql-076","SUBSTR: Extract First Name","HR / Employee","TCS Digital","easy",
"Extract just the first name from each employee (characters before any space, but since names are single words, just return first 3 characters as initials).\n\nReturn name and initials (first 3 chars). Order by name.",
"Use SUBSTR(name, 1, 3).",
"Ali, Bob, Cha, Dia, Eve, Fra.",
EMP_T,EMP_S,(["name","initials"],[["Alice","Ali"],["Bob","Bob"],["Charlie","Cha"],["Diana","Dia"],["Eve","Eve"],["Frank","Fra"]]),
"SELECT name,SUBSTR(name,1,3)AS initials FROM employees ORDER BY name;",topic="String Functions (SUBSTR)")

add("sql-077","CAST: Fare as Integer","Ride-Sharing (Ola)","Paytm","easy",
"Show each completed ride's fare cast as an integer (truncated, not rounded).\n\nReturn ride_id, original fare, and fare_int. Order by ride_id.",
"Use CAST(fare AS INT).",
"250.0→250, 180.0→180, etc.",
RIDE_T,RIDE_S,(["id","fare","fare_int"],[[1,250.0,250],[2,180.0,180],[3,320.0,320],[4,400.0,400],[5,200.0,200],[6,550.0,550],[8,150.0,150],[9,350.0,350],[10,220.0,220]]),
"SELECT id,fare,CAST(fare AS INT)AS fare_int FROM rides WHERE status='completed' ORDER BY id;",topic="CAST / Type Conversion")

add("sql-078","Cumulative Order Total","E-Commerce (Flipkart)","Amazon","hard",
"Show each order with a running cumulative total across all orders sorted by date.\n\nReturn order_id, order_date, total, and cumulative_total. Order by order_date.",
"Use SUM(total) OVER (ORDER BY order_date).",
"Jan10: 57500. Jan15: 57500+3299=60799. Feb05: 61598...",
ECOM_T,ECOM_S,(["id","order_date","total","cumulative_total"],[[1001,"2024-01-10",57500.0,57500.0],[1002,"2024-01-15",3299.0,60799.0],[1003,"2024-02-05",799.0,61598.0],[1004,"2024-02-20",55450.0,117048.0],[1005,"2024-03-01",2500.0,119548.0],[1006,"2024-03-10",6900.0,126448.0],[1007,"2024-03-15",450.0,126898.0]]),
"SELECT id,order_date,total,SUM(total) OVER(ORDER BY order_date)AS cumulative_total FROM orders ORDER BY order_date;",topic="Cumulative SUM Window")

add("sql-079","NOT EXISTS: Idle Drivers","Ride-Sharing (Ola)","Google","medium",
"Find drivers who have never completed a ride using NOT EXISTS.\n\nReturn driver name.",
"Use NOT EXISTS with a correlated subquery on rides.",
"All drivers have at least one completed ride, so result is empty.",
RIDE_T,RIDE_S,(["name"],[]),
"SELECT d.name FROM drivers d WHERE NOT EXISTS(SELECT 1 FROM rides r WHERE r.driver_id=d.id AND r.status='completed');",topic="NOT EXISTS")

add("sql-080","Multiple UNION: All Names","Ride-Sharing (Ola)","SAP","medium",
"Combine all driver names and rider names into a single list with their role.\n\nReturn name and role ('Driver' or 'Rider'). Order by name.",
"UNION ALL two SELECTs with literal role column.",
"Combined list of 10 people.",
RIDE_T,RIDE_S,(["name","role"],[["Aarav","Rider"],["Bhavna","Rider"],["Chirag","Rider"],["Diya","Rider"],["Eshan","Rider"],["Kavita","Driver"],["Lakshmi","Driver"],["Mohan","Driver"],["Ramesh","Driver"],["Sunil","Driver"]]),
"SELECT name,'Driver' AS role FROM drivers UNION ALL SELECT name,'Rider' FROM riders ORDER BY name;",topic="UNION ALL with Literals")

add("sql-081","Summary Row with UNION","Banking / Finance","Morgan Stanley","medium",
"Show each branch's total balance AND a grand total row at the bottom.\n\nReturn branch and total_balance. The summary row should have branch='TOTAL'.",
"Use UNION ALL: per-branch GROUP BY + a second SELECT for grand total.",
"Mumbai: 80000. Delhi: 120000. Bangalore: 75000. TOTAL: 275000.",
BANK_T,BANK_S,(["branch","total_balance"],[["Bangalore",75000.0],["Delhi",120000.0],["Mumbai",80000.0],["TOTAL",275000.0]]),
"SELECT branch,SUM(balance)AS total_balance FROM accounts GROUP BY branch UNION ALL SELECT 'TOTAL',SUM(balance) FROM accounts ORDER BY CASE WHEN branch='TOTAL' THEN 1 ELSE 0 END,branch;",topic="UNION ALL for Summary Rows")

add("sql-082","Same-City Customer Pairs","E-Commerce (Flipkart)","Flipkart","medium",
"Find all pairs of customers who live in the same city.\n\nReturn city, customer_a, customer_b (alphabetically). No duplicate pairs.",
"Self-join customers ON city, WHERE c1.name < c2.name.",
"Mumbai: Ankit & Sneha.",
ECOM_T,ECOM_S,(["city","customer_a","customer_b"],[["Mumbai","Ankit","Sneha"]]),
"SELECT c1.city,c1.name AS customer_a,c2.name AS customer_b FROM customers c1 JOIN customers c2 ON c1.city=c2.city AND c1.name<c2.name ORDER BY c1.city;",topic="Self-Join (Same Value Pairs)")

add("sql-083","RANK vs DENSE_RANK","Streaming (Netflix)","Oracle","hard",
"Compare RANK() and DENSE_RANK() for shows ordered by total watch time.\n\nReturn title, total_minutes, rank_val, dense_rank_val. Order by total_minutes descending.",
"If two shows tie, RANK skips next number but DENSE_RANK doesn't.",
"Money Heist(185) and Dark(165) then Stranger Things(130).",
STREAM_T,STREAM_S,(["title","total_minutes","rank_val","dense_rank_val"],[["Money Heist",185,1,1],["Dark",165,2,2],["Stranger Things",130,3,3],["Sacred Games",110,4,4],["Mirzapur",80,5,5]]),
"SELECT s.title,SUM(w.duration_min)AS total_minutes,RANK() OVER(ORDER BY SUM(w.duration_min) DESC)AS rank_val,DENSE_RANK() OVER(ORDER BY SUM(w.duration_min) DESC)AS dense_rank_val FROM shows s JOIN watch_history w ON s.id=w.show_id GROUP BY s.title ORDER BY total_minutes DESC;",topic="RANK vs DENSE_RANK")

add("sql-084","Scalar Subquery in SELECT","Food Delivery (Zomato)","Cognizant","medium",
"For each restaurant, show its rating and the overall average rating using a scalar subquery.\n\nReturn name, rating, and avg_all_rating (rounded to 1). Order by rating descending.",
"Use (SELECT ROUND(AVG(rating),1) FROM restaurants) in SELECT.",
"Each row shows the restaurant's rating alongside the global average.",
ZOMATO_T,ZOMATO_S,(["name","rating","avg_all_rating"],[["Dosa Corner",4.7,4.1],["Biryani House",4.5,4.1],["Dragon Wok",4.2,4.1],["Pizza Palace",3.8,4.1],["Burger Barn",3.5,4.1]]),
"SELECT name,rating,(SELECT ROUND(AVG(rating),1) FROM restaurants)AS avg_all_rating FROM restaurants ORDER BY rating DESC;",topic="Scalar Subquery in SELECT")

add("sql-085","Complex Date Filter: Q1 High-Value","E-Commerce (Flipkart)","Accenture","medium",
"Find delivered orders from Q1 2024 (Jan-Mar) with total > 1000.\n\nReturn order_id, order_date, total. Order by total descending.",
"WHERE status='delivered' AND order_date BETWEEN ... AND total > 1000.",
"Orders 1001(57500) and 1006(6900) qualify.",
ECOM_T,ECOM_S,(["id","order_date","total"],[[1001,"2024-01-10",57500.0],[1006,"2024-03-10",6900.0],[1002,"2024-01-15",3299.0]]),
"SELECT id,order_date,total FROM orders WHERE status='delivered' AND order_date BETWEEN '2024-01-01' AND '2024-03-31' AND total>1000 ORDER BY total DESC;",topic="Complex Date Filtering")


# ═══ BATCH 9: Final Stretch I ═══

add("sql-086","Moving Average: 2-Ride Window","Ride-Sharing (Ola)","Amazon","hard",
"For each rider, calculate a 2-ride moving average of fare (current + previous ride).\n\nReturn rider name, ride_date, fare, and moving_avg (rounded to 0). Order by rider name, ride_date.",
"Use AVG(fare) OVER (PARTITION BY rider_id ORDER BY ride_date ROWS BETWEEN 1 PRECEDING AND CURRENT ROW).",
"Aarav: Jan10→250, Jan12→(250+180)/2=215, Feb01→(180+200)/2=190...",
RIDE_T,RIDE_S,(["name","ride_date","fare","moving_avg"],[["Aarav","2024-01-10",250.0,250],["Aarav","2024-01-12",180.0,215],["Aarav","2024-02-01",200.0,190],["Aarav","2024-03-05",220.0,210],["Bhavna","2024-01-15",320.0,320],["Bhavna","2024-02-10",280.0,300],["Chirag","2024-01-20",400.0,400],["Chirag","2024-03-01",350.0,375],["Diya","2024-02-05",550.0,550],["Eshan","2024-02-15",150.0,150]]),
"SELECT r2.name,r.ride_date,r.fare,ROUND(AVG(r.fare) OVER(PARTITION BY r.rider_id ORDER BY r.ride_date ROWS BETWEEN 1 PRECEDING AND CURRENT ROW))AS moving_avg FROM rides r JOIN riders r2 ON r.rider_id=r2.id ORDER BY r2.name,r.ride_date;",topic="Moving Average Window")

add("sql-087","COALESCE: Multi-Fallback","Healthcare / Hospital","Wipro","easy",
"Show each patient's diagnosis. If NULL, show 'Under Observation'.\n\nReturn patient name, diagnosis_display. Order by name.",
"Use COALESCE(diagnosis, 'Under Observation').",
"All patients in this dataset have diagnoses, so COALESCE acts as a safety net.",
HOSPITAL_T,HOSPITAL_S,(["name","diagnosis_display"],[["Amit","Diabetes"],["Neha","Fracture"],["Priya","Fever"],["Raj","Cold"],["Sunita","Allergy"]]),
"SELECT name,COALESCE(diagnosis,'Under Observation')AS diagnosis_display FROM patients ORDER BY name;",topic="COALESCE Multi-Fallback")

add("sql-088","Nested 3-Level Subquery","University / Education","TCS NQT","hard",
"Find student names who got grade 'A' in courses taught in the 'CSE' department.\n\nReturn student name, ordered alphabetically.",
"3-level nesting: students → enrollments → courses WHERE dept='CSE'.",
"CSE courses (101,103). Grade A in CSE: Ravi(101), Nikhil(103), Arjun(101).",
UNI_T,UNI_S,(["name"],[["Arjun"],["Nikhil"],["Ravi"]]),
"SELECT s.name FROM students s WHERE s.id IN(SELECT e.student_id FROM enrollments e WHERE e.grade='A' AND e.course_id IN(SELECT c.id FROM courses c WHERE c.department='CSE'))ORDER BY s.name;",topic="Nested 3-Level Subquery")

add("sql-089","Anti-Join: Riders Without Rides","Ride-Sharing (Ola)","Razorpay","medium",
"Using LEFT JOIN + WHERE NULL pattern, find riders who have no completed rides.\n\nReturn rider name.",
"LEFT JOIN riders to rides WHERE rides.id IS NULL.",
"All riders have at least one ride, so result is empty.",
RIDE_T,RIDE_S,(["name"],[]),
"SELECT r2.name FROM riders r2 LEFT JOIN rides r ON r2.id=r.rider_id AND r.status='completed' WHERE r.id IS NULL;",topic="Anti-Join Pattern")

add("sql-090","GROUP BY Expression: Order Month","E-Commerce (Flipkart)","Salesforce","medium",
"Group orders by month name and show total revenue per month.\n\nReturn month_name and monthly_revenue. Order by revenue descending.",
"Use strftime('%m', order_date) to extract month, CASE to name it.",
"January: 57500+3299=60799. February: 799+55450+2500=58749. March: 6900+450=7350.",
ECOM_T,ECOM_S,(["month_name","monthly_revenue"],[["January",60799.0],["February",58749.0],["March",7350.0]]),
"SELECT CASE strftime('%m',order_date) WHEN '01' THEN 'January' WHEN '02' THEN 'February' WHEN '03' THEN 'March' END AS month_name,SUM(total)AS monthly_revenue FROM orders GROUP BY strftime('%m',order_date) ORDER BY monthly_revenue DESC;",topic="GROUP BY with Expression")

add("sql-091","Running Percentage of Total","Social Media (Instagram)","Adobe","hard",
"Show each post's likes as a running percentage of total likes across all posts.\n\nReturn content, likes, and running_pct (rounded to 1). Order by likes descending.",
"SUM(likes) OVER (ORDER BY likes DESC) / total * 100.",
"Deployed to production!(95)=21.9%, then cumulative grows...",
SOCIAL_T,SOCIAL_S,(["content","likes","running_pct"],[["Deployed to production!",95,21.9],["My first open source PR!",88,42.2],["SQL window functions",71,58.5],["Python vs JavaScript",56,71.4],["SQL is amazing",42,81.1],["Deep learning notes",33,88.7],["Learning React today!",25,94.5],["Built a REST API",15,100.0]]),
"SELECT content,likes,ROUND(SUM(likes) OVER(ORDER BY likes DESC)*100.0/(SELECT SUM(likes) FROM posts),1)AS running_pct FROM posts ORDER BY likes DESC;",topic="Running Percentage Window")

add("sql-092","Multiple GROUP BY Columns","Ride-Sharing (Ola)","Freshworks","medium",
"Count rides grouped by both driver city and ride status.\n\nReturn city, status, and ride_count. Order by city, status.",
"GROUP BY d.city, r.status.",
"Breakdown per city per status.",
RIDE_T,RIDE_S,(["city","status","ride_count"],[["Bangalore","completed",1],["Chennai","completed",1],["Delhi","cancelled",1],["Delhi","completed",1],["Mumbai","completed",6]]),
"SELECT d.city,r.status,COUNT(*)AS ride_count FROM rides r JOIN drivers d ON r.driver_id=d.id GROUP BY d.city,r.status ORDER BY d.city,r.status;",topic="Multiple GROUP BY Columns")

add("sql-093","CASE in WHERE Clause","Food Delivery (Zomato)","Swiggy","medium",
"Find restaurants that are considered 'premium' (rating >= 4.5) OR have the cuisine 'Chinese'.\n\nReturn name, cuisine, rating. Order by rating descending.",
"WHERE (rating >= 4.5) OR (cuisine = 'Chinese').",
"Dosa Corner(4.7), Biryani House(4.5), Dragon Wok(Chinese,4.2).",
ZOMATO_T,ZOMATO_S,(["name","cuisine","rating"],[["Dosa Corner","South Indian",4.7],["Biryani House","Indian",4.5],["Dragon Wok","Chinese",4.2]]),
"SELECT name,cuisine,rating FROM restaurants WHERE rating>=4.5 OR cuisine='Chinese' ORDER BY rating DESC;",topic="Conditional WHERE Filtering")

add("sql-094","Simulated UPDATE: Salary Hike","HR / Employee","Accenture","medium",
"Show what each employee's salary would be after a 10% hike for Engineering dept and 5% for others.\n\nReturn name, department, current_salary, new_salary. Order by new_salary descending.",
"Use CASE WHEN department='Engineering' THEN salary*1.10 ELSE salary*1.05.",
"Engineering gets 10% bump, others 5%.",
EMP_T,EMP_S,(["name","department","current_salary","new_salary"],[["Alice","Engineering",70000,77000.0],["Eve","Engineering",65000,71500.0],["Bob","Marketing",60000,63000.0],["Charlie","Engineering",55000,60500.0],["Diana","Marketing",50000,52500.0],["Frank","Sales",45000,47250.0]]),
"SELECT name,department,salary AS current_salary,CASE WHEN department='Engineering' THEN ROUND(salary*1.10) ELSE ROUND(salary*1.05) END AS new_salary FROM employees ORDER BY new_salary DESC;",topic="Simulated UPDATE with CASE")

add("sql-095","CTE + Window Combo: Ranked Monthly Revenue","E-Commerce (Flipkart)","Microsoft","hard",
"Using a CTE to calculate monthly revenue, then rank months by revenue.\n\nReturn month_num, monthly_revenue, and revenue_rank.",
"WITH monthly AS (...GROUP BY month), SELECT with DENSE_RANK().",
"January is #1, February #2, March #3.",
ECOM_T,ECOM_S,(["month_num","monthly_revenue","revenue_rank"],[["01",60799.0,1],["02",58749.0,2],["03",7350.0,3]]),
"WITH monthly AS(SELECT strftime('%m',order_date)AS month_num,SUM(total)AS monthly_revenue FROM orders GROUP BY strftime('%m',order_date))SELECT month_num,monthly_revenue,DENSE_RANK() OVER(ORDER BY monthly_revenue DESC)AS revenue_rank FROM monthly;",topic="CTE + Window Combo")

# ═══ BATCH 10: CAPSTONE (Final 5 — Boss Level) ═══

add("sql-096","Full Analytics: Driver Scorecard","Ride-Sharing (Ola)","Google","hard",
"Build a driver scorecard: for each driver show name, city, total completed rides, total earnings, average fare (rounded), their city rank by earnings, and whether they are 'Top Earner' (rank 1) or 'Regular'.\n\nReturn name, city, rides, earnings, avg_fare, city_rank, badge. Order by city, city_rank.",
"CTE for stats, DENSE_RANK per city, CASE for badge.",
"Ramesh is top in Mumbai, Kavita top in Delhi, etc.",
RIDE_T,RIDE_S,(["name","city","rides","earnings","avg_fare","city_rank","badge"],[["Mohan","Bangalore",1,550.0,550,1,"Top Earner"],["Lakshmi","Chennai",1,150.0,150,1,"Top Earner"],["Kavita","Delhi",1,600.0,600,1,"Top Earner"],["Ramesh","Mumbai",4,1070.0,268,1,"Top Earner"],["Sunil","Mumbai",2,530.0,265,2,"Regular"]]),
"WITH stats AS(SELECT d.name,d.city,COUNT(*)AS rides,SUM(r.fare)AS earnings,ROUND(AVG(r.fare))AS avg_fare FROM drivers d JOIN rides r ON d.id=r.driver_id WHERE r.status='completed' GROUP BY d.id),ranked AS(SELECT *,DENSE_RANK() OVER(PARTITION BY city ORDER BY earnings DESC)AS city_rank FROM stats)SELECT name,city,rides,earnings,avg_fare,city_rank,CASE WHEN city_rank=1 THEN 'Top Earner' ELSE 'Regular' END AS badge FROM ranked ORDER BY city,city_rank;",topic="Full Analytics Report")

add("sql-097","Repeat Buyers: Customer Cohort","E-Commerce (Flipkart)","Amazon","hard",
"Classify customers into cohorts: 'One-Timer' (1 order), 'Repeat' (2-3 orders), 'Loyal' (4+ orders). Exclude cancelled.\n\nReturn cohort and customer_count. Order by customer_count descending.",
"CTE counts orders per customer, CASE classifies, outer GROUP BY.",
"One-Timer: Rohan,Sneha,Vikram=3. Repeat: Ankit(2),Priya(1 non-cancelled)=2. Loyal: 0.",
ECOM_T,ECOM_S,(["cohort","customer_count"],[["One-Timer",4],["Repeat",1]]),
"WITH order_counts AS(SELECT customer_id,COUNT(*)AS cnt FROM orders WHERE status!='cancelled' GROUP BY customer_id),cohorts AS(SELECT CASE WHEN cnt>=4 THEN 'Loyal' WHEN cnt>=2 THEN 'Repeat' ELSE 'One-Timer' END AS cohort FROM order_counts)SELECT cohort,COUNT(*)AS customer_count FROM cohorts GROUP BY cohort ORDER BY customer_count DESC;",topic="Cohort Analysis")

add("sql-098","Top-2 Posts Per User (With Ties)","Social Media (Instagram)","Meta","hard",
"Find each user's top 2 most-liked posts, keeping ties.\n\nReturn username, content, likes, and post_rank. Order by username, post_rank.",
"Use DENSE_RANK per user by likes DESC, filter <=2.",
"ankit_dev: Deployed(95,rank1), SQL is amazing(42,rank2). priya_codes: Open source(88,rank1), Python vs JS(56,rank2).",
SOCIAL_T,SOCIAL_S,(["username","content","likes","post_rank"],[["ankit_dev","Deployed to production!",95,1],["ankit_dev","SQL is amazing",42,2],["priya_codes","My first open source PR!",88,1],["priya_codes","Python vs JavaScript",56,2],["rohan_js","Built a REST API",15,1],["sneha_ml","Deep learning notes",33,1],["vikram_sql","SQL window functions",71,1]]),
"SELECT username,content,likes,post_rank FROM(SELECT pr.username,p.content,p.likes,DENSE_RANK() OVER(PARTITION BY p.user_id ORDER BY p.likes DESC)AS post_rank FROM posts p JOIN profiles pr ON p.user_id=pr.id)WHERE post_rank<=2 ORDER BY username,post_rank;",topic="Top-N Per Group with Ties")

add("sql-099","Cross-Domain: Riders Who Are Customers","Ride-Sharing (Ola)","Flipkart","hard",
"Find people whose name appears in BOTH the riders table (Ride-Sharing) AND the customers table (E-Commerce) by matching on name.\n\nReturn name and both their city from riders and city from customers.",
"JOIN riders r ON r.name = customers c.name — cross-schema name match.",
"No names match between the two schemas, so result is empty.",
RIDE_T,RIDE_S,(["name"],[]),
"SELECT r.name FROM riders r WHERE r.name IN(SELECT c.name FROM customers c);",topic="Cross-Schema Matching")

add("sql-100","Grand Pipeline: Complete E-Commerce Report","E-Commerce (Flipkart)","Goldman Sachs","hard",
"Build a complete business report using a multi-CTE pipeline:\n1. Calculate per-customer stats (orders, spending)\n2. Rank customers by spending\n3. Add their most-bought category\n\nReturn name, total_orders, total_spent, spending_rank, top_category. Order by spending_rank.",
"3 CTEs chained: customer_stats → ranked → top_categories, final JOIN.",
"Ankit: 2 orders, 58299 spent, rank 1, top category Electronics.",
ECOM_T,ECOM_S,(["name","total_orders","total_spent","spending_rank","top_category"],[["Ankit",2,58299.0,1,"Electronics"],["Rohan",1,55450.0,2,"Electronics"],["Sneha",1,6900.0,3,"Fashion"],["Priya",1,3299.0,4,"Electronics"],["Vikram",1,450.0,5,"Books"]]),
"WITH customer_stats AS(SELECT c.id,c.name,COUNT(*)AS total_orders,SUM(o.total)AS total_spent FROM customers c JOIN orders o ON c.id=o.customer_id WHERE o.status!='cancelled' GROUP BY c.id),ranked AS(SELECT *,DENSE_RANK() OVER(ORDER BY total_spent DESC)AS spending_rank FROM customer_stats),top_cat AS(SELECT o.customer_id,p.category,SUM(oi.qty)AS cat_qty,ROW_NUMBER() OVER(PARTITION BY o.customer_id ORDER BY SUM(oi.qty) DESC)AS rn FROM orders o JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id WHERE o.status!='cancelled' GROUP BY o.customer_id,p.category)SELECT r.name,r.total_orders,r.total_spent,r.spending_rank,tc.category AS top_category FROM ranked r LEFT JOIN top_cat tc ON r.id=tc.customer_id AND tc.rn=1 ORDER BY r.spending_rank;",topic="Multi-CTE Pipeline (Capstone)")

# Write output
out = r'c:\AcadMix\frontend\src\data\sql_problems.json'
with open(out, 'w') as f:
    json.dump(P, f, indent=2, default=str)
print(f"Done: Generated {len(P)} problems")


