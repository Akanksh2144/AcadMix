#!/usr/bin/env python3
"""Generate sql_problems.json with 15 premium problems across real-world themes."""
import json, os

P = []
def add(id,title,theme,company,diff,stmt,hint,expl,tables,schema,expected,solution,topic="Miscellaneous",backend_only=False):
    entry = {"id":id,"title":title,"dataset_theme":theme,"company_tag":company,"difficulty":diff,
              "topic":topic,"problem_statement":stmt,"hint":hint,"explanation":expl,"tables_meta":tables,
              "example_output":{"columns":expected[0],"rows":expected[1]},
              "schema_sql":schema,"expected_output":[{"columns":expected[0],"values":expected[1]}],
              "solution_sql":solution}
    if backend_only:
        entry["backend_only"] = True
    P.append(entry)

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

add("sql-099","Riders Who Are Also Drivers (Name Match)","Ride-Sharing (Ola)","Flipkart","hard",
"Find people whose name appears in BOTH the riders table AND the drivers table.\n\nReturn name.",
"Use INTERSECT or IN subquery to find overlapping names.",
"No names overlap between riders and drivers.",
RIDE_T,RIDE_S,(["name"],[]),
"SELECT r.name FROM riders r WHERE r.name IN(SELECT d.name FROM drivers d);",topic="Cross-Table Name Matching")

add("sql-100","Grand Pipeline: Complete E-Commerce Report","E-Commerce (Flipkart)","Goldman Sachs","hard",
"Build a complete business report using a multi-CTE pipeline:\n1. Calculate per-customer stats (orders, spending)\n2. Rank customers by spending\n3. Add their most-bought category\n\nReturn name, total_orders, total_spent, spending_rank, top_category. Order by spending_rank.",
"3 CTEs chained: customer_stats → ranked → top_categories, final JOIN.",
"Ankit: 2 orders, 58299 spent, rank 1, top category Electronics.",
ECOM_T,ECOM_S,(["name","total_orders","total_spent","spending_rank","top_category"],[["Ankit",2,58299.0,1,"Electronics"],["Rohan",1,55450.0,2,"Electronics"],["Sneha",1,6900.0,3,"Fashion"],["Priya",1,3299.0,4,"Electronics"],["Vikram",1,450.0,5,"Books"]]),
"WITH customer_stats AS(SELECT c.id,c.name,COUNT(*)AS total_orders,SUM(o.total)AS total_spent FROM customers c JOIN orders o ON c.id=o.customer_id WHERE o.status!='cancelled' GROUP BY c.id),ranked AS(SELECT *,DENSE_RANK() OVER(ORDER BY total_spent DESC)AS spending_rank FROM customer_stats),top_cat AS(SELECT o.customer_id,p.category,SUM(oi.qty)AS cat_qty,ROW_NUMBER() OVER(PARTITION BY o.customer_id ORDER BY SUM(oi.qty) DESC)AS rn FROM orders o JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id WHERE o.status!='cancelled' GROUP BY o.customer_id,p.category)SELECT r.name,r.total_orders,r.total_spent,r.spending_rank,tc.category AS top_category FROM ranked r LEFT JOIN top_cat tc ON r.id=tc.customer_id AND tc.rn=1 ORDER BY r.spending_rank;",topic="Multi-CTE Pipeline (Capstone)")

# ═══ NEW SCHEMA: Login / Activity Tracking ═══

LOGIN_S = """CREATE TABLE users(id INT PRIMARY KEY,name VARCHAR,email VARCHAR,signup_date DATE);
CREATE TABLE logins(id INT PRIMARY KEY,user_id INT,login_date DATE);
INSERT INTO users VALUES(1,'Aarav','aarav@gmail.com','2023-01-01');
INSERT INTO users VALUES(2,'Bhavna','bhavna@gmail.com','2023-02-15');
INSERT INTO users VALUES(3,'Chirag','chirag@gmail.com','2023-03-01');
INSERT INTO users VALUES(4,'Diya','diya@gmail.com','2023-06-10');
INSERT INTO users VALUES(5,'Eshan','eshan@gmail.com','2023-09-01');
INSERT INTO logins VALUES(1,1,'2024-01-10');
INSERT INTO logins VALUES(2,1,'2024-01-11');
INSERT INTO logins VALUES(3,1,'2024-01-12');
INSERT INTO logins VALUES(4,1,'2024-01-15');
INSERT INTO logins VALUES(5,2,'2024-01-10');
INSERT INTO logins VALUES(6,2,'2024-01-12');
INSERT INTO logins VALUES(7,2,'2024-01-13');
INSERT INTO logins VALUES(8,3,'2024-01-10');
INSERT INTO logins VALUES(9,3,'2024-01-11');
INSERT INTO logins VALUES(10,3,'2024-01-12');
INSERT INTO logins VALUES(11,3,'2024-01-13');
INSERT INTO logins VALUES(12,3,'2024-01-14');
INSERT INTO logins VALUES(13,4,'2024-01-10');
INSERT INTO logins VALUES(14,4,'2024-01-20');
INSERT INTO logins VALUES(15,5,'2024-01-10');
INSERT INTO logins VALUES(16,5,'2024-01-11');
INSERT INTO logins VALUES(17,5,'2024-01-12');
INSERT INTO logins VALUES(18,5,'2024-01-13');"""
LOGIN_T = [{"name":"users","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"email","type":"varchar"},{"name":"signup_date","type":"date"}],
"sample_input":[[1,"Aarav","aarav@gmail.com","2023-01-01"],[2,"Bhavna","bhavna@gmail.com","2023-02-15"],[3,"Chirag","chirag@gmail.com","2023-03-01"],[4,"Diya","diya@gmail.com","2023-06-10"],[5,"Eshan","eshan@gmail.com","2023-09-01"]]},
{"name":"logins","columns":[{"name":"id","type":"int"},{"name":"user_id","type":"int"},{"name":"login_date","type":"date"}],
"sample_input":[[1,1,"2024-01-10"],[2,1,"2024-01-11"],[3,1,"2024-01-12"],[4,1,"2024-01-15"],[5,2,"2024-01-10"],[6,2,"2024-01-12"],[7,2,"2024-01-13"],[8,3,"2024-01-10"],[9,3,"2024-01-11"],[10,3,"2024-01-12"]]}]

# ═══ BATCH 11: CRITICAL GAPS — LeetCode Classics + Gaps & Islands ═══

add("sql-101","Nth Highest Salary (N=3)","HR / Employee","TCS NQT","medium",
"Find the 3rd highest salary from the employees table. If fewer than 3 distinct salaries exist, return NULL.\n\nReturn third_highest_salary.",
"Use DENSE_RANK or LIMIT/OFFSET with DISTINCT.",
"Salaries: 70K,65K,60K,55K,50K,45K. 3rd highest = 60000.",
EMP_T,EMP_S,(["third_highest_salary"],[[60000]]),
"SELECT DISTINCT salary AS third_highest_salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2;",topic="Nth Highest Salary")

add("sql-102","Second Highest Salary (LC #176)","HR / Employee","Infosys","easy",
"Find the second highest distinct salary. Return NULL if only one distinct salary exists.\n\nReturn second_highest.",
"Use DENSE_RANK() or LIMIT 1 OFFSET 1.",
"Second highest = 65000 (Eve).",
EMP_T,EMP_S,(["second_highest"],[[65000]]),
"SELECT MAX(salary)AS second_highest FROM employees WHERE salary<(SELECT MAX(salary) FROM employees);",topic="Second Highest Salary")

add("sql-103","Employee Earns More Than Manager (LC #181)","HR / Employee","Microsoft","easy",
"Given that employees have a manager_id, find employees who earn more than their manager. Since our schema doesn't have manager_id, use departments: find employees who earn more than the average of their department.\n\nReturn name, salary, department, dept_avg (rounded). Order by salary descending.",
"Self-referencing comparison: salary vs department average.",
"Alice(70K) vs Engineering avg(63333)=above. Eve(65K)=above. Bob(60K) vs Marketing avg(55K)=above.",
EMP_T,EMP_S,(["name","salary","department","dept_avg"],[["Alice",70000,"Engineering",63333],["Eve",65000,"Engineering",63333],["Bob",60000,"Marketing",55000]]),
"SELECT e.name,e.salary,e.department,ROUND(dept.avg_sal)AS dept_avg FROM employees e JOIN(SELECT department,AVG(salary)AS avg_sal FROM employees GROUP BY department)dept ON e.department=dept.department WHERE e.salary>dept.avg_sal ORDER BY e.salary DESC;",topic="Employee vs Department Average")

add("sql-104","Restaurants With No Orders (LC #183 Pattern)","Food Delivery (Zomato)","Amazon","easy",
"Find restaurants that have never received an order.\n\nReturn restaurant name.",
"LEFT JOIN restaurants to orders WHERE order is NULL, or NOT EXISTS.",
"All restaurants have orders except... let's check.",
ZOMATO_T,ZOMATO_S,(["name"],[]),
"SELECT r.name FROM restaurants r LEFT JOIN orders o ON r.id=o.rest_id WHERE o.id IS NULL;",topic="LEFT JOIN Anti-Pattern")

add("sql-105","Consecutive Numbers (LC #180)","Social Media (Instagram)","Google","hard",
"Find users who posted on at least 3 consecutive days.\n\nReturn distinct username.",
"Use LAG/LEAD to check consecutive dates, or row_number gap technique.",
"Aarav: Jan10,11,12(3 consecutive✓). Chirag: not posting on consecutive days.",
LOGIN_T,LOGIN_S,(["name"],[["Aarav"],["Chirag"],["Eshan"]]),
"WITH dated AS(SELECT user_id,login_date,JULIANDAY(login_date)-ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY login_date)AS grp FROM(SELECT DISTINCT user_id,login_date FROM logins)),streaks AS(SELECT user_id,grp,COUNT(*)AS streak FROM dated GROUP BY user_id,grp HAVING COUNT(*)>=3)SELECT DISTINCT u.name FROM streaks s JOIN users u ON s.user_id=u.id ORDER BY u.name;",topic="Gaps & Islands: Consecutive Days")

add("sql-106","Month-over-Month Revenue Growth","E-Commerce (Flipkart)","Goldman Sachs","hard",
"Calculate MoM revenue growth percentage.\n\nReturn month_num, revenue, prev_month_revenue, and growth_pct (rounded to 1). Order by month_num.",
"Use LAG(revenue) OVER (ORDER BY month) to get previous month, then (current-prev)/prev*100.",
"Jan→Feb: (58749-60799)/60799*100 = -3.4%. Feb→Mar: (7350-58749)/58749 = -87.5%.",
ECOM_T,ECOM_S,(["month_num","revenue","prev_month_revenue","growth_pct"],[["01",60799.0,None,None],["02",58749.0,60799.0,-3.4],["03",7350.0,58749.0,-87.5]]),
"WITH monthly AS(SELECT strftime('%m',order_date)AS month_num,SUM(total)AS revenue FROM orders GROUP BY strftime('%m',order_date))SELECT month_num,revenue,LAG(revenue) OVER(ORDER BY month_num)AS prev_month_revenue,ROUND((revenue-LAG(revenue) OVER(ORDER BY month_num))*100.0/LAG(revenue) OVER(ORDER BY month_num),1)AS growth_pct FROM monthly ORDER BY month_num;",topic="Month-over-Month Growth")

add("sql-107","Exchange Seat IDs (LC #626)","University / Education","Meta","medium",
"Swap adjacent student seat IDs: student in seat 1↔2, 3↔4, etc. If odd total, last student stays.\n\nReturn student id (swapped) and name. Order by new id.",
"Use CASE: if id is odd and not last, id+1. If even, id-1. If odd and last, keep id.",
"Swap adjacent rows using modular arithmetic.",
UNI_T,UNI_S,(["new_id","name"],[[1,"Kavya"],[2,"Arjun"],[3,"Nikhil"],[4,"Meera"],[5,"Ravi"]]),
"SELECT CASE WHEN id%2=1 AND id=(SELECT MAX(id) FROM students) THEN id WHEN id%2=1 THEN id+1 ELSE id-1 END AS new_id,name FROM students ORDER BY new_id;",topic="Row Swapping (CASE + MOD)")

add("sql-108","Department Top 3 Salaries (LC #185)","HR / Employee","Amazon","hard",
"Find the top 3 earners in each department. Include ties.\n\nReturn department, name, salary. Order by department, salary descending.",
"DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) <= 3.",
"Engineering: Alice(70K), Eve(65K), Charlie(55K). Marketing: Bob(60K), Diana(50K). Sales: Frank(45K).",
EMP_T,EMP_S,(["department","name","salary"],[["Engineering","Alice",70000],["Engineering","Eve",65000],["Engineering","Charlie",55000],["Marketing","Bob",60000],["Marketing","Diana",50000],["Sales","Frank",45000]]),
"SELECT department,name,salary FROM(SELECT department,name,salary,DENSE_RANK() OVER(PARTITION BY department ORDER BY salary DESC)AS rn FROM employees)WHERE rn<=3 ORDER BY department,salary DESC;",topic="Top-N Per Department")

add("sql-109","Delete Duplicate Emails (Keep Lowest ID)","HR / Employee","Wipro","medium",
"Show which employee records to KEEP if we had duplicates — keep the row with the lowest ID per department.\n\nReturn the employee id and name that would be kept (first employee per department). Order by id.",
"ROW_NUMBER() OVER (PARTITION BY department ORDER BY id) = 1.",
"Engineering first=Alice(1). Marketing first=Bob(2). Sales first=Frank(6).",
EMP_T,EMP_S,(["id","name","department"],[[1,"Alice","Engineering"],[2,"Bob","Marketing"],[6,"Frank","Sales"]]),
"SELECT id,name,department FROM(SELECT id,name,department,ROW_NUMBER() OVER(PARTITION BY department ORDER BY id)AS rn FROM employees)WHERE rn=1 ORDER BY id;",topic="Deduplication (Keep First)")

add("sql-110","DAU over MAU Ratio","Social Media (Instagram)","Meta","hard",
"Calculate the Daily Active Users to Monthly Active Users ratio for January 2024. DAU = average distinct daily users. MAU = total distinct users in the month.\n\nReturn dau_avg (rounded to 1), mau, and dau_mau_ratio (rounded to 2).",
"DAU = COUNT(DISTINCT user_id) per day averaged. MAU = COUNT(DISTINCT user_id) for the month.",
"MAU=5. Daily counts vary. DAU avg = total daily uniques / num days.",
LOGIN_T,LOGIN_S,(["dau_avg","mau","dau_mau_ratio"],[[3.2,5,0.64]]),
"WITH daily AS(SELECT login_date,COUNT(DISTINCT user_id)AS dau FROM logins WHERE login_date BETWEEN '2024-01-01' AND '2024-01-31' GROUP BY login_date),monthly AS(SELECT COUNT(DISTINCT user_id)AS mau FROM logins WHERE login_date BETWEEN '2024-01-01' AND '2024-01-31')SELECT ROUND(AVG(d.dau),1)AS dau_avg,m.mau,ROUND(AVG(d.dau)*1.0/m.mau,2)AS dau_mau_ratio FROM daily d,monthly m;",topic="DAU / MAU Ratio")

# ═══ NEW SCHEMA: Payments / Transactions ═══

PAY_S = """CREATE TABLE pay_users(id INT PRIMARY KEY,name VARCHAR,city VARCHAR,signup_date DATE);
CREATE TABLE payments(id INT PRIMARY KEY,user_id INT,amount REAL,method VARCHAR,status VARCHAR,pay_date DATE);
INSERT INTO pay_users VALUES(1,'Aarav','Mumbai','2023-01-01');
INSERT INTO pay_users VALUES(2,'Bhavna','Delhi','2023-03-15');
INSERT INTO pay_users VALUES(3,'Chirag','Bangalore','2023-06-01');
INSERT INTO pay_users VALUES(4,'Diya','Chennai','2023-09-10');
INSERT INTO pay_users VALUES(5,'Eshan','Mumbai','2024-01-01');
INSERT INTO payments VALUES(1,1,500,'UPI','success','2024-01-10');
INSERT INTO payments VALUES(2,1,1200,'card','success','2024-01-15');
INSERT INTO payments VALUES(3,2,300,'UPI','failed','2024-01-12');
INSERT INTO payments VALUES(4,2,800,'UPI','success','2024-01-13');
INSERT INTO payments VALUES(5,3,2500,'card','success','2024-01-20');
INSERT INTO payments VALUES(6,3,100,'wallet','failed','2024-01-22');
INSERT INTO payments VALUES(7,3,100,'wallet','success','2024-01-22');
INSERT INTO payments VALUES(8,4,5000,'card','success','2024-02-01');
INSERT INTO payments VALUES(9,4,200,'UPI','failed','2024-02-05');
INSERT INTO payments VALUES(10,1,700,'UPI','success','2024-02-10');
INSERT INTO payments VALUES(11,2,1500,'card','success','2024-02-15');
INSERT INTO payments VALUES(12,5,350,'UPI','success','2024-03-01');
INSERT INTO payments VALUES(13,1,900,'wallet','success','2024-03-05');
INSERT INTO payments VALUES(14,3,3000,'card','failed','2024-03-10');"""
PAY_T = [{"name":"pay_users","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"city","type":"varchar"},{"name":"signup_date","type":"date"}],
"sample_input":[[1,"Aarav","Mumbai","2023-01-01"],[2,"Bhavna","Delhi","2023-03-15"],[3,"Chirag","Bangalore","2023-06-01"],[4,"Diya","Chennai","2023-09-10"],[5,"Eshan","Mumbai","2024-01-01"]]},
{"name":"payments","columns":[{"name":"id","type":"int"},{"name":"user_id","type":"int"},{"name":"amount","type":"real"},{"name":"method","type":"varchar"},{"name":"status","type":"varchar"},{"name":"pay_date","type":"date"}],
"sample_input":[[1,1,500,"UPI","success","2024-01-10"],[2,1,1200,"card","success","2024-01-15"],[3,2,300,"UPI","failed","2024-01-12"],[4,2,800,"UPI","success","2024-01-13"],[5,3,2500,"card","success","2024-01-20"]]}]

# ═══ BATCH 12: Startups + Funnel/Churn/Retention ═══

add("sql-111","Funnel: Cart to Purchase","E-Commerce (Flipkart)","Flipkart","hard",
"Simulate a conversion funnel. From the orders table, count orders by status to show: total_orders, delivered (purchased), shipped (in progress), cancelled (dropped).\n\nReturn stage, count, and conversion_pct (relative to total, rounded to 1).",
"Use COUNT(*) for total, then CASE WHEN for each stage.",
"Total=7. Delivered=5(71.4%). Shipped=1(14.3%). Cancelled=1(14.3%).",
ECOM_T,ECOM_S,(["stage","cnt","conversion_pct"],[["Total",7,100.0],["Delivered",5,71.4],["Shipped",1,14.3],["Cancelled",1,14.3]]),
"SELECT 'Total' AS stage,COUNT(*)AS cnt,100.0 AS conversion_pct FROM orders UNION ALL SELECT status,COUNT(*),ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM orders),1) FROM orders GROUP BY status ORDER BY cnt DESC;",topic="Funnel / Conversion Analysis")

add("sql-112","Customer Churn: No Order in 30+ Days","E-Commerce (Flipkart)","Flipkart","hard",
"Find customers whose last order was more than 30 days before the most recent order date in the system (2024-03-15).\n\nReturn name, last_order_date, days_since. Order by days_since descending.",
"MAX(order_date) per customer, then JULIANDAY diff from system max.",
"Priya last ordered Feb 05 = 39 days. Diya never ordered via this schema.",
ECOM_T,ECOM_S,(["name","last_order_date","days_since"],[["Priya","2024-02-05",39],["Ankit","2024-01-15",60]]),
"WITH last_orders AS(SELECT c.name,MAX(o.order_date)AS last_order_date FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.id),max_date AS(SELECT MAX(order_date)AS md FROM orders)SELECT lo.name,lo.last_order_date,CAST(JULIANDAY(mx.md)-JULIANDAY(lo.last_order_date) AS INT)AS days_since FROM last_orders lo,max_date mx WHERE JULIANDAY(mx.md)-JULIANDAY(lo.last_order_date)>30 ORDER BY days_since DESC;",topic="Customer Churn Detection")

add("sql-113","User's First Transaction","Payments (Paytm)","Paytm","medium",
"Find each user's first successful payment.\n\nReturn user name, first_pay_date, amount, method. Order by first_pay_date.",
"ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY pay_date) = 1, filter success.",
"Aarav's first success: Jan 10, 500, UPI.",
PAY_T,PAY_S,(["name","first_pay_date","amount","method"],[["Aarav","2024-01-10",500.0,"UPI"],["Bhavna","2024-01-13",800.0,"UPI"],["Chirag","2024-01-20",2500.0,"card"],["Diya","2024-02-01",5000.0,"card"],["Eshan","2024-03-01",350.0,"UPI"]]),
"SELECT u.name,p.pay_date AS first_pay_date,p.amount,p.method FROM(SELECT *,ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY pay_date)AS rn FROM payments WHERE status='success')p JOIN pay_users u ON p.user_id=u.id WHERE p.rn=1 ORDER BY first_pay_date;",topic="First Transaction per User")

add("sql-114","Failed Transactions by Payment Method","Payments (Paytm)","Razorpay","medium",
"Count total and failed transactions per payment method. Calculate failure rate.\n\nReturn method, total_txns, failed_txns, failure_rate_pct (rounded to 1). Order by failure_rate descending.",
"GROUP BY method, conditional COUNT for failures.",
"UPI: 6 total, 1 failed = 16.7%. Card: 5 total, 1 failed = 20%. Wallet: 3 total, 1 failed = 33.3%.",
PAY_T,PAY_S,(["method","total_txns","failed_txns","failure_rate_pct"],[["wallet",3,1,33.3],["card",5,1,20.0],["UPI",6,1,16.7]]),
"SELECT method,COUNT(*)AS total_txns,SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END)AS failed_txns,ROUND(SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END)*100.0/COUNT(*),1)AS failure_rate_pct FROM payments GROUP BY method ORDER BY failure_rate_pct DESC;",topic="Failure Rate by Category")

add("sql-115","Peak Order Hours","Food Delivery (Zomato)","Swiggy","easy",
"Find which hour of the day has the most orders. Since our orders use dates not times, find the day with the most orders.\n\nReturn order_date and order_count. Show only the busiest day.",
"GROUP BY date, ORDER BY count DESC, LIMIT 1.",
"Multiple orders on the busiest day.",
ZOMATO_T,ZOMATO_S,(["order_date","order_count"],[["2024-01-15",2]]),
"SELECT order_date,COUNT(*)AS order_count FROM orders GROUP BY order_date ORDER BY order_count DESC LIMIT 1;",topic="Peak Activity Detection")

add("sql-116","Rolling 3-Payment Average","Payments (Paytm)","PhonePe","hard",
"For each successful payment by Aarav (user_id=1), show a rolling average of the last 3 payments.\n\nReturn pay_date, amount, and rolling_avg (rounded to 0). Order by pay_date.",
"AVG(amount) OVER (ORDER BY pay_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW).",
"Jan10:500→500. Jan15:1200→(500+1200)/2=850. Feb10:700→(500+1200+700)/3=800. Mar05:900→(1200+700+900)/3=933.",
PAY_T,PAY_S,(["pay_date","amount","rolling_avg"],[["2024-01-10",500.0,500],["2024-01-15",1200.0,850],["2024-02-10",700.0,800],["2024-03-05",900.0,933]]),
"SELECT pay_date,amount,ROUND(AVG(amount) OVER(ORDER BY pay_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW))AS rolling_avg FROM payments WHERE user_id=1 AND status='success' ORDER BY pay_date;",topic="Rolling Average (N-Window)")

add("sql-117","Longest Consecutive Login Streak","Login / Activity","Google","hard",
"Find the longest consecutive login streak for each user.\n\nReturn user name and max_streak. Order by max_streak descending.",
"Gaps & Islands: date - ROW_NUMBER() groups consecutive dates. Then MAX(COUNT) per user.",
"Chirag: 5 consecutive days (Jan 10-14). Eshan: 4 days. Aarav: 3 days.",
LOGIN_T,LOGIN_S,(["name","max_streak"],[["Chirag",5],["Eshan",4],["Aarav",3],["Bhavna",2],["Diya",1]]),
"WITH dated AS(SELECT user_id,login_date,JULIANDAY(login_date)-ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY login_date)AS grp FROM(SELECT DISTINCT user_id,login_date FROM logins)),streaks AS(SELECT user_id,COUNT(*)AS streak FROM dated GROUP BY user_id,grp)SELECT u.name,MAX(s.streak)AS max_streak FROM streaks s JOIN users u ON s.user_id=u.id GROUP BY u.name ORDER BY max_streak DESC;",topic="Longest Consecutive Streak")

add("sql-118","Friend Request Acceptance Rate","Social Media (Instagram)","Meta","medium",
"From the follows table, calculate the mutual follow (acceptance) rate: what percentage of follows are reciprocated?\n\nReturn total_follows, mutual_follows, acceptance_rate_pct (rounded to 1).",
"Self-join follows to find reciprocated pairs, then divide by total.",
"Total follows=9. Mutual pairs: (1↔2),(1↔3),(2↔1),(3↔1),(2↔3 not mutual). Count reciprocated follow rows.",
SOCIAL_T,SOCIAL_S,(["total_follows","mutual_follows","acceptance_rate_pct"],[[9,4,44.4]]),
"WITH mutual AS(SELECT f1.id FROM follows f1 WHERE EXISTS(SELECT 1 FROM follows f2 WHERE f2.follower_id=f1.following_id AND f2.following_id=f1.follower_id))SELECT(SELECT COUNT(*) FROM follows)AS total_follows,COUNT(*)AS mutual_follows,ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM follows),1)AS acceptance_rate_pct FROM mutual;",topic="Acceptance / Reciprocation Rate")

add("sql-119","Credit Score Bucketing","Payments (Paytm)","CRED","easy",
"Classify users by their total successful spending into credit buckets: 'Platinum' (>3000), 'Gold' (1000-3000), 'Silver' (<1000).\n\nReturn name, total_spent, and tier. Order by total_spent descending.",
"SUM with CASE WHEN for tier classification.",
"Diya: 5000=Platinum. Chirag: 2600=Gold. Aarav: 3300=Platinum. etc.",
PAY_T,PAY_S,(["name","total_spent","tier"],[["Diya",5000.0,"Platinum"],["Aarav",3300.0,"Platinum"],["Chirag",2600.0,"Gold"],["Bhavna",2300.0,"Gold"],["Eshan",350.0,"Silver"]]),
"SELECT u.name,SUM(p.amount)AS total_spent,CASE WHEN SUM(p.amount)>3000 THEN 'Platinum' WHEN SUM(p.amount)>=1000 THEN 'Gold' ELSE 'Silver' END AS tier FROM pay_users u JOIN payments p ON u.id=p.user_id WHERE p.status='success' GROUP BY u.name ORDER BY total_spent DESC;",topic="Bucketing / Tier Classification")

add("sql-120","Surge Pricing: Rides Above 2x Average","Ride-Sharing (Ola)","Uber","medium",
"Identify completed rides where the fare exceeded twice the overall average fare (surge-priced).\n\nReturn ride_id, rider name, fare, avg_fare (rounded), and surge_multiple (rounded to 1). Order by fare descending.",
"Scalar subquery for average, then fare > 2 * avg.",
"Avg completed fare ≈ 291. 2x = 582. Only ride #6 (550) is close but below. Actually 550 < 582.",
RIDE_T,RIDE_S,(["id","name","fare","avg_fare","surge_multiple"],[]),
"SELECT r.id,r2.name,r.fare,ROUND((SELECT AVG(fare) FROM rides WHERE status='completed'))AS avg_fare,ROUND(r.fare/(SELECT AVG(fare) FROM rides WHERE status='completed'),1)AS surge_multiple FROM rides r JOIN riders r2 ON r.rider_id=r2.id WHERE r.status='completed' AND r.fare>2*(SELECT AVG(fare) FROM rides WHERE status='completed')ORDER BY r.fare DESC;",topic="Surge / Outlier Detection")


# ═══ BATCH 13: Enterprise + Indian IT + More Startup Patterns ═══

add("sql-121","Best-Selling Product Per Month","E-Commerce (Flipkart)","Amazon","hard",
"Find the best-selling product (by quantity) for each month.\n\nReturn month_num, product_name, total_qty. Order by month_num.",
"CTE: SUM qty per product per month, ROW_NUMBER per month partition.",
"Jan: which product sold most? Feb? Mar?",
ECOM_T,ECOM_S,(["month_num","product_name","total_qty"],[["01","Laptop",1],["02","Laptop",1],["03","Sneakers",1]]),
"WITH monthly_sales AS(SELECT strftime('%m',o.order_date)AS month_num,p.product_name,SUM(oi.qty)AS total_qty FROM orders o JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id GROUP BY strftime('%m',o.order_date),p.product_name),ranked AS(SELECT *,ROW_NUMBER() OVER(PARTITION BY month_num ORDER BY total_qty DESC)AS rn FROM monthly_sales)SELECT month_num,product_name,total_qty FROM ranked WHERE rn=1 ORDER BY month_num;",topic="Best-Selling per Period")

