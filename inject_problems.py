import re

adds = """
add("FILT_MED_01", "High-Value Disputed Orders", "E-Commerce", "Amazon", "medium",
"Find all orders placed in 2023 where the order amount is greater than 500, the status is either 'Disputed' or 'Refunded', and the payment method was NOT 'Credit Card'. Sort by order amount descending.",
"Use AND, OR with proper parentheses for precedence, and IN for status.",
"We filter dates using strftime, check amount > 500, and use IN() for multiple statuses while excluding Credit Card.",
[{"name":"orders","columns":[{"name":"order_id","type":"int"},{"name":"amount","type":"real"},{"name":"status","type":"varchar"},{"name":"payment_method","type":"varchar"},{"name":"order_date","type":"date"}],"sample_input":[[1,600,"Disputed","Debit Card","2023-05-12"],[2,400,"Disputed","PayPal","2023-06-01"],[3,800,"Refunded","Credit Card","2023-07-15"],[4,750,"Refunded","PayPal","2023-08-20"],[5,550,"Disputed","Debit Card","2022-12-15"]]}],
"CREATE TABLE orders (order_id INT, amount DECIMAL(10,2), status VARCHAR(20), payment_method VARCHAR(20), order_date DATE); INSERT INTO orders VALUES (1, 600, 'Disputed', 'Debit Card', '2023-05-12'), (2, 400, 'Disputed', 'PayPal', '2023-06-01'), (3, 800, 'Refunded', 'Credit Card', '2023-07-15'), (4, 750, 'Refunded', 'PayPal', '2023-08-20'), (5, 550, 'Disputed', 'Debit Card', '2022-12-15');",
(["order_id", "amount", "status", "payment_method", "order_date"], [[4, 750.0, "Refunded", "PayPal", "2023-08-20"], [1, 600.0, "Disputed", "Debit Card", "2023-05-12"]]),
"SELECT order_id, amount, status, payment_method, order_date FROM orders WHERE amount > 500 AND status IN ('Disputed', 'Refunded') AND payment_method != 'Credit Card' AND strftime('%Y', order_date) = '2023' ORDER BY amount DESC;",
"Filtering & Sorting")

add("FILT_MED_02", "Complex Access Logs Filtering", "IT Services", "Cisco", "medium",
"Filter access logs to find entries where the IP starts with '192.168.', the action is 'DENIED', and either the port is 22 or the protocol is 'SSH'. Ensure you only include logs from after 8 AM. Sort by log_time ascending.",
"Check the IP with LIKE '192.168.%'. Group the port/protocol OR logic with parentheses.",
"String matching with LIKE combined with AND/OR precedence logic.",
[{"name":"access_logs","columns":[{"name":"log_id","type":"int"},{"name":"ip_address","type":"varchar"},{"name":"action","type":"varchar"},{"name":"port","type":"int"},{"name":"protocol","type":"varchar"},{"name":"log_time","type":"time"}],"sample_input":[[1,"192.168.1.5","DENIED",22,"TCP","09:15:00"],[2,"192.168.2.10","DENIED",80,"SSH","10:30:00"],[3,"10.0.0.5","DENIED",22,"SSH","11:00:00"],[4,"192.168.1.100","ALLOWED",22,"SSH","12:00:00"],[5,"192.168.1.50","DENIED",22,"SSH","07:30:00"]]}],
"CREATE TABLE access_logs (log_id INT, ip_address VARCHAR(20), action VARCHAR(10), port INT, protocol VARCHAR(10), log_time TIME); INSERT INTO access_logs VALUES (1, '192.168.1.5', 'DENIED', 22, 'TCP', '09:15:00'), (2, '192.168.2.10', 'DENIED', 80, 'SSH', '10:30:00'), (3, '10.0.0.5', 'DENIED', 22, 'SSH', '11:00:00'), (4, '192.168.1.100', 'ALLOWED', 22, 'SSH', '12:00:00'), (5, '192.168.1.50', 'DENIED', 22, 'SSH', '07:30:00');",
(["log_id", "ip_address", "action", "port", "protocol", "log_time"], [[1, "192.168.1.5", "DENIED", 22, "TCP", "09:15:00"], [2, "192.168.2.10", "DENIED", 80, "SSH", "10:30:00"]]),
"SELECT * FROM access_logs WHERE ip_address LIKE '192.168.%' AND action = 'DENIED' AND (port = 22 OR protocol = 'SSH') AND log_time > '08:00:00' ORDER BY log_time ASC;",
"Filtering & Sorting")

add("FILT_MED_03", "Custom Sorting by Priority", "Support", "ServiceNow", "medium",
"Retrieve all support tickets that are 'Open' or 'In Progress'. Sort them by priority: 'Critical' first, then 'High', 'Medium', and 'Low'. For tickets with the same priority, sort by ticket_date ascending.",
"Use a CASE WHEN statement in the ORDER BY clause.",
"We map textual priorities to numerical equivalents for accurate ordering.",
[{"name":"tickets","columns":[{"name":"ticket_id","type":"int"},{"name":"status","type":"varchar"},{"name":"priority","type":"varchar"},{"name":"ticket_date","type":"date"}],"sample_input":[[1,"Open","Low","2023-10-01"],[2,"In Progress","Critical","2023-10-02"],[3,"Open","High","2023-10-03"],[4,"Closed","Critical","2023-10-04"],[5,"In Progress","Medium","2023-10-05"],[6,"Open","Critical","2023-10-06"]]}],
"CREATE TABLE tickets (ticket_id INT, status VARCHAR(20), priority VARCHAR(10), ticket_date DATE); INSERT INTO tickets VALUES (1, 'Open', 'Low', '2023-10-01'), (2, 'In Progress', 'Critical', '2023-10-02'), (3, 'Open', 'High', '2023-10-03'), (4, 'Closed', 'Critical', '2023-10-04'), (5, 'In Progress', 'Medium', '2023-10-05'), (6, 'Open', 'Critical', '2023-10-06');",
(["ticket_id", "status", "priority", "ticket_date"], [[2, "In Progress", "Critical", "2023-10-02"], [6, "Open", "Critical", "2023-10-06"], [3, "Open", "High", "2023-10-03"], [5, "In Progress", "Medium", "2023-10-05"], [1, "Open", "Low", "2023-10-01"]]),
"SELECT ticket_id, status, priority, ticket_date FROM tickets WHERE status IN ('Open', 'In Progress') ORDER BY CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END ASC, ticket_date ASC;",
"Filtering & Sorting")

add("FILT_MED_04", "Product Compatibility Matrix", "Retail", "Flipkart", "medium",
"Find products that are either (Category = 'Electronics' AND price < 1000) OR (Category = 'Furniture' AND weight > 50). Do not include any products that are marked as 'Discontinued'.",
"Combine conditions using AND/OR with proper bracketing.",
"Complex precedence logic testing multiple combinations of conditions.",
[{"name":"products","columns":[{"name":"product_id","type":"int"},{"name":"category","type":"varchar"},{"name":"price","type":"real"},{"name":"weight","type":"int"},{"name":"is_discontinued","type":"boolean"}],"sample_input":[[1,"Electronics",800,2,0],[2,"Electronics",1200,3,0],[3,"Furniture",200,60,0],[4,"Furniture",500,40,0],[5,"Electronics",500,1,1]]}],
"CREATE TABLE products (product_id INT, category VARCHAR(20), price DECIMAL(10,2), weight INT, is_discontinued BOOLEAN); INSERT INTO products VALUES (1, 'Electronics', 800, 2, FALSE), (2, 'Electronics', 1200, 3, FALSE), (3, 'Furniture', 200, 60, FALSE), (4, 'Furniture', 500, 40, FALSE), (5, 'Electronics', 500, 1, TRUE);",
(["product_id", "category", "price", "weight"], [[1, "Electronics", 800.0, 2], [3, "Furniture", 200.0, 60]]),
"SELECT product_id, category, price, weight FROM products WHERE ((category = 'Electronics' AND price < 1000) OR (category = 'Furniture' AND weight > 50)) AND is_discontinued = FALSE;",
"Filtering & Sorting")

add("FILT_MED_05", "Complex Inclusion Rules", "Finance", "Goldman Sachs", "medium",
"Select active accounts where the account_type is 'Savings' or 'Checking', the balance is not between 1000 and 5000, and the country is neither 'US' nor 'UK'.",
"Use NOT BETWEEN and NOT IN.",
"Exclusion logic is tested here.",
[{"name":"accounts","columns":[{"name":"account_id","type":"int"},{"name":"account_type","type":"varchar"},{"name":"balance","type":"real"},{"name":"country","type":"varchar"},{"name":"is_active","type":"boolean"}],"sample_input":[[1,"Savings",500,"IN",1],[2,"Checking",6000,"SG",1],[3,"Savings",3000,"IN",1],[4,"Investment",10000,"IN",1],[5,"Checking",7000,"US",1],[6,"Savings",8000,"UK",0]]}],
"CREATE TABLE accounts (account_id INT, account_type VARCHAR(20), balance DECIMAL(10,2), country VARCHAR(5), is_active BOOLEAN); INSERT INTO accounts VALUES (1, 'Savings', 500, 'IN', TRUE), (2, 'Checking', 6000, 'SG', TRUE), (3, 'Savings', 3000, 'IN', TRUE), (4, 'Investment', 10000, 'IN', TRUE), (5, 'Checking', 7000, 'US', TRUE), (6, 'Savings', 8000, 'UK', FALSE);",
(["account_id", "account_type", "balance", "country"], [[1, "Savings", 500.0, "IN"], [2, "Checking", 6000.0, "SG"]]),
"SELECT account_id, account_type, balance, country FROM accounts WHERE is_active = TRUE AND account_type IN ('Savings', 'Checking') AND balance NOT BETWEEN 1000 AND 5000 AND country NOT IN ('US', 'UK');",
"Filtering & Sorting")

add("COND_HRD_01", "Pivot: Monthly Sales Matrix", "Sales", "Amazon", "hard",
"Pivot the sales data to show total sales per store. Create columns for 'Jan', 'Feb', and 'Mar' containing the total sales amount for that month. Return store_id, Jan, Feb, Mar.",
"Use SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) for each pivoted column.",
"Classic pivoting pattern in SQL using SUM(CASE).",
[{"name":"sales","columns":[{"name":"store_id","type":"int"},{"name":"month","type":"varchar"},{"name":"amount","type":"int"}],"sample_input":[[1,"Jan",100],[1,"Jan",50],[1,"Feb",200],[1,"Mar",300],[2,"Jan",400],[2,"Mar",150],[3,"Feb",500]]}],
"CREATE TABLE sales (store_id INT, month VARCHAR(3), amount INT); INSERT INTO sales VALUES (1, 'Jan', 100), (1, 'Jan', 50), (1, 'Feb', 200), (1, 'Mar', 300), (2, 'Jan', 400), (2, 'Mar', 150), (3, 'Feb', 500);",
(["store_id", "Jan", "Feb", "Mar"], [[1, 150, 200, 300], [2, 400, 0, 150], [3, 0, 500, 0]]),
"SELECT store_id, SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) AS Jan, SUM(CASE WHEN month = 'Feb' THEN amount ELSE 0 END) AS Feb, SUM(CASE WHEN month = 'Mar' THEN amount ELSE 0 END) AS Mar FROM sales GROUP BY store_id;",
"Conditional Logic")

add("COND_HRD_02", "Pivot: Employee Attendance Track", "HR", "TCS", "hard",
"Generate an attendance matrix for employees showing the count of 'Present', 'Absent', and 'Leave' days as separate columns. Return emp_id, Present, Absent, Leave.",
"Use SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) to aggregate conditionally.",
"Pivoting rows into columns using SUM/COUNT conditional logic.",
[{"name":"attendance","columns":[{"name":"emp_id","type":"int"},{"name":"status","type":"varchar"}],"sample_input":[[1,"Present"],[1,"Present"],[1,"Absent"],[2,"Leave"],[2,"Present"],[3,"Absent"],[3,"Absent"]]}],
"CREATE TABLE attendance (emp_id INT, status VARCHAR(10)); INSERT INTO attendance VALUES (1, 'Present'), (1, 'Present'), (1, 'Absent'), (2, 'Leave'), (2, 'Present'), (3, 'Absent'), (3, 'Absent');",
(["emp_id", "Present", "Absent", "Leave"], [[1, 2, 1, 0], [2, 1, 0, 1], [3, 0, 2, 0]]),
"SELECT emp_id, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS Present, SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS Absent, SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS Leave FROM attendance GROUP BY emp_id;",
"Conditional Logic")

add("COND_HRD_03", "Complex Conditional Conversion", "Marketing", "Google", "hard",
"Calculate the conversion rate per campaign. A conversion is when status = 'Converted'. The rate is (Converted / Total) * 100. Return campaign_id and conversion_rate rounded to 2 decimal places.",
"Use SUM(CASE...) to count converted, divide by COUNT(*), and multiply by 100.0.",
"Advanced aggregate math with conditionals.",
[{"name":"leads","columns":[{"name":"campaign_id","type":"int"},{"name":"status","type":"varchar"}],"sample_input":[[1,"Converted"],[1,"Clicked"],[1,"Ignored"],[1,"Converted"],[2,"Clicked"],[2,"Ignored"],[3,"Converted"],[3,"Converted"]]}],
"CREATE TABLE leads (campaign_id INT, status VARCHAR(20)); INSERT INTO leads VALUES (1, 'Converted'), (1, 'Clicked'), (1, 'Ignored'), (1, 'Converted'), (2, 'Clicked'), (2, 'Ignored'), (3, 'Converted'), (3, 'Converted');",
(["campaign_id", "conversion_rate"], [[1, 50.0], [2, 0.0], [3, 100.0]]),
"SELECT campaign_id, ROUND((SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS conversion_rate FROM leads GROUP BY campaign_id;",
"Conditional Logic")

add("COND_HRD_04", "Pivot: Transaction Type Breakdown", "Finance", "Morgan Stanley", "hard",
"Show each user's total 'Credit' amount and 'Debit' amount in separate columns. Also compute net_balance (Credit - Debit). Return user_id, total_credit, total_debit, net_balance.",
"Subtract two separate SUM(CASE...) expressions.",
"Combining multiple conditional aggregates.",
[{"name":"transactions","columns":[{"name":"user_id","type":"int"},{"name":"txn_type","type":"varchar"},{"name":"amount","type":"int"}],"sample_input":[[1,"Credit",1000],[1,"Debit",200],[1,"Debit",50],[2,"Credit",5000],[3,"Debit",100]]}],
"CREATE TABLE transactions (user_id INT, txn_type VARCHAR(10), amount INT); INSERT INTO transactions VALUES (1, 'Credit', 1000), (1, 'Debit', 200), (1, 'Debit', 50), (2, 'Credit', 5000), (3, 'Debit', 100);",
(["user_id", "total_credit", "total_debit", "net_balance"], [[1, 1000, 250, 750], [2, 5000, 0, 5000], [3, 0, 100, -100]]),
"SELECT user_id, SUM(CASE WHEN txn_type = 'Credit' THEN amount ELSE 0 END) AS total_credit, SUM(CASE WHEN txn_type = 'Debit' THEN amount ELSE 0 END) AS total_debit, (SUM(CASE WHEN txn_type = 'Credit' THEN amount ELSE 0 END) - SUM(CASE WHEN txn_type = 'Debit' THEN amount ELSE 0 END)) AS net_balance FROM transactions GROUP BY user_id;",
"Conditional Logic")

add("COND_HRD_05", "Cross-Tabulation of Feedback", "Customer Success", "Salesforce", "hard",
"Create a matrix showing how many pieces of feedback were given per feature, pivoted by sentiment ('Positive', 'Neutral', 'Negative').",
"Group by feature_name and use SUM with CASE.",
"Matrix representation of dimensional data.",
[{"name":"feedback","columns":[{"name":"feature_name","type":"varchar"},{"name":"sentiment","type":"varchar"}],"sample_input":[["Dashboard","Positive"],["Dashboard","Positive"],["Dashboard","Negative"],["Reports","Neutral"],["Reports","Negative"],["Reports","Negative"],["Login","Positive"]]}],
"CREATE TABLE feedback (feature_name VARCHAR(20), sentiment VARCHAR(10)); INSERT INTO feedback VALUES ('Dashboard', 'Positive'), ('Dashboard', 'Positive'), ('Dashboard', 'Negative'), ('Reports', 'Neutral'), ('Reports', 'Negative'), ('Reports', 'Negative'), ('Login', 'Positive');",
(["feature_name", "Positive", "Neutral", "Negative"], [["Dashboard", 2, 0, 1], ["Login", 1, 0, 0], ["Reports", 0, 1, 2]]),
"SELECT feature_name, SUM(CASE WHEN sentiment = 'Positive' THEN 1 ELSE 0 END) AS Positive, SUM(CASE WHEN sentiment = 'Neutral' THEN 1 ELSE 0 END) AS Neutral, SUM(CASE WHEN sentiment = 'Negative' THEN 1 ELSE 0 END) AS Negative FROM feedback GROUP BY feature_name;",
"Conditional Logic")
"""

with open(r'c:\AcadMix\frontend\src\data\gen_problems.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Insert right before the Print category distribution
new_content = content.replace('# Print category distribution', adds + '\n# Print category distribution')

with open(r'c:\AcadMix\frontend\src\data\gen_problems.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Injected 10 new problems successfully.")
