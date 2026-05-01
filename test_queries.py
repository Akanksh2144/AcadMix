import urllib.request
import json
import time

URL = 'https://axjhruxfwzymagaztney.supabase.co/functions/v1/insights-query'
HEADERS = {'Content-Type': 'application/json'}

queries = [
    'List the top 10 students who have both CGPA above 9.0 and have unpaid fee invoices',
    'Show me the pass rate and average CGPA for each department for the 2021-25 batch.',
    'Which faculty members are teaching subjects where no students have attended yet?',
    'List the hostels where occupancy is below 80%.',
    'How many students applied for placements but got rejected, grouped by their department?'
]

payload_base = {
    'college_id': 'aits-hyd-001'
}

with open('query_results.md', 'w', encoding='utf-8') as f:
    f.write("# Insights Engine - Diverse Query Tests\n\n")

    for q in queries:
        print(f"\n--- Testing: {q} ---")
        data = payload_base.copy()
        data['message'] = q
        req = urllib.request.Request(URL, data=json.dumps(data).encode('utf-8'), headers=HEADERS, method='POST')
        
        output = f"## Query: `{q}`\n\n"
        
        try:
            with urllib.request.urlopen(req) as response:
                res = json.loads(response.read().decode())
                
                rows = res.get('row_count', 0)
                source = res.get('source')
                ms = res.get('timing', {}).get('total_ms', 0)
                summary = res.get('summary', '')
                sql_debug = res.get('sql_debug', 'No SQL generated')
                
                print(f"Success! Rows: {rows}, Source: {source}, Time: {ms}ms")
                print(f"SQL Executed: {sql_debug}\n")
                output += f"- **Source/Route:** {source}\n"
                output += f"- **Rows Returned:** {rows}\n"
                output += f"- **Execution Time:** {ms}ms\n"
                output += f"- **AI Summary:** {summary}\n"
                output += f"- **SQL:**\n```sql\n{sql_debug}\n```\n\n"
                
                if rows > 0:
                    sample = res.get('data')[0]
                    output += f"**Sample Record:**\n```json\n{json.dumps(sample, indent=2)}\n```\n\n"
                elif source == 'vague_handler':
                    output += "**Vague Handler Response:** Handled correctly without failing.\n\n"
                else:
                    output += "**Warning:** Valid SQL generated, but no data matches the query.\n\n"
                    
        except urllib.error.HTTPError as e:
            err = e.read().decode()
            print(f"Error {e.code}: {err}")
            output += f"**FAILED ({e.code}):** {err}\n\n"
        except Exception as e:
            print(f"Exception: {e}")
            output += f"**EXCEPTION:** {e}\n\n"
            
        f.write(output)
        
print("\nDone! Results saved to query_results.md")
