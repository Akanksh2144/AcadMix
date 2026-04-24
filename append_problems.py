
# ====================================================================
# GAP ADDITIONS: Filtering & Sorting (Medium)
# ====================================================================

add({
    "id": "FILT_MED_01",
    "title": "High-Value Disputed Orders",
    "dataset_theme": "E-Commerce",
    "company_tag": "Amazon",
    "difficulty": "medium",
    "problem_statement": "Find all orders placed in 2023 where the order amount is greater than 500, the status is either 'Disputed' or 'Refunded', and the payment method was NOT 'Credit Card'. Sort by order amount descending.",
    "schema_sql": """
        CREATE TABLE orders (order_id INT, amount DECIMAL(10,2), status VARCHAR(20), payment_method VARCHAR(20), order_date DATE);
        INSERT INTO orders VALUES 
        (1, 600, 'Disputed', 'Debit Card', '2023-05-12'),
        (2, 400, 'Disputed', 'PayPal', '2023-06-01'),
        (3, 800, 'Refunded', 'Credit Card', '2023-07-15'),
        (4, 750, 'Refunded', 'PayPal', '2023-08-20'),
        (5, 550, 'Disputed', 'Debit Card', '2022-12-15');
    """,
    "hint": "Use AND, OR with proper parentheses for precedence, and IN for status.",
    "expected_query": "SELECT order_id, amount, status, payment_method, order_date FROM orders WHERE amount > 500 AND status IN ('Disputed', 'Refunded') AND payment_method != 'Credit Card' AND strftime('%Y', order_date) = '2023' ORDER BY amount DESC;",
    "expected_output": [
        {"order_id": 4, "amount": 750.0, "status": "Refunded", "payment_method": "PayPal", "order_date": "2023-08-20"},
        {"order_id": 1, "amount": 600.0, "status": "Disputed", "payment_method": "Debit Card", "order_date": "2023-05-12"}
    ]
})

add({
    "id": "FILT_MED_02",
    "title": "Complex Access Logs Filtering",
    "dataset_theme": "IT Services",
    "company_tag": "Cisco",
    "difficulty": "medium",
    "problem_statement": "Filter access logs to find entries where the IP starts with '192.168.', the action is 'DENIED', and either the port is 22 or the protocol is 'SSH'. Ensure you only include logs from after 8 AM. Sort by log_time ascending.",
    "schema_sql": """
        CREATE TABLE access_logs (log_id INT, ip_address VARCHAR(20), action VARCHAR(10), port INT, protocol VARCHAR(10), log_time TIME);
        INSERT INTO access_logs VALUES 
        (1, '192.168.1.5', 'DENIED', 22, 'TCP', '09:15:00'),
        (2, '192.168.2.10', 'DENIED', 80, 'SSH', '10:30:00'),
        (3, '10.0.0.5', 'DENIED', 22, 'SSH', '11:00:00'),
        (4, '192.168.1.100', 'ALLOWED', 22, 'SSH', '12:00:00'),
        (5, '192.168.1.50', 'DENIED', 22, 'SSH', '07:30:00');
    """,
    "hint": "Check the IP with LIKE '192.168.%'. Group the port/protocol OR logic with parentheses.",
    "expected_query": "SELECT * FROM access_logs WHERE ip_address LIKE '192.168.%' AND action = 'DENIED' AND (port = 22 OR protocol = 'SSH') AND log_time > '08:00:00' ORDER BY log_time ASC;",
    "expected_output": [
        {"log_id": 1, "ip_address": "192.168.1.5", "action": "DENIED", "port": 22, "protocol": "TCP", "log_time": "09:15:00"},
        {"log_id": 2, "ip_address": "192.168.2.10", "action": "DENIED", "port": 80, "protocol": "SSH", "log_time": "10:30:00"}
    ]
})