add("sql-122","Items Frequently Bought Together","E-Commerce (Flipkart)","Amazon","hard",
"Find pairs of products that appear in the same order. Show each unique pair once.\n\nReturn product_a, product_b, times_together. Order by times_together descending.",
"Self-join order_items on order_id where product_id differs, deduplicate pairs.",
"Which products co-occur in orders?",
ECOM_T,ECOM_S,(["product_a","product_b","times_together"],[["Headphones","Laptop",2],["Laptop","T-Shirt",1],["Headphones","T-Shirt",1],["Python Book","Sneakers",1],["Python Book","T-Shirt",1],["Sneakers","T-Shirt",1]]),
"SELECT p1.product_name AS product_a,p2.product_name AS product_b,COUNT(*)AS times_together FROM order_items oi1 JOIN order_items oi2 ON oi1.order_id=oi2.order_id AND oi1.product_id<oi2.product_id JOIN products p1 ON oi1.product_id=p1.id JOIN products p2 ON oi2.product_id=p2.id GROUP BY p1.product_name,p2.product_name ORDER BY times_together DESC;",topic="Market Basket Analysis")

add("sql-123","Restaurant With Highest Average Order","Food Delivery (Zomato)","Swiggy","medium",
"Find the restaurant with the highest average order amount.\n\nReturn restaurant name, avg_order (rounded to 0), and total_orders.",
"JOIN restaurants to orders, GROUP BY, ORDER BY AVG DESC LIMIT 1.",
"Which restaurant has the richest orders on average?",
ZOMATO_T,ZOMATO_S,(["name","avg_order","total_orders"],[["Dosa Corner",600,1]]),
"SELECT r.name,ROUND(AVG(o.amount))AS avg_order,COUNT(*)AS total_orders FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.name ORDER BY avg_order DESC LIMIT 1;",topic="Highest Average per Group")

add("sql-124","Cuisine-Wise Revenue Share","Food Delivery (Zomato)","Zomato","medium",
"Calculate what percentage of total revenue each cuisine type generates.\n\nReturn cuisine, total_revenue, and pct (rounded to 1). Order by pct descending.",
"SUM per cuisine / grand total * 100.",
"Indian, Chinese, etc. revenue shares.",
ZOMATO_T,ZOMATO_S,(["cuisine","total_revenue","pct"],[["Indian",1900.0,35.5],["South Indian",1400.0,26.2],["Chinese",1200.0,22.4],["American",450.0,8.4],["Italian",400.0,7.5]]),
"SELECT r.cuisine,SUM(o.amount)AS total_revenue,ROUND(SUM(o.amount)*100.0/(SELECT SUM(amount) FROM orders),1)AS pct FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.cuisine ORDER BY pct DESC;",topic="Revenue Share by Category")

add("sql-125","Simulate Return Rate by Category","E-Commerce (Flipkart)","Myntra","medium",
"Treat 'cancelled' orders as returns. Calculate the return rate per product category.\n\nReturn category, total_orders, cancelled_orders, return_rate_pct (rounded to 1). Order by return_rate descending.",
"JOIN orders→order_items→products. Conditional count of cancelled.",
"Which category has the most cancellations?",
ECOM_T,ECOM_S,(["category","total_orders","cancelled_orders","return_rate_pct"],[["Fashion",3,1,33.3],["Electronics",6,0,0.0],["Books",2,0,0.0]]),
"SELECT p.category,COUNT(*)AS total_orders,SUM(CASE WHEN o.status='cancelled' THEN 1 ELSE 0 END)AS cancelled_orders,ROUND(SUM(CASE WHEN o.status='cancelled' THEN 1 ELSE 0 END)*100.0/COUNT(*),1)AS return_rate_pct FROM orders o JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id GROUP BY p.category ORDER BY return_rate_pct DESC;",topic="Return / Cancellation Rate")

add("sql-126","Daily Active Transacting Users","Payments (Paytm)","Paytm","easy",
"Count the number of distinct users who made a successful payment on each day.\n\nReturn pay_date and active_users. Order by pay_date.",
"COUNT(DISTINCT user_id) WHERE status='success' GROUP BY pay_date.",
"Jan 10: Aarav. Jan 13: Bhavna. Jan 15: Aarav. etc.",
PAY_T,PAY_S,(["pay_date","active_users"],[["2024-01-10",1],["2024-01-13",1],["2024-01-15",1],["2024-01-20",1],["2024-01-22",1],["2024-02-01",1],["2024-02-10",1],["2024-02-15",1],["2024-03-01",1],["2024-03-05",1]]),
"SELECT pay_date,COUNT(DISTINCT user_id)AS active_users FROM payments WHERE status='success' GROUP BY pay_date ORDER BY pay_date;",topic="Daily Active Users (Transacting)")

add("sql-127","Driver Utilization: Rides Per Driver Per Month","Ride-Sharing (Ola)","Uber","hard",
"Calculate each driver's ride count per month and their utilization rate compared to the busiest driver that month.\n\nReturn month, driver_name, rides, max_rides_that_month, utilization_pct (rounded). Order by month, rides descending.",
"CTE for monthly rides, window MAX for max per month.",
"Ramesh dominates in January.",
RIDE_T,RIDE_S,(["month","driver_name","rides","max_rides","utilization_pct"],[["01","Ramesh",3,3,100],["01","Kavita",1,3,33],["01","Sunil",1,3,33],["02","Mohan",1,2,50],["02","Ramesh",1,2,50],["02","Lakshmi",1,2,50],["03","Ramesh",1,2,50],["03","Sunil",1,2,50]]),
"WITH monthly AS(SELECT strftime('%m',r.ride_date)AS month,d.name AS driver_name,COUNT(*)AS rides FROM rides r JOIN drivers d ON r.driver_id=d.id GROUP BY strftime('%m',r.ride_date),d.name)SELECT month,driver_name,rides,MAX(rides) OVER(PARTITION BY month)AS max_rides,ROUND(rides*100/MAX(rides) OVER(PARTITION BY month))AS utilization_pct FROM monthly ORDER BY month,rides DESC;",topic="Utilization Rate Analysis")

add("sql-128","SLA Breach: Late Appointments","Healthcare / Hospital","ServiceNow","medium",
"Find appointments where the doctor saw the patient more than 2 days after the appointment date (simulated SLA breach). Since we only have appointment_date, find appointments where the date is before '2024-01-10' as overdue.\n\nReturn patient name, doctor name, date. Order by date.",
"Simple date filter as SLA simulation.",
"Early appointments that could be 'overdue'.",
HOSPITAL_T,HOSPITAL_S,(["patient","doctor","appointment_date"],[["Amit","Dr. Sharma","2024-01-05"],["Priya","Dr. Gupta","2024-01-08"]]),
"SELECT p.name AS patient,d.name AS doctor,a.appointment_date FROM appointments a JOIN patients p ON a.patient_id=p.id JOIN doctors d ON a.doc_id=d.id WHERE a.appointment_date<'2024-01-10' ORDER BY a.appointment_date;",topic="SLA Breach Detection")

add("sql-129","Salary Above Department Average (Correlated)","HR / Employee","Accenture","medium",
"Using a correlated subquery, find employees whose salary is above their department's average.\n\nReturn name, department, salary. Order by department, salary descending.",
"WHERE salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e.department).",
"Uses correlated subquery instead of JOIN.",
EMP_T,EMP_S,(["name","department","salary"],[["Alice","Engineering",70000],["Eve","Engineering",65000],["Bob","Marketing",60000]]),
"SELECT name,department,salary FROM employees e WHERE salary>(SELECT AVG(salary) FROM employees e2 WHERE e2.department=e.department)ORDER BY department,salary DESC;",topic="Correlated Subquery")

add("sql-130","Fiscal Quarter Revenue Report","E-Commerce (Flipkart)","Deloitte","medium",
"Generate a quarterly revenue report. Map months to fiscal quarters: Q1(Jan-Mar), Q2(Apr-Jun), Q3(Jul-Sep), Q4(Oct-Dec).\n\nReturn quarter, order_count, and total_revenue. Order by quarter.",
"CASE on strftime('%m') to assign quarter, GROUP BY quarter.",
"All our orders are in Q1 2024.",
ECOM_T,ECOM_S,(["quarter","order_count","total_revenue"],[["Q1",7,126898.0]]),
"SELECT CASE WHEN CAST(strftime('%m',order_date)AS INT) BETWEEN 1 AND 3 THEN 'Q1' WHEN CAST(strftime('%m',order_date)AS INT) BETWEEN 4 AND 6 THEN 'Q2' WHEN CAST(strftime('%m',order_date)AS INT) BETWEEN 7 AND 9 THEN 'Q3' ELSE 'Q4' END AS quarter,COUNT(*)AS order_count,SUM(total)AS total_revenue FROM orders GROUP BY quarter ORDER BY quarter;",topic="Fiscal Quarter Reporting")

# ═══ BATCH 14: Indian IT Classics + Enterprise Patterns ═══

add("sql-131","Employees Starting With 'A'","HR / Employee","Wipro","easy",
"Find all employees whose name starts with the letter 'A'.\n\nReturn name and department. Order by name.",
"Use LIKE 'A%'.",
"Alice is the only one starting with A.",
EMP_T,EMP_S,(["name","department"],[["Alice","Engineering"]]),
"SELECT name,department FROM employees WHERE name LIKE 'A%' ORDER BY name;",topic="LIKE Pattern Matching")

add("sql-132","Employees With Same Salary","HR / Employee","Cognizant","medium",
"Find pairs of employees who have the same salary.\n\nReturn emp_a, emp_b, salary. No duplicate pairs. Order by salary descending.",
"Self-join WHERE e1.salary = e2.salary AND e1.name < e2.name.",
"No employees share a salary in our dataset, so result is empty.",
EMP_T,EMP_S,(["emp_a","emp_b","salary"],[]),
"SELECT e1.name AS emp_a,e2.name AS emp_b,e1.salary FROM employees e1 JOIN employees e2 ON e1.salary=e2.salary AND e1.name<e2.name ORDER BY e1.salary DESC;",topic="Self-Join (Same Value)")

add("sql-133","Department-Wise Employee Count","HR / Employee","Infosys","easy",
"Count the number of employees in each department.\n\nReturn department and emp_count. Order by emp_count descending.",
"Simple GROUP BY department with COUNT.",
"Engineering: 3. Marketing: 2. Sales: 1.",
EMP_T,EMP_S,(["department","emp_count"],[["Engineering",3],["Marketing",2],["Sales",1]]),
"SELECT department,COUNT(*)AS emp_count FROM employees GROUP BY department ORDER BY emp_count DESC;",topic="GROUP BY with COUNT")

add("sql-134","Lead Conversion: Order Status Pipeline","E-Commerce (Flipkart)","Salesforce","medium",
"Create a sales pipeline view: show how many orders are at each stage, and what percentage each stage is of total.\n\nReturn status, count, pct (rounded to 1). Order by count descending.",
"GROUP BY status, divide by total COUNT.",
"delivered=5(71.4%), shipped=1(14.3%), cancelled=1(14.3%).",
ECOM_T,ECOM_S,(["status","cnt","pct"],[["delivered",5,71.4],["cancelled",1,14.3],["shipped",1,14.3]]),
"SELECT status,COUNT(*)AS cnt,ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM orders),1)AS pct FROM orders GROUP BY status ORDER BY cnt DESC;",topic="Pipeline / Status Distribution")

add("sql-135","Payment Resolution: Time to Retry","Payments (Paytm)","Freshworks","hard",
"For users who had a failed payment followed by a successful one, calculate the time gap in days between failure and next success.\n\nReturn user name, failed_date, next_success_date, days_gap. Order by days_gap.",
"LEAD on payments partitioned by user_id, filter failed→success pairs.",
"Bhavna: failed Jan12, success Jan13 = 1 day. Chirag: failed Jan22, success Jan22 = 0 days.",
PAY_T,PAY_S,(["name","failed_date","next_success_date","days_gap"],[["Chirag","2024-01-22","2024-01-22",0],["Bhavna","2024-01-12","2024-01-13",1]]),
"WITH sequenced AS(SELECT p.*,LEAD(pay_date) OVER(PARTITION BY user_id ORDER BY pay_date,id)AS next_date,LEAD(status) OVER(PARTITION BY user_id ORDER BY pay_date,id)AS next_status FROM payments p)SELECT u.name,s.pay_date AS failed_date,s.next_date AS next_success_date,CAST(JULIANDAY(s.next_date)-JULIANDAY(s.pay_date)AS INT)AS days_gap FROM sequenced s JOIN pay_users u ON s.user_id=u.id WHERE s.status='failed' AND s.next_status='success' ORDER BY days_gap;",topic="Event Sequence Analysis")

add("sql-136","Payment Method Preference Per User","Payments (Paytm)","Juspay","medium",
"Find each user's most-used payment method (by count of successful payments).\n\nReturn user name, preferred_method, and usage_count. Order by name.",
"GROUP BY user_id, method → ROW_NUMBER per user → rn=1.",
"Aarav prefers UPI (2 times). Bhavna: UPI(1) vs card(1), pick first.",
PAY_T,PAY_S,(["name","preferred_method","usage_count"],[["Aarav","UPI",2],["Bhavna","UPI",1],["Chirag","card",1],["Diya","card",1],["Eshan","UPI",1]]),
"SELECT u.name,sub.method AS preferred_method,sub.usage_count FROM(SELECT user_id,method,COUNT(*)AS usage_count,ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY COUNT(*) DESC)AS rn FROM payments WHERE status='success' GROUP BY user_id,method)sub JOIN pay_users u ON sub.user_id=u.id WHERE sub.rn=1 ORDER BY u.name;",topic="Mode / Most Frequent Value")

add("sql-137","Session Gap: Days Between Logins","Login / Activity","Adobe","hard",
"For each user, calculate the average gap (in days) between consecutive logins.\n\nReturn user name and avg_gap (rounded to 1). Order by avg_gap descending. Exclude users with only 1 login.",
"LAG to get previous login, JULIANDAY diff, then AVG per user.",
"Diya: 1 login on Jan10, 1 on Jan20 = gap of 10 days avg. Aarav: gaps 1,1,3 = avg 1.7.",
LOGIN_T,LOGIN_S,(["name","avg_gap"],[["Diya",10.0],["Aarav",1.7],["Bhavna",1.5],["Chirag",1.0],["Eshan",1.0]]),
"WITH gaps AS(SELECT user_id,JULIANDAY(login_date)-JULIANDAY(LAG(login_date) OVER(PARTITION BY user_id ORDER BY login_date))AS gap FROM(SELECT DISTINCT user_id,login_date FROM logins))SELECT u.name,ROUND(AVG(g.gap),1)AS avg_gap FROM gaps g JOIN users u ON g.user_id=u.id WHERE g.gap IS NOT NULL GROUP BY u.name ORDER BY avg_gap DESC;",topic="Session Gap Analysis")

add("sql-138","Recursive CTE: Org Chart Levels","HR / Employee","SAP","hard",
"Using a recursive CTE, simulate organizational levels. Assign level 1 to the highest-paid employee, level 2 to next tier, etc., based on salary bands (each 10K range).\n\nReturn name, salary, and org_level. Order by org_level, name.",
"Recursive approach: tier = (max_salary - salary) / 10000 + 1.",
"Alice(70K)=L1. Eve(65K)=L1. Bob(60K)=L2. Charlie(55K)=L2. Diana(50K)=L3. Frank(45K)=L3.",
EMP_T,EMP_S,(["name","salary","org_level"],[["Alice",70000,1],["Eve",65000,1],["Bob",60000,2],["Charlie",55000,2],["Diana",50000,3],["Frank",45000,3]]),
"SELECT name,salary,CAST((((SELECT MAX(salary) FROM employees)-salary)/10000)+1 AS INT)AS org_level FROM employees ORDER BY org_level,name;",topic="Hierarchical Level Assignment")

add("sql-139","Suspicious Transactions: Above 3x Personal Average","Payments (Paytm)","Goldman Sachs","hard",
"Flag successful transactions where the amount exceeds 3 times the user's own average successful payment.\n\nReturn user name, pay_date, amount, user_avg (rounded), and multiplier (rounded to 1). Order by multiplier descending.",
"JOIN payments to user avg subquery, filter amount > 3 * avg.",
"Diya: avg=(5000)/1=5000, so nothing exceeds 3x. Chirag: avg=1300, 2500 is 1.9x (below 3x).",
PAY_T,PAY_S,(["name","pay_date","amount","user_avg","multiplier"],[]),
"SELECT u.name,p.pay_date,p.amount,ROUND(ua.avg_amt)AS user_avg,ROUND(p.amount/ua.avg_amt,1)AS multiplier FROM payments p JOIN pay_users u ON p.user_id=u.id JOIN(SELECT user_id,AVG(amount)AS avg_amt FROM payments WHERE status='success' GROUP BY user_id)ua ON p.user_id=ua.user_id WHERE p.status='success' AND p.amount>3*ua.avg_amt ORDER BY multiplier DESC;",topic="Anomaly / Fraud Detection")

add("sql-140","YoY Transaction Volume Change","Banking / Finance","Morgan Stanley","hard",
"Compare total transaction volume per account type (savings/current) between different months, simulating YoY.\n\nReturn acc_type, total_volume, avg_per_txn (rounded). Order by total_volume descending.",
"GROUP BY type with SUM and AVG.",
"Savings vs Current account total volumes.",
BANK_T,BANK_S,(["acc_type","total_volume","avg_per_txn"],[["savings",28000.0,4666.67],["current",10000.0,5000.0]]),
"SELECT a.type AS acc_type,SUM(t.amount)AS total_volume,ROUND(AVG(t.amount),2)AS avg_per_txn FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.type ORDER BY total_volume DESC;",topic="Volume Analysis by Category")


# ═══ BATCH 15: Remaining Research Gaps I ═══

add("sql-141","Employees Joined in Last 6 Months","HR / Employee","TCS Digital","easy",
"Find employees who joined after June 2023 (hire_date > '2023-06-01'). Since our schema uses a static dataset, find employees with salary below the median as a proxy for 'recent hires'.\n\nReturn name and salary. Order by salary.",
"WHERE salary < (median). Median of 6 values = avg of 3rd and 4th.",
"Median = (60000+55000)/2 = 57500. Below: Frank(45K), Diana(50K), Charlie(55K).",
EMP_T,EMP_S,(["name","salary"],[["Frank",45000],["Diana",50000],["Charlie",55000]]),
"SELECT name,salary FROM employees WHERE salary<(SELECT AVG(salary) FROM(SELECT salary FROM employees ORDER BY salary LIMIT 2 OFFSET 2))ORDER BY salary;",topic="Below-Median Filtering")

add("sql-142","Department With Highest Average Salary","HR / Employee","HCLTech","easy",
"Find the department with the highest average salary.\n\nReturn department and avg_salary (rounded to 0).",
"GROUP BY department, ORDER BY AVG DESC, LIMIT 1.",
"Engineering: (70K+65K+55K)/3=63333. Marketing: (60K+50K)/2=55000. Sales: 45000.",
EMP_T,EMP_S,(["department","avg_salary"],[["Engineering",63333]]),
"SELECT department,ROUND(AVG(salary))AS avg_salary FROM employees GROUP BY department ORDER BY avg_salary DESC LIMIT 1;",topic="Max Average per Group")

add("sql-143","Rider's 3rd Ride Ever","Ride-Sharing (Ola)","Ola","medium",
"Find each rider's 3rd ride (by date). Only include riders who have at least 3 rides.\n\nReturn rider name, ride_date, fare. Order by name.",
"ROW_NUMBER() OVER (PARTITION BY rider_id ORDER BY ride_date) = 3.",
"Aarav has 4 rides. His 3rd: Feb 01, 200.",
RIDE_T,RIDE_S,(["name","ride_date","fare"],[["Aarav","2024-02-01",200.0]]),
"SELECT r2.name,r.ride_date,r.fare FROM(SELECT *,ROW_NUMBER() OVER(PARTITION BY rider_id ORDER BY ride_date)AS rn FROM rides)r JOIN riders r2 ON r.rider_id=r2.id WHERE r.rn=3 ORDER BY r2.name;",topic="Nth Event per User")

add("sql-144","Users Inactive for 7+ Days","Login / Activity","Atlassian","medium",
"Find users whose gap between any two consecutive logins exceeds 7 days.\n\nReturn distinct user name and max_gap. Order by max_gap descending.",
"LAG + JULIANDAY diff, filter > 7.",
"Diya: Jan10→Jan20 = 10 day gap. Others have shorter gaps.",
LOGIN_T,LOGIN_S,(["name","max_gap"],[["Diya",10]]),
"WITH gaps AS(SELECT user_id,CAST(JULIANDAY(login_date)-JULIANDAY(LAG(login_date) OVER(PARTITION BY user_id ORDER BY login_date))AS INT)AS gap FROM(SELECT DISTINCT user_id,login_date FROM logins))SELECT u.name,MAX(g.gap)AS max_gap FROM gaps g JOIN users u ON g.user_id=u.id WHERE g.gap>7 GROUP BY u.name ORDER BY max_gap DESC;",topic="Inactivity Detection")

add("sql-145","Pareto: Top 20% Revenue Customers","E-Commerce (Flipkart)","Oracle","hard",
"Find customers who contribute to the top 20% of total revenue (Pareto principle).\n\nReturn name, total_spent, and cumulative_pct (rounded to 1). Show only those within top 20%.",
"Cumulative SUM / grand total, filter <= 20.",
"With 5 customers, top 20% ≈ top 1 customer.",
ECOM_T,ECOM_S,(["name","total_spent","cumulative_pct"],[]),
"WITH customer_rev AS(SELECT c.name,SUM(o.total)AS total_spent FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name),ranked AS(SELECT *,SUM(total_spent) OVER(ORDER BY total_spent DESC)AS cum_sum,(SELECT SUM(total) FROM orders)AS grand_total FROM customer_rev)SELECT name,total_spent,ROUND(cum_sum*100.0/grand_total,1)AS cumulative_pct FROM ranked WHERE ROUND(cum_sum*100.0/grand_total,1)<=50;",topic="Pareto / Top-N Revenue")

add("sql-146","Extract Email Domain","E-Commerce (Flipkart)","Capgemini","easy",
"Extract just the domain from each customer's email address.\n\nReturn name and email_domain. Order by name.",
"Use SUBSTR + INSTR to get everything after '@'.",
"ankit@gmail.com → gmail.com.",
ECOM_T,ECOM_S,(["name","email_domain"],[["Ankit","gmail.com"],["Priya","yahoo.com"],["Rohan","gmail.com"],["Sneha","outlook.com"],["Vikram","gmail.com"]]),
"SELECT name,SUBSTR(email,INSTR(email,'@')+1)AS email_domain FROM customers ORDER BY name;",topic="Email Domain Extraction")

add("sql-147","Cross-Month Retention","Login / Activity","Google","hard",
"Find users who logged in during BOTH the first week (Jan 10-16) AND the second week (Jan 17-23) of January 2024.\n\nReturn distinct user name.",
"INTERSECT of two date-range queries, or HAVING COUNT(DISTINCT week)=2.",
"Who logged in both weeks?",
LOGIN_T,LOGIN_S,(["name"],[["Aarav"],["Diya"]]),
"SELECT DISTINCT u.name FROM users u WHERE u.id IN(SELECT user_id FROM logins WHERE login_date BETWEEN '2024-01-10' AND '2024-01-16')AND u.id IN(SELECT user_id FROM logins WHERE login_date BETWEEN '2024-01-17' AND '2024-01-23')ORDER BY u.name;",topic="Cross-Period Retention")

add("sql-148","Products With No Sales","E-Commerce (Flipkart)","Flipkart","easy",
"Find products that have never been ordered.\n\nReturn product_name.",
"LEFT JOIN products to order_items WHERE order_item is NULL.",
"All products may have been ordered... let's check.",
ECOM_T,ECOM_S,(["product_name"],[]),
"SELECT p.product_name FROM products p LEFT JOIN order_items oi ON p.id=oi.product_id WHERE oi.id IS NULL;",topic="Unsold Products Detection")

add("sql-149","Multi-Condition CASE: Risk Rating","Banking / Finance","TCS NQT","medium",
"Assign a risk rating to each account based on balance: 'High Risk' (balance < 30000), 'Medium Risk' (30000-60000), 'Low Risk' (>60000).\n\nReturn holder, balance, and risk_rating. Order by balance.",
"CASE WHEN with multiple conditions.",
"Categorize each account.",
BANK_T,BANK_S,(["holder","balance","risk_rating"],[["Priya",25000.0,"High Risk"],["Suresh",30000.0,"Medium Risk"],["Amit",45000.0,"Medium Risk"],["Neha",50000.0,"Medium Risk"],["Ravi",50000.0,"Medium Risk"],["Deepak",75000.0,"Low Risk"]]),
"SELECT holder,balance,CASE WHEN balance<30000 THEN 'High Risk' WHEN balance<=60000 THEN 'Medium Risk' ELSE 'Low Risk' END AS risk_rating FROM accounts ORDER BY balance;",topic="Multi-Condition Risk Rating")

add("sql-150","Doctors With Most Appointments","Healthcare / Hospital","HCLTech","easy",
"Find the doctor with the most appointments.\n\nReturn doctor name and appointment_count.",
"JOIN doctors to appointments, GROUP BY, ORDER BY COUNT DESC, LIMIT 1.",
"Which doctor is busiest?",
HOSPITAL_T,HOSPITAL_S,(["name","appointment_count"],[["Dr. Sharma",2]]),
"SELECT d.name,COUNT(*)AS appointment_count FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name ORDER BY appointment_count DESC LIMIT 1;",topic="Busiest Entity Detection")

# ═══ BATCH 16: Final Research Gaps ═══

add("sql-151","Customer Lifetime Value Ranking","E-Commerce (Flipkart)","Amazon","hard",
"Rank customers by their lifetime value (total spending minus cancelled orders). Include order count.\n\nReturn name, total_orders, lifetime_value, clv_rank. Order by clv_rank.",
"Filter out cancelled, SUM total, DENSE_RANK by value.",
"Exclude cancelled orders from total.",
ECOM_T,ECOM_S,(["name","total_orders","lifetime_value","clv_rank"],[["Ankit",2,60799.0,1],["Rohan",1,55450.0,2],["Sneha",1,6900.0,3],["Vikram",1,450.0,4]]),
"WITH clv AS(SELECT c.name,COUNT(*)AS total_orders,SUM(o.total)AS lifetime_value FROM customers c JOIN orders o ON c.id=o.customer_id WHERE o.status!='cancelled' GROUP BY c.name)SELECT name,total_orders,lifetime_value,DENSE_RANK() OVER(ORDER BY lifetime_value DESC)AS clv_rank FROM clv ORDER BY clv_rank;",topic="Customer Lifetime Value")

add("sql-152","Viewers Who Watched All Genres","Streaming (Netflix)","Oracle","hard",
"Find users who have watched shows from every genre in the shows table.\n\nReturn user_name.",
"COUNT(DISTINCT genre) per user = total distinct genres.",
"Check who has coverage across all genres.",
STREAM_T,STREAM_S,(["user_name"],[["Arjun"]]),
"SELECT u.user_name FROM users u JOIN watch_history w ON u.id=w.user_id JOIN shows s ON w.show_id=s.id GROUP BY u.user_name HAVING COUNT(DISTINCT s.genre)=(SELECT COUNT(DISTINCT genre) FROM shows);",topic="Complete Coverage Check")

add("sql-153","Account Balance After All Transactions","Banking / Finance","JP Morgan","medium",
"Calculate each account's effective balance after applying all credits and debits.\n\nReturn holder, original_balance, credits, debits, effective_balance. Order by effective_balance descending.",
"Balance + SUM(credits) - SUM(debits).",
"Start with initial balance, add credits, subtract debits.",
BANK_T,BANK_S,(["holder","original_balance","credits","debits","effective_balance"],[["Deepak",75000.0,5000.0,0.0,80000.0],["Ravi",50000.0,8000.0,0.0,58000.0],["Amit",45000.0,5000.0,2000.0,48000.0],["Neha",50000.0,0.0,3000.0,47000.0],["Suresh",30000.0,0.0,0.0,30000.0],["Priya",25000.0,0.0,0.0,25000.0]]),
"SELECT a.holder,a.balance AS original_balance,IFNULL(SUM(CASE WHEN t.type='credit' THEN t.amount END),0)AS credits,IFNULL(SUM(CASE WHEN t.type='debit' THEN t.amount END),0)AS debits,a.balance+IFNULL(SUM(CASE WHEN t.type='credit' THEN t.amount WHEN t.type='debit' THEN -t.amount END),0)AS effective_balance FROM accounts a LEFT JOIN transactions t ON a.id=t.acc_id GROUP BY a.id ORDER BY effective_balance DESC;",topic="Balance Reconciliation")

add("sql-154","Weekday vs Weekend Orders","Food Delivery (Zomato)","Swiggy","medium",
"Categorize orders into 'Weekday' vs 'Weekend' based on order_date and compare revenue.\n\nReturn day_type, order_count, total_revenue. Order by total_revenue descending.",
"strftime('%w') gives day-of-week (0=Sun, 6=Sat). Weekend = 0 or 6.",
"Classify and aggregate.",
ZOMATO_T,ZOMATO_S,(["day_type","order_count","total_revenue"],[["Weekday",7,5050.0],["Weekend",1,300.0]]),
"SELECT CASE WHEN CAST(strftime('%w',order_date)AS INT) IN(0,6) THEN 'Weekend' ELSE 'Weekday' END AS day_type,COUNT(*)AS order_count,SUM(amount)AS total_revenue FROM orders GROUP BY day_type ORDER BY total_revenue DESC;",topic="Weekday vs Weekend Analysis")

