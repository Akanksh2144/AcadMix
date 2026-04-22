"""
Resume Builder Service — Generates ATS-friendly .docx resumes from profile data.

Pulls from UserProfile.extra_data["resume_profile"] (student-editable fields)
and UserProfile base fields (ERP auto-fill) to produce a clean, single-column
Word document optimized for ATS scanners.

Templates:
  - classic: Clean, professional, single-column. Academic style.
"""
import io
import logging
from typing import Dict, Any

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml.ns import qn

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models

logger = logging.getLogger("acadmix.resume_builder")

# ═══════════════════════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════════════════════
_FONT = "Times New Roman"
_CLR = RGBColor(0x00, 0x00, 0x00)  # Pure black for everything
_CONTENT_WIDTH = Cm(21 - 2.0 - 2.0)  # A4 width minus margins


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _margins(doc: Document):
    for s in doc.sections:
        s.top_margin = Cm(1.5)
        s.bottom_margin = Cm(1.5)
        s.left_margin = Cm(2.0)
        s.right_margin = Cm(2.0)


def _run(p, text, sz=Pt(11), bold=False, italic=False):
    """Add a black run — everything is black in this template."""
    r = p.add_run(text)
    r.font.name = _FONT
    r.font.size = sz
    r.font.color.rgb = _CLR
    if bold:
        r.bold = True
    if italic:
        r.font.italic = True
    return r


def _para(doc, sp_before=0, sp_after=0, align=None):
    p = doc.add_paragraph()
    fmt = p.paragraph_format
    fmt.space_before = Pt(sp_before)
    fmt.space_after = Pt(sp_after)
    if align:
        p.alignment = align
    return p


def _heading(doc, title):
    """Section heading — bold, larger, with thin bottom border. Not uppercase."""
    p = _para(doc, sp_before=8, sp_after=3)
    _run(p, title, sz=Pt(13), bold=True)

    # Thin bottom border
    pPr = p._p.get_or_add_pPr()
    bdr = pPr.makeelement(qn('w:pBdr'), {})
    bdr.append(bdr.makeelement(qn('w:bottom'), {
        qn('w:val'): 'single', qn('w:sz'): '4',
        qn('w:space'): '1', qn('w:color'): '000000',
    }))
    pPr.append(bdr)
    return p


def _bullet(doc, text):
    """Bullet point — round bullet, indented."""
    p = doc.add_paragraph()
    p.style = doc.styles['List Bullet']
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    _run(p, text, sz=Pt(11))
    return p


def _tech_stack_line(doc, tech):
    """Tech Stack: label bold, items regular. Indented to match bullets."""
    p = doc.add_paragraph()
    p.style = doc.styles['List Bullet']
    # Remove the bullet character by overriding numbering
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    # Clear bullet numbering — use indent only
    numPr = p._p.get_or_add_pPr().find(qn('w:numPr'))
    if numPr is not None:
        p._p.get_or_add_pPr().remove(numPr)
    # Manual indent to match bullets
    fmt = p.paragraph_format
    fmt.left_indent = Cm(1.27)  # Standard list bullet indent
    _run(p, "Tech Stack: ", sz=Pt(11), bold=True)
    _run(p, tech, sz=Pt(11))
    return p


# ═══════════════════════════════════════════════════════════════════════════════
# Template: Classic
# ═══════════════════════════════════════════════════════════════════════════════