add({
    "id": "FILT_MED_03",
    "title": "Custom Sorting by Priority",
    "dataset_theme": "Support",
    "company_tag": "ServiceNow",
    "difficulty": "medium",
    "problem_statement": "Retrieve all support tickets that are 'Open' or 'In Progress'. Sort them not alphabetically, but by priority: 'Critical' first, then 'High', 'Medium', and 'Low'. For tickets with the same priority, sort by ticket_date ascending.",
    "schema_sql": """
        CREATE TABLE tickets (ticket_id INT, status VARCHAR(20), priority VARCHAR(10), ticket_date DATE);
        INSERT INTO tickets VALUES 
        (1, 'Open', 'Low', '2023-10-01'),
        (2, 'In Progress', 'Critical', '2023-10-02'),
        (3, 'Open', 'High', '2023-10-03'),
        (4, 'Closed', 'Critical', '2023-10-04'),
        (5, 'In Progress', 'Medium', '2023-10-05'),
        (6, 'Open', 'Critical', '2023-10-06');
    """,
    "hint": "Use a CASE WHEN statement in the ORDER BY clause to assign a numerical weight to each priority.",
    "expected_query": "SELECT ticket_id, status, priority, ticket_date FROM tickets WHERE status IN ('Open', 'In Progress') ORDER BY CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END ASC, ticket_date ASC;",
    "expected_output": [
        {"ticket_id": 2, "status": "In Progress", "priority": "Critical", "ticket_date": "2023-10-02"},
        {"ticket_id": 6, "status": "Open", "priority": "Critical", "ticket_date": "2023-10-06"},
        {"ticket_id": 3, "status": "Open", "priority": "High", "ticket_date": "2023-10-03"},
        {"ticket_id": 5, "status": "In Progress", "priority": "Medium", "ticket_date": "2023-10-05"},
        {"ticket_id": 1, "status": "Open", "priority": "Low", "ticket_date": "2023-10-01"}
    ]
})

add({
    "id": "FILT_MED_04",
    "title": "Product Compatibility Matrix",
    "dataset_theme": "Retail",
    "company_tag": "Flipkart",
    "difficulty": "medium",
    "problem_statement": "Find products that are either (Category = 'Electronics' AND price < 1000) OR (Category = 'Furniture' AND weight > 50). Do not include any products that are marked as 'Discontinued'.",
    "schema_sql": """
        CREATE TABLE products (product_id INT, category VARCHAR(20), price DECIMAL(10,2), weight INT, is_discontinued BOOLEAN);
        INSERT INTO products VALUES 
        (1, 'Electronics', 800, 2, FALSE),
        (2, 'Electronics', 1200, 3, FALSE),
        (3, 'Furniture', 200, 60, FALSE),
        (4, 'Furniture', 500, 40, FALSE),
        (5, 'Electronics', 500, 1, TRUE);
    """,
    "hint": "Combine conditions using AND/OR with proper bracketing and ensure the discontinued check applies to everything.",
    "expected_query": "SELECT product_id, category, price, weight FROM products WHERE ((category = 'Electronics' AND price < 1000) OR (category = 'Furniture' AND weight > 50)) AND is_discontinued = FALSE;",
    "expected_output": [
        {"product_id": 1, "category": "Electronics", "price": 800.0, "weight": 2},
        {"product_id": 3, "category": "Furniture", "price": 200.0, "weight": 60}
    ]
})

add({
    "id": "FILT_MED_05",
    "title": "Complex Inclusion/Exclusion Rules",
    "dataset_theme": "Finance",
    "company_tag": "Goldman Sachs",
    "difficulty": "medium",
    "problem_statement": "Select active accounts where the account_type is 'Savings' or 'Checking', the balance is not between 1000 and 5000, and the country is neither 'US' nor 'UK'.",
    "schema_sql": """
        CREATE TABLE accounts (account_id INT, account_type VARCHAR(20), balance DECIMAL(10,2), country VARCHAR(5), is_active BOOLEAN);
        INSERT INTO accounts VALUES 
        (1, 'Savings', 500, 'IN', TRUE),
        (2, 'Checking', 6000, 'SG', TRUE),
        (3, 'Savings', 3000, 'IN', TRUE),
        (4, 'Investment', 10000, 'IN', TRUE),
        (5, 'Checking', 7000, 'US', TRUE),
        (6, 'Savings', 8000, 'UK', FALSE);
    """,
    "hint": "Use NOT BETWEEN and NOT IN to handle the exclusions cleanly.",
    "expected_query": "SELECT account_id, account_type, balance, country FROM accounts WHERE is_active = TRUE AND account_type IN ('Savings', 'Checking') AND balance NOT BETWEEN 1000 AND 5000 AND country NOT IN ('US', 'UK');",
    "expected_output": [
        {"account_id": 1, "account_type": "Savings", "balance": 500.0, "country": "IN"},
        {"account_id": 2, "account_type": "Checking", "balance": 6000.0, "country": "SG"}
    ]
})

