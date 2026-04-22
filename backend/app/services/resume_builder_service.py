"""
Resume Builder Service — Generates ATS-friendly .docx resumes from profile data.

Pulls from UserProfile.extra_data["resume_profile"] (student-editable fields)
and UserProfile base fields (ERP auto-fill) to produce a clean, single-column
Word document optimized for ATS scanners.

Templates:
  - classic: Clean, professional, single-column. Ideal for mass-recruiters.
"""
import io
import logging
from typing import Optional, Dict, Any, List

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml.ns import qn

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models

logger = logging.getLogger("acadmix.resume_builder")


# ═══════════════════════════════════════════════════════════════════════════════
# Style Constants
# ═══════════════════════════════════════════════════════════════════════════════

_FONT = "Calibri"
_NAME_SZ = Pt(20)
_CONTACT_SZ = Pt(9.5)
_HEADING_SZ = Pt(11)
_TITLE_SZ = Pt(10.5)
_BODY_SZ = Pt(10)
_SUB_SZ = Pt(9)

_CLR_BLACK = RGBColor(0x1A, 0x1A, 0x2E)
_CLR_BODY = RGBColor(0x33, 0x33, 0x33)
_CLR_SUBTLE = RGBColor(0x66, 0x66, 0x66)
_CLR_LINK = RGBColor(0x0A, 0x66, 0xC2)
_CLR_HEADING = RGBColor(0x0D, 0x47, 0x71)
_CLR_PLACEHOLDER = RGBColor(0xBB, 0xBB, 0xBB)

# Page width minus margins  (A4 = 21cm, margins = 1.5cm each)
_CONTENT_WIDTH = Cm(21 - 1.5 - 1.5)  # 18cm


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _margins(doc: Document):
    for s in doc.sections:
        s.top_margin = Cm(1.2)
        s.bottom_margin = Cm(1.0)
        s.left_margin = Cm(1.5)
        s.right_margin = Cm(1.5)


def _run(p, text, sz=None, bold=False, color=None, italic=False):
    r = p.add_run(text)
    r.font.name = _FONT
    if sz:
        r.font.size = sz
    if bold:
        r.bold = True
    if italic:
        r.font.italic = True
    if color:
        r.font.color.rgb = color
    return r


def _para(doc, sp_before=0, sp_after=0, align=None):
    """Create an empty paragraph with spacing."""
    p = doc.add_paragraph()
    fmt = p.paragraph_format
    fmt.space_before = Pt(sp_before)
    fmt.space_after = Pt(sp_after)
    fmt.line_spacing = Pt(13)
    if align:
        p.alignment = align
    return p


def _heading(doc, title):
    """Section heading — uppercase, bold, dark teal, with solid bottom border."""
    p = _para(doc, sp_before=10, sp_after=3)
    _run(p, title.upper(), sz=_HEADING_SZ, bold=True, color=_CLR_HEADING)

    # Solid bottom border
    pPr = p._p.get_or_add_pPr()
    bdr = pPr.makeelement(qn('w:pBdr'), {})
    bdr.append(bdr.makeelement(qn('w:bottom'), {
        qn('w:val'): 'single', qn('w:sz'): '8',
        qn('w:space'): '1', qn('w:color'): '0D4771',
    }))
    pPr.append(bdr)
    return p


def _entry_line(doc, left_text, left_bold=True, right_text=None):
    """
    A two-column entry: bold title left, subtle date/info right-aligned.
    Uses a right-tab stop at the content width.
    """
    p = _para(doc, sp_before=2, sp_after=0)

    # Add right tab stop
    fmt = p.paragraph_format
    tab_stops = fmt.tab_stops
    tab_stops.add_tab_stop(_CONTENT_WIDTH, WD_TAB_ALIGNMENT.RIGHT)

    _run(p, left_text, sz=_TITLE_SZ, bold=left_bold, color=_CLR_BLACK)
    if right_text:
        _run(p, "\t", sz=_TITLE_SZ)
        _run(p, right_text, sz=_SUB_SZ, color=_CLR_SUBTLE)
    return p


def _subtitle(doc, text):
    """Subtle subtitle line (institution, location, board info)."""
    p = _para(doc, sp_before=0, sp_after=1)
    _run(p, text, sz=_SUB_SZ, color=_CLR_SUBTLE)
    return p


def _bullet(doc, text):
    """Bullet point with proper indentation."""
    p = doc.add_paragraph()
    p.style = doc.styles['List Bullet']
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = Pt(13)
    _run(p, text, sz=_BODY_SZ, color=_CLR_BODY)
    return p


