import os
import io
import zipfile
import logging
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader

# Assuming a Celery instance is configured in the app
# from app.core.celery_app import celery_app
# Mocking celery_app for structure
class MockCeleryApp:
    def task(self, *args, **kwargs):
        def decorator(func):
            return func
        return decorator
celery_app = MockCeleryApp()

from sqlalchemy.future import select
from database import AdminSessionLocal
from app.models.accreditation import AccreditationReportJob, AccreditationEvidence
from app.services.report_engine import ReportEngineService

logger = logging.getLogger("acadmix.workers.pdf_generator")

# S3 Configuration (usually from environment)
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "acadmix-evidence")
S3_CLIENT = boto3.client(
    's3',
    endpoint_url=os.getenv("S3_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

def stream_s3_file_to_zip(zip_file, s3_key, arcname, missing_files_list):
    """
    Streams a file from S3 directly into the zip archive in chunks.
    Handles 404/Connection errors by appending to missing_files_list.
    """
    try:
        response = S3_CLIENT.get_object(Bucket=S3_BUCKET, Key=s3_key)
        
        # Write to zip in chunks (memory safe)
        with zip_file.open(arcname, 'w') as zf:
            for chunk in response['Body'].iter_chunks(chunk_size=1024*1024): # 1MB chunks
                zf.write(chunk)
                
    except ClientError as e:
        error_code = e.response['Error']['Code']
        logger.warning(f"Failed to fetch {s3_key} from S3: {error_code}")
        missing_files_list.append(f"S3_ERROR: {s3_key} ({error_code})")
    except Exception as e:
        logger.error(f"Unexpected error fetching {s3_key}: {str(e)}")
        missing_files_list.append(f"FETCH_ERROR: {s3_key} ({str(e)})")


@celery_app.task(bind=True, time_limit=600, soft_time_limit=540)
def generate_naac_ssr(self, job_id: str):
    """
    Generates the complete NAAC SSR (PDF + Evidence Zip).
    """
    logger.info(f"Starting NAAC SSR generation for job: {job_id}")
    
    # 1. Fetch Job from DB
    with SessionLocal() as db:
        job = db.query(AccreditationReportJob).filter_by(id=job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found.")
            return
            
        job.status = "PROCESSING"
        db.commit()
        
        try:
            # 2. Fetch Aggregated Payload
            engine = ReportEngineService(db)
            # In an async context, we'd await. Here we assume synchronous block or run_until_complete
            import asyncio
            payload = asyncio.run(engine.aggregate_naac_payload(job.college_id, job.academic_year))
            
            # 3. Render HTML
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            template_dir = os.path.join(base_dir, "templates")
            env = Environment(loader=FileSystemLoader(template_dir))
            template = env.get_template("naac_ssr_template.html")
            html_out = template.render(payload)
            
            # 4. Generate PDF
            pdf_bytes = HTML(string=html_out).write_pdf()
            
            # 5. Build DVV Zip in memory
            zip_buffer = io.BytesIO()
            missing_evidence = []
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add PDF
                zip_file.writestr("NAAC_SSR_Report.pdf", pdf_bytes)
                
                # Fetch all evidence records for this college and year
                # For a real implementation, we'd filter only the evidence linked in the payload
                evidence_records = db.query(AccreditationEvidence).filter_by(
                    college_id=job.college_id,
                    academic_year=job.academic_year
                ).all()
                
                for ev in evidence_records:
                    if not ev.s3_key:
                        missing_evidence.append(f"DB_ERROR: Evidence record {ev.id} has no s3_key.")
                        continue
                        
                    arcname = f"evidence/{ev.metric_code}/{ev.file_name}"
                    stream_s3_file_to_zip(zip_file, ev.s3_key, arcname, missing_evidence)
                
                # Add missing evidence report if necessary
                if missing_evidence:
                    report_content = "Missing Evidence Report\n" + "="*25 + "\n\n"
                    report_content += "\n".join(missing_evidence)
                    zip_file.writestr("missing_evidence_report.txt", report_content)
                    
            zip_buffer.seek(0)
            
            # 6. Upload Zip to R2/S3
            output_s3_key = f"exports/{job.college_id}/NAAC_SSR_{job.academic_year}_v{job.version}.zip"
            S3_CLIENT.upload_fileobj(zip_buffer, S3_BUCKET, output_s3_key)
            
            # 7. Generate 30-day Presigned URL
            presigned_url = S3_CLIENT.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': output_s3_key},
                ExpiresIn=30 * 24 * 3600  # 30 days
            )
            
            # 8. Update Job Status
            job.status = "COMPLETED"
            job.presigned_url = presigned_url
            job.expires_at = datetime.utcnow() + timedelta(days=30)
            db.commit()
            
            logger.info(f"Successfully generated NAAC SSR for job: {job_id}")
            
        except Exception as e:
            logger.exception(f"Error generating NAAC SSR for job {job_id}: {str(e)}")
            job.status = "FAILED"
            db.commit()
            raise e

@celery_app.task(bind=True, time_limit=600, soft_time_limit=540)
def generate_nba_sar(self, job_id: str):
    """
    Generates the complete NBA SAR (PDF + Appendix CSV).
    """
    logger.info(f"Starting NBA SAR generation for job: {job_id}")
    
    with SessionLocal() as db:
        job = db.query(AccreditationReportJob).filter_by(id=job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found.")
            return
            
        job.status = "PROCESSING"
        db.commit()
        
        try:
            # 1. Fetch Aggregated Payload
            engine = ReportEngineService(db)
            import asyncio
            payload = asyncio.run(engine.aggregate_nba_payload(job.college_id, job.academic_year, job.department_id))
            
            # 2. Render HTML
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            template_dir = os.path.join(base_dir, "templates")
            env = Environment(loader=FileSystemLoader(template_dir))
            template = env.get_template("nba_sar_template.html")
            html_out = template.render(payload)
            
            # 3. Generate PDF
            pdf_bytes = HTML(string=html_out).write_pdf()
            
            # 4. Generate Appendix CSV
            csv_data = asyncio.run(engine.get_nba_appendix_data(job.college_id, job.academic_year, job.department_id))
            
            # 5. Build DVV Zip in memory
            zip_buffer = io.BytesIO()
            missing_evidence = []
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add PDF
                zip_file.writestr("NBA_SAR_Report.pdf", pdf_bytes)
                
                # Add CSV Appendix
                zip_file.writestr("NBA_Appendix.csv", csv_data)
                
                # Optional: stream evidence if mapped
                evidence_records = db.query(AccreditationEvidence).filter_by(
                    college_id=job.college_id,
                    criterion_id=job.department_id  # approximation for NBA department scope
                ).all()
                
                for ev in evidence_records:
                    if not ev.s3_key:
                        missing_evidence.append(f"DB_ERROR: Evidence record {ev.id} has no s3_key.")
                        continue
                        
                    arcname = f"evidence/{ev.file_name}"
                    stream_s3_file_to_zip(zip_file, ev.s3_key, arcname, missing_evidence)
                
                if missing_evidence:
                    report_content = "Missing Evidence Report\n" + "="*25 + "\n\n"
                    report_content += "\n".join(missing_evidence)
                    zip_file.writestr("missing_evidence_report.txt", report_content)
                    
            zip_buffer.seek(0)
            
            # 6. Upload Zip to R2/S3
            output_s3_key = f"exports/{job.college_id}/NBA_SAR_{job.department_id}_{job.academic_year}_v{job.version}.zip"
            S3_CLIENT.upload_fileobj(zip_buffer, S3_BUCKET, output_s3_key)
            
            # 7. Generate 30-day Presigned URL
            presigned_url = S3_CLIENT.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': output_s3_key},
                ExpiresIn=30 * 24 * 3600  # 30 days
            )
            
            # 8. Update Job Status
            job.status = "COMPLETED"
            job.presigned_url = presigned_url
            job.expires_at = datetime.utcnow() + timedelta(days=30)
            db.commit()
            
            logger.info(f"Successfully generated NBA SAR for job: {job_id}")
            
        except Exception as e:
            logger.exception(f"Error generating NBA SAR for job {job_id}: {str(e)}")
            job.status = "FAILED"
            db.commit()
            raise e
