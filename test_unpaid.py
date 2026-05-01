import os
from dotenv import load_dotenv
import requests
import json

load_dotenv("backend/.env")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

url = f"{SUPABASE_URL}/functions/v1/insights-query"

query = "List the top 10 students who have both CGPA above 9.0 and have unpaid fee invoices"
print(f"Testing query: {query}")
payload = {
    "message": query,
    "college_id": "COL-001"
}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    print(f"\nSUCCESS ({data.get('source')}): {data.get('row_count')} rows returned.")
    print("Columns:", data.get("columns"))
    print(f"Summary: {data.get('summary')}")
    if "sql_debug" in data:
        print(f"Executed SQL: {data['sql_debug']}")
    for i, row in enumerate(data.get("data", [])[:3]):
        print(f"Row {i+1}: {row}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response') and e.response:
        print(e.response.text)