def _placeholder(doc, hint):
    p = _para(doc, sp_before=0, sp_after=1)
    _run(p, f"[{hint}]", sz=_SUB_SZ, color=_CLR_PLACEHOLDER, italic=True)
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
    p.paragraph_format.line_spacing = Pt(20)
    if name:
        r = _run(p, name.upper(), sz=_NAME_SZ, bold=True, color=_CLR_BLACK)
        r.font.letter_spacing = Pt(2)
    else:
        r = _run(p, "[YOUR FULL NAME]", sz=_NAME_SZ, bold=True, color=_CLR_PLACEHOLDER)
        r.font.letter_spacing = Pt(2)

    # ── CONTACT ───────────────────────────────────────────────
    contact = [v for v in [personal.get("email"), personal.get("phone"), personal.get("location")] if v]
    if contact:
        p = _para(doc, sp_before=0, sp_after=1, align=WD_ALIGN_PARAGRAPH.CENTER)
        _run(p, "  •  ".join(contact), sz=_CONTACT_SZ, color=_CLR_SUBTLE)

    # ── LINKS ─────────────────────────────────────────────────
    links = [v for v in [personal.get("linkedin"), personal.get("github"), personal.get("portfolio")] if v]
    if links:
        p = _para(doc, sp_before=0, sp_after=4, align=WD_ALIGN_PARAGRAPH.CENTER)
        _run(p, "  •  ".join(links), sz=_CONTACT_SZ, color=_CLR_LINK)

    # ── SUMMARY ───────────────────────────────────────────────
    if summary and summary.strip():
        _heading(doc, "Professional Summary")
        p = _para(doc, sp_before=1, sp_after=2)
        _run(p, summary.strip(), sz=_BODY_SZ, color=_CLR_BODY)

    # ── EDUCATION ─────────────────────────────────────────────
    _heading(doc, "Education")

    current = personal.get("current_education")
    if current and current.get("institution"):
        branch = current.get("branch", "")
        degree = current.get("degree", "B.Tech")
        title = f"{degree} in {branch}" if branch else degree
        _entry_line(doc, title, right_text=current.get("batch", ""))
        _subtitle(doc, current["institution"])

    for edu in education:
        level = edu.get("level", "")
        school = edu.get("school", "")
        title = f"{level} — {school}" if school else level
        _entry_line(doc, title, right_text=edu.get("year", ""))
        sub = [v for v in [edu.get("board"), edu.get("percentage") and f"{edu['percentage']}%"] if v]
        if sub:
            _subtitle(doc, "  •  ".join(sub))

    if not current and not education:
        _placeholder(doc, "Add your education — degree, institution, CGPA, year")

    # ── SKILLS ────────────────────────────────────────────────
    has_skills = any(skills.get(k) for k in ["languages", "frameworks", "tools", "databases"])
    if has_skills:
        _heading(doc, "Technical Skills")
        for key, label in [("languages", "Languages"), ("frameworks", "Frameworks"),
                           ("tools", "Tools & Platforms"), ("databases", "Databases")]:
            items = skills.get(key, [])
            if items:
                p = _para(doc, sp_before=0, sp_after=1)
                _run(p, f"{label}: ", sz=_BODY_SZ, bold=True, color=_CLR_BLACK)
                _run(p, ", ".join(items), sz=_BODY_SZ, color=_CLR_BODY)

    # ── PROJECTS ──────────────────────────────────────────────
    if projects:
        _heading(doc, "Projects")
        for proj in projects:
            title = proj.get("title", "Untitled")
            tech = proj.get("tech_stack", "")
            left = f"{title} — {tech}" if tech else title
            _entry_line(doc, left, right_text=proj.get("duration", ""))

            link = proj.get("link", "")
            if link:
                p = _para(doc, sp_before=0, sp_after=0)
                _run(p, link, sz=_SUB_SZ, color=_CLR_LINK)

            bullets = proj.get("bullets", [])
            written = False
            for b in bullets:
                if b and b.strip():
                    _bullet(doc, b.strip())
                    written = True
            if not written:
                _placeholder(doc, "Describe what you built, the tech used, and measurable impact")

    # ── EXPERIENCE ────────────────────────────────────────────
    if experience:
        _heading(doc, "Experience")
        for exp in experience:
            role = exp.get("role", "Role")
            company = exp.get("company", "")
            left = f"{role} — {company}" if company else role
            _entry_line(doc, left, right_text=exp.get("duration", ""))

            loc = exp.get("location", "")
            if loc:
                _subtitle(doc, loc)

            bullets = exp.get("bullets", [])
            written = False
            for b in bullets:
                if b and b.strip():
                    _bullet(doc, b.strip())
                    written = True
            if not written:
                _placeholder(doc, "Describe responsibilities & achievements — use action verbs and metrics")

    # ── CERTIFICATIONS ────────────────────────────────────────
    if certs:
        _heading(doc, "Certifications")
        for c in certs:
            name_t = c.get("name", "")
            suffix = [v for v in [c.get("issuer"), c.get("year") and str(c["year"])] if v]
            left = f"{name_t} — {', '.join(suffix)}" if suffix else name_t
            p = _para(doc, sp_before=0, sp_after=1)
            _run(p, name_t, sz=_BODY_SZ, bold=True, color=_CLR_BLACK)
            if suffix:
                _run(p, f" — {', '.join(suffix)}", sz=_BODY_SZ, color=_CLR_SUBTLE)

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
    """
    Generate a resume .docx from the student's resume profile data.

    Returns an in-memory BytesIO buffer containing the .docx file.
    """
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

    if template == "classic":
        doc = _build_classic(data)
    else:
        doc = _build_classic(data)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    student_name = (profile.full_name or "resume").replace(" ", "_")
    logger.info("Generated %s resume for student %s", template, user["id"])
    return buffer, f"{student_name}_Resume.docx"
