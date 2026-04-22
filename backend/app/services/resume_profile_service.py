"""
Resume Profile Service — Manages student-editable resume fields.

Stores resume-enrichment data (projects, experience, certifications, links, etc.)
inside UserProfile.extra_data["resume_profile"] JSONB.  No new table needed.

This data fuels the Resume Studio auto-fill pipeline.
"""
import logging
from typing import Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm.attributes import flag_modified

from app import models

logger = logging.getLogger("acadmix.resume_profile")

# URL validation patterns — permissive but enforce correct domains
import re
_URL_VALIDATORS = {
    "linkedin": re.compile(r'^(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9_-]{3,100}/?$'),
    "github":   re.compile(r'^(https?://)?(www\.)?github\.com/[a-zA-Z0-9_-]{1,39}/?$'),
    "portfolio": re.compile(r'^(https?://)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(/.*)?$'),
}


# ═══════════════════════════════════════════════════════════════════════════════
# Schema constants — defines the shape of resume_profile within extra_data
# ═══════════════════════════════════════════════════════════════════════════════

ALLOWED_FIELDS = {
    # Social / Professional links
    "linkedin", "github", "portfolio", "location",

    # Professional summary
    "summary",

    # Prior education (10th, 12th)
    "education_history",   # list of {level, school, board, year, percentage}

    # Skills breakdown
    "skills",              # {languages: [], frameworks: [], tools: [], databases: []}

    # Projects
    "projects",            # list of {title, tech_stack, duration?, bullets: [], link?}

    # Work experience / internships
    "experience",          # list of {company, role, duration, location?, bullets: []}

    # Certifications
    "certifications",      # list of {name, issuer, year?, url?}

    # Achievements
    "achievements",        # list of strings
}


# ═══════════════════════════════════════════════════════════════════════════════
# Service Methods
# ═══════════════════════════════════════════════════════════════════════════════

async def get_resume_profile(user: dict, session: AsyncSession) -> Dict[str, Any]:
    """Fetch the student's resume profile from extra_data."""
    profile = await _get_user_profile(user, session)
    if not profile:
        return {}

    extra = profile.extra_data or {}
    resume_data = extra.get("resume_profile", {})

    # Merge in auto-filled fields from core profile
    user_obj = await session.get(models.User, user["id"])
    core_fields = {}
    if user_obj:
        core_fields["name"] = user_obj.name
        core_fields["email"] = user_obj.email

    core_fields["phone"] = profile.phone or ""
    core_fields["department"] = profile.department or ""
    core_fields["batch"] = profile.batch or ""
    core_fields["current_semester"] = profile.current_semester
    core_fields["roll_number"] = profile.roll_number or ""

    # Get college name
    if user_obj and user_obj.college_id:
        college = await session.get(models.College, user_obj.college_id)
        if college:
            core_fields["institution"] = college.name

    return {
        "auto_filled": core_fields,
        "editable": resume_data,
    }


async def update_resume_profile(
    user: dict,
    data: Dict[str, Any],
    session: AsyncSession,
) -> Dict[str, Any]:
    """Update the student's resume profile fields."""
    profile = await _get_user_profile(user, session)
    if not profile:
        logger.warning("No UserProfile found for user %s", user["id"])
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User profile not found")

    extra = dict(profile.extra_data or {})
    resume = dict(extra.get("resume_profile", {}))

    # Validate and merge only allowed fields
    for key, value in data.items():
        if key not in ALLOWED_FIELDS:
            continue

        # Validate list-type fields
        if key in ("education_history", "projects", "experience", "certifications"):
            if not isinstance(value, list):
                continue
            # Cap list lengths to prevent abuse
            resume[key] = value[:20]

        elif key == "achievements":
            if not isinstance(value, list):
                continue
            resume[key] = [str(a)[:500] for a in value[:15]]

        elif key == "skills":
            if not isinstance(value, dict):
                continue
            # Validate sub-keys
            cleaned = {}
            for sub_key in ("languages", "frameworks", "tools", "databases"):
                if sub_key in value and isinstance(value[sub_key], list):
                    cleaned[sub_key] = [str(s)[:100] for s in value[sub_key][:30]]
            resume[key] = cleaned

        elif key in ("linkedin", "github", "portfolio", "location", "summary"):
            val = str(value).strip()[:500] if value else ""
            # Validate URLs — reject silently if invalid
            if key in _URL_VALIDATORS and val:
                if not _URL_VALIDATORS[key].match(val):
                    logger.info("Rejected invalid %s URL: %s", key, val[:80])
                    continue
            resume[key] = val

    extra["resume_profile"] = resume
    profile.extra_data = extra
    flag_modified(profile, "extra_data")
    await session.commit()

    return resume


# ═══════════════════════════════════════════════════════════════════════════════
# Private Helpers
# ═══════════════════════════════════════════════════════════════════════════════

async def _get_user_profile(
    user: dict, session: AsyncSession
) -> Optional[models.UserProfile]:
    """Load the UserProfile for the current user."""
    result = await session.execute(
        select(models.UserProfile).where(
            models.UserProfile.user_id == user["id"],
        )
    )
    return result.scalars().first()