add("sql-155","Signup-to-First-Login Time","Login / Activity","Zoho","medium",
"Calculate the number of days between each user's signup date and their first login.\n\nReturn name, signup_date, first_login, days_to_activate. Order by days_to_activate descending.",
"MIN(login_date) per user, then JULIANDAY diff from signup.",
"How long until users become active?",
LOGIN_T,LOGIN_S,(["name","signup_date","first_login","days_to_activate"],[["Eshan","2023-09-01","2024-01-10",131],["Diya","2023-06-10","2024-01-10",184],["Chirag","2023-03-01","2024-01-10",315],["Bhavna","2023-02-15","2024-01-10",330],["Aarav","2023-01-01","2024-01-10",374]]),
"SELECT u.name,u.signup_date,MIN(l.login_date)AS first_login,CAST(JULIANDAY(MIN(l.login_date))-JULIANDAY(u.signup_date)AS INT)AS days_to_activate FROM users u JOIN logins l ON u.id=l.user_id GROUP BY u.id ORDER BY days_to_activate DESC;",topic="Time-to-Activation")

add("sql-156","Top Spender Per City","Payments (Paytm)","CRED","medium",
"Find the highest spender (successful payments) in each city.\n\nReturn city, name, total_spent. Order by total_spent descending.",
"CTE for user spending, ROW_NUMBER per city.",
"Mumbai: Aarav(3300) vs Eshan(350). Delhi: Bhavna. etc.",
PAY_T,PAY_S,(["city","name","total_spent"],[["Chennai","Diya",5000.0],["Mumbai","Aarav",3300.0],["Bangalore","Chirag",2600.0],["Delhi","Bhavna",2300.0]]),
"WITH user_spend AS(SELECT u.name,u.city,SUM(p.amount)AS total_spent FROM pay_users u JOIN payments p ON u.id=p.user_id WHERE p.status='success' GROUP BY u.id),ranked AS(SELECT *,ROW_NUMBER() OVER(PARTITION BY city ORDER BY total_spent DESC)AS rn FROM user_spend)SELECT city,name,total_spent FROM ranked WHERE rn=1 ORDER BY total_spent DESC;",topic="Top-N per Region")

add("sql-157","Payment Volume MoM Growth","Payments (Paytm)","PhonePe","hard",
"Calculate the month-over-month growth in total successful payment volume.\n\nReturn month_num, volume, prev_volume, growth_pct (rounded to 1). Order by month.",
"CTE for monthly SUM, LAG for previous month.",
"Jan total vs Feb total vs Mar total.",
PAY_T,PAY_S,(["month_num","volume","prev_volume","growth_pct"],[["01",5100.0,None,None],["02",7200.0,5100.0,41.2],["03",1250.0,7200.0,-82.6]]),
"WITH monthly AS(SELECT strftime('%m',pay_date)AS month_num,SUM(amount)AS volume FROM payments WHERE status='success' GROUP BY strftime('%m',pay_date))SELECT month_num,volume,LAG(volume) OVER(ORDER BY month_num)AS prev_volume,ROUND((volume-LAG(volume) OVER(ORDER BY month_num))*100.0/LAG(volume) OVER(ORDER BY month_num),1)AS growth_pct FROM monthly ORDER BY month_num;",topic="MoM Payment Volume Growth")

add("sql-158","Average Rides Per Rider Per Month","Ride-Sharing (Ola)","Ola","medium",
"Calculate the average number of rides per active rider per month.\n\nReturn month, total_rides, active_riders, avg_rides_per_rider (rounded to 1). Order by month.",
"COUNT rides / COUNT DISTINCT riders per month.",
"Jan: 4 rides by 3 riders = 1.3.",
RIDE_T,RIDE_S,(["month","total_rides","active_riders","avg_rides_per_rider"],[["01",4,3,1.3],["02",3,3,1.0],["03",3,2,1.5]]),
"SELECT strftime('%m',ride_date)AS month,COUNT(*)AS total_rides,COUNT(DISTINCT rider_id)AS active_riders,ROUND(COUNT(*)*1.0/COUNT(DISTINCT rider_id),1)AS avg_rides_per_rider FROM rides GROUP BY strftime('%m',ride_date) ORDER BY month;",topic="Per-User Activity Rate")

add("sql-159","Multi-Schema Summary Dashboard","HR / Employee","Deloitte","hard",
"Create a single-row executive dashboard showing: total employees, total departments, avg salary (rounded), highest salary, lowest salary, salary range, and total payroll.\n\nReturn all 7 metrics.",
"Multiple aggregations in a single SELECT.",
"Comprehensive summary in one query.",
EMP_T,EMP_S,(["total_emp","total_dept","avg_salary","max_salary","min_salary","salary_range","total_payroll"],[[6,3,57500,70000,45000,25000,345000]]),
"SELECT COUNT(*)AS total_emp,COUNT(DISTINCT department)AS total_dept,ROUND(AVG(salary))AS avg_salary,MAX(salary)AS max_salary,MIN(salary)AS min_salary,MAX(salary)-MIN(salary)AS salary_range,SUM(salary)AS total_payroll FROM employees;",topic="Executive Summary Dashboard")

add("sql-160","Grand Analytics: User 360° View","Payments (Paytm)","Google","hard",
"Build a comprehensive user profile: name, city, total transactions, successful count, failed count, success rate, total spent, avg transaction, preferred method, and spending tier.\n\nReturn all metrics. Order by total_spent descending.",
"Multi-CTE pipeline combining aggregation, conditional counts, ROW_NUMBER for preferred method, and CASE for tier.",
"Complete 360° user analytics.",
PAY_T,PAY_S,(["name","city","total_txns","success_cnt","fail_cnt","success_rate","total_spent","avg_txn","preferred_method","tier"],[["Diya","Chennai",2,1,1,50.0,5000.0,5000,"card","Platinum"],["Aarav","Mumbai",4,4,0,100.0,3300.0,825,"UPI","Platinum"],["Chirag","Bangalore",4,2,2,50.0,2600.0,1300,"card","Gold"],["Bhavna","Delhi",3,2,1,66.7,2300.0,1150,"UPI","Gold"],["Eshan","Mumbai",1,1,0,100.0,350.0,350,"UPI","Silver"]]),
"WITH stats AS(SELECT u.name,u.city,COUNT(*)AS total_txns,SUM(CASE WHEN p.status='success' THEN 1 ELSE 0 END)AS success_cnt,SUM(CASE WHEN p.status='failed' THEN 1 ELSE 0 END)AS fail_cnt,ROUND(SUM(CASE WHEN p.status='success' THEN 1 ELSE 0 END)*100.0/COUNT(*),1)AS success_rate,IFNULL(SUM(CASE WHEN p.status='success' THEN p.amount END),0)AS total_spent,ROUND(IFNULL(AVG(CASE WHEN p.status='success' THEN p.amount END),0))AS avg_txn FROM pay_users u JOIN payments p ON u.id=p.user_id GROUP BY u.id),prefs AS(SELECT user_id,method,ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY COUNT(*) DESC)AS rn FROM payments WHERE status='success' GROUP BY user_id,method)SELECT s.name,s.city,s.total_txns,s.success_cnt,s.fail_cnt,s.success_rate,s.total_spent,s.avg_txn,pr.method AS preferred_method,CASE WHEN s.total_spent>3000 THEN 'Platinum' WHEN s.total_spent>=1000 THEN 'Gold' ELSE 'Silver' END AS tier FROM stats s JOIN prefs pr ON s.name=(SELECT name FROM pay_users WHERE id=pr.user_id) AND pr.rn=1 ORDER BY s.total_spent DESC;",topic="User 360° Analytics (Capstone)")


# ═══ BATCH 17: Advanced Patterns + Remaining Concepts ═══

add("sql-161","EXCEPT: Riders Not In January","Ride-Sharing (Ola)","Capgemini","medium",
"Find riders who took rides in February or March but NOT in January.\n\nReturn distinct rider name. Order by name.",
"EXCEPT: Feb/Mar riders minus Jan riders.",
"Who started riding after January?",
RIDE_T,RIDE_S,(["name"],[]),
"SELECT DISTINCT r2.name FROM rides r JOIN riders r2 ON r.rider_id=r2.id WHERE strftime('%m',r.ride_date) IN('02','03') EXCEPT SELECT DISTINCT r2.name FROM rides r JOIN riders r2 ON r.rider_id=r2.id WHERE strftime('%m',r.ride_date)='01' ORDER BY name;",topic="EXCEPT / Set Difference")

add("sql-162","EXISTS: Departments With High Earners","HR / Employee","Cognizant","medium",
"Find departments that have at least one employee earning more than 60000 using EXISTS.\n\nReturn distinct department.",
"WHERE EXISTS (SELECT 1 FROM employees e2 WHERE e2.department = e.department AND e2.salary > 60000).",
"Engineering has Alice(70K) and Eve(65K).",
EMP_T,EMP_S,(["department"],[["Engineering"]]),
"SELECT DISTINCT department FROM employees e WHERE EXISTS(SELECT 1 FROM employees e2 WHERE e2.department=e.department AND e2.salary>60000);",topic="EXISTS Correlated Check")

add("sql-163","HAVING Multiple Conditions","E-Commerce (Flipkart)","Deloitte","medium",
"Find product categories where the total revenue exceeds 5000 AND the average order amount exceeds 1000.\n\nReturn category, total_revenue, avg_order (rounded). Order by total_revenue descending.",
"GROUP BY category, HAVING SUM > 5000 AND AVG > 1000.",
"Electronics has high revenue and avg.",
ECOM_T,ECOM_S,(["category","total_revenue","avg_order"],[["Electronics",117048.0,19508]]),
"SELECT p.category,SUM(o.total)AS total_revenue,ROUND(AVG(o.total))AS avg_order FROM orders o JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id GROUP BY p.category HAVING SUM(o.total)>5000 AND AVG(o.total)>1000 ORDER BY total_revenue DESC;",topic="HAVING with Multiple Conditions")

add("sql-164","Conditional ORDER BY","HR / Employee","TCS NQT","easy",
"Sort employees: Engineers first (by salary descending), then others (by name ascending).\n\nReturn name, department, salary.",
"ORDER BY CASE to assign priority to Engineering, then salary/name.",
"Custom sorting logic.",
EMP_T,EMP_S,(["name","department","salary"],[["Alice","Engineering",70000],["Eve","Engineering",65000],["Charlie","Engineering",55000],["Bob","Marketing",60000],["Diana","Marketing",50000],["Frank","Sales",45000]]),
"SELECT name,department,salary FROM employees ORDER BY CASE WHEN department='Engineering' THEN 0 ELSE 1 END,CASE WHEN department='Engineering' THEN -salary ELSE 0 END,name;",topic="Conditional ORDER BY")

add("sql-165","Pivot: Monthly Revenue Columns","E-Commerce (Flipkart)","SAP","hard",
"Pivot monthly revenue into columns: show each customer with their Jan, Feb, Mar spending as separate columns.\n\nReturn name, jan_total, feb_total, mar_total. Order by name.",
"Use SUM(CASE WHEN month='01' THEN total END) for each month.",
"Pivot long data to wide format.",
ECOM_T,ECOM_S,(["name","jan_total","feb_total","mar_total"],[["Ankit",57500.0,None,None],["Priya",None,None,3299.0],["Rohan",None,55450.0,None],["Sneha",None,None,6900.0],["Vikram",None,None,450.0]]),
"SELECT c.name,SUM(CASE WHEN strftime('%m',o.order_date)='01' THEN o.total END)AS jan_total,SUM(CASE WHEN strftime('%m',o.order_date)='02' THEN o.total END)AS feb_total,SUM(CASE WHEN strftime('%m',o.order_date)='03' THEN o.total END)AS mar_total FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY c.name;",topic="Pivot / Crosstab Query")

add("sql-166","Percentage Change: Salary vs Company Average","HR / Employee","Accenture","medium",
"For each employee, show how much their salary deviates from the company-wide average, as a percentage.\n\nReturn name, salary, company_avg (rounded), deviation_pct (rounded to 1). Order by deviation_pct descending.",
"(salary - avg) / avg * 100.",
"Alice: (70000-57500)/57500*100 = 21.7%.",
EMP_T,EMP_S,(["name","salary","company_avg","deviation_pct"],[["Alice",70000,57500,21.7],["Eve",65000,57500,13.0],["Bob",60000,57500,4.3],["Charlie",55000,57500,-4.3],["Diana",50000,57500,-13.0],["Frank",45000,57500,-21.7]]),
"SELECT name,salary,ROUND((SELECT AVG(salary) FROM employees))AS company_avg,ROUND((salary-(SELECT AVG(salary) FROM employees))*100.0/(SELECT AVG(salary) FROM employees),1)AS deviation_pct FROM employees ORDER BY deviation_pct DESC;",topic="Percentage Deviation from Mean")

add("sql-167","NULL-Safe Join: All Patients With Optional Appointments","Healthcare / Hospital","Wipro","easy",
"List ALL patients with their appointment details. Patients without appointments should still appear with NULL.\n\nReturn patient name, diagnosis, appointment_date. Order by name.",
"LEFT JOIN patients to appointments.",
"Shows all patients, even those without appointments.",
HOSPITAL_T,HOSPITAL_S,(["name","diagnosis","appointment_date"],[["Amit","Diabetes","2024-01-05"],["Amit","Diabetes","2024-01-15"],["Neha","Fracture","2024-01-12"],["Priya","Fever","2024-01-08"],["Raj","Cold","2024-01-10"],["Sunita","Allergy","2024-01-18"]]),
"SELECT p.name,p.diagnosis,a.appointment_date FROM patients p LEFT JOIN appointments a ON p.id=a.patient_id ORDER BY p.name;",topic="LEFT JOIN (All Rows)")

add("sql-168","String Report: Comma-Separated Employees","HR / Employee","Atlassian","medium",
"For each department, create a comma-separated list of employee names.\n\nReturn department and employee_list. Order by department.",
"Use GROUP_CONCAT(name) grouped by department.",
"Engineering: Alice, Charlie, Eve.",
EMP_T,EMP_S,(["department","employee_list"],[["Engineering","Alice,Charlie,Eve"],["Marketing","Bob,Diana"],["Sales","Frank"]]),
"SELECT department,GROUP_CONCAT(name)AS employee_list FROM(SELECT department,name FROM employees ORDER BY name)GROUP BY department ORDER BY department;",topic="GROUP_CONCAT for Reports")

add("sql-169","Median Salary Calculation","HR / Employee","Goldman Sachs","hard",
"Calculate the median salary from the employees table.\n\nReturn median_salary.",
"For even N: average of middle two. N=6, median = avg of 3rd and 4th.",
"Sorted: 45K,50K,55K,60K,65K,70K. Median = (55000+60000)/2 = 57500.",
EMP_T,EMP_S,(["median_salary"],[[57500.0]]),
"SELECT AVG(salary)AS median_salary FROM(SELECT salary,ROW_NUMBER() OVER(ORDER BY salary)AS rn,COUNT(*) OVER()AS cnt FROM employees)WHERE rn IN(cnt/2,cnt/2+1);",topic="Median Calculation")

add("sql-170","Complex Analytics: Rider Engagement Score","Ride-Sharing (Ola)","Razorpay","hard",
"Calculate a rider engagement score: (ride_count * 10) + (avg_fare * 0.1) + (distinct_drivers * 5). Rank riders by score.\n\nReturn name, ride_count, avg_fare (rounded), distinct_drivers, score (rounded), and engagement_rank.",
"Multi-metric formula combined into a single score.",
"Weighted engagement scoring.",
RIDE_T,RIDE_S,(["name","ride_count","avg_fare","distinct_drivers","score","engagement_rank"],[["Aarav",4,213,3,78,1],["Chirag",2,375,2,58,2],["Bhavna",2,300,1,55,3],["Diya",1,550,1,70,4],["Eshan",1,150,1,30,5]]),
"WITH metrics AS(SELECT r.rider_id,COUNT(*)AS ride_count,ROUND(AVG(r.fare))AS avg_fare,COUNT(DISTINCT r.driver_id)AS distinct_drivers FROM rides r WHERE r.status='completed' GROUP BY r.rider_id),scored AS(SELECT m.*,ROUND(m.ride_count*10+m.avg_fare*0.1+m.distinct_drivers*5)AS score FROM metrics m)SELECT r2.name,s.ride_count,s.avg_fare,s.distinct_drivers,s.score,DENSE_RANK() OVER(ORDER BY s.score DESC)AS engagement_rank FROM scored s JOIN riders r2 ON s.rider_id=r2.id ORDER BY engagement_rank;",topic="Weighted Engagement Score")

# ═══ BATCH 18: Deep Concept Coverage ═══

add("sql-171","BETWEEN With NOT: Exclude Mid-Range","HR / Employee","Infosys","easy",
"Find employees whose salary is NOT between 50000 and 65000.\n\nReturn name and salary. Order by salary.",
"WHERE salary NOT BETWEEN 50000 AND 65000.",
"Frank(45K) and Alice(70K) are outside the range.",
EMP_T,EMP_S,(["name","salary"],[["Frank",45000],["Alice",70000]]),
"SELECT name,salary FROM employees WHERE salary NOT BETWEEN 50000 AND 65000 ORDER BY salary;",topic="NOT BETWEEN")

add("sql-172","Count Distinct With Condition","Login / Activity","ServiceNow","easy",
"Count how many distinct users logged in more than twice in January 2024.\n\nReturn active_power_users.",
"Subquery: GROUP BY user_id HAVING COUNT >= 3, outer COUNT.",
"Users with 3+ logins.",
LOGIN_T,LOGIN_S,(["active_power_users"],[[3]]),
"SELECT COUNT(*)AS active_power_users FROM(SELECT user_id FROM logins WHERE login_date BETWEEN '2024-01-01' AND '2024-01-31' GROUP BY user_id HAVING COUNT(*)>=3);",topic="Conditional DISTINCT Count")

add("sql-173","Year-Month Grouping","Banking / Finance","JP Morgan","medium",
"Group transactions by year-month and show count and total per month.\n\nReturn year_month, txn_count, total_amount. Order by year_month.",
"strftime('%Y-%m', date) for year-month grouping.",
"Monthly transaction summary.",
BANK_T,BANK_S,(["year_month","txn_count","total_amount"],[["2024-01",3,10000.0],["2024-02",3,13000.0],["2024-03",2,15000.0]]),
"SELECT strftime('%Y-%m',txn_date)AS year_month,COUNT(*)AS txn_count,SUM(amount)AS total_amount FROM transactions GROUP BY strftime('%Y-%m',txn_date) ORDER BY year_month;",topic="Year-Month Grouping")

add("sql-174","Customers Who Ordered Every Month","E-Commerce (Flipkart)","Myntra","hard",
"Find customers who placed at least one order in every month available in the data (Jan, Feb, Mar).\n\nReturn customer name.",
"COUNT(DISTINCT month) = total distinct months.",
"Who ordered in all 3 months?",
ECOM_T,ECOM_S,(["name"],[]),
"SELECT c.name FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name HAVING COUNT(DISTINCT strftime('%m',o.order_date))=(SELECT COUNT(DISTINCT strftime('%m',order_date)) FROM orders);",topic="Every-Period Participation")

add("sql-175","Cumulative User Signups","Login / Activity","Freshworks","medium",
"Show a cumulative count of user signups over time.\n\nReturn signup_date and cumulative_users. Order by signup_date.",
"COUNT(*) OVER (ORDER BY signup_date).",
"Running total of new signups.",
LOGIN_T,LOGIN_S,(["signup_date","cumulative_users"],[["2023-01-01",1],["2023-02-15",2],["2023-03-01",3],["2023-06-10",4],["2023-09-01",5]]),
"SELECT signup_date,COUNT(*) OVER(ORDER BY signup_date)AS cumulative_users FROM users ORDER BY signup_date;",topic="Cumulative Count")

add("sql-176","Window: Difference From Previous Row","Payments (Paytm)","Juspay","medium",
"For Aarav's successful payments, show each payment and the difference from the previous payment amount.\n\nReturn pay_date, amount, prev_amount, difference. Order by pay_date.",
"LAG(amount) OVER(ORDER BY pay_date), then subtract.",
"Jan10:500→NULL. Jan15:1200→+700. Feb10:700→-500. Mar05:900→+200.",
PAY_T,PAY_S,(["pay_date","amount","prev_amount","difference"],[["2024-01-10",500.0,None,None],["2024-01-15",1200.0,500.0,700.0],["2024-02-10",700.0,1200.0,-500.0],["2024-03-05",900.0,700.0,200.0]]),
"SELECT pay_date,amount,LAG(amount) OVER(ORDER BY pay_date)AS prev_amount,amount-LAG(amount) OVER(ORDER BY pay_date)AS difference FROM payments WHERE user_id=1 AND status='success' ORDER BY pay_date;",topic="Row-to-Row Difference")

add("sql-177","INTERSECT: Users Who Logged In Jan 10 AND Jan 11","Login / Activity","Microsoft","medium",
"Find users who logged in on BOTH January 10 AND January 11 using INTERSECT.\n\nReturn name. Order by name.",
"SELECT user_id FROM logins WHERE date='Jan10' INTERSECT SELECT user_id FROM logins WHERE date='Jan11'.",
"Users active on both consecutive days.",
LOGIN_T,LOGIN_S,(["name"],[["Aarav"],["Chirag"],["Eshan"]]),
"SELECT u.name FROM users u WHERE u.id IN(SELECT user_id FROM logins WHERE login_date='2024-01-10' INTERSECT SELECT user_id FROM logins WHERE login_date='2024-01-11')ORDER BY u.name;",topic="INTERSECT / Set Intersection")

add("sql-178","Conditional Aggregation: Pass/Fail Count","University / Education","Zoho","easy",
"Count students who passed (grade A or B) vs failed (grade C or below) per course.\n\nReturn course_name, passed, failed. Order by course_name.",
"SUM(CASE WHEN grade IN('A','B') THEN 1 ELSE 0 END).",
"Pass/fail breakdown per course.",
UNI_T,UNI_S,(["course_name","passed","failed"],[["Algorithms",2,0],["DBMS",0,2],["Data Structures",2,1],["Machine Learning",1,0],["Operating Systems",0,1]]),
"SELECT c.course_name,SUM(CASE WHEN e.grade IN('A','B') THEN 1 ELSE 0 END)AS passed,SUM(CASE WHEN e.grade NOT IN('A','B') THEN 1 ELSE 0 END)AS failed FROM courses c JOIN enrollments e ON c.id=e.course_id GROUP BY c.course_name ORDER BY c.course_name;",topic="Conditional Aggregation Pass/Fail")

add("sql-179","Dense Data: Fill Gaps in Date Sequence","Login / Activity","Adobe","hard",
"Identify which dates in January 10-20 had NO logins at all.\n\nReturn missing_date.",
"Generate date sequence, LEFT JOIN to logins, filter NULLs.",
"Which days had zero activity?",
LOGIN_T,LOGIN_S,(["missing_date"],[["2024-01-16"],["2024-01-17"],["2024-01-18"],["2024-01-19"]]),
"WITH RECURSIVE dates(d) AS(SELECT '2024-01-10' UNION ALL SELECT DATE(d,'+1 day') FROM dates WHERE d<'2024-01-20')SELECT d AS missing_date FROM dates WHERE d NOT IN(SELECT DISTINCT login_date FROM logins) ORDER BY d;",topic="Date Gap Detection (Recursive)")

add("sql-180","Grand Finale: Cross-Schema Business Intelligence","E-Commerce (Flipkart)","Amazon","hard",
"Build a comprehensive BI report from the E-Commerce schema: for each customer, show their name, city, email domain, total orders, total spent, avg order (rounded), first order date, last order date, days as customer, favorite category, and customer segment (VIP/Regular/New).\n\nReturn all metrics. Order by total_spent descending.",
"Multi-CTE pipeline: customer stats + favorite category + segmentation.",
"The ultimate analytical query combining everything learned.",
ECOM_T,ECOM_S,(["name","city","domain","orders","spent","avg_order","first_order","last_order","days_active","top_category","segment"],[["Ankit","Mumbai","gmail.com",2,60799.0,30400,"2024-01-10","2024-01-15",5,"Electronics","VIP"],["Rohan","Pune","gmail.com",1,55450.0,55450,"2024-02-20","2024-02-20",0,"Electronics","VIP"],["Sneha","Mumbai","outlook.com",1,6900.0,6900,"2024-03-10","2024-03-10",0,"Fashion","Regular"],["Priya","Delhi","yahoo.com",1,3299.0,3299,"2024-03-15","2024-03-15",0,"Electronics","Regular"],["Vikram","Bangalore","gmail.com",1,450.0,450,"2024-03-15","2024-03-15",0,"Books","New"]]),
"WITH stats AS(SELECT c.id,c.name,c.city,SUBSTR(c.email,INSTR(c.email,'@')+1)AS domain,COUNT(*)AS orders,SUM(o.total)AS spent,ROUND(AVG(o.total))AS avg_order,MIN(o.order_date)AS first_order,MAX(o.order_date)AS last_order,CAST(JULIANDAY(MAX(o.order_date))-JULIANDAY(MIN(o.order_date))AS INT)AS days_active FROM customers c JOIN orders o ON c.id=o.customer_id WHERE o.status!='cancelled' GROUP BY c.id),cats AS(SELECT o.customer_id,p.category,SUM(oi.qty)AS qty,ROW_NUMBER() OVER(PARTITION BY o.customer_id ORDER BY SUM(oi.qty) DESC)AS rn FROM orders o JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id WHERE o.status!='cancelled' GROUP BY o.customer_id,p.category)SELECT s.name,s.city,s.domain,s.orders,s.spent,s.avg_order,s.first_order,s.last_order,s.days_active,cat.category AS top_category,CASE WHEN s.spent>10000 THEN 'VIP' WHEN s.spent>1000 THEN 'Regular' ELSE 'New' END AS segment FROM stats s LEFT JOIN cats cat ON s.id=cat.customer_id AND cat.rn=1 ORDER BY s.spent DESC;",topic="Cross-Schema BI Report (Grand Finale)")


# ═══ BATCH 20: Mass Recruiter Deep-Dive (Glassdoor/PrepInsta Research) ═══
# 25 problems covering the MOST FREQUENTLY asked patterns at mass hiring companies.

# --- TCS NQT (3 new) ---
add("sql-186","Employee Earns More Than Manager","HR / Employee","TCS NQT","medium",
"Find employees who earn MORE than their direct manager.\n\nReturn employee name, employee salary, manager name, manager salary. Order by employee salary DESC.",
"Self-join: employees e1 JOIN employees e2 ON e1.mgr_id = e2.id WHERE e1.salary > e2.salary.",
"Bob(60K) has manager Alice(70K) — no. Eve(65K) has manager Alice(70K) — no. Diana(50K) has manager Charlie(55K) — no.",
EMP_T,EMP_S,(["emp_name","emp_salary","mgr_name","mgr_salary"],[]),
"SELECT e1.name AS emp_name,e1.salary AS emp_salary,e2.name AS mgr_name,e2.salary AS mgr_salary FROM employees e1 JOIN employees e2 ON e1.mgr_id=e2.id WHERE e1.salary>e2.salary ORDER BY e1.salary DESC;",topic="Employee vs Manager Salary")

add("sql-187","Odd-Numbered Rows Only","HR / Employee","TCS NQT","easy",
"Select only odd-numbered rows from the employees table (by id).\n\nReturn id, name. Order by id.",
"Use MOD or % operator: WHERE id % 2 != 0.",
"IDs 1,3,5 are odd.",
EMP_T,EMP_S,(["id","name"],[[1,"Alice"],[3,"Charlie"],[5,"Eve"]]),
"SELECT id,name FROM employees WHERE id%2!=0 ORDER BY id;",topic="Odd/Even Row Selection")

add("sql-188","Departments With More Than 2 Employees","HR / Employee","TCS NQT","easy",
"Find departments that have more than 2 employees.\n\nReturn dept, emp_count. Order by emp_count DESC.",
"GROUP BY dept HAVING COUNT(*) > 2.",
"Eng has 3 employees (Alice, Bob, Eve).",
EMP_T,EMP_S,(["dept","emp_count"],[["Eng",3]]),
"SELECT dept,COUNT(*)AS emp_count FROM employees GROUP BY dept HAVING COUNT(*)>2 ORDER BY emp_count DESC;",topic="GROUP BY + HAVING Count")

# --- TCS Digital (2 new) ---
add("sql-189","Employees Hired Before 2021","HR / Employee","TCS Digital","easy",
"Find all employees hired before January 1, 2021.\n\nReturn name, hire_date. Order by hire_date.",
"WHERE hire_date < '2021-01-01'.",
"Alice(2019), Bob(2020), Charlie(2020).",
EMP_T,EMP_S,(["name","hire_date"],[["Alice","2019-01-15"],["Bob","2020-03-01"],["Charlie","2020-06-10"]]),
"SELECT name,hire_date FROM employees WHERE hire_date<'2021-01-01' ORDER BY hire_date;",topic="Date Filtering (Before/After)")

