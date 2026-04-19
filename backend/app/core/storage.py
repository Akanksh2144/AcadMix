"""
Object Storage Client — Cloudflare R2 (S3-compatible).

Provides async-friendly upload/download/delete/presign operations
for all AcadMix file storage needs (resumes, materials, profiles, etc.).

Uses boto3 with a custom endpoint URL pointing to Cloudflare R2.
Falls back to local filesystem storage when R2 credentials are not configured (dev mode).
"""
import io
import os
import uuid
import logging
from typing import Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger("acadmix.storage")


def _get_s3_client():
    """Create a boto3 S3 client configured for Cloudflare R2."""
    if not settings.R2_ACCOUNT_ID or not settings.R2_ACCESS_KEY_ID:
        logger.warning("R2 credentials not configured — file storage will use local fallback")
        return None

    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=BotoConfig(
            signature_version="s3v4",
            retries={"max_attempts": 2, "mode": "standard"},
        ),
        region_name="auto",
    )


# Module-level lazy client
_s3 = None


def _client():
    global _s3
    if _s3 is None:
        _s3 = _get_s3_client()
    return _s3


# ═══════════════════════════════════════════════════════════════════════════════
# Local Filesystem Fallback (dev mode)
# ═══════════════════════════════════════════════════════════════════════════════

LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage_local")


def _local_path(key: str) -> str:
    path = os.path.join(LOCAL_STORAGE_DIR, key.replace("/", os.sep))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


# ═══════════════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════════════

def upload_file(
    file_bytes: bytes,
    key: str,
    content_type: str = "application/octet-stream",
) -> str:
    """
    Upload file bytes to R2 (or local fallback).

    Args:
        file_bytes: Raw file content.
        key: Storage key (e.g. "resumes/{college_id}/{student_id}/resume_v1.pdf").
        content_type: MIME type.

    Returns:
        Public URL of the uploaded file.
    """
    client = _client()

    if client:
        client.upload_fileobj(
            Fileobj=io.BytesIO(file_bytes),
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            ExtraArgs={"ContentType": content_type},
        )
        if settings.R2_PUBLIC_URL:
            return f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"
        return f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{settings.R2_BUCKET_NAME}/{key}"
    else:
        # Local fallback for dev
        path = _local_path(key)
        with open(path, "wb") as f:
            f.write(file_bytes)
        logger.info("Saved file locally: %s (%d bytes)", path, len(file_bytes))
        return f"/storage/{key}"


def download_file(key: str) -> Optional[bytes]:
    """Download file bytes from R2 (or local fallback)."""
    client = _client()

    if client:
        try:
            response = client.get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            return response["Body"].read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return None
            raise
    else:
        path = _local_path(key)
        if os.path.exists(path):
            with open(path, "rb") as f:
                return f.read()
        return None


def delete_file(key: str) -> bool:
    """Delete a file from R2 (or local fallback). Returns True if deleted."""
    client = _client()

    if client:
        try:
            client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            return True
        except ClientError:
            logger.exception("Failed to delete from R2: %s", key)
            return False
    else:
        path = _local_path(key)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False


def generate_presigned_url(key: str, expires_in: int = 3600) -> Optional[str]:
    """Generate a time-limited download URL. Returns None if R2 is not configured."""
    client = _client()
    if not client:
        return None

    try:
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in,
        )
    except ClientError:
        logger.exception("Failed to generate presigned URL for: %s", key)
        return None


def generate_storage_key(college_id: str, bucket_prefix: str, filename: str) -> str:
    """
    Generate a unique storage key with collision-safe naming.

    Example: resumes/GNITC/abc-123/resume_v1_f8a3b.pdf
    """
    short_id = uuid.uuid4().hex[:6]
    safe_name = filename.replace(" ", "_")
    base, ext = os.path.splitext(safe_name)
    return f"{bucket_prefix}/{college_id}/{base}_{short_id}{ext}"
