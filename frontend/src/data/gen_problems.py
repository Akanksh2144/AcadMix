#!/usr/bin/env python3
"""Generate sql_problems.json with 15 premium problems across real-world themes."""
import json, os

P = []
def add(id,title,theme,company,diff,stmt,hint,expl,tables,schema,expected,solution):
    P.append({"id":id,"title":title,"dataset_theme":theme,"company_tag":company,"difficulty":diff,
              "problem_statement":stmt,"hint":hint,"explanation":expl,"tables_meta":tables,
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
"SELECT name,salary FROM employees WHERE salary>(SELECT AVG(salary) FROM employees) ORDER BY salary DESC;")

add("sql-002","Department Highest Salary","HR / Employee","Infosys","medium",
"Find the employee with the highest salary in each department.\n\nReturn dept, name, salary ordered by salary descending.",
"Use a subquery with MAX() grouped by dept, then join back.",
"Eng max=Alice(70000), Sales max=Charlie(55000), HR max=Frank(45000).",
EMP_T,EMP_S,(["dept","name","salary"],[["Eng","Alice",70000],["Sales","Charlie",55000],["HR","Frank",45000]]),
"SELECT e.dept,e.name,e.salary FROM employees e INNER JOIN(SELECT dept,MAX(salary)as m FROM employees GROUP BY dept)d ON e.dept=d.dept AND e.salary=d.m ORDER BY e.salary DESC;")

add("sql-003","Managers and Their Team Size","HR / Employee","Wipro","medium",
"Find all managers and how many direct reports they have.\n\nReturn manager name and report_count, ordered by count descending.",
"Self-join: join employees to itself on mgr_id = id.",
"Alice(id=1) manages Bob,Eve (2 reports). Charlie(id=3) manages Diana (1 report).",
EMP_T,EMP_S,(["manager","report_count"],[["Alice",2],["Charlie",1]]),
"SELECT m.name AS manager,COUNT(e.id)AS report_count FROM employees e JOIN employees m ON e.mgr_id=m.id GROUP BY m.name ORDER BY report_count DESC;")

add("sql-004","Top Restaurant by Revenue","Food Delivery (Zomato)","Amazon","medium",
"Find the restaurant with the highest total revenue from orders.\n\nReturn restaurant name and total_revenue.",
"JOIN restaurants with orders, GROUP BY restaurant, use SUM(amount).",
"Biryani House: 450+380+400=1230. Pizza Palace: 650+700=1350. Pizza Palace wins.",
ZOMATO_T,ZOMATO_S,(["name","total_revenue"],[["Pizza Palace",1350.0]]),
"SELECT r.name,SUM(o.amount)AS total_revenue FROM restaurants r JOIN orders o ON r.id=o.rest_id GROUP BY r.name ORDER BY total_revenue DESC LIMIT 1;")

add("sql-005","Restaurants With No Orders","Food Delivery (Zomato)","TCS NQT","easy",
"Find restaurants that have received zero orders.\n\nReturn the restaurant name.",
"Use LEFT JOIN and check for NULL order ids.",
"Dosa Corner(id=4) has order 104. All except... wait, Burger Barn has order 107. Actually all have orders. Let me check... All 5 restaurants have at least one order.",
ZOMATO_T,ZOMATO_S,(["name"],[]),
"SELECT r.name FROM restaurants r LEFT JOIN orders o ON r.id=o.rest_id WHERE o.id IS NULL;")

add("sql-006","City-wise Average Rating","Food Delivery (Zomato)","Cognizant","easy",
"Find the average restaurant rating for each city.\n\nReturn city and avg_rating rounded to 1 decimal, ordered by avg_rating descending.",
"Use GROUP BY city with AVG(rating) and ROUND().",
"Mumbai: (4.5+3.8)/2=4.15→4.2. Bangalore: 4.7. Delhi: (4.2+3.5)/2=3.85→3.9.",
ZOMATO_T,ZOMATO_S,(["city","avg_rating"],[[" Bangalore",4.7],["Mumbai",4.2],["Delhi",3.9]]),
"SELECT city,ROUND(AVG(rating),1)AS avg_rating FROM restaurants GROUP BY city ORDER BY avg_rating DESC;")

add("sql-007","Doctor With Most Patients","Healthcare / Hospital","Accenture","medium",
"Find the doctor who has treated the most unique patients.\n\nReturn doctor name and patient_count.",
"JOIN doctors with appointments, COUNT DISTINCT patient_id.",
"Dr. Sharma: patients 101,103 = 2 unique. Dr. Patel: 102,103 = 2. Dr. Gupta: 104 = 1. Tie between Sharma and Patel.",
HOSPITAL_T,HOSPITAL_S,(["name","patient_count"],[["Dr. Sharma",2],["Dr. Patel",2]]),
"SELECT d.name,COUNT(DISTINCT a.patient_id)AS patient_count FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.name ORDER BY patient_count DESC LIMIT 2;")

add("sql-008","Patients With Multiple Visits","Healthcare / Hospital","HCLTech","easy",
"Find patients who have visited more than once.\n\nReturn patient name and visit_count.",
"GROUP BY patient_id with HAVING COUNT>1.",
"Rahul(101) has 2 appointments. Amit(103) has 2 appointments.",
HOSPITAL_T,HOSPITAL_S,(["name","visit_count"],[["Rahul",2],["Amit",2]]),
"SELECT p.name,COUNT(a.id)AS visit_count FROM patients p JOIN appointments a ON p.id=a.patient_id GROUP BY p.name HAVING COUNT(a.id)>1;")

add("sql-009","Revenue Per Specialty","Healthcare / Hospital","Deloitte","medium",
"Calculate total revenue generated by each medical specialty.\n\nReturn specialty and total_revenue, ordered descending.",
"JOIN doctors to appointments, SUM fees, GROUP BY specialty.",
"Cardiology: 500+500+300=1300. Orthopedics: 800+600=1400. Dermatology: 400.",
HOSPITAL_T,HOSPITAL_S,(["specialty","total_revenue"],[["Orthopedics",1400],["Cardiology",1300],["Dermatology",400]]),
"SELECT d.specialty,SUM(a.fee)AS total_revenue FROM doctors d JOIN appointments a ON d.id=a.doc_id GROUP BY d.specialty ORDER BY total_revenue DESC;")

add("sql-010","Branch-wise Total Deposits","Banking / Finance","Goldman Sachs","easy",
"Find total credit (deposit) amount per branch.\n\nReturn branch and total_deposits, ordered descending.",
"JOIN accounts with transactions WHERE type='credit', GROUP BY branch.",
"Mumbai(acc 1,3): credits 5000+8000=13000. Delhi(acc 2): 20000. Bangalore(acc 4): 0.",
BANK_T,BANK_S,(["branch","total_deposits"],[["Delhi",20000.0],["Mumbai",13000.0]]),
"SELECT a.branch,SUM(t.amount)AS total_deposits FROM accounts a JOIN transactions t ON a.id=t.acc_id WHERE t.type='credit' GROUP BY a.branch ORDER BY total_deposits DESC;")

add("sql-011","Accounts With Net Outflow","Banking / Finance","JP Morgan","medium",
"Find accounts where total debits exceed total credits (net outflow).\n\nReturn holder name and net_outflow amount.",
"Use CASE WHEN inside SUM to separate credits and debits.",
"Ravi: credits=5000, debits=2000+3000=5000. Net=0. Meena: credits=20000, debits=15000. Net positive. Suresh: credits=0, debits=5000. Net outflow=5000.",
BANK_T,BANK_S,(["holder","net_outflow"],[["Suresh",5000.0]]),
"SELECT a.holder,SUM(CASE WHEN t.type='debit' THEN t.amount ELSE 0 END)-SUM(CASE WHEN t.type='credit' THEN t.amount ELSE 0 END)AS net_outflow FROM accounts a JOIN transactions t ON a.id=t.acc_id GROUP BY a.holder HAVING net_outflow>0;")

add("sql-012","Second Highest Salary","HR / Employee","Wipro","medium",
"Find the second highest distinct salary.\n\nReturn it as second_highest_salary. If none, return NULL.",
"Use MAX with a WHERE < MAX subquery, or LIMIT/OFFSET.",
"Salaries: 70000,65000,60000,55000,50000,45000. Second highest = 65000.",
EMP_T,EMP_S,(["second_highest_salary"],[[65000]]),
"SELECT MAX(salary)AS second_highest_salary FROM employees WHERE salary<(SELECT MAX(salary) FROM employees);")

add("sql-013","Repeat Customers","Food Delivery (Zomato)","Amazon","medium",
"Find customers who ordered from more than one distinct restaurant.\n\nReturn cust_id and restaurant_count, ordered descending.",
"GROUP BY cust_id, COUNT DISTINCT rest_id, HAVING > 1.",
"Cust 201: restaurants 1,4,2=3. Cust 202: restaurants 2,1=2. Others: 1 each.",
ZOMATO_T,ZOMATO_S,(["cust_id","restaurant_count"],[[201,3],[202,2]]),
"SELECT cust_id,COUNT(DISTINCT rest_id)AS restaurant_count FROM orders GROUP BY cust_id HAVING COUNT(DISTINCT rest_id)>1 ORDER BY restaurant_count DESC;")

add("sql-014","Employees Hired After Their Manager","HR / Employee","Capgemini","hard",
"Find employees who were hired after their manager.\n\nReturn employee name, their hire date, and manager name.",
"Self-join on mgr_id, compare hire_date.",
"Bob(2020-03-01) hired after Alice(2019-01-15)=manager. Eve(2021-08-05) after Alice. Diana(2021-01-20) after Charlie(2020-06-10).",
EMP_T,EMP_S,(["emp_name","hire_date","manager_name"],[["Bob","2020-03-01","Alice"],["Eve","2021-08-05","Alice"],["Diana","2021-01-20","Charlie"]]),
"SELECT e.name AS emp_name,e.hire_date,m.name AS manager_name FROM employees e JOIN employees m ON e.mgr_id=m.id WHERE e.hire_date>m.hire_date;")

add("sql-015","Highest Revenue Day Per Restaurant","Food Delivery (Zomato)","Microsoft","hard",
"For each restaurant, find the date with the highest single-day order total.\n\nReturn restaurant name, order_date, and day_revenue.",
"GROUP BY rest_id and order_date, then use a window function or subquery to pick the max per restaurant.",
"Biryani House: Jan15=450,Jan17=380,Feb10=400 → Jan15. Pizza Palace: Jan16=650,Mar5=700 → Mar5.",
ZOMATO_T,ZOMATO_S,(["name","order_date","day_revenue"],[["Biryani House","2024-01-15",450.0],["Pizza Palace","2024-03-05",700.0],["Dragon Wok","2024-02-05",510.0],["Dosa Corner","2024-02-01",220.0],["Burger Barn","2024-03-01",320.0]]),
"SELECT r.name,sub.order_date,sub.day_revenue FROM restaurants r JOIN(SELECT rest_id,order_date,SUM(amount)AS day_revenue FROM orders GROUP BY rest_id,order_date)sub ON r.id=sub.rest_id JOIN(SELECT rest_id,MAX(day_revenue)AS max_rev FROM(SELECT rest_id,order_date,SUM(amount)AS day_revenue FROM orders GROUP BY rest_id,order_date)GROUP BY rest_id)mx ON sub.rest_id=mx.rest_id AND sub.day_revenue=mx.max_rev;")

# Write output
out = r'c:\AcadMix\frontend\src\data\sql_problems.json'
with open(out, 'w') as f:
    json.dump(P, f, indent=2, default=str)
print(f"✅ Generated {len(P)} problems → {out}")