add("sql-190","Total Salary Expense Per Department","HR / Employee","TCS Digital","easy",
"Calculate the total salary expense for each department.\n\nReturn dept, total_salary. Order by total_salary DESC.",
"GROUP BY dept + SUM(salary).",
"Eng: 70K+60K+65K=195K. Sales: 55K+50K=105K. HR: 45K.",
EMP_T,EMP_S,(["dept","total_salary"],[["Eng",195000],["Sales",105000],["HR",45000]]),
"SELECT dept,SUM(salary)AS total_salary FROM employees GROUP BY dept ORDER BY total_salary DESC;",topic="SUM Per Department")

# --- Infosys (3 new) ---
add("sql-191","Salary Above Company Average","HR / Employee","Infosys","easy",
"Find employees whose salary is above the company-wide average.\n\nReturn name, salary. Order by salary DESC.",
"Subquery: WHERE salary > (SELECT AVG(salary) FROM employees). Avg = 57500.",
"Alice(70K), Eve(65K), Bob(60K) are above 57500.",
EMP_T,EMP_S,(["name","salary"],[["Alice",70000],["Eve",65000],["Bob",60000]]),
"SELECT name,salary FROM employees WHERE salary>(SELECT AVG(salary) FROM employees) ORDER BY salary DESC;",topic="Subquery: Above Average")

add("sql-192","Highest Salary Per Department","HR / Employee","Infosys","medium",
"Find the employee with the highest salary in each department.\n\nReturn dept, name, salary. Order by salary DESC.",
"Use RANK() or DENSE_RANK() PARTITION BY dept ORDER BY salary DESC, filter rank=1.",
"Eng: Alice(70K), Sales: Charlie(55K), HR: Frank(45K).",
EMP_T,EMP_S,(["dept","name","salary"],[["Eng","Alice",70000],["Sales","Charlie",55000],["HR","Frank",45000]]),
"SELECT dept,name,salary FROM(SELECT dept,name,salary,RANK() OVER(PARTITION BY dept ORDER BY salary DESC)AS rk FROM employees)t WHERE rk=1 ORDER BY salary DESC;",topic="Top Salary Per Department")

add("sql-193","Employees Never Assigned a Project","E-Commerce (Flipkart)","Infosys","medium",
"Find customers who have never placed an order.\n\nReturn name, city. Order by name.",
"LEFT JOIN orders ON customers.id = orders.customer_id WHERE orders.id IS NULL.",
"All customers have at least one order in our dataset.",
ECOM_T,ECOM_S,(["name","city"],[]),
"SELECT c.name,c.city FROM customers c LEFT JOIN orders o ON c.id=o.customer_id WHERE o.id IS NULL ORDER BY c.name;",topic="LEFT JOIN: Find Unmatched")

# --- Wipro (3 new) ---
add("sql-194","DELETE vs TRUNCATE Simulation: Count After Filter","HR / Employee","Wipro","easy",
"Count how many employees would remain if we deleted all employees in 'HR' department.\n\nReturn remaining_count.",
"COUNT with WHERE dept != 'HR'.",
"6 total - 1 HR = 5.",
EMP_T,EMP_S,(["remaining_count"],[[5]]),
"SELECT COUNT(*)AS remaining_count FROM employees WHERE dept!='HR';",topic="Conditional Count (DELETE Sim)")

add("sql-195","DISTINCT Departments","HR / Employee","Wipro","easy",
"List all unique departments from the employees table.\n\nReturn dept. Order alphabetically.",
"SELECT DISTINCT dept.",
"Eng, HR, Sales.",
EMP_T,EMP_S,(["dept"],[["Eng"],["HR"],["Sales"]]),
"SELECT DISTINCT dept FROM employees ORDER BY dept;",topic="DISTINCT Values")

add("sql-196","Employees With NULL Manager","HR / Employee","Wipro","easy",
"Find employees who have no manager (mgr_id is NULL).\n\nReturn name, dept. Order by name.",
"WHERE mgr_id IS NULL.",
"Alice, Charlie, Frank have no manager.",
EMP_T,EMP_S,(["name","dept"],[["Alice","Eng"],["Charlie","Sales"],["Frank","HR"]]),
"SELECT name,dept FROM employees WHERE mgr_id IS NULL ORDER BY name;",topic="IS NULL Filtering")

# --- HCLTech (3 new) ---
add("sql-197","COUNT(*) vs COUNT(column) Difference","HR / Employee","HCLTech","easy",
"Show the difference between COUNT(*) and COUNT(mgr_id) on the employees table.\n\nReturn total_rows, non_null_managers.",
"COUNT(*) counts all rows. COUNT(mgr_id) skips NULLs.",
"6 total rows, 3 have non-null mgr_id.",
EMP_T,EMP_S,(["total_rows","non_null_managers"],[[6,3]]),
"SELECT COUNT(*)AS total_rows,COUNT(mgr_id)AS non_null_managers FROM employees;",topic="COUNT(*) vs COUNT(col)")

add("sql-198","Employees Joined in Each Year","HR / Employee","HCLTech","easy",
"Count how many employees were hired in each year.\n\nReturn hire_year, count. Order by hire_year.",
"Use SUBSTR or strftime to extract year from hire_date.",
"2019:1, 2020:2, 2021:2, 2022:1.",
EMP_T,EMP_S,(["hire_year","count"],[["2019",1],["2020",2],["2021",2],["2022",1]]),
"SELECT SUBSTR(hire_date,1,4)AS hire_year,COUNT(*)AS count FROM employees GROUP BY SUBSTR(hire_date,1,4) ORDER BY hire_year;",topic="Year Extraction + GROUP BY")

add("sql-199","Min and Max Salary Per Department","HR / Employee","HCLTech","easy",
"Find the minimum and maximum salary in each department.\n\nReturn dept, min_sal, max_sal. Order by dept.",
"GROUP BY dept + MIN(salary) + MAX(salary).",
"Eng: 60K-70K. HR: 45K-45K. Sales: 50K-55K.",
EMP_T,EMP_S,(["dept","min_sal","max_sal"],[["Eng",60000,70000],["HR",45000,45000],["Sales",50000,55000]]),
"SELECT dept,MIN(salary)AS min_sal,MAX(salary)AS max_sal FROM employees GROUP BY dept ORDER BY dept;",topic="MIN/MAX Per Group")

# --- Cognizant (3 new) ---
add("sql-200","Concatenate First and Last Name","Social Media (Instagram)","Cognizant","easy",
"Create a full display name by combining username with ' (@' and username and ')' format.\n\nReturn profile display as 'name (@username)'. Order by username.",
"Use || operator for string concatenation.",
"Builds display strings from profiles table.",
SOCIAL_T,SOCIAL_S,(["display"],[["ankit_dev (@ankit_dev)"],["priya_codes (@priya_codes)"],["rohan_js (@rohan_js)"],["sneha_ml (@sneha_ml)"],["vikram_sql (@vikram_sql)"]]),
"SELECT username||' (@'||username||')'AS display FROM profiles ORDER BY username;",topic="String Concatenation")

add("sql-201","Average Salary Comparison: Above vs Below","HR / Employee","Cognizant","medium",
"Classify each employee as 'Above Average' or 'Below Average' based on company-wide average salary.\n\nReturn name, salary, classification. Order by salary DESC.",
"CASE WHEN salary > (SELECT AVG(salary)...) THEN 'Above Average' ELSE 'Below Average'.",
"Avg is 57500. Alice,Eve,Bob above. Charlie,Diana,Frank below.",
EMP_T,EMP_S,(["name","salary","classification"],[["Alice",70000,"Above Average"],["Eve",65000,"Above Average"],["Bob",60000,"Above Average"],["Charlie",55000,"Below Average"],["Diana",50000,"Below Average"],["Frank",45000,"Below Average"]]),
"SELECT name,salary,CASE WHEN salary>(SELECT AVG(salary) FROM employees) THEN 'Above Average' ELSE 'Below Average' END AS classification FROM employees ORDER BY salary DESC;",topic="CASE + Subquery Classification")

add("sql-202","Employees Sharing Same Department as 'Alice'","HR / Employee","Cognizant","easy",
"Find all employees in the same department as Alice (excluding Alice herself).\n\nReturn name, dept. Order by name.",
"Subquery to get Alice's dept, then WHERE dept = that AND name != 'Alice'.",
"Bob and Eve are in Eng with Alice.",
EMP_T,EMP_S,(["name","dept"],[["Bob","Eng"],["Eve","Eng"]]),
"SELECT name,dept FROM employees WHERE dept=(SELECT dept FROM employees WHERE name='Alice') AND name!='Alice' ORDER BY name;",topic="Subquery: Same Group As")

# --- Accenture (3 new) ---
add("sql-203","Multi-Table: Customer Orders With Product Names","E-Commerce (Flipkart)","Accenture","medium",
"Join customers, orders, order_items, and products to show who bought what.\n\nReturn customer name, product name, qty, order_date. Order by order_date, customer name.",
"4-table join: customers -> orders -> order_items -> products.",
"Multi-table join across the full e-commerce schema.",
ECOM_T,ECOM_S,(["name","product_name","qty","order_date"],[["Ankit","iPhone 15",1,"2024-01-10"],["Ankit","MacBook Pro",1,"2024-01-15"],["Ankit","Running Shoes",1,"2024-01-15"],["Ankit","SQL Book",2,"2024-01-15"],["Rohan","MacBook Pro",1,"2024-02-20"],["Rohan","iPhone 15",1,"2024-02-20"],["Priya","iPhone 15",1,"2024-03-15"],["Sneha","Running Shoes",2,"2024-03-10"],["Sneha","Cotton T-Shirt",3,"2024-03-10"],["Vikram","SQL Book",1,"2024-03-15"]]),
"SELECT c.name,p.name AS product_name,oi.qty,o.order_date FROM customers c JOIN orders o ON c.id=o.customer_id JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id ORDER BY o.order_date,c.name;",topic="Multi-Table JOIN (4 Tables)")

add("sql-204","Weekend Orders Only","E-Commerce (Flipkart)","Accenture","medium",
"Find orders placed on weekends (Saturday=6 or Sunday=0 in SQLite strftime('%w')).\n\nReturn order_id, order_date, day_of_week. Order by order_date.",
"strftime('%w', order_date) returns 0 (Sun) to 6 (Sat).",
"Check which order dates fall on weekends.",
ECOM_T,ECOM_S,(["order_id","order_date","day_of_week"],[]),
"SELECT id AS order_id,order_date,CASE CAST(strftime('%w',order_date)AS INT) WHEN 0 THEN 'Sunday' WHEN 6 THEN 'Saturday' END AS day_of_week FROM orders WHERE CAST(strftime('%w',order_date)AS INT) IN(0,6) ORDER BY order_date;",topic="Day-of-Week Filtering")

add("sql-205","Customers With Orders Above Average Total","E-Commerce (Flipkart)","Accenture","medium",
"Find customers whose order total exceeds the average order total across all orders.\n\nReturn customer name, order total. Order by total DESC.",
"Subquery: WHERE o.total > (SELECT AVG(total) FROM orders).",
"Avg order total, then filter above it.",
ECOM_T,ECOM_S,(["name","total"],[["Rohan",55450.0],["Ankit",55000.0]]),
"SELECT c.name,o.total FROM customers c JOIN orders o ON c.id=o.customer_id WHERE o.total>(SELECT AVG(total) FROM orders) ORDER BY o.total DESC;",topic="Subquery: Above Avg Order")

# --- Capgemini (2 new) ---
add("sql-206","UNION: Combine Riders and Drivers","Ride-Sharing (Ola)","Capgemini","easy",
"Create a unified list of all people in the ride-sharing system (both riders and drivers).\n\nReturn name, role ('Rider' or 'Driver'). Order by name.",
"SELECT name, 'Rider' FROM riders UNION ALL SELECT name, 'Driver' FROM drivers.",
"Combines both tables with a role label.",
RIDE_T,RIDE_S,(["name","role"],[["Aarav","Rider"],["Bhavna","Rider"],["Chirag","Rider"],["Diya","Rider"],["Eshan","Rider"],["Kiran","Driver"],["Lakshmi","Driver"],["Manoj","Driver"],["Neha","Driver"]]),
"SELECT name,'Rider'AS role FROM riders UNION ALL SELECT name,'Driver'AS role FROM drivers ORDER BY name;",topic="UNION ALL with Labels")

add("sql-207","Employees in Same City as Company HQ","Ride-Sharing (Ola)","Capgemini","medium",
"Find riders whose city matches any driver's city.\n\nReturn rider name, city. Order by name.",
"WHERE city IN (SELECT city FROM drivers).",
"Check city overlap between riders and drivers.",
RIDE_T,RIDE_S,(["name","city"],[["Aarav","Mumbai"],["Bhavna","Delhi"],["Chirag","Mumbai"],["Diya","Bangalore"],["Eshan","Delhi"]]),
"SELECT r.name,r.city FROM riders r WHERE r.city IN(SELECT d.city FROM drivers d) ORDER BY r.name;",topic="IN Subquery: City Match")

# --- Deloitte (2 new) ---
add("sql-208","Revenue Trend: Orders Per Month","E-Commerce (Flipkart)","Deloitte","medium",
"Calculate total revenue and order count per month.\n\nReturn month, order_count, total_revenue. Order by month.",
"GROUP BY SUBSTR(order_date,1,7) for year-month grouping.",
"Jan: 2 orders, Feb: 1, Mar: 4.",
ECOM_T,ECOM_S,(["month","order_count","total_revenue"],[["2024-01",2,57500.0],["2024-02",1,55450.0],["2024-03",4,13948.0]]),
"SELECT SUBSTR(order_date,1,7)AS month,COUNT(*)AS order_count,SUM(total)AS total_revenue FROM orders WHERE status!='cancelled' GROUP BY SUBSTR(order_date,1,7) ORDER BY month;",topic="Monthly Revenue Trend")

add("sql-209","Customer Segmentation by Order Count","E-Commerce (Flipkart)","Deloitte","medium",
"Segment customers into 'Frequent' (3+ orders), 'Regular' (2 orders), or 'New' (1 order).\n\nReturn name, order_count, segment. Order by order_count DESC.",
"CASE WHEN COUNT >= 3 THEN 'Frequent' WHEN COUNT = 2 THEN 'Regular' ELSE 'New'.",
"Ankit has 3 orders, others have 1.",
ECOM_T,ECOM_S,(["name","order_count","segment"],[["Ankit",3,"Frequent"],["Priya",1,"New"],["Rohan",1,"New"],["Sneha",1,"New"],["Vikram",1,"New"]]),
"SELECT c.name,COUNT(o.id)AS order_count,CASE WHEN COUNT(o.id)>=3 THEN 'Frequent' WHEN COUNT(o.id)=2 THEN 'Regular' ELSE 'New' END AS segment FROM customers c JOIN orders o ON c.id=o.customer_id WHERE o.status!='cancelled' GROUP BY c.id,c.name ORDER BY order_count DESC;",topic="CASE Segmentation")

# --- Zoho (2 new) ---
add("sql-210","Library Schema: Books Not Borrowed","University / Education","Zoho","medium",
"Find courses that have zero enrollments.\n\nReturn course_name. Order by course_name.",
"LEFT JOIN enrollments, WHERE enrollment.id IS NULL.",
"Check for courses without any student enrollment.",
UNI_T,UNI_S,(["course_name"],[]),
"SELECT c.name AS course_name FROM courses c LEFT JOIN enrollments e ON c.id=e.course_id WHERE e.id IS NULL ORDER BY c.name;",topic="LEFT JOIN: Orphan Detection")

# ═══ BATCH 21: TCS NQT Scale-Up (10 of 20) ═══

add("sql-211","Salary Raise Simulation: 10% Hike for Eng","HR / Employee","TCS NQT","easy",
"Show what each Engineering employee's salary would be after a 10% raise.\n\nReturn name, current_salary, new_salary. Order by new_salary DESC.",
"SELECT name, salary, salary * 1.10 WHERE dept = 'Eng'.",
"Alice: 70000->77000. Eve: 65000->71500. Bob: 60000->66000.",
EMP_T,EMP_S,(["name","current_salary","new_salary"],[["Alice",70000,77000.0],["Eve",65000,71500.0],["Bob",60000,66000.0]]),
"SELECT name,salary AS current_salary,ROUND(salary*1.10,0)AS new_salary FROM employees WHERE dept='Eng' ORDER BY new_salary DESC;",topic="Salary Hike Simulation")

add("sql-212","Employees Hired Same Year as Alice","HR / Employee","TCS NQT","easy",
"Find employees hired in the same year as Alice.\n\nReturn name, hire_date. Order by name.",
"Subquery: WHERE SUBSTR(hire_date,1,4) = (SELECT SUBSTR(hire_date,1,4) FROM employees WHERE name='Alice').",
"Alice hired 2019. Only Alice herself in 2019.",
EMP_T,EMP_S,(["name","hire_date"],[["Alice","2019-01-15"]]),
"SELECT name,hire_date FROM employees WHERE SUBSTR(hire_date,1,4)=(SELECT SUBSTR(hire_date,1,4) FROM employees WHERE name='Alice') ORDER BY name;",topic="Subquery: Same Year")

add("sql-213","Top 3 Highest Paid Employees","HR / Employee","TCS NQT","easy",
"Find the 3 highest-paid employees.\n\nReturn name, salary. Order by salary DESC.",
"ORDER BY salary DESC LIMIT 3.",
"Alice(70K), Eve(65K), Bob(60K).",
EMP_T,EMP_S,(["name","salary"],[["Alice",70000],["Eve",65000],["Bob",60000]]),
"SELECT name,salary FROM employees ORDER BY salary DESC LIMIT 3;",topic="ORDER BY + LIMIT")

add("sql-214","Average Fare Per City","Ride-Sharing (Ola)","TCS NQT","easy",
"Calculate the average ride fare for each city.\n\nReturn city, avg_fare (rounded to 1). Order by avg_fare DESC.",
"JOIN rides with riders, GROUP BY city, AVG(fare).",
"Avg fare per city from the rides table.",
RIDE_T,RIDE_S,(["city","avg_fare"],[["Mumbai",225.0],["Delhi",250.0],["Bangalore",200.0],["Pune",175.0]]),
"SELECT r2.city,ROUND(AVG(r.fare),1)AS avg_fare FROM rides r JOIN riders r2 ON r.rider_id=r2.id GROUP BY r2.city ORDER BY avg_fare DESC;",topic="GROUP BY + AVG")

add("sql-215","Count Orders Per Customer","E-Commerce (Flipkart)","TCS NQT","easy",
"Count how many orders each customer has placed.\n\nReturn name, order_count. Order by order_count DESC.",
"JOIN customers + orders, GROUP BY, COUNT.",
"Ankit has 3, others have 1.",
ECOM_T,ECOM_S,(["name","order_count"],[["Ankit",3],["Priya",1],["Rohan",1],["Sneha",1],["Vikram",1]]),
"SELECT c.name,COUNT(o.id)AS order_count FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY order_count DESC;",topic="JOIN + COUNT Per Group")

add("sql-216","Products Never Ordered","E-Commerce (Flipkart)","TCS NQT","medium",
"Find products that have never been ordered by anyone.\n\nReturn product name, price. Order by name.",
"LEFT JOIN order_items ON product_id, WHERE order_items.id IS NULL.",
"Check which products have no entries in order_items.",
ECOM_T,ECOM_S,(["name","price"],[]),
"SELECT p.name,p.price FROM products p LEFT JOIN order_items oi ON p.id=oi.product_id WHERE oi.id IS NULL ORDER BY p.name;",topic="LEFT JOIN: Never Ordered")

add("sql-217","Display With Column Aliases","HR / Employee","TCS NQT","easy",
"Display employee info with friendly column names: 'Full Name', 'Department', 'Annual Salary'.\n\nReturn Full_Name, Department, Annual_Salary. Order by Annual_Salary DESC.",
"Use AS for aliasing. salary is already annual.",
"Simple column aliasing exercise.",
EMP_T,EMP_S,(["Full_Name","Department","Annual_Salary"],[["Alice","Eng",70000],["Eve","Eng",65000],["Bob","Eng",60000],["Charlie","Sales",55000],["Diana","Sales",50000],["Frank","HR",45000]]),
"SELECT name AS Full_Name,dept AS Department,salary AS Annual_Salary FROM employees ORDER BY Annual_Salary DESC;",topic="Column Aliasing")

add("sql-218","Employees Between Salary Range","HR / Employee","TCS NQT","easy",
"Find employees with salary between 50000 and 65000 (inclusive).\n\nReturn name, salary. Order by salary.",
"WHERE salary BETWEEN 50000 AND 65000.",
"Charlie(55K), Diana(50K), Bob(60K), Eve(65K).",
EMP_T,EMP_S,(["name","salary"],[["Diana",50000],["Charlie",55000],["Bob",60000],["Eve",65000]]),
"SELECT name,salary FROM employees WHERE salary BETWEEN 50000 AND 65000 ORDER BY salary;",topic="BETWEEN Range Filter")

add("sql-219","Department With Lowest Average Salary","HR / Employee","TCS NQT","medium",
"Find the department with the lowest average salary.\n\nReturn dept, avg_salary.",
"GROUP BY dept, ORDER BY AVG(salary) ASC LIMIT 1.",
"HR avg=45K, Sales avg=52.5K, Eng avg=65K. HR is lowest.",
EMP_T,EMP_S,(["dept","avg_salary"],[["HR",45000.0]]),
"SELECT dept,AVG(salary)AS avg_salary FROM employees GROUP BY dept ORDER BY avg_salary ASC LIMIT 1;",topic="Lowest AVG Per Group")

add("sql-220","Employees With 'a' in Name","HR / Employee","TCS NQT","easy",
"Find all employees whose name contains the letter 'a' (case-insensitive).\n\nReturn name. Order by name.",
"WHERE LOWER(name) LIKE '%a%'.",
"Alice, Charlie, Diana, Frank, Eve — check lowercase.",
EMP_T,EMP_S,(["name"],[["Alice"],["Charlie"],["Diana"],["Frank"]]),
"SELECT name FROM employees WHERE LOWER(name) LIKE '%a%' ORDER BY name;",topic="LIKE Case-Insensitive")

# ═══ BATCH 22: TCS NQT Scale-Up (10 of 20) — COMPLETES TCS NQT to 30 ═══

add("sql-221","Total Revenue Per Restaurant","Food Delivery (Zomato)","TCS NQT","medium",
"Find total order revenue for each restaurant.\n\nReturn restaurant name, total_revenue. Order by total_revenue DESC.",
"JOIN restaurants + orders, SUM(amount), GROUP BY.",
"Biryani House: 450+380+400=1230. Pizza Palace: 650+700=1350.",
ZOMATO_T,ZOMATO_S,(["name","total_revenue"],[["Pizza Palace",1350.0],["Biryani House",1230.0],["Dragon Wok",510.0],["Burger Barn",320.0],["Dosa Corner",220.0]]),
"SELECT r.name,SUM(o.amount)AS total_revenue FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.name ORDER BY total_revenue DESC;",topic="JOIN + SUM Revenue")

add("sql-222","Customers From Mumbai or Delhi","E-Commerce (Flipkart)","TCS NQT","easy",
"Find customers who live in Mumbai or Delhi.\n\nReturn name, city. Order by name.",
"WHERE city IN ('Mumbai','Delhi').",
"Ankit=Mumbai, Priya=Delhi, Sneha=Mumbai.",
ECOM_T,ECOM_S,(["name","city"],[["Ankit","Mumbai"],["Priya","Delhi"],["Sneha","Mumbai"]]),
"SELECT name,city FROM customers WHERE city IN('Mumbai','Delhi') ORDER BY name;",topic="WHERE IN Filter")

add("sql-223","Latest Hire Per Department","HR / Employee","TCS NQT","medium",
"Find the most recently hired employee in each department.\n\nReturn dept, name, hire_date. Order by dept.",
"ROW_NUMBER() PARTITION BY dept ORDER BY hire_date DESC, filter rn=1.",
"Eng: Eve(2021-08). Sales: Diana(2021-01). HR: Frank(2022-02).",
EMP_T,EMP_S,(["dept","name","hire_date"],[["Eng","Eve","2021-08-05"],["HR","Frank","2022-02-14"],["Sales","Diana","2021-01-20"]]),
"SELECT dept,name,hire_date FROM(SELECT dept,name,hire_date,ROW_NUMBER() OVER(PARTITION BY dept ORDER BY hire_date DESC)AS rn FROM employees)t WHERE rn=1 ORDER BY dept;",topic="Latest Per Group (Window)")

add("sql-224","Count NULL vs Non-NULL Managers","HR / Employee","TCS NQT","easy",
"Count how many employees have a manager vs those who don't.\n\nReturn has_manager, count. Order by has_manager.",
"CASE WHEN mgr_id IS NULL THEN 'No' ELSE 'Yes' + GROUP BY.",
"3 with manager, 3 without.",
EMP_T,EMP_S,(["has_manager","count"],[["No",3],["Yes",3]]),
"SELECT CASE WHEN mgr_id IS NULL THEN 'No' ELSE 'Yes' END AS has_manager,COUNT(*)AS count FROM employees GROUP BY has_manager ORDER BY has_manager;",topic="CASE NULL Classification")

add("sql-225","Rides With Above-Average Fare","Ride-Sharing (Ola)","TCS NQT","medium",
"Find all rides where the fare exceeds the overall average fare.\n\nReturn rider name, fare. Order by fare DESC.",
"Subquery: WHERE fare > (SELECT AVG(fare) FROM rides).",
"Filter rides above the average.",
RIDE_T,RIDE_S,(["name","fare"],[]),
"SELECT ri.name,r.fare FROM rides r JOIN riders ri ON r.rider_id=ri.id WHERE r.fare>(SELECT AVG(fare) FROM rides) ORDER BY r.fare DESC;",topic="Subquery: Above Avg Fare")

add("sql-226","Orders in January 2024","E-Commerce (Flipkart)","TCS NQT","easy",
"Find all orders placed in January 2024.\n\nReturn order_id, order_date, total. Order by order_date.",
"WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31'.",
"Orders 1,2,3 are in January.",
ECOM_T,ECOM_S,(["order_id","order_date","total"],[[1,"2024-01-10",2500.0],[2,"2024-01-15",55000.0],[3,"2024-01-15",3299.0]]),
"SELECT id AS order_id,order_date,total FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31' ORDER BY order_date;",topic="Date Range: Month Filter")

add("sql-227","Rank Employees by Salary","HR / Employee","TCS NQT","medium",
"Assign a rank to each employee based on salary (highest=1). Use DENSE_RANK.\n\nReturn name, salary, salary_rank. Order by salary_rank.",
"DENSE_RANK() OVER(ORDER BY salary DESC).",
"Alice=1, Eve=2, Bob=3, Charlie=4, Diana=5, Frank=6.",
EMP_T,EMP_S,(["name","salary","salary_rank"],[["Alice",70000,1],["Eve",65000,2],["Bob",60000,3],["Charlie",55000,4],["Diana",50000,5],["Frank",45000,6]]),
"SELECT name,salary,DENSE_RANK() OVER(ORDER BY salary DESC)AS salary_rank FROM employees ORDER BY salary_rank;",topic="DENSE_RANK Ranking")

add("sql-228","Top 2 Cuisines by Restaurant Count","Food Delivery (Zomato)","TCS NQT","medium",
"Find the top 2 cuisines that have the most restaurants.\n\nReturn cuisine, restaurant_count. Order by count DESC.",
"GROUP BY cuisine, COUNT, ORDER BY DESC LIMIT 2.",
"Indian=2, others=1 each.",
ZOMATO_T,ZOMATO_S,(["cuisine","restaurant_count"],[["Indian",2],["American",1]]),
"SELECT cuisine,COUNT(*)AS restaurant_count FROM restaurants GROUP BY cuisine ORDER BY restaurant_count DESC LIMIT 2;",topic="Top-N by COUNT")

add("sql-229","Patients With Exactly One Visit","Healthcare / Hospital","TCS NQT","easy",
"Find patients who visited the doctor exactly once.\n\nReturn name, visit_count. Order by name.",
"GROUP BY patient_id HAVING COUNT = 1.",
"Priya and Sneha have exactly 1 appointment each.",
HOSPITAL_T,HOSPITAL_S,(["name","visit_count"],[["Priya",1],["Sneha",1]]),
"SELECT p.name,COUNT(a.id)AS visit_count FROM patients p JOIN appointments a ON p.id=a.patient_id GROUP BY p.name HAVING COUNT(a.id)=1 ORDER BY p.name;",topic="HAVING COUNT Exact")

add("sql-230","Total Employee Count","HR / Employee","TCS NQT","easy",
"Count the total number of employees in the company.\n\nReturn total_employees.",
"Simple COUNT(*).",
"6 employees total.",
EMP_T,EMP_S,(["total_employees"],[[6]]),
"SELECT COUNT(*)AS total_employees FROM employees;",topic="Simple COUNT")

# ═══ BATCH 23: TCS Digital Scale-Up (10 of 25) ═══

add("sql-231","Average Order Value Per Customer","E-Commerce (Flipkart)","TCS Digital","easy",
"Calculate the average order value for each customer.\n\nReturn name, avg_order_value (rounded to 0). Order by avg_order_value DESC.",
"JOIN customers + orders, AVG(total), GROUP BY.",
"Rohan=55450, Ankit avg of 3 orders, etc.",
ECOM_T,ECOM_S,(["name","avg_order_value"],[["Rohan",55450],["Ankit",20266],["Sneha",6900],["Priya",3299],["Vikram",450]]),
"SELECT c.name,ROUND(AVG(o.total),0)AS avg_order_value FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY avg_order_value DESC;",topic="AVG Per Customer")