# ====================================================================
# GAP ADDITIONS: Conditional Logic / Pivoting (Hard)
# ====================================================================

add({
    "id": "COND_HRD_01",
    "title": "Pivot: Monthly Sales Matrix",
    "dataset_theme": "Sales",
    "company_tag": "Amazon",
    "difficulty": "hard",
    "problem_statement": "Pivot the sales data to show total sales per store. Create columns for 'Jan', 'Feb', and 'Mar' containing the total sales amount for that month. Return store_id, Jan, Feb, Mar.",
    "schema_sql": """
        CREATE TABLE sales (store_id INT, month VARCHAR(3), amount INT);
        INSERT INTO sales VALUES 
        (1, 'Jan', 100), (1, 'Jan', 50), (1, 'Feb', 200), (1, 'Mar', 300),
        (2, 'Jan', 400), (2, 'Mar', 150), (3, 'Feb', 500);
    """,
    "hint": "Use SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) for each pivoted column.",
    "expected_query": "SELECT store_id, SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) AS Jan, SUM(CASE WHEN month = 'Feb' THEN amount ELSE 0 END) AS Feb, SUM(CASE WHEN month = 'Mar' THEN amount ELSE 0 END) AS Mar FROM sales GROUP BY store_id;",
    "expected_output": [
        {"store_id": 1, "Jan": 150, "Feb": 200, "Mar": 300},
        {"store_id": 2, "Jan": 400, "Feb": 0, "Mar": 150},
        {"store_id": 3, "Jan": 0, "Feb": 500, "Mar": 0}
    ]
})

add({
    "id": "COND_HRD_02",
    "title": "Pivot: Employee Attendance Track",
    "dataset_theme": "HR",
    "company_tag": "TCS",
    "difficulty": "hard",
    "problem_statement": "Generate an attendance matrix for employees showing the count of 'Present', 'Absent', and 'Leave' days as separate columns. Return emp_id, Present, Absent, Leave.",
    "schema_sql": """
        CREATE TABLE attendance (emp_id INT, status VARCHAR(10));
        INSERT INTO attendance VALUES 
        (1, 'Present'), (1, 'Present'), (1, 'Absent'),
        (2, 'Leave'), (2, 'Present'),
        (3, 'Absent'), (3, 'Absent');
    """,
    "hint": "Use SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) to aggregate conditionally.",
    "expected_query": "SELECT emp_id, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS Present, SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS Absent, SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS Leave FROM attendance GROUP BY emp_id;",
    "expected_output": [
        {"emp_id": 1, "Present": 2, "Absent": 1, "Leave": 0},
        {"emp_id": 2, "Present": 1, "Absent": 0, "Leave": 1},
        {"emp_id": 3, "Present": 0, "Absent": 2, "Leave": 0}
    ]
})

add({
    "id": "COND_HRD_03",
    "title": "Complex Conditional Conversion Rates",
    "dataset_theme": "Marketing",
    "company_tag": "Google",
    "difficulty": "hard",
    "problem_statement": "Calculate the conversion rate per campaign. A conversion is when status = 'Converted'. The rate is (Converted / Total) * 100. Return campaign_id and conversion_rate rounded to 2 decimal places.",
    "schema_sql": """
        CREATE TABLE leads (campaign_id INT, status VARCHAR(20));
        INSERT INTO leads VALUES 
        (1, 'Converted'), (1, 'Clicked'), (1, 'Ignored'), (1, 'Converted'),
        (2, 'Clicked'), (2, 'Ignored'),
        (3, 'Converted'), (3, 'Converted');
    """,
    "hint": "Use SUM(CASE...) to count converted, divide by COUNT(*), and multiply by 100.0 to ensure float division.",
    "expected_query": "SELECT campaign_id, ROUND((SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS conversion_rate FROM leads GROUP BY campaign_id;",
    "expected_output": [
        {"campaign_id": 1, "conversion_rate": 50.0},
        {"campaign_id": 2, "conversion_rate": 0.0},
        {"campaign_id": 3, "conversion_rate": 100.0}
    ]
})

