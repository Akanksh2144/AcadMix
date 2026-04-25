import csv, json, sys
sys.stdout.reconfigure(encoding='utf-8')

files = ['15_bus_routes.csv','29_section_mentors.csv','30_hostel_allocation.csv',
         '31_bus_allocation.csv','33_scholarship_disbursements.csv','24_attendance_summary_past.csv']
for f in files:
    with open(f'../mock_data/{f}','r',encoding='utf-8') as fh:
        r = csv.DictReader(fh)
        print(f'{f}:')
        print(f'  cols: {r.fieldnames}')
        row = next(r)
        print(f'  sample: {json.dumps(dict(row), ensure_ascii=False)[:200]}')
        print()