add("sql-232","Restaurants Rated Above 4.0","Food Delivery (Zomato)","TCS Digital","easy",
"Find all restaurants with a rating above 4.0.\n\nReturn name, rating. Order by rating DESC.",
"WHERE rating > 4.0.",
"Dosa Corner(4.7), Biryani House(4.5), Pizza Palace(4.2).",
ZOMATO_T,ZOMATO_S,(["name","rating"],[["Dosa Corner",4.7],["Biryani House",4.5],["Pizza Palace",4.2]]),
"SELECT name,rating FROM restaurants WHERE rating>4.0 ORDER BY rating DESC;",topic="Simple WHERE Filter")

add("sql-233","Count Rides Per Driver","Ride-Sharing (Ola)","TCS Digital","easy",
"Count how many rides each driver has completed.\n\nReturn driver name, ride_count. Order by ride_count DESC.",
"JOIN drivers + rides, GROUP BY, COUNT.",
"Count from rides table grouped by driver.",
RIDE_T,RIDE_S,(["name","ride_count"],[]),
"SELECT d.name,COUNT(r.id)AS ride_count FROM drivers d JOIN rides r ON d.id=r.driver_id GROUP BY d.name ORDER BY ride_count DESC;",topic="JOIN + COUNT Rides")

add("sql-234","Employees With Same Salary","HR / Employee","TCS Digital","medium",
"Find pairs of employees who have the exact same salary.\n\nReturn emp1, emp2, salary. Order by salary DESC.",
"Self-join: e1.salary = e2.salary AND e1.id < e2.id.",
"Check for duplicate salary values.",
EMP_T,EMP_S,(["emp1","emp2","salary"],[]),
"SELECT e1.name AS emp1,e2.name AS emp2,e1.salary FROM employees e1 JOIN employees e2 ON e1.salary=e2.salary AND e1.id<e2.id ORDER BY e1.salary DESC;",topic="Self-Join: Same Salary")

add("sql-235","Most Expensive Product Per Category","E-Commerce (Flipkart)","TCS Digital","medium",
"Find the most expensive product in each category.\n\nReturn category, product name, price. Order by price DESC.",
"ROW_NUMBER PARTITION BY category ORDER BY price DESC, rn=1.",
"Electronics: MacBook(120K). Fashion: Running Shoes(3499). Books: SQL Book(450).",
ECOM_T,ECOM_S,(["category","name","price"],[["Electronics","MacBook Pro",120000.0],["Fashion","Running Shoes",3499.0],["Fashion","Cotton T-Shirt",799.0],["Books","SQL Book",450.0]]),
"SELECT category,name,price FROM(SELECT category,name,price,ROW_NUMBER() OVER(PARTITION BY category ORDER BY price DESC)AS rn FROM products)t WHERE rn=1 ORDER BY price DESC;",topic="Top Per Category (Window)")

add("sql-236","Customers Who Ordered Electronics","E-Commerce (Flipkart)","TCS Digital","medium",
"Find customers who ordered at least one product in the 'Electronics' category.\n\nReturn DISTINCT customer name. Order by name.",
"Multi-join: customers->orders->order_items->products WHERE category='Electronics'.",
"Join through 4 tables and filter by category.",
ECOM_T,ECOM_S,(["name"],[["Ankit"],["Priya"],["Rohan"]]),
"SELECT DISTINCT c.name FROM customers c JOIN orders o ON c.id=o.customer_id JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id WHERE p.category='Electronics' ORDER BY c.name;",topic="Multi-Join Category Filter")

add("sql-237","All Departments Even Empty Ones","HR / Employee","TCS Digital","easy",
"List all departments. If a department has employees, show the count; otherwise show 0.\n\nReturn dept, emp_count. Order by dept.",
"Use a subquery or GROUP BY on existing data.",
"Eng=3, HR=1, Sales=2. All depts have employees here.",
EMP_T,EMP_S,(["dept","emp_count"],[["Eng",3],["HR",1],["Sales",2]]),
"SELECT dept,COUNT(*)AS emp_count FROM employees GROUP BY dept ORDER BY dept;",topic="Department Employee Count")

add("sql-238","Cancelled Orders","E-Commerce (Flipkart)","TCS Digital","easy",
"Find all orders with status 'cancelled'.\n\nReturn order_id, customer_id, total. Order by order_id.",
"WHERE status = 'cancelled'.",
"Check which orders are cancelled.",
ECOM_T,ECOM_S,(["order_id","customer_id","total"],[]),
"SELECT id AS order_id,customer_id,total FROM orders WHERE status='cancelled' ORDER BY id;",topic="WHERE Status Filter")

add("sql-239","Driver With Highest Total Earnings","Ride-Sharing (Ola)","TCS Digital","medium",
"Find the driver who earned the most total fare across all rides.\n\nReturn driver name, total_fare.",
"JOIN drivers + rides, SUM(fare), ORDER BY DESC LIMIT 1.",
"Sum fares per driver and pick the top one.",
RIDE_T,RIDE_S,(["name","total_fare"],[]),
"SELECT d.name,SUM(r.fare)AS total_fare FROM drivers d JOIN rides r ON d.id=r.driver_id GROUP BY d.name ORDER BY total_fare DESC LIMIT 1;",topic="TOP 1 by SUM")

add("sql-240","Mark Old Orders as Archived","E-Commerce (Flipkart)","TCS Digital","medium",
"Simulate marking orders before Feb 2024 as 'Archived' and others as 'Active'.\n\nReturn order_id, order_date, archive_status. Order by order_date.",
"CASE WHEN order_date < '2024-02-01' THEN 'Archived' ELSE 'Active'.",
"Jan orders = Archived, Feb+ = Active.",
ECOM_T,ECOM_S,(["order_id","order_date","archive_status"],[[1,"2024-01-10","Archived"],[2,"2024-01-15","Archived"],[3,"2024-01-15","Archived"],[4,"2024-02-20","Active"],[5,"2024-03-15","Active"],[6,"2024-03-10","Active"],[7,"2024-03-15","Active"]]),
"SELECT id AS order_id,order_date,CASE WHEN order_date<'2024-02-01' THEN 'Archived' ELSE 'Active' END AS archive_status FROM orders ORDER BY order_date;",topic="CASE Date Classification")

# ═══ BATCH 24: TCS Digital Scale-Up (10 of 25) ═══

add("sql-241","Average Rating Per Cuisine","Food Delivery (Zomato)","TCS Digital","easy",
"Calculate the average restaurant rating for each cuisine type.\n\nReturn cuisine, avg_rating (rounded to 1). Order by avg_rating DESC.",
"GROUP BY cuisine, AVG(rating).",
"Indian avg=(4.5+4.7)/2=4.6. Italian=4.2. Chinese=3.8. American=3.5.",
ZOMATO_T,ZOMATO_S,(["cuisine","avg_rating"],[["Indian",4.6],["Italian",4.2],["Chinese",3.8],["American",3.5]]),
"SELECT cuisine,ROUND(AVG(rating),1)AS avg_rating FROM restaurants GROUP BY cuisine ORDER BY avg_rating DESC;",topic="AVG Per Cuisine")

add("sql-242","Patients Diagnosed With Hypertension","Healthcare / Hospital","TCS Digital","easy",
"Find all patients who were diagnosed with Hypertension.\n\nReturn patient name, visit_date. Order by visit_date.",
"JOIN patients + appointments WHERE diagnosis='Hypertension'.",
"Rahul diagnosed with Hypertension on 2024-01-10.",
HOSPITAL_T,HOSPITAL_S,(["name","visit_date"],[["Rahul","2024-01-10"]]),
"SELECT p.name,a.visit_date FROM patients p JOIN appointments a ON p.id=a.patient_id WHERE a.diagnosis='Hypertension' ORDER BY a.visit_date;",topic="JOIN + WHERE Diagnosis")

add("sql-243","Rides in February 2024","Ride-Sharing (Ola)","TCS Digital","easy",
"Find all rides that took place in February 2024.\n\nReturn ride_id, ride_date, fare. Order by ride_date.",
"WHERE ride_date BETWEEN '2024-02-01' AND '2024-02-28'.",
"Filter rides by February date range.",
RIDE_T,RIDE_S,(["ride_id","ride_date","fare"],[]),
"SELECT id AS ride_id,ride_date,fare FROM rides WHERE ride_date BETWEEN '2024-02-01' AND '2024-02-29' ORDER BY ride_date;",topic="Date Range: Feb Filter")

add("sql-244","Products Costing Above Average","E-Commerce (Flipkart)","TCS Digital","medium",
"Find products whose price is above the average product price.\n\nReturn name, price. Order by price DESC.",
"WHERE price > (SELECT AVG(price) FROM products).",
"Average price, then filter above it.",
ECOM_T,ECOM_S,(["name","price"],[["MacBook Pro",120000.0],["iPhone 15",79999.0]]),
"SELECT name,price FROM products WHERE price>(SELECT AVG(price) FROM products) ORDER BY price DESC;",topic="Subquery: Above Avg Price")

add("sql-245","Student With Highest GPA","University / Education","TCS Digital","easy",
"Find the student with the highest GPA.\n\nReturn student name, gpa.",
"ORDER BY gpa DESC LIMIT 1.",
"Find top GPA student.",
UNI_T,UNI_S,(["name","gpa"],[]),
"SELECT s.name,s.gpa FROM students s ORDER BY s.gpa DESC LIMIT 1;",topic="ORDER BY DESC LIMIT 1")

add("sql-246","Count Logins Per User","Login / Activity","TCS Digital","easy",
"Count the number of login events for each user.\n\nReturn user_id, login_count. Order by login_count DESC.",
"GROUP BY user_id, COUNT.",
"Count login activity per user.",
LOGIN_T,LOGIN_S,(["user_id","login_count"],[]),
"SELECT user_id,COUNT(*)AS login_count FROM logins GROUP BY user_id ORDER BY login_count DESC;",topic="COUNT Logins Per User")

add("sql-247","Monthly Revenue for Restaurants","Food Delivery (Zomato)","TCS Digital","medium",
"Calculate total order revenue per month for restaurants.\n\nReturn month, total_revenue. Order by month.",
"SUBSTR(order_date,1,7) + SUM(amount) GROUP BY.",
"Group orders by year-month and sum amounts.",
ZOMATO_T,ZOMATO_S,(["month","total_revenue"],[["2024-01",1480.0],["2024-02",730.0],["2024-03",1020.0]]),
"SELECT SUBSTR(order_date,1,7)AS month,SUM(amount)AS total_revenue FROM orders GROUP BY SUBSTR(order_date,1,7) ORDER BY month;",topic="Monthly Revenue Grouping")

add("sql-248","Doctors With 10+ Years Experience","Healthcare / Hospital","TCS Digital","easy",
"Find doctors who have 10 or more years of experience.\n\nReturn name, specialty, experience_yrs. Order by experience_yrs DESC.",
"WHERE experience_yrs >= 10.",
"Dr. Sharma(15), Dr. Patel(10).",
HOSPITAL_T,HOSPITAL_S,(["name","specialty","experience_yrs"],[["Dr. Sharma","Cardiology",15],["Dr. Patel","Orthopedics",10]]),
"SELECT name,specialty,experience_yrs FROM doctors WHERE experience_yrs>=10 ORDER BY experience_yrs DESC;",topic="WHERE >= Threshold")

add("sql-249","Customers Who Placed 2+ Orders","E-Commerce (Flipkart)","TCS Digital","medium",
"Find customers who have placed 2 or more orders.\n\nReturn name, order_count. Order by order_count DESC.",
"JOIN + GROUP BY + HAVING COUNT >= 2.",
"Ankit has 3 orders. Others have 1.",
ECOM_T,ECOM_S,(["name","order_count"],[["Ankit",3]]),
"SELECT c.name,COUNT(o.id)AS order_count FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name HAVING COUNT(o.id)>=2 ORDER BY order_count DESC;",topic="HAVING COUNT >= N")

add("sql-250","Combine Name and Department","HR / Employee","TCS Digital","easy",
"Create a display string combining name and department like 'Alice (Eng)'.\n\nReturn display. Order by name.",
"Use || for string concatenation.",
"Alice (Eng), Bob (Eng), Charlie (Sales), etc.",
EMP_T,EMP_S,(["display"],[["Alice (Eng)"],["Bob (Eng)"],["Charlie (Sales)"],["Diana (Sales)"],["Eve (Eng)"],["Frank (HR)"]]),
"SELECT name||' ('||dept||')'AS display FROM employees ORDER BY name;",topic="String Concat Display")

# ═══ BATCH 25: TCS Digital Final 5 + Infosys First 5 ═══

# --- TCS Digital (5 remaining → completes to 30) ---
add("sql-251","Running Total of Salaries","HR / Employee","TCS Digital","medium",
"Calculate a running total of salaries ordered by hire date.\n\nReturn name, salary, running_total. Order by hire_date.",
"SUM(salary) OVER(ORDER BY hire_date).",
"Cumulative sum as you go down by hire date.",
EMP_T,EMP_S,(["name","salary","running_total"],[["Alice",70000,70000],["Bob",60000,130000],["Charlie",55000,185000],["Diana",50000,235000],["Eve",65000,300000],["Frank",45000,345000]]),
"SELECT name,salary,SUM(salary) OVER(ORDER BY hire_date)AS running_total FROM employees ORDER BY hire_date;",topic="Running Total Window")

add("sql-252","Posts With More Than 50 Likes","Social Media (Instagram)","TCS Digital","easy",
"Find posts that received more than 50 likes.\n\nReturn post_id, content preview (first 30 chars), likes. Order by likes DESC.",
"WHERE likes > 50.",
"Filter high-engagement posts.",
SOCIAL_T,SOCIAL_S,(["post_id","preview","likes"],[]),
"SELECT id AS post_id,SUBSTR(content,1,30)AS preview,likes FROM posts WHERE likes>50 ORDER BY likes DESC;",topic="WHERE + SUBSTR Preview")

add("sql-253","Shows Watched by User 1","Streaming (Netflix)","TCS Digital","easy",
"Find all shows watched by user with id=1.\n\nReturn show title, watch_date. Order by watch_date.",
"JOIN watch_history + shows WHERE user_id=1.",
"Filter watch history for a specific user.",
STREAM_T,STREAM_S,(["title","watch_date"],[]),
"SELECT s.title,w.watch_date FROM watch_history w JOIN shows s ON w.show_id=s.id WHERE w.user_id=1 ORDER BY w.watch_date;",topic="JOIN + User Filter")

add("sql-254","Total Transaction Amount Per Account","Banking / Finance","TCS Digital","medium",
"Calculate the total transaction amount for each account.\n\nReturn holder name, total_amount. Order by total_amount DESC.",
"JOIN accounts + transactions, SUM(amount), GROUP BY.",
"Sum all transactions per account holder.",
BANK_T,BANK_S,(["holder","total_amount"],[["Meena",35000.0],["Ravi",10000.0],["Suresh",5000.0],["Kavita",8000.0]]),
"SELECT a.holder,SUM(t.amount)AS total_amount FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.holder ORDER BY total_amount DESC;",topic="JOIN + SUM Transactions")

add("sql-255","High-Value Customers Over 10K","E-Commerce (Flipkart)","TCS Digital","medium",
"Find customers whose total spending exceeds 10,000.\n\nReturn name, total_spent. Order by total_spent DESC.",
"JOIN + GROUP BY + HAVING SUM > 10000.",
"Ankit and Rohan are high-value.",
ECOM_T,ECOM_S,(["name","total_spent"],[["Ankit",60799.0],["Rohan",55450.0]]),
"SELECT c.name,SUM(o.total)AS total_spent FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name HAVING SUM(o.total)>10000 ORDER BY total_spent DESC;",topic="HAVING SUM Threshold")

# --- Infosys (5 of 21 needed) ---
add("sql-256","Departments With Avg Salary Above 50K","HR / Employee","Infosys","medium",
"Find departments where the average salary exceeds 50,000.\n\nReturn dept, avg_salary. Order by avg_salary DESC.",
"GROUP BY dept HAVING AVG(salary) > 50000.",
"Eng avg=65K, Sales avg=52.5K. HR avg=45K excluded.",
EMP_T,EMP_S,(["dept","avg_salary"],[["Eng",65000.0],["Sales",52500.0]]),
"SELECT dept,AVG(salary)AS avg_salary FROM employees GROUP BY dept HAVING AVG(salary)>50000 ORDER BY avg_salary DESC;",topic="HAVING AVG Threshold")

add("sql-257","Employees Not in Engineering","HR / Employee","Infosys","easy",
"Find all employees who are NOT in the Engineering department.\n\nReturn name, dept. Order by name.",
"WHERE dept != 'Eng'.",
"Charlie(Sales), Diana(Sales), Frank(HR).",
EMP_T,EMP_S,(["name","dept"],[["Charlie","Sales"],["Diana","Sales"],["Frank","HR"]]),
"SELECT name,dept FROM employees WHERE dept!='Eng' ORDER BY name;",topic="WHERE Not Equal")

add("sql-258","Youngest and Oldest Patient","Healthcare / Hospital","Infosys","easy",
"Find the youngest and oldest patient.\n\nReturn type ('Youngest'/'Oldest'), name, age.",
"Use UNION with MIN and MAX age subqueries.",
"Youngest: Priya(28). Oldest: Amit(45).",
HOSPITAL_T,HOSPITAL_S,(["type","name","age"],[["Youngest","Priya",28],["Oldest","Amit",45]]),
"SELECT 'Youngest'AS type,name,age FROM patients WHERE age=(SELECT MIN(age) FROM patients) UNION ALL SELECT 'Oldest',name,age FROM patients WHERE age=(SELECT MAX(age) FROM patients);",topic="UNION MIN/MAX")

add("sql-259","Second Highest Salary Per Department","HR / Employee","Infosys","hard",
"Find the second highest salary in each department. If a dept has only 1 employee, exclude it.\n\nReturn dept, name, salary. Order by dept.",
"DENSE_RANK PARTITION BY dept ORDER BY salary DESC, filter rank=2.",
"Eng: Eve(65K). Sales: Diana(50K). HR has only 1 employee.",
EMP_T,EMP_S,(["dept","name","salary"],[["Eng","Eve",65000],["Sales","Diana",50000]]),
"SELECT dept,name,salary FROM(SELECT dept,name,salary,DENSE_RANK() OVER(PARTITION BY dept ORDER BY salary DESC)AS rk FROM employees)t WHERE rk=2 ORDER BY dept;",topic="2nd Highest Per Dept")

add("sql-260","Products Ordered More Than Once","E-Commerce (Flipkart)","Infosys","medium",
"Find products that appear in more than one order.\n\nReturn product name, order_count. Order by order_count DESC.",
"JOIN products + order_items, GROUP BY product, HAVING COUNT DISTINCT order > 1.",
"Products appearing across multiple orders.",
ECOM_T,ECOM_S,(["name","order_count"],[["iPhone 15",3],["MacBook Pro",2],["Running Shoes",2],["SQL Book",2]]),
"SELECT p.name,COUNT(DISTINCT oi.order_id)AS order_count FROM products p JOIN order_items oi ON p.id=oi.product_id GROUP BY p.name HAVING COUNT(DISTINCT oi.order_id)>1 ORDER BY order_count DESC;",topic="HAVING COUNT DISTINCT")

# ═══ BATCH 26: Infosys Scale-Up (10 of 21) ═══

add("sql-261","Customer Total Spending Rank","E-Commerce (Flipkart)","Infosys","medium",
"Rank customers by their total spending using DENSE_RANK.\n\nReturn name, total_spent, spending_rank. Order by spending_rank.",
"CTE/subquery for SUM, then DENSE_RANK OVER(ORDER BY total DESC).",
"Ankit=60799(#1), Rohan=55450(#2), etc.",
ECOM_T,ECOM_S,(["name","total_spent","spending_rank"],[["Ankit",60799.0,1],["Rohan",55450.0,2],["Sneha",6900.0,3],["Priya",3299.0,4],["Vikram",450.0,5]]),
"SELECT name,total_spent,DENSE_RANK() OVER(ORDER BY total_spent DESC)AS spending_rank FROM(SELECT c.name,SUM(o.total)AS total_spent FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name)t ORDER BY spending_rank;",topic="DENSE_RANK on Aggregate")

add("sql-262","Employees With No Subordinates","HR / Employee","Infosys","medium",
"Find employees who are not a manager to anyone (no one reports to them).\n\nReturn name, dept. Order by name.",
"LEFT JOIN employees e2 ON e1.id = e2.mgr_id WHERE e2.id IS NULL.",
"Bob, Diana, Eve, Frank have no one reporting to them.",
EMP_T,EMP_S,(["name","dept"],[["Bob","Eng"],["Diana","Sales"],["Eve","Eng"],["Frank","HR"]]),
"SELECT e1.name,e1.dept FROM employees e1 LEFT JOIN employees e2 ON e1.id=e2.mgr_id WHERE e2.id IS NULL ORDER BY e1.name;",topic="Self LEFT JOIN: No Reports")

add("sql-263","Restaurants With Below-Average Rating","Food Delivery (Zomato)","Infosys","easy",
"Find restaurants whose rating is below the overall average.\n\nReturn name, rating. Order by rating.",
"WHERE rating < (SELECT AVG(rating) FROM restaurants).",
"Avg=4.14. Dragon Wok(3.8) and Burger Barn(3.5) are below.",
ZOMATO_T,ZOMATO_S,(["name","rating"],[["Burger Barn",3.5],["Dragon Wok",3.8]]),
"SELECT name,rating FROM restaurants WHERE rating<(SELECT AVG(rating) FROM restaurants) ORDER BY rating;",topic="Subquery: Below Average")

add("sql-264","Top Selling Product by Quantity","E-Commerce (Flipkart)","Infosys","medium",
"Find the product with the highest total quantity sold.\n\nReturn product name, total_qty.",
"JOIN products + order_items, SUM(qty), ORDER DESC LIMIT 1.",
"Sum quantities across all orders per product.",
ECOM_T,ECOM_S,(["name","total_qty"],[["Cotton T-Shirt",3]]),
"SELECT p.name,SUM(oi.qty)AS total_qty FROM products p JOIN order_items oi ON p.id=oi.product_id GROUP BY p.name ORDER BY total_qty DESC LIMIT 1;",topic="Top by SUM Quantity")

add("sql-265","Unique Cities of Riders","Ride-Sharing (Ola)","Infosys","easy",
"List all unique cities where riders are located.\n\nReturn city. Order by city.",
"SELECT DISTINCT city FROM riders.",
"Bangalore, Delhi, Mumbai, Pune.",
RIDE_T,RIDE_S,(["city"],[["Bangalore"],["Delhi"],["Mumbai"],["Pune"]]),
"SELECT DISTINCT city FROM riders ORDER BY city;",topic="DISTINCT Cities")

add("sql-266","Count Products Per Category","E-Commerce (Flipkart)","Infosys","easy",
"Count the number of products in each category.\n\nReturn category, product_count. Order by product_count DESC.",
"GROUP BY category, COUNT.",
"Electronics=2, Fashion=2, Books=1.",
ECOM_T,ECOM_S,(["category","product_count"],[["Electronics",2],["Fashion",2],["Books",1]]),
"SELECT category,COUNT(*)AS product_count FROM products GROUP BY category ORDER BY product_count DESC;",topic="COUNT Per Category")

add("sql-267","Accounts With No Transactions","Banking / Finance","Infosys","medium",
"Find bank accounts that have zero transactions.\n\nReturn holder, branch. Order by holder.",
"LEFT JOIN transactions WHERE t.id IS NULL.",
"Find accounts with no transaction records.",
BANK_T,BANK_S,(["holder","branch"],[]),
"SELECT a.holder,a.branch FROM accounts a LEFT JOIN transactions t ON a.id=t.acc_id WHERE t.id IS NULL ORDER BY a.holder;",topic="LEFT JOIN: No Transactions")

add("sql-268","Employee Tenure in Days","HR / Employee","Infosys","medium",
"Calculate how many days each employee has been with the company (from hire_date to '2024-06-01').\n\nReturn name, hire_date, tenure_days. Order by tenure_days DESC.",
"JULIANDAY('2024-06-01') - JULIANDAY(hire_date).",
"Alice hired earliest, so highest tenure.",
EMP_T,EMP_S,(["name","hire_date","tenure_days"],[["Alice","2019-01-15",1964],["Bob","2020-03-01",1553],["Charlie","2020-06-10",1452],["Diana","2021-01-20",1228],["Eve","2021-08-05",1031],["Frank","2022-02-14",838]]),
"SELECT name,hire_date,CAST(JULIANDAY('2024-06-01')-JULIANDAY(hire_date)AS INT)AS tenure_days FROM employees ORDER BY tenure_days DESC;",topic="Date Diff: Tenure Calc")

add("sql-269","Find Duplicate Customer Emails","E-Commerce (Flipkart)","Infosys","medium",
"Find email domains that are used by more than one customer.\n\nReturn domain, customer_count. Order by customer_count DESC.",
"SUBSTR email after @, GROUP BY, HAVING COUNT > 1.",
"gmail.com used by multiple customers.",
ECOM_T,ECOM_S,(["domain","customer_count"],[["gmail.com",3]]),
"SELECT SUBSTR(email,INSTR(email,'@')+1)AS domain,COUNT(*)AS customer_count FROM customers GROUP BY SUBSTR(email,INSTR(email,'@')+1) HAVING COUNT(*)>1 ORDER BY customer_count DESC;",topic="Email Domain Duplicates")

add("sql-270","Courses With Most Enrollments","University / Education","Infosys","easy",
"Find the course with the most student enrollments.\n\nReturn course name, enrollment_count.",
"JOIN courses + enrollments, COUNT, ORDER DESC LIMIT 1.",
"Course with highest enrollment count.",
UNI_T,UNI_S,(["name","enrollment_count"],[]),
"SELECT c.name,COUNT(e.id)AS enrollment_count FROM courses c JOIN enrollments e ON c.id=e.course_id GROUP BY c.name ORDER BY enrollment_count DESC LIMIT 1;",topic="Most Enrolled Course")

# ═══ BATCH 27: Infosys Final 6 + Wipro First 4 ═══

# --- Infosys (6 remaining → completes to 30) ---
add("sql-271","Salary Percentile Ranking","HR / Employee","Infosys","hard",
"Calculate the percentile rank of each employee's salary.\n\nReturn name, salary, percentile (rounded to 2). Order by percentile DESC.",
"PERCENT_RANK() OVER(ORDER BY salary).",
"Alice at 100th percentile, Frank at 0th.",
EMP_T,EMP_S,(["name","salary","percentile"],[["Alice",70000,1.0],["Eve",65000,0.8],["Bob",60000,0.6],["Charlie",55000,0.4],["Diana",50000,0.2],["Frank",45000,0.0]]),
"SELECT name,salary,ROUND(PERCENT_RANK() OVER(ORDER BY salary),2)AS percentile FROM employees ORDER BY percentile DESC;",topic="PERCENT_RANK Percentile")

add("sql-272","Revenue Per City From E-Commerce","E-Commerce (Flipkart)","Infosys","medium",
"Calculate total order revenue per customer city.\n\nReturn city, total_revenue. Order by total_revenue DESC.",
"JOIN customers + orders, GROUP BY city, SUM(total).",
"Mumbai: Ankit+Sneha orders. Delhi: Priya. Pune: Rohan. Bangalore: Vikram.",
ECOM_T,ECOM_S,(["city","total_revenue"],[["Mumbai",67699.0],["Pune",55450.0],["Delhi",3299.0],["Bangalore",450.0]]),
"SELECT c.city,SUM(o.total)AS total_revenue FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.city ORDER BY total_revenue DESC;",topic="Revenue Per City")

add("sql-273","Average Likes Per User","Social Media (Instagram)","Infosys","easy",
"Calculate the average number of likes per user's posts.\n\nReturn username, avg_likes (rounded to 0). Order by avg_likes DESC.",
"JOIN profiles + posts, AVG(likes), GROUP BY user.",
"Average likes each user gets on their posts.",
SOCIAL_T,SOCIAL_S,(["username","avg_likes"],[]),
"SELECT pr.username,ROUND(AVG(p.likes),0)AS avg_likes FROM profiles pr JOIN posts p ON pr.id=p.user_id GROUP BY pr.username ORDER BY avg_likes DESC;",topic="AVG Likes Per User")

add("sql-274","Doctors Who Treated Only Female Patients","Healthcare / Hospital","Infosys","hard",
"Find doctors who have ONLY treated female patients (never treated a male).\n\nReturn doctor name. Order by name.",
"NOT EXISTS: no appointment with male patient.",
"Check each doctor's patient gender distribution.",
HOSPITAL_T,HOSPITAL_S,(["name"],[]),
"SELECT DISTINCT d.name FROM doctors d JOIN appointments a ON d.id=a.doc_id JOIN patients p ON a.patient_id=p.id WHERE NOT EXISTS(SELECT 1 FROM appointments a2 JOIN patients p2 ON a2.patient_id=p2.id WHERE a2.doc_id=d.id AND p2.gender='M') ORDER BY d.name;",topic="NOT EXISTS: Exclusive Filter")

