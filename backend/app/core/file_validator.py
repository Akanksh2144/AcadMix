"""
File Validator — server-side upload validation for security hardening.

Validates file uploads by:
  1. File size enforcement (vs. configured max)
  2. Extension whitelist (prevents .exe, .bat, .sh, etc.)
  3. Magic byte verification (detects disguised files: .exe renamed to .pdf)
  4. Double-extension rejection (resume.pdf.exe, image.png.js)

Usage in storage.py or router handlers:
    from app.core.file_validator import validate_upload

    result = validate_upload(file_bytes, "resume.pdf", max_size_mb=2)
    if not result.is_valid:
        raise InputValidationError(result.rejection_reason)
"""
import os
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger("acadmix.file_validator")

# ═══════════════════════════════════════════════════════════════════════════════
# MAGIC BYTE SIGNATURES — first N bytes that identify file types.
# Used to detect file type regardless of extension.
# ═══════════════════════════════════════════════════════════════════════════════

_MAGIC_SIGNATURES = {
    # PDF
    b"%PDF": "application/pdf",
    # PNG
    b"\x89PNG": "image/png",
    # JPEG (multiple SOI markers)
    b"\xff\xd8\xff\xe0": "image/jpeg",
    b"\xff\xd8\xff\xe1": "image/jpeg",
    b"\xff\xd8\xff\xdb": "image/jpeg",
    b"\xff\xd8\xff\xee": "image/jpeg",
    # ZIP (covers DOCX, XLSX, PPTX, ODT)
    b"PK\x03\x04": "application/zip",
    b"PK\x05\x06": "application/zip",
    # GIF
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    # WebP
    b"RIFF": "image/webp",
}

# Extensions we allow (lowercase, with dot)
ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".rtf",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".xlsx", ".xls", ".csv",
    ".pptx", ".ppt",
    ".odt", ".ods", ".odp",
}

# Dangerous extensions that should NEVER be accepted, regardless of config
BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".msi",
    ".com", ".scr", ".pif", ".cpl", ".hta", ".inf", ".reg",
    ".wsf", ".wsh", ".jar", ".py", ".rb", ".pl",
    ".dll", ".sys", ".drv", ".ocx",
}


@dataclass
class FileValidationResult:
    """Result of file validation."""
    is_valid: bool
    detected_mime: Optional[str] = None
    rejection_reason: Optional[str] = None
    file_size_bytes: int = 0


def _detect_mime_from_magic(file_bytes: bytes) -> Optional[str]:
    """Detect MIME type from magic bytes (file header signature)."""
    if len(file_bytes) < 4:
        return None

    for signature, mime_type in _MAGIC_SIGNATURES.items():
        sig_len = len(signature)
        if file_bytes[:sig_len] == signature:
            return mime_type

    return None


def _has_double_extension(filename: str) -> bool:
    """Detect double extensions like resume.pdf.exe or image.png.js."""
    parts = filename.rsplit(".", maxsplit=2)
    if len(parts) >= 3:
        # e.g., ["resume", "pdf", "exe"] — two extensions present
        second_ext = f".{parts[-1].lower()}"
        first_ext = f".{parts[-2].lower()}"
        # If either extension is dangerous, reject
        if second_ext in BLOCKED_EXTENSIONS or first_ext in BLOCKED_EXTENSIONS:
            return True
    return False


def validate_upload(
    file_bytes: bytes,
    filename: str,
    max_size_mb: float = 2.0,
    allowed_extensions: set[str] | None = None,
) -> FileValidationResult:
    """Validate an uploaded file for safety.

    Args:
        file_bytes: Raw file content.
        filename: Original filename from the client.
        max_size_mb: Maximum allowed file size in MB.
        allowed_extensions: Set of allowed extensions (with dot, lowercase).
                            Defaults to ALLOWED_EXTENSIONS.

    Returns:
        FileValidationResult with is_valid, detected_mime, and rejection_reason.
    """
    allowed = allowed_extensions or ALLOWED_EXTENSIONS
    file_size = len(file_bytes)

    # 1. Size check
    max_bytes = int(max_size_mb * 1024 * 1024)
    if file_size > max_bytes:
        return FileValidationResult(
            is_valid=False,
            file_size_bytes=file_size,
            rejection_reason=f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum ({max_size_mb}MB).",
        )

    # 2. Extension check
    _, ext = os.path.splitext(filename.lower())
    if not ext:
        return FileValidationResult(
            is_valid=False,
            file_size_bytes=file_size,
            rejection_reason="File has no extension. Cannot determine file type.",
        )

    if ext in BLOCKED_EXTENSIONS:
        logger.warning("Blocked upload of dangerous file type: %s (ext=%s)", filename, ext)
        return FileValidationResult(
            is_valid=False,
            file_size_bytes=file_size,
            rejection_reason=f"File type '{ext}' is not allowed for security reasons.",
        )

    if ext not in allowed:
        return FileValidationResult(
            is_valid=False,
            file_size_bytes=file_size,
            rejection_reason=f"File type '{ext}' is not supported. Allowed: {', '.join(sorted(allowed))}",
        )

    # 3. Double extension check
    if _has_double_extension(filename):
        logger.warning("Blocked upload with double extension: %s", filename)
        return FileValidationResult(
            is_valid=False,
            file_size_bytes=file_size,
            rejection_reason="File has a suspicious double extension. Please rename and retry.",
        )

    # 4. Magic byte verification
    detected_mime = _detect_mime_from_magic(file_bytes)

    # Extensions that MUST have verifiable magic bytes.
    # If a file claims to be .pdf but magic bytes are unrecognized, it's suspicious.
    _STRICT_MAGIC_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"}

    if ext in _STRICT_MAGIC_EXTENSIONS and detected_mime is None:
        logger.warning(
            "Blocked disguised file: %s (ext=%s, no matching magic bytes)",
            filename, ext,
        )
        return FileValidationResult(
            is_valid=False,
            file_size_bytes=file_size,
            rejection_reason=(
                f"File content does not match its extension '{ext}'. "
                f"The file may be corrupted or disguised."
            ),
        )

    # If we detected a MIME type from magic bytes, cross-check against extension
    if detected_mime:
        ext_mime_map = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".docx": "application/zip",  # DOCX is a ZIP archive
            ".xlsx": "application/zip",  # XLSX is a ZIP archive
            ".pptx": "application/zip",  # PPTX is a ZIP archive
            ".odt": "application/zip",   # ODF files are ZIP archives
        }
        expected_mime = ext_mime_map.get(ext)
        if expected_mime and detected_mime != expected_mime:
            logger.warning(
                "MIME mismatch: file=%s ext=%s expected_mime=%s detected_mime=%s",
                filename, ext, expected_mime, detected_mime,
            )
            return FileValidationResult(
                is_valid=False,
                detected_mime=detected_mime,
                file_size_bytes=file_size,
                rejection_reason=(
                    f"File content does not match its extension '{ext}'. "
                    f"Expected {expected_mime} but detected {detected_mime}."
                ),
            )

    return FileValidationResult(
        is_valid=True,
        detected_mime=detected_mime,
        file_size_bytes=file_size,
    )

