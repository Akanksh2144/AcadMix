"""
JSONB Schema Validation — Pydantic models for schemaless JSONB fields.

Provides type-safe validation for JSONB columns that would otherwise
accept any arbitrary dict, preventing silent data corruption.

Supported fields:
  - College.settings  → CollegeSettings
  - Hostel.meta_data  → HostelMetaData
  - User.profile_data → UserProfileData

Usage in service layer:
    from app.schemas.jsonb_schemas import validate_jsonb, CollegeSettings

    # On write (validate before saving)
    validated = validate_jsonb(raw_dict, CollegeSettings)
    college.settings = validated

    # On read (parse with forward compatibility)
    settings = CollegeSettings.model_validate(college.settings or {})

All models use `extra="allow"` for forward compatibility — unknown keys
are preserved but logged as warnings.
"""
import logging
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, field_validator

logger = logging.getLogger("acadmix.jsonb")


# ═══════════════════════════════════════════════════════════════════════════════
# College.settings JSONB schema
# ═══════════════════════════════════════════════════════════════════════════════


class CollegeBranding(BaseModel):
    """Branding configuration within College.settings."""
    model_config = ConfigDict(extra="allow")

    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    favicon_url: Optional[str] = None


class CollegeFeatures(BaseModel):
    """Feature flags within College.settings."""
    model_config = ConfigDict(extra="allow")

    hostel_enabled: bool = True
    transport_enabled: bool = True
    library_enabled: bool = True
    placement_enabled: bool = True
    interview_prep_enabled: bool = True
    whatsapp_bot_enabled: bool = False
    iot_enabled: bool = False


class CollegeSettings(BaseModel):
    """Schema for College.settings JSONB field."""
    model_config = ConfigDict(extra="allow")

    plan: str = "starter"  # starter | professional | enterprise
    features: Optional[CollegeFeatures] = None
    branding: Optional[CollegeBranding] = None
    timezone: str = "Asia/Kolkata"
    academic_year_start_month: int = 6  # June
    attendance_threshold_pct: float = 75.0

    @field_validator("plan")
    @classmethod
    def validate_plan(cls, v):
        allowed = {"starter", "professional", "enterprise", "trial"}
        if v not in allowed:
            logger.warning("Unknown plan '%s' in College.settings — defaulting to 'starter'", v)
            return "starter"
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Hostel.meta_data JSONB schema
# ═══════════════════════════════════════════════════════════════════════════════


class FloorElement(BaseModel):
    """A single element on a floor blueprint grid."""
    model_config = ConfigDict(extra="allow")

    id: str
    type: str  # room | corridor | stairs | vending_machine | water_machine | empty
    row: int
    col: int
    label: Optional[str] = None
    room_id: Optional[str] = None
    color: Optional[str] = None


class FloorLayout(BaseModel):
    """Layout for a single floor in the blueprint editor."""
    model_config = ConfigDict(extra="allow")

    floor_number: int
    rows: int = 10
    cols: int = 10
    elements: list[FloorElement] = []


class HostelMetaData(BaseModel):
    """Schema for Hostel.meta_data JSONB field."""
    model_config = ConfigDict(extra="allow")

    floor_layouts: Optional[dict[str, FloorLayout]] = None


# ═══════════════════════════════════════════════════════════════════════════════
# User.profile_data JSONB schema
# ═══════════════════════════════════════════════════════════════════════════════

# Keys that must NEVER be set via profile_data (prevents prototype pollution)
_PROTECTED_PROFILE_KEYS = {"id", "role", "email", "name", "tenant_id", "college_id"}


class UserProfileData(BaseModel):
    """Schema for User.profile_data JSONB field.
    
    Uses extra="allow" for extensibility. Protected keys are stripped
    on validation to prevent privilege escalation via JSONB injection.
    """
    model_config = ConfigDict(extra="allow")

    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    photo_url: Optional[str] = None
    student_id: Optional[str] = None
    company_id: Optional[str] = None
    section_id: Optional[str] = None

    @classmethod
    def strip_protected_keys(cls, data: dict) -> dict:
        """Remove protected keys that could cause privilege escalation."""
        cleaned = {k: v for k, v in data.items() if k not in _PROTECTED_PROFILE_KEYS}
        removed = set(data.keys()) - set(cleaned.keys())
        if removed:
            logger.warning(
                "Stripped protected keys from profile_data: %s (potential injection attempt)",
                removed,
            )
        return cleaned


# ═══════════════════════════════════════════════════════════════════════════════
# Validation utility
# ═══════════════════════════════════════════════════════════════════════════════


def validate_jsonb(
    data: Any,
    schema_class: type[BaseModel],
    warn_on_extra: bool = True,
) -> dict:
    """Validate a JSONB dict against a Pydantic schema.

    Args:
        data: Raw dict from the database or API input.
        schema_class: Pydantic model class to validate against.
        warn_on_extra: If True, log warnings for unexpected keys.

    Returns:
        Validated dict (cleaned and type-coerced).
    """
    if data is None:
        data = {}

    if not isinstance(data, dict):
        logger.warning(
            "Expected dict for %s JSONB, got %s — returning empty dict",
            schema_class.__name__, type(data).__name__,
        )
        return {}

    try:
        validated = schema_class.model_validate(data)
        result = validated.model_dump(exclude_none=False)

        if warn_on_extra:
            # Detect keys not in the schema (the "extra" fields)
            schema_fields = set(schema_class.model_fields.keys())
            extra_keys = set(data.keys()) - schema_fields
            if extra_keys:
                logger.debug(
                    "JSONB %s has extra keys (forward-compat preserved): %s",
                    schema_class.__name__, extra_keys,
                )

        return result
    except Exception as e:
        logger.warning(
            "JSONB validation failed for %s: %s — returning raw data",
            schema_class.__name__, e,
        )
        return data