add("sql-275","Average Post Likes Above 100","Social Media (Instagram)","Infosys","medium",
"Find users whose average post likes exceed 100.\n\nReturn username, avg_likes. Order by avg_likes DESC.",
"JOIN + GROUP BY + HAVING AVG(likes) > 100.",
"Filter users with high avg engagement.",
SOCIAL_T,SOCIAL_S,(["username","avg_likes"],[]),
"SELECT pr.username,ROUND(AVG(p.likes),0)AS avg_likes FROM profiles pr JOIN posts p ON pr.id=p.user_id GROUP BY pr.username HAVING AVG(p.likes)>100 ORDER BY avg_likes DESC;",topic="HAVING AVG Engagement")

add("sql-276","Total Fees Collected Per Specialty","Healthcare / Hospital","Infosys","medium",
"Calculate total fees collected per medical specialty.\n\nReturn specialty, total_fees. Order by total_fees DESC.",
"JOIN doctors + appointments, SUM(fee), GROUP BY specialty.",
"Orthopedics=1400, Cardiology=1300, Dermatology=400.",
HOSPITAL_T,HOSPITAL_S,(["specialty","total_fees"],[["Orthopedics",1400],["Cardiology",1300],["Dermatology",400]]),
"SELECT d.specialty,SUM(a.fee)AS total_fees FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.specialty ORDER BY total_fees DESC;",topic="SUM Fees Per Specialty")

# --- Wipro (4 of 19 needed) ---
add("sql-277","Employees Earning Exactly 60000","HR / Employee","Wipro","easy",
"Find employees whose salary is exactly 60,000.\n\nReturn name, dept. Order by name.",
"WHERE salary = 60000.",
"Bob earns exactly 60000.",
EMP_T,EMP_S,(["name","dept"],[["Bob","Eng"]]),
"SELECT name,dept FROM employees WHERE salary=60000 ORDER BY name;",topic="WHERE Exact Match")

add("sql-278","Count Male vs Female Patients","Healthcare / Hospital","Wipro","easy",
"Count how many patients are male vs female.\n\nReturn gender, patient_count. Order by gender.",
"GROUP BY gender, COUNT.",
"M=2 (Rahul, Amit). F=2 (Priya, Sneha).",
HOSPITAL_T,HOSPITAL_S,(["gender","patient_count"],[["F",2],["M",2]]),
"SELECT gender,COUNT(*)AS patient_count FROM patients GROUP BY gender ORDER BY gender;",topic="COUNT Per Gender")

add("sql-279","Products in Price Range 1K-10K","E-Commerce (Flipkart)","Wipro","easy",
"Find products priced between 1,000 and 10,000.\n\nReturn name, price. Order by price.",
"WHERE price BETWEEN 1000 AND 10000.",
"Running Shoes(3499).",
ECOM_T,ECOM_S,(["name","price"],[["Running Shoes",3499.0]]),
"SELECT name,price FROM products WHERE price BETWEEN 1000 AND 10000 ORDER BY price;",topic="BETWEEN Price Range")

add("sql-280","Employee Names in Uppercase","HR / Employee","Wipro","easy",
"Display all employee names in uppercase.\n\nReturn upper_name, dept. Order by upper_name.",
"UPPER(name).",
"ALICE, BOB, CHARLIE, etc.",
EMP_T,EMP_S,(["upper_name","dept"],[["ALICE","Eng"],["BOB","Eng"],["CHARLIE","Sales"],["DIANA","Sales"],["EVE","Eng"],["FRANK","HR"]]),
"SELECT UPPER(name)AS upper_name,dept FROM employees ORDER BY upper_name;",topic="UPPER() Transform")

# ═══ BATCH 28: Wipro Scale-Up (10 of 19) ═══

add("sql-281","Latest Order Per Customer","E-Commerce (Flipkart)","Wipro","medium",
"Find the most recent order for each customer.\n\nReturn name, order_date, total. Order by order_date DESC.",
"ROW_NUMBER() PARTITION BY customer_id ORDER BY order_date DESC, rn=1.",
"Most recent order per customer.",
ECOM_T,ECOM_S,(["name","order_date","total"],[["Ankit","2024-01-15",55000.0],["Priya","2024-03-15",3299.0],["Rohan","2024-02-20",55450.0],["Sneha","2024-03-10",6900.0],["Vikram","2024-03-15",450.0]]),
"SELECT name,order_date,total FROM(SELECT c.name,o.order_date,o.total,ROW_NUMBER() OVER(PARTITION BY c.id ORDER BY o.order_date DESC)AS rn FROM customers c JOIN orders o ON c.id=o.customer_id)t WHERE rn=1 ORDER BY order_date DESC;",topic="Latest Per Customer (Window)")

add("sql-282","Total Fee Per Doctor","Healthcare / Hospital","Wipro","easy",
"Calculate total appointment fees collected by each doctor.\n\nReturn doctor name, total_fee. Order by total_fee DESC.",
"JOIN doctors + appointments, SUM(fee), GROUP BY.",
"Sum fees per doctor.",
HOSPITAL_T,HOSPITAL_S,(["name","total_fee"],[["Dr. Patel",1400],["Dr. Sharma",1300],["Dr. Gupta",400]]),
"SELECT d.name,SUM(a.fee)AS total_fee FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name ORDER BY total_fee DESC;",topic="SUM Fee Per Doctor")

add("sql-283","Shortest and Longest Employee Name","HR / Employee","Wipro","easy",
"Find the employee with the shortest name and the one with the longest name.\n\nReturn type, name, name_length.",
"UNION with MIN/MAX LENGTH.",
"Shortest: Bob/Eve (3). Longest: Charlie (7).",
EMP_T,EMP_S,(["type","name","name_length"],[["Shortest","Bob",3],["Longest","Charlie",7]]),
"SELECT 'Shortest'AS type,name,LENGTH(name)AS name_length FROM employees WHERE LENGTH(name)=(SELECT MIN(LENGTH(name)) FROM employees) UNION ALL SELECT 'Longest',name,LENGTH(name) FROM employees WHERE LENGTH(name)=(SELECT MAX(LENGTH(name)) FROM employees) LIMIT 2;",topic="MIN/MAX LENGTH")

add("sql-284","Restaurants Not in Mumbai","Food Delivery (Zomato)","Wipro","easy",
"Find all restaurants that are NOT located in Mumbai.\n\nReturn name, city. Order by name.",
"WHERE city != 'Mumbai'.",
"Filter out Mumbai restaurants.",
ZOMATO_T,ZOMATO_S,(["name","city"],[["Burger Barn","Bangalore"],["Dosa Corner","Chennai"],["Dragon Wok","Kolkata"],["Pizza Palace","Delhi"]]),
"SELECT name,city FROM restaurants WHERE city!='Mumbai' ORDER BY name;",topic="WHERE Not Equal City")

add("sql-285","Average Transaction Amount Per Branch","Banking / Finance","Wipro","medium",
"Calculate the average transaction amount for each bank branch.\n\nReturn branch, avg_amount (rounded to 0). Order by avg_amount DESC.",
"JOIN accounts + transactions, AVG(amount), GROUP BY branch.",
"Average transaction size per branch.",
BANK_T,BANK_S,(["branch","avg_amount"],[["Delhi",11667],["Mumbai",4500],["Bangalore",8000]]),
"SELECT a.branch,ROUND(AVG(t.amount),0)AS avg_amount FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.branch ORDER BY avg_amount DESC;",topic="AVG Transaction Per Branch")

add("sql-286","Rider and Driver From Same City","Ride-Sharing (Ola)","Wipro","medium",
"Find all rider-driver pairs where both are from the same city.\n\nReturn rider_name, driver_name, city. Order by city, rider_name.",
"JOIN riders r, drivers d ON r.city = d.city.",
"Cross-table city matching.",
RIDE_T,RIDE_S,(["rider_name","driver_name","city"],[]),
"SELECT r.name AS rider_name,d.name AS driver_name,r.city FROM riders r JOIN drivers d ON r.city=d.city ORDER BY r.city,r.name;",topic="Cross-Table City Match")

add("sql-287","Replace Dept Code With Full Name","HR / Employee","Wipro","easy",
"Replace department abbreviations: 'Eng' → 'Engineering', 'HR' → 'Human Resources'.\n\nReturn name, full_dept. Order by name.",
"CASE or REPLACE for dept name expansion.",
"Map short codes to full names.",
EMP_T,EMP_S,(["name","full_dept"],[["Alice","Engineering"],["Bob","Engineering"],["Charlie","Sales"],["Diana","Sales"],["Eve","Engineering"],["Frank","Human Resources"]]),
"SELECT name,CASE dept WHEN 'Eng' THEN 'Engineering' WHEN 'HR' THEN 'Human Resources' ELSE dept END AS full_dept FROM employees ORDER BY name;",topic="CASE Value Mapping")

add("sql-288","First Order Date Per Customer","E-Commerce (Flipkart)","Wipro","easy",
"Find the date of each customer's first order.\n\nReturn name, first_order. Order by first_order.",
"JOIN + MIN(order_date) GROUP BY.",
"Earliest order date per customer.",
ECOM_T,ECOM_S,(["name","first_order"],[["Ankit","2024-01-10"],["Rohan","2024-02-20"],["Sneha","2024-03-10"],["Priya","2024-03-15"],["Vikram","2024-03-15"]]),
"SELECT c.name,MIN(o.order_date)AS first_order FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY first_order;",topic="MIN Date Per Group")

add("sql-289","Drivers With Rating Above 4.5","Ride-Sharing (Ola)","Wipro","easy",
"Find drivers whose rating exceeds 4.5.\n\nReturn name, rating. Order by rating DESC.",
"WHERE rating > 4.5.",
"High-rated drivers.",
RIDE_T,RIDE_S,(["name","rating"],[]),
"SELECT name,rating FROM drivers WHERE rating>4.5 ORDER BY rating DESC;",topic="WHERE Rating Filter")

add("sql-290","Total Orders Per City","E-Commerce (Flipkart)","Wipro","medium",
"Count total orders placed from each customer city.\n\nReturn city, order_count. Order by order_count DESC.",
"JOIN customers + orders, GROUP BY city, COUNT.",
"Mumbai: Ankit(3)+Sneha(1)=4. Others have fewer.",
ECOM_T,ECOM_S,(["city","order_count"],[["Mumbai",4],["Delhi",1],["Pune",1],["Bangalore",1]]),
"SELECT c.city,COUNT(o.id)AS order_count FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.city ORDER BY order_count DESC;",topic="Orders Per City")

# ═══ BATCH 29: Wipro Final 5 + HCLTech First 5 ═══

# --- Wipro (5 remaining → completes to 30) ---
add("sql-291","Profile Followers Count","Social Media (Instagram)","Wipro","easy",
"Count followers for each profile (from the follows table).\n\nReturn username, follower_count. Order by follower_count DESC.",
"JOIN profiles + follows, COUNT, GROUP BY.",
"Count who follows whom.",
SOCIAL_T,SOCIAL_S,(["username","follower_count"],[]),
"SELECT pr.username,COUNT(f.id)AS follower_count FROM profiles pr LEFT JOIN follows f ON pr.id=f.following_id GROUP BY pr.username ORDER BY follower_count DESC;",topic="COUNT Followers")

add("sql-292","Employees Hired on Weekday vs Weekend","HR / Employee","Wipro","medium",
"Classify each employee's hire date as 'Weekday' or 'Weekend'.\n\nReturn name, hire_date, day_type. Order by hire_date.",
"strftime('%w') returns 0=Sun, 6=Sat.",
"Check each hire date's day of week.",
EMP_T,EMP_S,(["name","hire_date","day_type"],[["Alice","2019-01-15","Weekday"],["Bob","2020-03-01","Weekend"],["Charlie","2020-06-10","Weekday"],["Diana","2021-01-20","Weekday"],["Eve","2021-08-05","Weekday"],["Frank","2022-02-14","Weekday"]]),
"SELECT name,hire_date,CASE WHEN CAST(strftime('%w',hire_date)AS INT) IN(0,6) THEN 'Weekend' ELSE 'Weekday' END AS day_type FROM employees ORDER BY hire_date;",topic="Day-of-Week Classification")

add("sql-293","Customers Who Ordered in All 3 Months","E-Commerce (Flipkart)","Wipro","hard",
"Find customers who placed orders in all three months (Jan, Feb, Mar 2024).\n\nReturn name. Order by name.",
"HAVING COUNT(DISTINCT month) = 3.",
"Check if any customer ordered in all 3 months.",
ECOM_T,ECOM_S,(["name"],[]),
"SELECT c.name FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name HAVING COUNT(DISTINCT SUBSTR(o.order_date,1,7))=3 ORDER BY c.name;",topic="HAVING DISTINCT Months")

add("sql-294","Students Enrolled in 2+ Courses","University / Education","Wipro","medium",
"Find students enrolled in 2 or more courses.\n\nReturn student name, course_count. Order by course_count DESC.",
"JOIN students + enrollments, GROUP BY, HAVING COUNT >= 2.",
"Students with multiple enrollments.",
UNI_T,UNI_S,(["name","course_count"],[]),
"SELECT s.name,COUNT(e.id)AS course_count FROM students s JOIN enrollments e ON s.id=e.student_id GROUP BY s.name HAVING COUNT(e.id)>=2 ORDER BY course_count DESC;",topic="HAVING Multi-Enrollment")

add("sql-295","Hired Weekday Distribution","HR / Employee","Wipro","medium",
"Count how many employees were hired on each day of the week.\n\nReturn day_name, hire_count. Order by hire_count DESC.",
"CASE strftime('%w') for day names, GROUP BY.",
"Distribution of hires across days.",
EMP_T,EMP_S,(["day_name","hire_count"],[]),
"SELECT CASE CAST(strftime('%w',hire_date)AS INT) WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday' WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday' END AS day_name,COUNT(*)AS hire_count FROM employees GROUP BY day_name ORDER BY hire_count DESC;",topic="Day Distribution")

# --- HCLTech (5 of 23 needed) ---
add("sql-296","Top 5 Highest Paid Employees","HR / Employee","HCLTech","easy",
"Find the 5 highest-paid employees.\n\nReturn name, salary. Order by salary DESC.",
"ORDER BY salary DESC LIMIT 5.",
"Top 5 by salary.",
EMP_T,EMP_S,(["name","salary"],[["Alice",70000],["Eve",65000],["Bob",60000],["Charlie",55000],["Diana",50000]]),
"SELECT name,salary FROM employees ORDER BY salary DESC LIMIT 5;",topic="TOP 5 by Salary")

add("sql-297","Restaurant With Most Orders","Food Delivery (Zomato)","HCLTech","medium",
"Find the restaurant that received the most orders.\n\nReturn restaurant name, order_count.",
"JOIN restaurants + orders, COUNT, ORDER DESC LIMIT 1.",
"Restaurant with highest order volume.",
ZOMATO_T,ZOMATO_S,(["name","order_count"],[["Biryani House",3]]),
"SELECT r.name,COUNT(o.id)AS order_count FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.name ORDER BY order_count DESC LIMIT 1;",topic="Most Orders Restaurant")

add("sql-298","Patients Over Age 40","Healthcare / Hospital","HCLTech","easy",
"Find all patients older than 40.\n\nReturn name, age, gender. Order by age DESC.",
"WHERE age > 40.",
"Amit is 45.",
HOSPITAL_T,HOSPITAL_S,(["name","age","gender"],[["Amit",45,"M"]]),
"SELECT name,age,gender FROM patients WHERE age>40 ORDER BY age DESC;",topic="WHERE Age Filter")

add("sql-299","Average Fare Per Ride City","Ride-Sharing (Ola)","HCLTech","easy",
"Calculate average fare grouped by pickup city.\n\nReturn pickup, avg_fare (rounded to 0). Order by avg_fare DESC.",
"GROUP BY pickup, AVG(fare).",
"Average fare by pickup location.",
RIDE_T,RIDE_S,(["pickup","avg_fare"],[]),
"SELECT pickup,ROUND(AVG(fare),0)AS avg_fare FROM rides GROUP BY pickup ORDER BY avg_fare DESC;",topic="AVG Fare by Pickup")

add("sql-300","Products Below Average Price","E-Commerce (Flipkart)","HCLTech","medium",
"Find products whose price is below the average product price.\n\nReturn name, price. Order by price.",
"WHERE price < (SELECT AVG(price) FROM products).",
"Avg price ~40949. Cotton T-Shirt, Running Shoes, SQL Book are below.",
ECOM_T,ECOM_S,(["name","price"],[["SQL Book",450.0],["Cotton T-Shirt",799.0],["Running Shoes",3499.0]]),
"SELECT name,price FROM products WHERE price<(SELECT AVG(price) FROM products) ORDER BY price;",topic="Subquery: Below Avg Price")

# ═══ BATCH 30: HCLTech Scale-Up (10 of 23) ═══

add("sql-301","Doctors With No Appointments","Healthcare / Hospital","HCLTech","medium",
"Find doctors who have no scheduled appointments.\n\nReturn doctor name, specialty. Order by name.",
"LEFT JOIN appointments WHERE a.id IS NULL.",
"Check for doctors with zero appointments.",
HOSPITAL_T,HOSPITAL_S,(["name","specialty"],[]),
"SELECT d.name,d.specialty FROM doctors d LEFT JOIN appointments a ON d.id=a.doc_id WHERE a.id IS NULL ORDER BY d.name;",topic="LEFT JOIN: No Appointments")

add("sql-302","Customer Who Spent Most Overall","E-Commerce (Flipkart)","HCLTech","medium",
"Find the customer who spent the most money across all orders.\n\nReturn name, total_spent.",
"JOIN + SUM + ORDER DESC LIMIT 1.",
"Ankit: 2500+55000+3299=60799.",
ECOM_T,ECOM_S,(["name","total_spent"],[["Ankit",60799.0]]),
"SELECT c.name,SUM(o.total)AS total_spent FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY total_spent DESC LIMIT 1;",topic="Top Spender (SUM+LIMIT)")

add("sql-303","Rides With Mumbai Pickup","Ride-Sharing (Ola)","HCLTech","easy",
"Find all rides that started in Mumbai.\n\nReturn ride_id, pickup, dropoff, fare. Order by fare DESC.",
"WHERE pickup = 'Mumbai'.",
"Filter by pickup city.",
RIDE_T,RIDE_S,(["ride_id","pickup","dropoff","fare"],[]),
"SELECT id AS ride_id,pickup,dropoff,fare FROM rides WHERE pickup='Mumbai' ORDER BY fare DESC;",topic="WHERE Pickup City")

add("sql-304","UNION: All People in Ride System","Ride-Sharing (Ola)","HCLTech","easy",
"Create a combined list of all riders and drivers with their role.\n\nReturn name, city, role. Order by role, name.",
"UNION ALL with literal 'Rider'/'Driver'.",
"Merge both tables.",
RIDE_T,RIDE_S,(["name","city","role"],[]),
"SELECT name,city,'Driver'AS role FROM drivers UNION ALL SELECT name,city,'Rider' FROM riders ORDER BY role,name;",topic="UNION ALL Merge")

add("sql-305","Orders With Total Above 5000","E-Commerce (Flipkart)","HCLTech","easy",
"Find all orders where the total exceeds 5,000.\n\nReturn order_id, total, status. Order by total DESC.",
"WHERE total > 5000.",
"Filter high-value orders.",
ECOM_T,ECOM_S,(["order_id","total","status"],[[2,55000.0,"delivered"],[4,55450.0,"delivered"],[6,6900.0,"delivered"]]),
"SELECT id AS order_id,total,status FROM orders WHERE total>5000 ORDER BY total DESC;",topic="WHERE High-Value Orders")

add("sql-306","Latest Appointment Per Doctor","Healthcare / Hospital","HCLTech","medium",
"Find each doctor's most recent appointment date.\n\nReturn doctor name, last_visit. Order by last_visit DESC.",
"JOIN + MAX(visit_date) GROUP BY.",
"Most recent appointment per doctor.",
HOSPITAL_T,HOSPITAL_S,(["name","last_visit"],[["Dr. Gupta","2024-01-20"],["Dr. Patel","2024-01-18"],["Dr. Sharma","2024-01-15"]]),
"SELECT d.name,MAX(a.visit_date)AS last_visit FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name ORDER BY last_visit DESC;",topic="MAX Date Per Doctor")

add("sql-307","Employee Salary vs Department Average","HR / Employee","HCLTech","medium",
"Show each employee's salary compared to their department average.\n\nReturn name, salary, dept_avg (rounded to 0), diff. Order by diff DESC.",
"Window AVG(salary) OVER(PARTITION BY dept).",
"Compare individual salary to their dept average.",
EMP_T,EMP_S,(["name","salary","dept_avg","diff"],[["Alice",70000,65000,5000],["Eve",65000,65000,0],["Charlie",55000,52500,2500],["Bob",60000,65000,-5000],["Diana",50000,52500,-2500],["Frank",45000,45000,0]]),
"SELECT name,salary,ROUND(AVG(salary) OVER(PARTITION BY dept),0)AS dept_avg,salary-ROUND(AVG(salary) OVER(PARTITION BY dept),0)AS diff FROM employees ORDER BY diff DESC;",topic="Window AVG Comparison")

add("sql-308","Count Transactions Per Type","Banking / Finance","HCLTech","easy",
"Count how many credit vs debit transactions exist.\n\nReturn type, txn_count. Order by txn_count DESC.",
"GROUP BY type, COUNT.",
"Count credits and debits.",
BANK_T,BANK_S,(["type","txn_count"],[["debit",4],["credit",3]]),
"SELECT type,COUNT(*)AS txn_count FROM transactions GROUP BY type ORDER BY txn_count DESC;",topic="COUNT Per Type")

add("sql-309","Revenue Per Quarter","E-Commerce (Flipkart)","HCLTech","medium",
"Calculate total order revenue per quarter of 2024.\n\nReturn quarter, total_revenue. Order by quarter.",
"CASE month ranges for Q1/Q2/Q3/Q4.",
"All orders in Q1 2024 (Jan-Mar).",
ECOM_T,ECOM_S,(["quarter","total_revenue"],[["Q1",126898.0]]),
"SELECT 'Q'||((CAST(SUBSTR(order_date,6,2)AS INT)-1)/3+1)AS quarter,SUM(total)AS total_revenue FROM orders WHERE status!='cancelled' GROUP BY quarter ORDER BY quarter;",topic="Quarter Revenue Report")

add("sql-310","Riders Sorted by Total Fare","Ride-Sharing (Ola)","HCLTech","easy",
"Sort riders by their total fare spent across all rides.\n\nReturn rider name, total_fare. Order by total_fare DESC.",
"JOIN riders + rides, SUM(fare), ORDER BY.",
"Total ride spend per rider.",
RIDE_T,RIDE_S,(["name","total_fare"],[]),
"SELECT ri.name,SUM(r.fare)AS total_fare FROM riders ri JOIN rides r ON ri.id=r.rider_id GROUP BY ri.name ORDER BY total_fare DESC;",topic="SUM Fare Per Rider")

# ═══ BATCH 31: HCLTech Final 8 + Cognizant First 2 ═══

# --- HCLTech (8 remaining → completes to 30) ---
add("sql-311","Inactive Users (No Recent Login)","Login / Activity","HCLTech","medium",
"Find users who have not logged in since '2024-01-15'.\n\nReturn user_id, last_login. Order by last_login.",
"GROUP BY user_id, HAVING MAX(login_date) < '2024-01-15'.",
"Users whose last login was before the cutoff date.",
LOGIN_T,LOGIN_S,(["user_id","last_login"],[]),
"SELECT user_id,MAX(login_date)AS last_login FROM logins GROUP BY user_id HAVING MAX(login_date)<'2024-01-15' ORDER BY last_login;",topic="HAVING MAX Date Filter")

add("sql-312","Student Average Grade","University / Education","HCLTech","easy",
"Calculate the average grade for each student.\n\nReturn student name, avg_grade (rounded to 1). Order by avg_grade DESC.",
"JOIN students + enrollments, AVG(grade), GROUP BY.",
"Average grade per student.",
UNI_T,UNI_S,(["name","avg_grade"],[]),
"SELECT s.name,ROUND(AVG(e.grade),1)AS avg_grade FROM students s JOIN enrollments e ON s.id=e.student_id GROUP BY s.name ORDER BY avg_grade DESC;",topic="AVG Grade Per Student")

add("sql-313","Average Order Quantity Per Product","E-Commerce (Flipkart)","HCLTech","easy",
"Find the average quantity ordered per product.\n\nReturn product name, avg_qty (rounded to 1). Order by avg_qty DESC.",
"JOIN products + order_items, AVG(qty), GROUP BY.",
"Average qty per product across all orders.",
ECOM_T,ECOM_S,(["name","avg_qty"],[["SQL Book",1.5],["Cotton T-Shirt",3.0],["Running Shoes",1.5],["MacBook Pro",1.0],["iPhone 15",1.0]]),
"SELECT p.name,ROUND(AVG(oi.qty),1)AS avg_qty FROM products p JOIN order_items oi ON p.id=oi.product_id GROUP BY p.name ORDER BY avg_qty DESC;",topic="AVG Qty Per Product")

add("sql-314","Credit vs Debit Ratio Per Account","Banking / Finance","HCLTech","hard",
"For each account, show total credits, total debits, and the credit-to-debit ratio.\n\nReturn holder, total_credit, total_debit, ratio (rounded to 2). Order by ratio DESC.",
"CASE WHEN type='credit' then SUM, CASE WHEN type='debit' then SUM.",
"Calculate ratio of credits to debits per account.",
BANK_T,BANK_S,(["holder","total_credit","total_debit","ratio"],[["Meena",20000.0,15000.0,1.33],["Ravi",5000.0,5000.0,1.0],["Kavita",0.0,8000.0,0.0]]),
"SELECT a.holder,SUM(CASE WHEN t.type='credit' THEN t.amount ELSE 0 END)AS total_credit,SUM(CASE WHEN t.type='debit' THEN t.amount ELSE 0 END)AS total_debit,ROUND(CAST(SUM(CASE WHEN t.type='credit' THEN t.amount ELSE 0 END)AS FLOAT)/NULLIF(SUM(CASE WHEN t.type='debit' THEN t.amount ELSE 0 END),0),2)AS ratio FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.holder ORDER BY ratio DESC;",topic="Credit/Debit Ratio")

add("sql-315","Multi-City Restaurant Chains","Food Delivery (Zomato)","HCLTech","medium",
"Find cuisines that have restaurants in more than 1 city.\n\nReturn cuisine, city_count. Order by city_count DESC.",
"GROUP BY cuisine HAVING COUNT(DISTINCT city) > 1.",
"Cuisines present in multiple cities.",
ZOMATO_T,ZOMATO_S,(["cuisine","city_count"],[["Indian",2]]),
"SELECT cuisine,COUNT(DISTINCT city)AS city_count FROM restaurants GROUP BY cuisine HAVING COUNT(DISTINCT city)>1 ORDER BY city_count DESC;",topic="HAVING DISTINCT Cities")

add("sql-316","Posts Without Any Comments","Social Media (Instagram)","HCLTech","medium",
"Find posts that have received no comments.\n\nReturn post_id, content (first 30 chars), likes. Order by likes DESC.",
"LEFT JOIN comments WHERE comment.id IS NULL.",
"Posts with zero comments.",
SOCIAL_T,SOCIAL_S,(["post_id","content","likes"],[]),
"SELECT p.id AS post_id,SUBSTR(p.content,1,30)AS content,p.likes FROM posts p LEFT JOIN comments c ON p.id=c.post_id WHERE c.id IS NULL ORDER BY p.likes DESC;",topic="LEFT JOIN: No Comments")

add("sql-317","Consecutive ID Gaps in Employees","HR / Employee","HCLTech","hard",
"Find gaps in the employee ID sequence (missing IDs between min and max).\n\nReturn gap_start where an ID is missing. Use a self-referencing approach.",
"WHERE id+1 NOT IN (SELECT id FROM employees) AND id < MAX.",
"Check for non-consecutive IDs.",
EMP_T,EMP_S,(["gap_after"],[]),
"SELECT e1.id AS gap_after FROM employees e1 WHERE e1.id+1 NOT IN(SELECT id FROM employees) AND e1.id<(SELECT MAX(id) FROM employees) ORDER BY gap_after;",topic="ID Gap Detection")

add("sql-318","Average Experience Per Specialty","Healthcare / Hospital","HCLTech","easy",
"Calculate average years of experience per medical specialty.\n\nReturn specialty, avg_exp (rounded to 0). Order by avg_exp DESC.",
"GROUP BY specialty, AVG(experience_yrs).",
"Cardiology: 15. Orthopedics: 10. Dermatology: 5.",
HOSPITAL_T,HOSPITAL_S,(["specialty","avg_exp"],[["Cardiology",15],["Orthopedics",10],["Dermatology",5]]),
"SELECT specialty,ROUND(AVG(experience_yrs),0)AS avg_exp FROM doctors GROUP BY specialty ORDER BY avg_exp DESC;",topic="AVG Experience Per Specialty")

# --- Cognizant (2 of 22 needed) ---
add("sql-319","Employees in Sales Department","HR / Employee","Cognizant","easy",
"Find all employees in the Sales department.\n\nReturn name, salary. Order by salary DESC.",
"WHERE dept = 'Sales'.",
"Charlie(55K), Diana(50K).",
EMP_T,EMP_S,(["name","salary"],[["Charlie",55000],["Diana",50000]]),
"SELECT name,salary FROM employees WHERE dept='Sales' ORDER BY salary DESC;",topic="WHERE Department Filter")