add({
    "id": "COND_HRD_04",
    "title": "Pivot: Transaction Type Breakdown",
    "dataset_theme": "Finance",
    "company_tag": "Morgan Stanley",
    "difficulty": "hard",
    "problem_statement": "Show each user's total 'Credit' amount and 'Debit' amount in separate columns. Also, compute the net_balance (Credit - Debit). Return user_id, total_credit, total_debit, net_balance.",
    "schema_sql": """
        CREATE TABLE transactions (user_id INT, txn_type VARCHAR(10), amount INT);
        INSERT INTO transactions VALUES 
        (1, 'Credit', 1000), (1, 'Debit', 200), (1, 'Debit', 50),
        (2, 'Credit', 5000),
        (3, 'Debit', 100);
    """,
    "hint": "Use conditional aggregation for Credit and Debit. Then subtract the two aggregates.",
    "expected_query": "SELECT user_id, SUM(CASE WHEN txn_type = 'Credit' THEN amount ELSE 0 END) AS total_credit, SUM(CASE WHEN txn_type = 'Debit' THEN amount ELSE 0 END) AS total_debit, (SUM(CASE WHEN txn_type = 'Credit' THEN amount ELSE 0 END) - SUM(CASE WHEN txn_type = 'Debit' THEN amount ELSE 0 END)) AS net_balance FROM transactions GROUP BY user_id;",
    "expected_output": [
        {"user_id": 1, "total_credit": 1000, "total_debit": 250, "net_balance": 750},
        {"user_id": 2, "total_credit": 5000, "total_debit": 0, "net_balance": 5000},
        {"user_id": 3, "total_credit": 0, "total_debit": 100, "net_balance": -100}
    ]
})

add({
    "id": "COND_HRD_05",
    "title": "Cross-Tabulation of Feedback",
    "dataset_theme": "Customer Success",
    "company_tag": "Salesforce",
    "difficulty": "hard",
    "problem_statement": "Create a matrix showing how many pieces of feedback were given per feature, pivoted by sentiment ('Positive', 'Neutral', 'Negative'). Return feature_name, Positive, Neutral, Negative.",
    "schema_sql": """
        CREATE TABLE feedback (feature_name VARCHAR(20), sentiment VARCHAR(10));
        INSERT INTO feedback VALUES 
        ('Dashboard', 'Positive'), ('Dashboard', 'Positive'), ('Dashboard', 'Negative'),
        ('Reports', 'Neutral'), ('Reports', 'Negative'), ('Reports', 'Negative'),
        ('Login', 'Positive');
    """,
    "hint": "Group by feature_name and use SUM or COUNT with CASE for the sentiment categories.",
    "expected_query": "SELECT feature_name, SUM(CASE WHEN sentiment = 'Positive' THEN 1 ELSE 0 END) AS Positive, SUM(CASE WHEN sentiment = 'Neutral' THEN 1 ELSE 0 END) AS Neutral, SUM(CASE WHEN sentiment = 'Negative' THEN 1 ELSE 0 END) AS Negative FROM feedback GROUP BY feature_name;",
    "expected_output": [
        {"feature_name": "Dashboard", "Positive": 2, "Neutral": 0, "Negative": 1},
        {"feature_name": "Login", "Positive": 1, "Neutral": 0, "Negative": 0},
        {"feature_name": "Reports", "Positive": 0, "Neutral": 1, "Negative": 2}
    ]
})

# ====================================================================

import json
with open('sql_problems.json', 'w', encoding='utf-8') as f:
    json.dump(problems, f, indent=2)
print("Saved %d problems" % len(problems))
