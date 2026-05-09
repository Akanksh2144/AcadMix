import asyncio
import os
from database import admin_session_ctx
from app.services.report_engine import ReportEngineService
from jinja2 import Environment, FileSystemLoader
from app.workers.pdf_generator import _generate_pdf_bytes

async def run_stress_test():
    async with admin_session_ctx() as session:
        engine = ReportEngineService(session)
        # Using AITS and 2024-2025 as the baseline
        payload = await engine.aggregate_naac_payload("AITS", "2024-2025")
        
        # Inject stress test data
        payload["swoc"]["strength"] = "STRENGTH: " + "This is a very long paragraph to test pagination and text wrapping across the PDF boundary. " * 50
        
        # Add a dummy metric with lots of evidence
        payload["quantitative_metrics"]["STRESS_1"] = {
            "name": "Stress Test Metric with Massive Data Table",
            "yearly_data": [
                {"year": "2020", "value": 1500, "evidence_ids": ["1", "2"], "locked": True},
                {"year": "2021", "value": 2500, "evidence_ids": ["3", "4"], "locked": True},
                {"year": "2022", "value": 3500, "evidence_ids": ["5", "6"], "locked": True},
            ],
            "evidence": [
                {"description": "Very long evidence description name that might wrap " * 5, "presigned_url": "http://example.com/long/url"} for _ in range(10)
            ]
        }

        base_dir = os.path.dirname(os.path.abspath(__file__))
        template_dir = os.path.join(base_dir, "app", "templates")
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("naac_ssr_template.html")
        html_out = template.render(payload)
        
        pdf_bytes = _generate_pdf_bytes(html_out)
        
        output_path = r"C:\Users\akank\.gemini\antigravity\brain\204d6593-0cc6-4bf5-a517-ee4f06681e78\artifacts\QA_stress_test_naac.pdf"
        html_output_path = r"C:\Users\akank\.gemini\antigravity\brain\204d6593-0cc6-4bf5-a517-ee4f06681e78\artifacts\QA_stress_test_naac.html"
        
        with open(html_output_path, "w", encoding="utf-8") as f:
            f.write(html_out)
            
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
        
        print(f"Stress test PDF generated at: {output_path}")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