def _build_classic(data: Dict[str, Any]) -> Document:
    doc = Document()
    _margins(doc)

    personal = data.get("personal", {})
    education = data.get("education_history", [])
    skills = data.get("skills", {})
    projects = data.get("projects", [])
    experience = data.get("experience", [])
    certs = data.get("certifications", [])
    achievements = data.get("achievements", [])
    summary = data.get("summary", "")

    # ── NAME ──────────────────────────────────────────────────
    name = personal.get("name", "").strip()
    p = _para(doc, sp_before=0, sp_after=2, align=WD_ALIGN_PARAGRAPH.CENTER)
    if name:
        _run(p, name, sz=Pt(18), bold=True)
    else:
        _run(p, "[Your Full Name]", sz=Pt(18), bold=True, italic=True)

    # ── CONTACT ───────────────────────────────────────────────
    contact = [v for v in [personal.get("email"), personal.get("phone"), personal.get("location")] if v]
    if contact:
        p = _para(doc, sp_before=0, sp_after=1, align=WD_ALIGN_PARAGRAPH.CENTER)
        _run(p, "  |  ".join(contact), sz=Pt(10))

    # ── LINKS ─────────────────────────────────────────────────
    links = [v for v in [personal.get("linkedin"), personal.get("github"), personal.get("portfolio")] if v]
    if links:
        p = _para(doc, sp_before=0, sp_after=3, align=WD_ALIGN_PARAGRAPH.CENTER)
        _run(p, "  |  ".join(links), sz=Pt(10))

    # ── SUMMARY ───────────────────────────────────────────────
    if summary and summary.strip():
        _heading(doc, "Summary")
        p = _para(doc, sp_before=1, sp_after=2)
        _run(p, summary.strip(), sz=Pt(11))

    # ── EDUCATION ─────────────────────────────────────────────
    _heading(doc, "Education")

    current = personal.get("current_education")
    if current and current.get("institution"):
        branch = current.get("branch", "")
        degree = current.get("degree", "B.Tech")
        title = f"{degree} in {branch}" if branch else degree

        # Line 1: Degree + Institution .... right-aligned Batch
        p = _para(doc, sp_before=2, sp_after=0)
        p.paragraph_format.tab_stops.add_tab_stop(_CONTENT_WIDTH, WD_TAB_ALIGNMENT.RIGHT)
        _run(p, f"{title}, ", sz=Pt(11), bold=True)
        _run(p, current["institution"], sz=Pt(11))
        if current.get("batch"):
            _run(p, "\t", sz=Pt(11))
            _run(p, current["batch"], sz=Pt(11), italic=True)

    for edu in education:
        level = edu.get("level", "")
        school = edu.get("school", "")

        # Line 1: Level, School .... right-aligned Year
        p = _para(doc, sp_before=4, sp_after=0)
        p.paragraph_format.tab_stops.add_tab_stop(_CONTENT_WIDTH, WD_TAB_ALIGNMENT.RIGHT)
        _run(p, level, sz=Pt(11), bold=True)
        if school:
            _run(p, f", {school}", sz=Pt(11))
        if edu.get("year"):
            _run(p, "\t", sz=Pt(11))
            _run(p, str(edu["year"]), sz=Pt(11), italic=True)

        # Line 2: Board | Percentage (subtitle)
        sub = []
        if edu.get("board"):
            sub.append(edu["board"])
        if edu.get("percentage"):
            sub.append(f"{edu['percentage']}")
        if sub:
            p2 = _para(doc, sp_before=0, sp_after=1)
            _run(p2, "  |  ".join(sub), sz=Pt(10), italic=True)

    # ── SKILLS ────────────────────────────────────────────────
    has_skills = any(skills.get(k) for k in ["languages", "frameworks", "tools", "databases"])
    if has_skills:
        _heading(doc, "Technical Skills")
        for key, label in [("languages", "Languages"), ("frameworks", "Frameworks"),
                           ("tools", "Tools & Platforms"), ("databases", "Databases")]:
            items = skills.get(key, [])
            if items:
                p = _para(doc, sp_before=0, sp_after=1)
                _run(p, f"{label}: ", sz=Pt(11), bold=True)
                _run(p, ", ".join(items), sz=Pt(11))

    # ── PROJECTS ──────────────────────────────────────────────
    if projects:
        _heading(doc, "Projects")
        for proj in projects:
            title = proj.get("title", "Untitled")

            # Bold project title
            p = _para(doc, sp_before=3, sp_after=1)
            _run(p, title, sz=Pt(11), bold=True)

            # Bullets first
            bullets = proj.get("bullets", [])
            for b in bullets:
                if b and b.strip():
                    _bullet(doc, b.strip())

            # Tech Stack: at the end, indented to match bullets
            tech = proj.get("tech_stack", "")
            if tech:
                _tech_stack_line(doc, tech)

    # ── EXPERIENCE ────────────────────────────────────────────
    if experience:
        _heading(doc, "Experience")
        for exp in experience:
            role = exp.get("role", "Role")
            company = exp.get("company", "")

            # Bold role title
            p = _para(doc, sp_before=3, sp_after=0)
            _run(p, role, sz=Pt(11), bold=True)
            if company:
                _run(p, f", {company}", sz=Pt(11))

            # Duration/location subtitle
            sub = [v for v in [exp.get("duration"), exp.get("location")] if v]
            if sub:
                p2 = _para(doc, sp_before=0, sp_after=1)
                _run(p2, "  |  ".join(sub), sz=Pt(10), italic=True)

            # Bullets
            bullets = exp.get("bullets", [])
            for b in bullets:
                if b and b.strip():
                    _bullet(doc, b.strip())

    # ── CERTIFICATIONS ────────────────────────────────────────
    if certs:
        _heading(doc, "Certifications")
        for c in certs:
            p = _para(doc, sp_before=0, sp_after=1)
            _run(p, c.get("name", ""), sz=Pt(11), bold=True)
            suffix = [v for v in [c.get("issuer"), c.get("year") and str(c["year"])] if v]
            if suffix:
                _run(p, f" — {', '.join(suffix)}", sz=Pt(11))

    # ── ACHIEVEMENTS ──────────────────────────────────────────
    if achievements:
        _heading(doc, "Achievements")
        for a in achievements:
            text = a if isinstance(a, str) else a.get("title", "")
            if text and text.strip():
                _bullet(doc, text.strip())

    return doc


# ═══════════════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════════════

async def generate_docx(
    user: dict,
    session: AsyncSession,
    template: str = "classic",
) -> io.BytesIO:
    """Generate a resume .docx from the student's resume profile data."""
    result = await session.execute(
        select(models.UserProfile).where(
            models.UserProfile.user_id == user["id"],
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise ValueError("No profile found")

    extra = profile.extra_data or {}
    resume = extra.get("resume_profile", {})

    # Resolve college name
    user_obj = await session.get(models.User, user["id"])
    institution = ""
    if user_obj and user_obj.college_id:
        college = await session.get(models.College, user_obj.college_id)
        if college:
            institution = college.name

    data = {
        "personal": {
            "name": profile.full_name or user.get("full_name", ""),
            "email": resume.get("email") or user.get("email", ""),
            "phone": resume.get("phone") or getattr(profile, "phone", "") or "",
            "location": resume.get("location", ""),
            "linkedin": resume.get("linkedin", ""),
            "github": resume.get("github", ""),
            "portfolio": resume.get("portfolio", ""),
            "current_education": {
                "degree": "B.Tech",
                "institution": institution,
                "branch": profile.department or "",
                "batch": profile.batch or "",
            },
        },
        "summary": resume.get("summary", ""),
        "education_history": resume.get("education_history", []),
        "skills": resume.get("skills", {}),
        "projects": resume.get("projects", []),
        "experience": resume.get("experience", []),
        "certifications": resume.get("certifications", []),
        "achievements": resume.get("achievements", []),
    }

    doc = _build_classic(data)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    student_name = (profile.full_name or "resume").replace(" ", "_")
    logger.info("Generated %s resume for student %s", template, user["id"])
    return buffer, f"{student_name}_Resume.docx"