add("sql-320","Count Appointments Per Specialty","Healthcare / Hospital","Cognizant","easy",
"Count the number of appointments for each medical specialty.\n\nReturn specialty, appt_count. Order by appt_count DESC.",
"JOIN doctors + appointments, GROUP BY specialty, COUNT.",
"Cardiology: 3, Orthopedics: 2, Dermatology: 1.",
HOSPITAL_T,HOSPITAL_S,(["specialty","appt_count"],[["Cardiology",3],["Orthopedics",2],["Dermatology",1]]),
"SELECT d.specialty,COUNT(a.id)AS appt_count FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.specialty ORDER BY appt_count DESC;",topic="COUNT Per Specialty")

# ═══ BATCH 32: Cognizant Scale-Up (10 of 22) ═══

add("sql-321","Highest Single Order Total","E-Commerce (Flipkart)","Cognizant","easy",
"Find the single highest order total.\n\nReturn order_id, total.",
"ORDER BY total DESC LIMIT 1 or SELECT MAX(total).",
"Highest order by total value.",
ECOM_T,ECOM_S,(["order_id","total"],[[4,55450.0]]),
"SELECT id AS order_id,total FROM orders ORDER BY total DESC LIMIT 1;",topic="MAX Order Total")

add("sql-322","Riders From Delhi","Ride-Sharing (Ola)","Cognizant","easy",
"Find all riders who live in Delhi.\n\nReturn name, phone. Order by name.",
"WHERE city = 'Delhi'.",
"Bhavna, Eshan from Delhi.",
RIDE_T,RIDE_S,(["name","phone"],[]),
"SELECT name,phone FROM riders WHERE city='Delhi' ORDER BY name;",topic="WHERE City Filter")

add("sql-323","Products Sorted by Price Descending","E-Commerce (Flipkart)","Cognizant","easy",
"List all products sorted by price from highest to lowest.\n\nReturn name, category, price. Order by price DESC.",
"Simple ORDER BY price DESC.",
"MacBook(120K), iPhone(80K), etc.",
ECOM_T,ECOM_S,(["name","category","price"],[["MacBook Pro","Electronics",120000.0],["iPhone 15","Electronics",79999.0],["Running Shoes","Fashion",3499.0],["Cotton T-Shirt","Fashion",799.0],["SQL Book","Books",450.0]]),
"SELECT name,category,price FROM products ORDER BY price DESC;",topic="ORDER BY Price DESC")

add("sql-324","First Employee Hired","HR / Employee","Cognizant","easy",
"Find the employee who was hired first.\n\nReturn name, hire_date.",
"ORDER BY hire_date LIMIT 1.",
"Alice was hired on 2019-01-15.",
EMP_T,EMP_S,(["name","hire_date"],[["Alice","2019-01-15"]]),
"SELECT name,hire_date FROM employees ORDER BY hire_date LIMIT 1;",topic="Earliest Hire (LIMIT)")

add("sql-325","Average Patient Age Per Gender","Healthcare / Hospital","Cognizant","easy",
"Calculate the average patient age for each gender.\n\nReturn gender, avg_age (rounded to 0). Order by gender.",
"GROUP BY gender, AVG(age).",
"F avg, M avg.",
HOSPITAL_T,HOSPITAL_S,(["gender","avg_age"],[["F",30],["M",38]]),
"SELECT gender,ROUND(AVG(age),0)AS avg_age FROM patients GROUP BY gender ORDER BY gender;",topic="AVG Age Per Gender")

add("sql-326","Orders With Multiple Line Items","E-Commerce (Flipkart)","Cognizant","medium",
"Find orders that contain more than 1 line item.\n\nReturn order_id, item_count. Order by item_count DESC.",
"GROUP BY order_id HAVING COUNT > 1.",
"Orders with multiple products.",
ECOM_T,ECOM_S,(["order_id","item_count"],[[2,3],[4,2]]),
"SELECT order_id,COUNT(*)AS item_count FROM order_items GROUP BY order_id HAVING COUNT(*)>1 ORDER BY item_count DESC;",topic="HAVING Multiple Items")

add("sql-327","Rank Restaurants by Rating","Food Delivery (Zomato)","Cognizant","medium",
"Rank all restaurants by rating using DENSE_RANK.\n\nReturn name, rating, rating_rank. Order by rating_rank.",
"DENSE_RANK() OVER(ORDER BY rating DESC).",
"Dosa Corner=1, Biryani House=2, etc.",
ZOMATO_T,ZOMATO_S,(["name","rating","rating_rank"],[["Dosa Corner",4.7,1],["Biryani House",4.5,2],["Pizza Palace",4.2,3],["Dragon Wok",3.8,4],["Burger Barn",3.5,5]]),
"SELECT name,rating,DENSE_RANK() OVER(ORDER BY rating DESC)AS rating_rank FROM restaurants ORDER BY rating_rank;",topic="DENSE_RANK Restaurants")

add("sql-328","Employees Earning 50K to 65K","HR / Employee","Cognizant","easy",
"Find employees with salary between 50,000 and 65,000.\n\nReturn name, dept, salary. Order by salary.",
"WHERE salary BETWEEN 50000 AND 65000.",
"Diana, Charlie, Bob, Eve.",
EMP_T,EMP_S,(["name","dept","salary"],[["Diana","Sales",50000],["Charlie","Sales",55000],["Bob","Eng",60000],["Eve","Eng",65000]]),
"SELECT name,dept,salary FROM employees WHERE salary BETWEEN 50000 AND 65000 ORDER BY salary;",topic="BETWEEN Salary Range")

add("sql-329","Full Order Details (3-Table Join)","E-Commerce (Flipkart)","Cognizant","medium",
"Show order details: customer name, product name, quantity, order date.\n\nReturn name, product, qty, order_date. Order by order_date, name.",
"3-table join: orders -> order_items -> products + customers.",
"Full order detail view.",
ECOM_T,ECOM_S,(["name","product","qty","order_date"],[]),
"SELECT c.name,p.name AS product,oi.qty,o.order_date FROM customers c JOIN orders o ON c.id=o.customer_id JOIN order_items oi ON o.id=oi.order_id JOIN products p ON oi.product_id=p.id ORDER BY o.order_date,c.name;",topic="3-Table Order Details")

add("sql-330","Total Rides Per Month","Ride-Sharing (Ola)","Cognizant","medium",
"Count total rides per month.\n\nReturn month, ride_count. Order by month.",
"SUBSTR(ride_date,1,7) GROUP BY, COUNT.",
"Group rides by year-month.",
RIDE_T,RIDE_S,(["month","ride_count"],[]),
"SELECT SUBSTR(ride_date,1,7)AS month,COUNT(*)AS ride_count FROM rides GROUP BY SUBSTR(ride_date,1,7) ORDER BY month;",topic="Monthly Ride Count")

# ═══ BATCH 33: Cognizant Final 10 — COMPLETES to 30 ═══

add("sql-331","Running Count of Orders","E-Commerce (Flipkart)","Cognizant","medium",
"Show a running count of orders by order date.\n\nReturn order_id, order_date, running_count. Order by order_date.",
"COUNT(*) OVER(ORDER BY order_date).",
"Cumulative order count.",
ECOM_T,ECOM_S,(["order_id","order_date","running_count"],[[1,"2024-01-10",1],[2,"2024-01-15",3],[3,"2024-01-15",3],[4,"2024-02-20",4],[5,"2024-03-15",7],[6,"2024-03-10",5],[7,"2024-03-15",7]]),
"SELECT id AS order_id,order_date,COUNT(*) OVER(ORDER BY order_date)AS running_count FROM orders ORDER BY order_date;",topic="Window Running COUNT")

add("sql-332","Second Cheapest Product","E-Commerce (Flipkart)","Cognizant","medium",
"Find the second cheapest product.\n\nReturn name, price.",
"DENSE_RANK OVER(ORDER BY price ASC), filter rank=2.",
"Cheapest=SQL Book(450), 2nd=Cotton T-Shirt(799).",
ECOM_T,ECOM_S,(["name","price"],[["Cotton T-Shirt",799.0]]),
"SELECT name,price FROM(SELECT name,price,DENSE_RANK() OVER(ORDER BY price ASC)AS rk FROM products)t WHERE rk=2;",topic="2nd Cheapest (DENSE_RANK)")

add("sql-333","Total Fare Collected Per City","Ride-Sharing (Ola)","Cognizant","easy",
"Calculate total fare revenue per pickup city.\n\nReturn pickup, total_fare. Order by total_fare DESC.",
"GROUP BY pickup, SUM(fare).",
"Sum fares by pickup city.",
RIDE_T,RIDE_S,(["pickup","total_fare"],[]),
"SELECT pickup,SUM(fare)AS total_fare FROM rides GROUP BY pickup ORDER BY total_fare DESC;",topic="SUM Fare Per City")

add("sql-334","Accounts With Balance Above 50K","Banking / Finance","Cognizant","easy",
"Find bank accounts with balance exceeding 50,000.\n\nReturn holder, balance. Order by balance DESC.",
"WHERE balance > 50000.",
"High-balance accounts.",
BANK_T,BANK_S,(["holder","balance"],[["Meena",150000.0],["Ravi",75000.0]]),
"SELECT holder,balance FROM accounts WHERE balance>50000 ORDER BY balance DESC;",topic="WHERE Balance Filter")

add("sql-335","Employee Name Length","HR / Employee","Cognizant","easy",
"Show each employee's name and the length of their name.\n\nReturn name, name_len. Order by name_len DESC, name.",
"LENGTH(name).",
"Charlie=7, Diana=5, Alice=5, Frank=5, Bob=3, Eve=3.",
EMP_T,EMP_S,(["name","name_len"],[["Charlie",7],["Alice",5],["Diana",5],["Frank",5],["Bob",3],["Eve",3]]),
"SELECT name,LENGTH(name)AS name_len FROM employees ORDER BY name_len DESC,name;",topic="LENGTH() Function")

add("sql-336","Student GPA Classification","University / Education","Cognizant","easy",
"Classify students by GPA: 'Distinction' (>=3.5), 'First Class' (>=3.0), 'Second Class' (others).\n\nReturn name, gpa, classification. Order by gpa DESC.",
"CASE WHEN gpa >= 3.5 THEN 'Distinction'...",
"GPA-based classification.",
UNI_T,UNI_S,(["name","gpa","classification"],[]),
"SELECT name,gpa,CASE WHEN gpa>=3.5 THEN 'Distinction' WHEN gpa>=3.0 THEN 'First Class' ELSE 'Second Class' END AS classification FROM students ORDER BY gpa DESC;",topic="CASE GPA Tiers")

add("sql-337","Users Who Both Posted and Commented","Social Media (Instagram)","Cognizant","medium",
"Find users who have both created a post AND left a comment.\n\nReturn username. Order by username.",
"EXISTS in posts AND EXISTS in comments.",
"Users active in both content creation and engagement.",
SOCIAL_T,SOCIAL_S,(["username"],[]),
"SELECT DISTINCT pr.username FROM profiles pr WHERE EXISTS(SELECT 1 FROM posts p WHERE p.user_id=pr.id) AND EXISTS(SELECT 1 FROM comments c WHERE c.user_id=pr.id) ORDER BY pr.username;",topic="EXISTS Both Tables")

add("sql-338","Order Status Distribution","E-Commerce (Flipkart)","Cognizant","easy",
"Count orders by their status.\n\nReturn status, order_count. Order by order_count DESC.",
"GROUP BY status, COUNT.",
"delivered, shipped, cancelled counts.",
ECOM_T,ECOM_S,(["status","order_count"],[["delivered",5],["shipped",1],["cancelled",1]]),
"SELECT status,COUNT(*)AS order_count FROM orders GROUP BY status ORDER BY order_count DESC;",topic="COUNT Per Status")

add("sql-339","Customer Order Frequency Label","E-Commerce (Flipkart)","Cognizant","medium",
"Label customers as 'Power User' (3+), 'Active' (2), or 'Casual' (1) based on order count.\n\nReturn name, orders, label. Order by orders DESC.",
"CASE on COUNT of orders.",
"Ankit=3(Power), others=1(Casual).",
ECOM_T,ECOM_S,(["name","orders","label"],[["Ankit",3,"Power User"],["Priya",1,"Casual"],["Rohan",1,"Casual"],["Sneha",1,"Casual"],["Vikram",1,"Casual"]]),
"SELECT c.name,COUNT(o.id)AS orders,CASE WHEN COUNT(o.id)>=3 THEN 'Power User' WHEN COUNT(o.id)=2 THEN 'Active' ELSE 'Casual' END AS label FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY orders DESC;",topic="CASE Frequency Label")

add("sql-340","Doctors Treating Multiple Patients","Healthcare / Hospital","Cognizant","medium",
"Find doctors who have treated 2 or more unique patients.\n\nReturn doctor name, patient_count. Order by patient_count DESC.",
"GROUP BY doc_id HAVING COUNT(DISTINCT patient_id) >= 2.",
"Dr. Sharma and Dr. Patel each treated 2 patients.",
HOSPITAL_T,HOSPITAL_S,(["name","patient_count"],[["Dr. Sharma",2],["Dr. Patel",2]]),
"SELECT d.name,COUNT(DISTINCT a.patient_id)AS patient_count FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name HAVING COUNT(DISTINCT a.patient_id)>=2 ORDER BY patient_count DESC;",topic="HAVING DISTINCT Patients")

# ═══ BATCH 34: Accenture Scale-Up (10 of 21) ═══

add("sql-341","Customer Full Order History","E-Commerce (Flipkart)","Accenture","medium",
"Show each customer's order count, total spent, and average order value.\n\nReturn name, orders, total_spent, avg_order. Order by total_spent DESC.",
"JOIN + GROUP BY + COUNT + SUM + AVG.",
"Comprehensive customer summary.",
ECOM_T,ECOM_S,(["name","orders","total_spent","avg_order"],[["Ankit",3,60799.0,20266],["Rohan",1,55450.0,55450],["Sneha",1,6900.0,6900],["Priya",1,3299.0,3299],["Vikram",1,450.0,450]]),
"SELECT c.name,COUNT(o.id)AS orders,SUM(o.total)AS total_spent,ROUND(AVG(o.total),0)AS avg_order FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name ORDER BY total_spent DESC;",topic="Customer Summary Report")

add("sql-342","Highest Rated Restaurant Per City","Food Delivery (Zomato)","Accenture","medium",
"Find the highest-rated restaurant in each city.\n\nReturn city, name, rating. Order by city.",
"ROW_NUMBER PARTITION BY city ORDER BY rating DESC, rn=1.",
"Best restaurant per city.",
ZOMATO_T,ZOMATO_S,(["city","name","rating"],[["Bangalore","Burger Barn",3.5],["Chennai","Dosa Corner",4.7],["Delhi","Pizza Palace",4.2],["Kolkata","Dragon Wok",3.8],["Mumbai","Biryani House",4.5]]),
"SELECT city,name,rating FROM(SELECT city,name,rating,ROW_NUMBER() OVER(PARTITION BY city ORDER BY rating DESC)AS rn FROM restaurants)t WHERE rn=1 ORDER BY city;",topic="Top Per City (Window)")

add("sql-343","Employee Salary Quartile","HR / Employee","Accenture","hard",
"Divide employees into 4 salary quartiles using NTILE.\n\nReturn name, salary, quartile. Order by quartile, salary DESC.",
"NTILE(4) OVER(ORDER BY salary DESC).",
"Split 6 employees into 4 quartiles.",
EMP_T,EMP_S,(["name","salary","quartile"],[["Alice",70000,1],["Eve",65000,1],["Bob",60000,2],["Charlie",55000,2],["Diana",50000,3],["Frank",45000,4]]),
"SELECT name,salary,NTILE(4) OVER(ORDER BY salary DESC)AS quartile FROM employees ORDER BY quartile,salary DESC;",topic="NTILE Quartile")

add("sql-344","Total Revenue Per Product","E-Commerce (Flipkart)","Accenture","medium",
"Calculate total revenue per product (price × quantity sold).\n\nReturn product name, total_revenue. Order by total_revenue DESC.",
"JOIN products + order_items, SUM(price * qty).",
"Revenue = price × total qty across all orders.",
ECOM_T,ECOM_S,(["name","total_revenue"],[["MacBook Pro",240000.0],["iPhone 15",239997.0],["Running Shoes",10497.0],["Cotton T-Shirt",2397.0],["SQL Book",1350.0]]),
"SELECT p.name,SUM(p.price*oi.qty)AS total_revenue FROM products p JOIN order_items oi ON p.id=oi.product_id GROUP BY p.name ORDER BY total_revenue DESC;",topic="Revenue = Price × Qty")

add("sql-345","Most Popular Cuisine","Food Delivery (Zomato)","Accenture","easy",
"Find the cuisine with the most restaurants.\n\nReturn cuisine, count.",
"GROUP BY cuisine, COUNT, ORDER DESC LIMIT 1.",
"Indian has 2 restaurants.",
ZOMATO_T,ZOMATO_S,(["cuisine","count"],[["Indian",2]]),
"SELECT cuisine,COUNT(*)AS count FROM restaurants GROUP BY cuisine ORDER BY count DESC LIMIT 1;",topic="Most Popular (COUNT+LIMIT)")

add("sql-346","Orders Placed on Same Date","E-Commerce (Flipkart)","Accenture","medium",
"Find dates where multiple orders were placed.\n\nReturn order_date, order_count. Order by order_count DESC.",
"GROUP BY order_date HAVING COUNT > 1.",
"Jan 15: 2 orders. Mar 15: 2 orders.",
ECOM_T,ECOM_S,(["order_date","order_count"],[["2024-01-15",2],["2024-03-15",2]]),
"SELECT order_date,COUNT(*)AS order_count FROM orders GROUP BY order_date HAVING COUNT(*)>1 ORDER BY order_count DESC;",topic="HAVING Same-Date Orders")

add("sql-347","Account Balance Summary","Banking / Finance","Accenture","hard",
"Show each account's balance, total credits, total debits, and net balance.\n\nReturn holder, balance, credits, debits, net. Order by net DESC.",
"CASE credit/debit SUM + balance calculation.",
"Full account financial summary.",
BANK_T,BANK_S,(["holder","balance","credits","debits","net"],[["Meena",150000.0,20000.0,15000.0,5000.0],["Ravi",75000.0,5000.0,5000.0,0.0],["Kavita",30000.0,0.0,8000.0,-8000.0]]),
"SELECT a.holder,a.balance,SUM(CASE WHEN t.type='credit' THEN t.amount ELSE 0 END)AS credits,SUM(CASE WHEN t.type='debit' THEN t.amount ELSE 0 END)AS debits,SUM(CASE WHEN t.type='credit' THEN t.amount ELSE -t.amount END)AS net FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.holder,a.balance ORDER BY net DESC;",topic="Account Balance Summary")

add("sql-348","Employee Name Starting With Vowel","HR / Employee","Accenture","easy",
"Find employees whose name starts with a vowel (A, E, I, O, U).\n\nReturn name, dept. Order by name.",
"WHERE SUBSTR(name,1,1) IN ('A','E','I','O','U').",
"Alice, Eve start with vowels.",
EMP_T,EMP_S,(["name","dept"],[["Alice","Eng"],["Eve","Eng"]]),
"SELECT name,dept FROM employees WHERE SUBSTR(UPPER(name),1,1) IN('A','E','I','O','U') ORDER BY name;",topic="Vowel Start Filter")

add("sql-349","Top 3 Products by Revenue","E-Commerce (Flipkart)","Accenture","medium",
"Find the top 3 products by total revenue.\n\nReturn product name, total_revenue. Order by total_revenue DESC.",
"JOIN + SUM(price*qty) + LIMIT 3.",
"Top 3 revenue generators.",
ECOM_T,ECOM_S,(["name","total_revenue"],[["MacBook Pro",240000.0],["iPhone 15",239997.0],["Running Shoes",10497.0]]),
"SELECT p.name,SUM(p.price*oi.qty)AS total_revenue FROM products p JOIN order_items oi ON p.id=oi.product_id GROUP BY p.name ORDER BY total_revenue DESC LIMIT 3;",topic="Top 3 by Revenue")

add("sql-350","Patients Treated by Multiple Doctors","Healthcare / Hospital","Accenture","medium",
"Find patients who have been treated by more than 1 different doctor.\n\nReturn patient name, doctor_count. Order by doctor_count DESC.",
"GROUP BY patient_id HAVING COUNT(DISTINCT doc_id) > 1.",
"Amit has seen Dr. Sharma and Dr. Patel.",
HOSPITAL_T,HOSPITAL_S,(["name","doctor_count"],[["Amit",2]]),
"SELECT p.name,COUNT(DISTINCT a.doc_id)AS doctor_count FROM patients p JOIN appointments a ON p.id=a.patient_id GROUP BY p.name HAVING COUNT(DISTINCT a.doc_id)>1 ORDER BY doctor_count DESC;",topic="HAVING Multiple Doctors")

# ═══ BATCH 35: Accenture Scale-Up 2 (10 more) ═══

add("sql-351","Employee Salary vs Previous (LAG)","HR / Employee","Accenture","hard",
"Show each employee's salary and the previous employee's salary (ordered by hire date) using LAG.\n\nReturn name, salary, prev_salary. Order by hire_date.",
"LAG(salary) OVER(ORDER BY hire_date).",
"Alice has no previous. Bob's prev is Alice's 70K.",
EMP_T,EMP_S,(["name","salary","prev_salary"],[["Alice",70000,None],["Bob",60000,70000],["Charlie",55000,60000],["Diana",50000,55000],["Eve",65000,50000],["Frank",45000,65000]]),
"SELECT name,salary,LAG(salary) OVER(ORDER BY hire_date)AS prev_salary FROM employees ORDER BY hire_date;",topic="LAG Window Function")

add("sql-352","Cheapest and Most Expensive Per Order","E-Commerce (Flipkart)","Accenture","medium",
"For each order, find the cheapest and most expensive product.\n\nReturn order_id, min_price, max_price. Order by order_id.",
"JOIN order_items+products, GROUP BY order_id, MIN/MAX price.",
"Price range within each order.",
ECOM_T,ECOM_S,(["order_id","min_price","max_price"],[]),
"SELECT oi.order_id,MIN(p.price)AS min_price,MAX(p.price)AS max_price FROM order_items oi JOIN products p ON oi.product_id=p.id GROUP BY oi.order_id ORDER BY oi.order_id;",topic="MIN/MAX Per Order")

add("sql-353","Restaurant Revenue Rank Per City","Food Delivery (Zomato)","Accenture","hard",
"Rank restaurants by revenue within their city.\n\nReturn city, name, revenue, city_rank. Order by city, city_rank.",
"DENSE_RANK PARTITION BY city ORDER BY SUM(amount) DESC.",
"Rank by revenue within each city.",
ZOMATO_T,ZOMATO_S,(["city","name","revenue","city_rank"],[]),
"SELECT city,name,revenue,DENSE_RANK() OVER(PARTITION BY city ORDER BY revenue DESC)AS city_rank FROM(SELECT r.city,r.name,SUM(o.amount)AS revenue FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.city,r.name)t ORDER BY city,city_rank;",topic="Rank Within City")

add("sql-354","Monthly Order Trend","E-Commerce (Flipkart)","Accenture","medium",
"Count orders per month and show the month-over-month difference.\n\nReturn month, orders, prev_orders, diff. Order by month.",
"LAG on monthly COUNT.",
"Monthly order count with trend.",
ECOM_T,ECOM_S,(["month","orders","prev_orders","diff"],[["2024-01",3,None,None],["2024-02",1,3,-2],["2024-03",3,1,2]]),
"SELECT month,orders,LAG(orders) OVER(ORDER BY month)AS prev_orders,orders-LAG(orders) OVER(ORDER BY month)AS diff FROM(SELECT SUBSTR(order_date,1,7)AS month,COUNT(*)AS orders FROM orders GROUP BY SUBSTR(order_date,1,7))t ORDER BY month;",topic="LAG Monthly Trend")

add("sql-355","Employee Salary Band","HR / Employee","Accenture","easy",
"Classify employees into salary bands: 'High' (>=65K), 'Medium' (>=50K), 'Low' (<50K).\n\nReturn name, salary, band. Order by salary DESC.",
"CASE WHEN salary >= 65000...",
"Alice=High, Eve=High, Bob=Medium, etc.",
EMP_T,EMP_S,(["name","salary","band"],[["Alice",70000,"High"],["Eve",65000,"High"],["Bob",60000,"Medium"],["Charlie",55000,"Medium"],["Diana",50000,"Medium"],["Frank",45000,"Low"]]),
"SELECT name,salary,CASE WHEN salary>=65000 THEN 'High' WHEN salary>=50000 THEN 'Medium' ELSE 'Low' END AS band FROM employees ORDER BY salary DESC;",topic="CASE Salary Band")

add("sql-356","Most Commented Post","Social Media (Instagram)","Accenture","medium",
"Find the post with the most comments.\n\nReturn post_id, content (first 30 chars), comment_count.",
"JOIN posts + comments, COUNT, ORDER DESC LIMIT 1.",
"Most discussed post.",
SOCIAL_T,SOCIAL_S,(["post_id","content","comment_count"],[]),
"SELECT p.id AS post_id,SUBSTR(p.content,1,30)AS content,COUNT(c.id)AS comment_count FROM posts p JOIN comments c ON p.id=c.post_id GROUP BY p.id,p.content ORDER BY comment_count DESC LIMIT 1;",topic="Most Commented (LIMIT)")

add("sql-357","Show With Most Watch Events","Streaming (Netflix)","Accenture","easy",
"Find the show that has been watched the most times.\n\nReturn title, watch_count.",
"JOIN shows + watch_history, COUNT, ORDER DESC LIMIT 1.",
"Most watched show.",
STREAM_T,STREAM_S,(["title","watch_count"],[]),
"SELECT s.title,COUNT(w.id)AS watch_count FROM shows s JOIN watch_history w ON s.id=w.show_id GROUP BY s.title ORDER BY watch_count DESC LIMIT 1;",topic="Most Watched Show")

add("sql-358","Cumulative Account Balance","Banking / Finance","Accenture","hard",
"Show running balance per account: add credits, subtract debits.\n\nReturn holder, txn_date, type, amount, running_bal. Order by holder, txn_date.",
"SUM(CASE credit/debit) OVER(PARTITION BY acc_id ORDER BY txn_date).",
"Running balance tracking.",
BANK_T,BANK_S,(["holder","txn_date","type","amount","running_bal"],[]),
"SELECT a.holder,t.txn_date,t.type,t.amount,SUM(CASE WHEN t.type='credit' THEN t.amount ELSE -t.amount END) OVER(PARTITION BY a.id ORDER BY t.txn_date)AS running_bal FROM accounts a JOIN transactions t ON a.id=t.acc_id ORDER BY a.holder,t.txn_date;",topic="Running Balance Window")

add("sql-359","Driver Ride Count Rank","Ride-Sharing (Ola)","Accenture","medium",
"Rank drivers by their total number of completed rides.\n\nReturn driver name, ride_count, driver_rank. Order by driver_rank.",
"DENSE_RANK on COUNT of rides.",
"Rank drivers by ride volume.",
RIDE_T,RIDE_S,(["name","ride_count","driver_rank"],[]),
"SELECT name,ride_count,DENSE_RANK() OVER(ORDER BY ride_count DESC)AS driver_rank FROM(SELECT d.name,COUNT(r.id)AS ride_count FROM drivers d JOIN rides r ON d.id=r.driver_id GROUP BY d.name)t ORDER BY driver_rank;",topic="DENSE_RANK Driver Rides")

add("sql-360","Customers Without Any Orders","E-Commerce (Flipkart)","Accenture","easy",
"Find customers who have never placed an order.\n\nReturn name, city. Order by name.",
"LEFT JOIN orders WHERE o.id IS NULL.",
"Check for customers with zero orders.",
ECOM_T,ECOM_S,(["name","city"],[]),
"SELECT c.name,c.city FROM customers c LEFT JOIN orders o ON c.id=o.customer_id WHERE o.id IS NULL ORDER BY c.name;",topic="LEFT JOIN: No Orders")

# ═══ BATCH 36: Accenture Final 1 + Capgemini 9 ═══

# --- Accenture (1 remaining → completes to 30) ---
add("sql-361","Salary Difference From Company Average","HR / Employee","Accenture","medium",
"Show each employee's salary difference from the company-wide average.\n\nReturn name, salary, company_avg, diff. Order by diff DESC.",
"salary - AVG(salary) OVER().",
"Compare individual to company average.",
EMP_T,EMP_S,(["name","salary","company_avg","diff"],[["Alice",70000,57500,12500],["Eve",65000,57500,7500],["Bob",60000,57500,2500],["Charlie",55000,57500,-2500],["Diana",50000,57500,-7500],["Frank",45000,57500,-12500]]),
"SELECT name,salary,ROUND(AVG(salary) OVER(),0)AS company_avg,salary-ROUND(AVG(salary) OVER(),0)AS diff FROM employees ORDER BY diff DESC;",topic="Window AVG() OVER()")

# --- Capgemini (9 of 23 needed) ---
add("sql-362","Employees Hired After 2020","HR / Employee","Capgemini","easy",
"Find employees hired after January 1, 2020.\n\nReturn name, hire_date, dept. Order by hire_date.",
"WHERE hire_date > '2020-01-01'.",
"Bob, Charlie, Diana, Eve, Frank.",
EMP_T,EMP_S,(["name","hire_date","dept"],[["Bob","2020-03-01","Eng"],["Charlie","2020-06-10","Sales"],["Diana","2021-01-20","Sales"],["Eve","2021-08-05","Eng"],["Frank","2022-02-14","HR"]]),
"SELECT name,hire_date,dept FROM employees WHERE hire_date>'2020-01-01' ORDER BY hire_date;",topic="WHERE Date After")

add("sql-363","Total Quantity Sold Per Product","E-Commerce (Flipkart)","Capgemini","easy",
"Find total quantity sold for each product.\n\nReturn product name, total_qty. Order by total_qty DESC.",
"JOIN products + order_items, SUM(qty), GROUP BY.",
"Total units sold per product.",
ECOM_T,ECOM_S,(["name","total_qty"],[["Cotton T-Shirt",3],["iPhone 15",3],["SQL Book",3],["MacBook Pro",2],["Running Shoes",3]]),
"SELECT p.name,SUM(oi.qty)AS total_qty FROM products p JOIN order_items oi ON p.id=oi.product_id GROUP BY p.name ORDER BY total_qty DESC;",topic="SUM Qty Per Product")

add("sql-364","Patients With Multiple Appointments","Healthcare / Hospital","Capgemini","medium",
"Find patients who have had more than 1 appointment.\n\nReturn patient name, appt_count. Order by appt_count DESC.",
"GROUP BY patient_id HAVING COUNT > 1.",
"Amit=2, Rahul=2 appointments.",
HOSPITAL_T,HOSPITAL_S,(["name","appt_count"],[["Amit",2],["Rahul",2]]),
"SELECT p.name,COUNT(a.id)AS appt_count FROM patients p JOIN appointments a ON p.id=a.patient_id GROUP BY p.name HAVING COUNT(a.id)>1 ORDER BY appt_count DESC;",topic="HAVING Multiple Appts")

add("sql-365","Restaurant City Distribution","Food Delivery (Zomato)","Capgemini","easy",
"Count restaurants per city.\n\nReturn city, restaurant_count. Order by restaurant_count DESC.",
"GROUP BY city, COUNT.",
"Each city has 1 restaurant.",
ZOMATO_T,ZOMATO_S,(["city","restaurant_count"],[["Bangalore",1],["Chennai",1],["Delhi",1],["Kolkata",1],["Mumbai",1]]),
"SELECT city,COUNT(*)AS restaurant_count FROM restaurants GROUP BY city ORDER BY restaurant_count DESC;",topic="COUNT Per City")

add("sql-366","Employee Salary Cumulative Percent","HR / Employee","Capgemini","hard",
"Show each employee's salary as a percentage of the total payroll.\n\nReturn name, salary, pct_of_total (rounded to 1). Order by pct_of_total DESC.",
"salary * 100.0 / SUM(salary) OVER().",
"Alice: 70K/345K = 20.3%.",
EMP_T,EMP_S,(["name","salary","pct_of_total"],[["Alice",70000,20.3],["Eve",65000,18.8],["Bob",60000,17.4],["Charlie",55000,15.9],["Diana",50000,14.5],["Frank",45000,13.0]]),
"SELECT name,salary,ROUND(salary*100.0/SUM(salary) OVER(),1)AS pct_of_total FROM employees ORDER BY pct_of_total DESC;",topic="Percent of Total (Window)")

add("sql-367","Orders With Electronics Only","E-Commerce (Flipkart)","Capgemini","hard",
"Find orders that contain ONLY electronics products (no other category).\n\nReturn order_id. Order by order_id.",
"NOT EXISTS non-electronics items in that order.",
"Orders with all items in Electronics category.",
ECOM_T,ECOM_S,(["order_id"],[]),
"SELECT DISTINCT oi.order_id FROM order_items oi WHERE NOT EXISTS(SELECT 1 FROM order_items oi2 JOIN products p ON oi2.product_id=p.id WHERE oi2.order_id=oi.order_id AND p.category!='Electronics') ORDER BY oi.order_id;",topic="NOT EXISTS: Exclusive Category")

add("sql-368","Average Rating vs City Average","Food Delivery (Zomato)","Capgemini","medium",
"For each restaurant, show its rating and the average rating of its city.\n\nReturn name, city, rating, city_avg (rounded to 1). Order by name.",
"AVG(rating) OVER(PARTITION BY city).",
"Compare restaurant to its city peers.",
ZOMATO_T,ZOMATO_S,(["name","city","rating","city_avg"],[["Biryani House","Mumbai",4.5,4.5],["Burger Barn","Bangalore",3.5,3.5],["Dosa Corner","Chennai",4.7,4.7],["Dragon Wok","Kolkata",3.8,3.8],["Pizza Palace","Delhi",4.2,4.2]]),
"SELECT name,city,rating,ROUND(AVG(rating) OVER(PARTITION BY city),1)AS city_avg FROM restaurants ORDER BY name;",topic="Window AVG Per City")

add("sql-369","Riders Who Never Took a Ride","Ride-Sharing (Ola)","Capgemini","medium",
"Find riders who have never taken a ride.\n\nReturn name, city. Order by name.",
"LEFT JOIN rides WHERE ride.id IS NULL.",
"Riders with zero ride records.",
RIDE_T,RIDE_S,(["name","city"],[]),
"SELECT ri.name,ri.city FROM riders ri LEFT JOIN rides r ON ri.id=r.rider_id WHERE r.id IS NULL ORDER BY ri.name;",topic="LEFT JOIN: No Rides")

add("sql-370","Doctors With Below-Average Fees","Healthcare / Hospital","Capgemini","medium",
"Find doctors whose average appointment fee is below the overall average fee.\n\nReturn doctor name, avg_fee (rounded to 0). Order by avg_fee.",
"HAVING AVG(fee) < (SELECT AVG(fee) FROM appointments).",
"Compare per-doctor avg to overall avg.",
HOSPITAL_T,HOSPITAL_S,(["name","avg_fee"],[["Dr. Gupta",400]]),
"SELECT d.name,ROUND(AVG(a.fee),0)AS avg_fee FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name HAVING AVG(a.fee)<(SELECT AVG(fee) FROM appointments) ORDER BY avg_fee;",topic="HAVING vs Global AVG")

# ═══ BATCH 37: Capgemini Scale-Up (10 of 14) ═══

add("sql-371","Order Size Classification","E-Commerce (Flipkart)","Capgemini","easy",
"Classify orders: 'Small' (<1000), 'Medium' (1000-10000), 'Large' (>10000).\n\nReturn order_id, total, size. Order by total DESC.",
"CASE WHEN total > 10000 THEN 'Large'...",
"55450=Large, 55000=Large, 6900=Medium, etc.",
ECOM_T,ECOM_S,(["order_id","total","size"],[[4,55450.0,"Large"],[2,55000.0,"Large"],[6,6900.0,"Medium"],[3,3299.0,"Medium"],[1,2500.0,"Medium"],[5,450.0,"Small"],[7,3299.0,"Medium"]]),
"SELECT id AS order_id,total,CASE WHEN total>10000 THEN 'Large' WHEN total>=1000 THEN 'Medium' ELSE 'Small' END AS size FROM orders ORDER BY total DESC;",topic="CASE Order Size")

add("sql-372","Unique Diagnoses in Hospital","Healthcare / Hospital","Capgemini","easy",
"List all unique diagnoses recorded in appointments.\n\nReturn diagnosis. Order by diagnosis.",
"SELECT DISTINCT diagnosis.",
"All unique medical conditions.",
HOSPITAL_T,HOSPITAL_S,(["diagnosis"],[["Back Pain"],["Flu"],["Heart Checkup"],["Hypertension"],["Skin Allergy"],["Sprain"]]),
"SELECT DISTINCT diagnosis FROM appointments ORDER BY diagnosis;",topic="DISTINCT Diagnoses")

add("sql-373","Employee Row Number by Hire Date","HR / Employee","Capgemini","easy",
"Assign row numbers to employees ordered by hire date.\n\nReturn row_num, name, hire_date. Order by row_num.",
"ROW_NUMBER() OVER(ORDER BY hire_date).",
"Sequential numbering by seniority.",
EMP_T,EMP_S,(["row_num","name","hire_date"],[[1,"Alice","2019-01-15"],[2,"Bob","2020-03-01"],[3,"Charlie","2020-06-10"],[4,"Diana","2021-01-20"],[5,"Eve","2021-08-05"],[6,"Frank","2022-02-14"]]),
"SELECT ROW_NUMBER() OVER(ORDER BY hire_date)AS row_num,name,hire_date FROM employees ORDER BY row_num;",topic="ROW_NUMBER by Seniority")

add("sql-374","Days Between Restaurant Orders","Food Delivery (Zomato)","Capgemini","hard",
"For each order, show the number of days since the previous order (for the same restaurant).\n\nReturn restaurant name, order_date, days_gap. Order by name, order_date.",
"LAG(order_date) OVER(PARTITION BY rest_id ORDER BY order_date).",
"Track order frequency per restaurant.",
ZOMATO_T,ZOMATO_S,(["name","order_date","days_gap"],[]),
"SELECT r.name,o.order_date,CAST(JULIANDAY(o.order_date)-JULIANDAY(LAG(o.order_date) OVER(PARTITION BY o.rest_id ORDER BY o.order_date))AS INT)AS days_gap FROM orders o JOIN restaurants r ON o.rest_id=r.id ORDER BY r.name,o.order_date;",topic="LAG Date Gap Per Group")

add("sql-375","Top Rider by Total Spend","Ride-Sharing (Ola)","Capgemini","easy",
"Find the rider who spent the most on rides.\n\nReturn name, total_spent.",
"JOIN + SUM + ORDER DESC LIMIT 1.",
"Highest total fare across all rides.",
RIDE_T,RIDE_S,(["name","total_spent"],[]),
"SELECT ri.name,SUM(r.fare)AS total_spent FROM riders ri JOIN rides r ON ri.id=r.rider_id GROUP BY ri.name ORDER BY total_spent DESC LIMIT 1;",topic="Top Rider Spend")

add("sql-376","Average Salary by Hire Year","HR / Employee","Capgemini","medium",
"Calculate average salary per hire year.\n\nReturn hire_year, avg_salary (rounded to 0). Order by hire_year.",
"SUBSTR(hire_date,1,4) GROUP BY, AVG.",
"Average salary grouped by year of hire.",
EMP_T,EMP_S,(["hire_year","avg_salary"],[["2019",70000],["2020",57500],["2021",57500],["2022",45000]]),
"SELECT SUBSTR(hire_date,1,4)AS hire_year,ROUND(AVG(salary),0)AS avg_salary FROM employees GROUP BY SUBSTR(hire_date,1,4) ORDER BY hire_year;",topic="AVG Per Hire Year")

add("sql-377","Cheapest Product in Each Order","E-Commerce (Flipkart)","Capgemini","medium",
"Find the cheapest product in each order.\n\nReturn order_id, product name, price. Order by order_id.",
"ROW_NUMBER PARTITION BY order_id ORDER BY price ASC, rn=1.",
"Lowest-price item per order.",
ECOM_T,ECOM_S,(["order_id","name","price"],[]),
"SELECT order_id,name,price FROM(SELECT oi.order_id,p.name,p.price,ROW_NUMBER() OVER(PARTITION BY oi.order_id ORDER BY p.price ASC)AS rn FROM order_items oi JOIN products p ON oi.product_id=p.id)t WHERE rn=1 ORDER BY order_id;",topic="Cheapest Per Order (Window)")

add("sql-378","High-Frequency Login Users","Login / Activity","Capgemini","medium",
"Find users who logged in more than 3 times.\n\nReturn user_id, login_count. Order by login_count DESC.",
"GROUP BY user_id HAVING COUNT > 3.",
"High-frequency users.",
LOGIN_T,LOGIN_S,(["user_id","login_count"],[]),
"SELECT user_id,COUNT(*)AS login_count FROM logins GROUP BY user_id HAVING COUNT(*)>3 ORDER BY login_count DESC;",topic="HAVING Frequent Logins")

add("sql-379","Restaurant Revenue Share Percent","Food Delivery (Zomato)","Capgemini","hard",
"Show each restaurant's revenue as a percentage of total platform revenue.\n\nReturn name, revenue, pct (rounded to 1). Order by pct DESC.",
"SUM(amount) / SUM(amount) OVER() * 100.",
"Each restaurant's share of total revenue.",
ZOMATO_T,ZOMATO_S,(["name","revenue","pct"],[["Pizza Palace",1350.0,41.9],["Biryani House",1230.0,38.1],["Dragon Wok",510.0,15.8],["Burger Barn",130.0,4.0],["Dosa Corner",10.0,0.3]]),
"SELECT name,revenue,ROUND(revenue*100.0/SUM(revenue) OVER(),1)AS pct FROM(SELECT r.name,SUM(o.amount)AS revenue FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.name)t ORDER BY pct DESC;",topic="Revenue Share Percent")

add("sql-380","Delivered vs Pending Revenue","E-Commerce (Flipkart)","Capgemini","medium",
"Compare total revenue from delivered orders vs non-delivered.\n\nReturn status_group, total_revenue. Order by total_revenue DESC.",
"CASE status='delivered' then 'Delivered' else 'Other'.",
"Delivered total vs all other statuses.",
ECOM_T,ECOM_S,(["status_group","total_revenue"],[["Delivered",120350.0],["Other",6598.0]]),
"SELECT CASE WHEN status='delivered' THEN 'Delivered' ELSE 'Other' END AS status_group,SUM(total)AS total_revenue FROM orders GROUP BY status_group ORDER BY total_revenue DESC;",topic="CASE Status Grouping")

# ═══ BATCH 38: Capgemini Final 4 + Deloitte 6 ═══

# --- Capgemini (4 remaining → completes to 30) ---
add("sql-381","Employees With Manager Name","HR / Employee","Capgemini","medium",
"Show each employee alongside their manager's name.\n\nReturn employee, manager. Order by employee.",
"Self-join: e1 LEFT JOIN e1 AS mgr ON e1.mgr_id = mgr.id.",
"Alice managed by no one. Bob managed by Alice.",
EMP_T,EMP_S,(["employee","manager"],[["Alice",None],["Bob","Alice"],["Charlie","Alice"],["Diana","Charlie"],["Eve","Bob"],["Frank",None]]),
"SELECT e.name AS employee,m.name AS manager FROM employees e LEFT JOIN employees m ON e.mgr_id=m.id ORDER BY e.name;",topic="Self-Join: Manager Name")

add("sql-382","Nth Highest Salary (3rd)","HR / Employee","Capgemini","hard",
"Find the employee with the 3rd highest salary.\n\nReturn name, salary.",
"DENSE_RANK OVER(ORDER BY salary DESC), filter rank=3.",
"3rd highest: Bob at 60K.",
EMP_T,EMP_S,(["name","salary"],[["Bob",60000]]),
"SELECT name,salary FROM(SELECT name,salary,DENSE_RANK() OVER(ORDER BY salary DESC)AS rk FROM employees)t WHERE rk=3;",topic="Nth Highest (DENSE_RANK)")

add("sql-383","Products Not Ordered By Anyone","E-Commerce (Flipkart)","Capgemini","medium",
"Find products that have never been ordered.\n\nReturn name, category. Order by name.",
"LEFT JOIN order_items WHERE oi.id IS NULL.",
"Products with zero orders.",
ECOM_T,ECOM_S,(["name","category"],[]),
"SELECT p.name,p.category FROM products p LEFT JOIN order_items oi ON p.id=oi.product_id WHERE oi.id IS NULL ORDER BY p.name;",topic="LEFT JOIN: Never Ordered")

add("sql-384","Employees Earning Above Dept Median","HR / Employee","Capgemini","hard",
"Find employees whose salary exceeds the median salary of their department.\n\nReturn name, dept, salary. Order by dept, salary DESC.",
"Compare salary to department median using window percentile.",
"Above median within their dept.",
EMP_T,EMP_S,(["name","dept","salary"],[["Alice",70000],["Charlie",55000]]),
"SELECT name,dept,salary FROM(SELECT name,dept,salary,ROW_NUMBER() OVER(PARTITION BY dept ORDER BY salary DESC)AS rn,COUNT(*) OVER(PARTITION BY dept)AS cnt FROM employees)t WHERE rn<=cnt/2 ORDER BY dept,salary DESC;",topic="Above Dept Median")

# --- Deloitte (6 of 20 needed) ---
add("sql-385","Total Revenue by Order Status","E-Commerce (Flipkart)","Deloitte","easy",
"Calculate total revenue grouped by order status.\n\nReturn status, total_revenue. Order by total_revenue DESC.",
"GROUP BY status, SUM(total).",
"delivered, shipped, cancelled totals.",
ECOM_T,ECOM_S,(["status","total_revenue"],[["delivered",120350.0],["shipped",3299.0],["cancelled",3299.0]]),
"SELECT status,SUM(total)AS total_revenue FROM orders GROUP BY status ORDER BY total_revenue DESC;",topic="SUM Per Status")

add("sql-386","Employees With No Manager","HR / Employee","Deloitte","easy",
"Find employees who have no manager (mgr_id IS NULL).\n\nReturn name, dept. Order by name.",
"WHERE mgr_id IS NULL.",
"Alice and Frank have no manager.",
EMP_T,EMP_S,(["name","dept"],[["Alice","Eng"],["Frank","HR"]]),
"SELECT name,dept FROM employees WHERE mgr_id IS NULL ORDER BY name;",topic="WHERE IS NULL Manager")

add("sql-387","Orders Per Customer With Running Total","E-Commerce (Flipkart)","Deloitte","hard",
"For each customer, show orders with a running total of their spending.\n\nReturn name, order_date, total, running_spent. Order by name, order_date.",
"SUM(total) OVER(PARTITION BY customer_id ORDER BY order_date).",
"Cumulative spend per customer.",
ECOM_T,ECOM_S,(["name","order_date","total","running_spent"],[]),
"SELECT c.name,o.order_date,o.total,SUM(o.total) OVER(PARTITION BY c.id ORDER BY o.order_date)AS running_spent FROM customers c JOIN orders o ON c.id=o.customer_id ORDER BY c.name,o.order_date;",topic="Running Sum Per Customer")

add("sql-388","Doctor Appointment Count Summary","Healthcare / Hospital","Deloitte","easy",
"Count total appointments per doctor.\n\nReturn doctor name, appt_count. Order by appt_count DESC.",
"JOIN + GROUP BY + COUNT.",
"Dr. Sharma=3, Dr. Patel=2, Dr. Gupta=1.",
HOSPITAL_T,HOSPITAL_S,(["name","appt_count"],[["Dr. Sharma",3],["Dr. Patel",2],["Dr. Gupta",1]]),
"SELECT d.name,COUNT(a.id)AS appt_count FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name ORDER BY appt_count DESC;",topic="Doctor Appt Summary")

add("sql-389","Rides Costing Above 200","Ride-Sharing (Ola)","Deloitte","easy",
"Find all rides with fare above 200.\n\nReturn ride_id, pickup, dropoff, fare. Order by fare DESC.",
"WHERE fare > 200.",
"Filter expensive rides.",
RIDE_T,RIDE_S,(["ride_id","pickup","dropoff","fare"],[]),
"SELECT id AS ride_id,pickup,dropoff,fare FROM rides WHERE fare>200 ORDER BY fare DESC;",topic="WHERE Fare Filter")

add("sql-390","Products With Price Rank","E-Commerce (Flipkart)","Deloitte","medium",
"Rank products by price within their category.\n\nReturn category, name, price, category_rank. Order by category, category_rank.",
"DENSE_RANK PARTITION BY category ORDER BY price DESC.",
"Rank within each product category.",
ECOM_T,ECOM_S,(["category","name","price","category_rank"],[["Books","SQL Book",450.0,1],["Electronics","MacBook Pro",120000.0,1],["Electronics","iPhone 15",79999.0,2],["Fashion","Running Shoes",3499.0,1],["Fashion","Cotton T-Shirt",799.0,2]]),
"SELECT category,name,price,DENSE_RANK() OVER(PARTITION BY category ORDER BY price DESC)AS category_rank FROM products ORDER BY category,category_rank;",topic="Rank Within Category")

# ═══ BATCH 19: PostgreSQL-Only — FULL OUTER JOIN ═══
# These problems require FULL OUTER JOIN which is NOT supported by SQLite WASM.
# They are flagged backend_only=True and execute on the backend PostgreSQL engine.

# PostgreSQL schema (VARCHAR → TEXT for PG compat, otherwise same structure)
PG_EMP_S = """CREATE TABLE employees(id INT PRIMARY KEY,name VARCHAR(100),department VARCHAR(50),salary INT,hire_date DATE);
CREATE TABLE departments(id INT PRIMARY KEY,dept_name VARCHAR(50),budget INT,head_count INT);
INSERT INTO employees VALUES(1,'Alice','Engineering',70000,'2019-01-15');
INSERT INTO employees VALUES(2,'Bob','Marketing',60000,'2020-03-01');
INSERT INTO employees VALUES(3,'Charlie','Engineering',55000,'2020-06-10');
INSERT INTO employees VALUES(4,'Diana','Marketing',50000,'2021-01-20');
INSERT INTO employees VALUES(5,'Eve','Engineering',65000,'2021-08-05');
INSERT INTO employees VALUES(6,'Frank','Sales',45000,'2022-02-14');
INSERT INTO departments VALUES(1,'Engineering',500000,3);
INSERT INTO departments VALUES(2,'Marketing',200000,2);
INSERT INTO departments VALUES(3,'Sales',150000,1);
INSERT INTO departments VALUES(4,'HR',100000,0);
INSERT INTO departments VALUES(5,'Finance',300000,0);"""
PG_EMP_T = [{"name":"employees","columns":[{"name":"id","type":"int"},{"name":"name","type":"varchar"},{"name":"department","type":"varchar"},{"name":"salary","type":"int"},{"name":"hire_date","type":"date"}],
"sample_input":[[1,"Alice","Engineering",70000,"2019-01-15"],[2,"Bob","Marketing",60000,"2020-03-01"],[3,"Charlie","Engineering",55000,"2020-06-10"],[4,"Diana","Marketing",50000,"2021-01-20"],[5,"Eve","Engineering",65000,"2021-08-05"],[6,"Frank","Sales",45000,"2022-02-14"]]},
{"name":"departments","columns":[{"name":"id","type":"int"},{"name":"dept_name","type":"varchar"},{"name":"budget","type":"int"},{"name":"head_count","type":"int"}],
"sample_input":[[1,"Engineering",500000,3],[2,"Marketing",200000,2],[3,"Sales",150000,1],[4,"HR",100000,0],[5,"Finance",300000,0]]}]

add("sql-181","FULL OUTER JOIN: All Employees & Departments","HR / Employee","Google","hard",
"Use FULL OUTER JOIN to show all employees AND all departments, even if unmatched.\n\nReturn employee name (or NULL), department from employees (or NULL), dept_name from departments (or NULL), budget (or NULL). Order by COALESCE(department, dept_name).\n\n⚠️ This problem uses PostgreSQL (FULL OUTER JOIN is not available in SQLite).",
"FULL OUTER JOIN matches on employee.department = departments.dept_name. Unmatched rows appear with NULLs.",
"HR and Finance have no employees. All employees have matching departments.",
PG_EMP_T,PG_EMP_S,(["name","department","dept_name","budget"],[["Alice","Engineering","Engineering",500000],["Charlie","Engineering","Engineering",500000],["Eve","Engineering","Engineering",500000],["Bob","Marketing","Marketing",200000],["Diana","Marketing","Marketing",50000],["Frank","Sales","Sales",150000],[None,None,"Finance",300000],[None,None,"HR",100000]]),
"SELECT e.name,e.department,d.dept_name,d.budget FROM employees e FULL OUTER JOIN departments d ON e.department=d.dept_name ORDER BY COALESCE(e.department,d.dept_name),e.name;",topic="FULL OUTER JOIN",backend_only=True)

add("sql-182","FULL OUTER JOIN: Unmatched Only","HR / Employee","Microsoft","medium",
"Use FULL OUTER JOIN to find departments with no employees AND employees in departments not in the departments table (orphans).\n\nReturn dept source (employee department or departments.dept_name), has_employees (boolean), has_dept_record (boolean). Order by dept.\n\n⚠️ PostgreSQL required.",
"FULL OUTER JOIN + WHERE either side IS NULL to find mismatches.",
"HR and Finance have no employees.",
PG_EMP_T,PG_EMP_S,(["dept","has_employees","has_dept_record"],[["Finance",False,True],["HR",False,True]]),
"SELECT COALESCE(e.department,d.dept_name)AS dept,e.id IS NOT NULL AS has_employees,d.id IS NOT NULL AS has_dept_record FROM employees e FULL OUTER JOIN departments d ON e.department=d.dept_name WHERE e.id IS NULL OR d.id IS NULL GROUP BY COALESCE(e.department,d.dept_name),e.id IS NOT NULL,d.id IS NOT NULL ORDER BY dept;",topic="FULL OUTER JOIN: Unmatched",backend_only=True)

add("sql-183","FULL OUTER JOIN: Budget Utilization","HR / Employee","Deloitte","hard",
"Using FULL OUTER JOIN, compare each department's budget against its actual payroll (SUM of salaries).\n\nReturn dept_name, budget, actual_payroll, utilization_pct (rounded to 1). Order by utilization_pct descending NULLS LAST.\n\n⚠️ PostgreSQL required.",
"FULL OUTER JOIN + GROUP BY + SUM salary vs budget.",
"Engineering: 190K salary / 500K budget = 38%. Marketing: 110K / 200K = 55%.",
PG_EMP_T,PG_EMP_S,(["dept_name","budget","actual_payroll","utilization_pct"],[["Sales",150000,45000,30.0],["Engineering",500000,190000,38.0],["Marketing",200000,110000,55.0],["Finance",300000,0,0.0],["HR",100000,0,0.0]]),
"SELECT d.dept_name,d.budget,COALESCE(SUM(e.salary),0)AS actual_payroll,ROUND(COALESCE(SUM(e.salary),0)*100.0/d.budget,1)AS utilization_pct FROM departments d FULL OUTER JOIN employees e ON d.dept_name=e.department GROUP BY d.dept_name,d.budget ORDER BY utilization_pct DESC NULLS LAST;",topic="FULL OUTER JOIN: Budget Analysis",backend_only=True)

add("sql-184","FULL OUTER JOIN: Customer-Order Reconciliation","E-Commerce (Flipkart)","Amazon","hard",
"Use FULL OUTER JOIN to reconcile customers with their orders. Show ALL customers (even with no orders) and ALL orders (even with orphan customer IDs).\n\nReturn customer name (or 'Unknown'), order_id (or NULL), total (or 0). Order by name, order_id.\n\n⚠️ PostgreSQL required.",
"FULL OUTER JOIN customers to orders, COALESCE for NULLs.",
"Some customers may not have orders. Some orders may have invalid customer IDs.",
ECOM_T,ECOM_S,(["name","order_id","total"],[["Ankit",1,2500.0],["Ankit",2,55000.0],["Ankit",3,3299.0],["Priya",5,3299.0],["Rohan",4,55450.0],["Sneha",6,6900.0],["Vikram",7,450.0]]),
"SELECT COALESCE(c.name,'Unknown')AS name,o.id AS order_id,COALESCE(o.total,0)AS total FROM customers c FULL OUTER JOIN orders o ON c.id=o.customer_id ORDER BY name,order_id;",topic="FULL OUTER JOIN: Reconciliation",backend_only=True)

add("sql-185","FULL OUTER JOIN: Cross-Table Coverage Report","HR / Employee","SAP","hard",
"Create a full coverage report: for every department (from both tables), show the department name, count of employees, budget, and whether it's 'Staffed', 'Empty', or 'Unbudgeted'.\n\nReturn dept, emp_count, budget, status. Order by dept.\n\n⚠️ PostgreSQL required.",
"FULL OUTER JOIN + CASE for status classification.",
"Engineering/Marketing/Sales = Staffed. HR/Finance = Empty. No Unbudgeted ones exist.",
PG_EMP_T,PG_EMP_S,(["dept","emp_count","budget","status"],[["Engineering",3,500000,"Staffed"],["Finance",0,300000,"Empty"],["HR",0,100000,"Empty"],["Marketing",2,200000,"Staffed"],["Sales",1,150000,"Staffed"]]),
"SELECT COALESCE(e.department,d.dept_name)AS dept,COUNT(e.id)AS emp_count,COALESCE(d.budget,0)AS budget,CASE WHEN COUNT(e.id)>0 AND d.id IS NOT NULL THEN 'Staffed' WHEN COUNT(e.id)=0 AND d.id IS NOT NULL THEN 'Empty' ELSE 'Unbudgeted' END AS status FROM employees e FULL OUTER JOIN departments d ON e.department=d.dept_name GROUP BY COALESCE(e.department,d.dept_name),d.id,d.budget ORDER BY dept;",topic="FULL OUTER JOIN: Coverage Report",backend_only=True)

# Write output
out = r'c:\AcadMix\frontend\src\data\sql_problems.json'
with open(out, 'w') as f:
    json.dump(P, f, indent=2, default=str)
print(f"Done: Generated {len(P)} problems")
pg_count = sum(1 for p in P if p.get('backend_only'))
print(f"  -> {pg_count} PostgreSQL-only problems (backend_only=True)")
print(f"  -> {len(P) - pg_count} SQLite WASM problems")
