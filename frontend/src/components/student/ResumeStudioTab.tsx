import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, FilePdf, FileDoc, Download, Sparkle, Eye, PencilSimple,
  GraduationCap, Briefcase, Code, Certificate, Trophy, Globe,
  LinkedinLogo, GithubLogo, Envelope, Phone, MapPin, User,
  CaretDown, Check, Warning, ArrowRight, Notebook
} from '@phosphor-icons/react';
import { resumeProfileAPI } from '../../services/api';
import { toast } from 'sonner';

/* ── Animation Variants ─────────────────────────────────── */
const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

/* ── Template Configs ────────────────────────────────────── */
const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Clean, ATS-friendly single column' },
  { id: 'modern', label: 'Modern', desc: 'Coming soon', disabled: true },
];

/* ═══════════════════════════════════════════════════════════
   LIVE PREVIEW — renders the resume as a scaled A4 page
   ═══════════════════════════════════════════════════════════ */
const ResumePreview = ({ data, template }: { data: any; template: string }) => {
  const personal = data?.personal || {};
  const education = data?.education_history || [];
  const skills = data?.skills || {};
  const projects = data?.projects || [];
  const experience = data?.experience || [];
  const certs = data?.certifications || [];
  const achievements = data?.achievements || [];
  const summary = data?.summary || '';
  const currentEdu = personal.current_education;

  const SectionTitle = ({ children }: any) => (
    <div className="mt-[6px] mb-[3px] first:mt-0">
      <h3 className="text-[10px] font-[900] uppercase tracking-[0.18em] text-[#0D4771] border-b-[1.5px] border-[#0D4771] pb-[2px]">{children}</h3>
    </div>
  );
  const Placeholder = ({ text }: { text: string }) => (
    <p className="text-[8px] italic text-slate-300 leading-snug">[{text}]</p>
  );
  const Bullet = ({ children }: any) => (
    <p className="text-[8px] text-[#333] leading-[1.4] pl-[8px] relative before:content-['•'] before:absolute before:left-0 before:text-[#666]">{children}</p>
  );

  const hasSkills = skills.languages?.length || skills.frameworks?.length || skills.tools?.length || skills.databases?.length;

  return (
    <div className="w-full bg-white shadow-2xl shadow-black/10 rounded-sm overflow-hidden" style={{ aspectRatio: '210 / 297', fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}>
      <div className="p-5 h-full overflow-hidden">

        {/* Name */}
        <h1 className="text-center text-[16px] font-[900] tracking-[0.2em] text-[#1A1A2E] uppercase leading-tight">
          {personal.name || <span className="text-slate-300">YOUR FULL NAME</span>}
        </h1>

        {/* Contact */}
        {(personal.email || personal.phone || personal.location) && (
          <p className="text-center text-[8px] text-[#555] mt-[3px] leading-snug">
            {[personal.email, personal.phone, personal.location].filter(Boolean).join('  •  ')}
          </p>
        )}

        {/* Links */}
        {(personal.linkedin || personal.github || personal.portfolio) && (
          <p className="text-center text-[8px] text-[#0A66C2] mt-[2px] leading-snug">
            {[personal.linkedin, personal.github, personal.portfolio].filter(Boolean).join('  •  ')}
          </p>
        )}

        {/* Summary */}
        {summary.trim() && (
          <>
            <SectionTitle>Professional Summary</SectionTitle>
            <p className="text-[8px] text-[#333] leading-[1.5]">{summary}</p>
          </>
        )}

        {/* Education */}
        <SectionTitle>Education</SectionTitle>
        {currentEdu && currentEdu.institution && (
          <div className="mb-[4px]">
            <div className="flex items-baseline justify-between">
              <p className="text-[9px]">
                <span className="font-[800] text-[#1A1A2E]">{currentEdu.degree || 'B.Tech'}{currentEdu.branch ? ` in ${currentEdu.branch}` : ''}</span>
              </p>
              {currentEdu.batch && <span className="text-[8px] text-[#666]">{currentEdu.batch}</span>}
            </div>
            <p className="text-[8px] text-[#555]">{currentEdu.institution}</p>
          </div>
        )}
        {education.map((edu: any, i: number) => (
          <div key={i} className="mb-[3px]">
            <div className="flex items-baseline justify-between">
              <p className="text-[9px]">
                <span className="font-[800] text-[#1A1A2E]">{edu.level}</span>
                {edu.school && <span className="text-[#555]"> — {edu.school}</span>}
              </p>
              {edu.year && <span className="text-[8px] text-[#666]">{edu.year}</span>}
            </div>
            {(edu.board || edu.percentage) && (
              <p className="text-[8px] text-[#666]">
                {[edu.board, edu.percentage && `${edu.percentage}%`].filter(Boolean).join('  •  ')}
              </p>
            )}
          </div>
        ))}
        {!currentEdu?.institution && !education.length && (
          <Placeholder text="Add your education details" />
        )}

        {/* Skills */}
        {hasSkills ? (
          <>
            <SectionTitle>Technical Skills</SectionTitle>
            <div className="space-y-[1px]">
              {([['languages', 'Languages'], ['frameworks', 'Frameworks'], ['tools', 'Tools & Platforms'], ['databases', 'Databases']] as const).map(([key, label]) => {
                const items = skills[key];
                if (!items?.length) return null;
                return (
                  <p key={key} className="text-[8px] text-[#333] leading-[1.5]">
                    <span className="font-[700] text-[#1A1A2E]">{label}: </span>
                    {items.join(', ')}
                  </p>
                );
              })}
            </div>
          </>
        ) : null}

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <SectionTitle>Projects</SectionTitle>
            {projects.slice(0, 3).map((p: any, i: number) => (
              <div key={i} className="mb-[4px]">
                <div className="flex items-baseline justify-between">
                  <p className="text-[9px]">
                    <span className="font-[800] text-[#1A1A2E]">{p.title || 'Untitled'}</span>
                    {p.tech_stack && <span className="text-[#888] text-[8px]"> — {p.tech_stack}</span>}
                  </p>
                  {p.duration && <span className="text-[7px] text-[#888]">{p.duration}</span>}
                </div>
                {p.link && <p className="text-[7px] text-[#0A66C2]">{p.link}</p>}
                {p.bullets?.filter((b: string) => b.trim()).slice(0, 3).map((b: string, j: number) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <>
            <SectionTitle>Experience</SectionTitle>
            {experience.slice(0, 3).map((e: any, i: number) => (
              <div key={i} className="mb-[4px]">
                <div className="flex items-baseline justify-between">
                  <p className="text-[9px]">
                    <span className="font-[800] text-[#1A1A2E]">{e.role || 'Role'}</span>
                    {e.company && <span className="text-[#555]"> — {e.company}</span>}
                  </p>
                  {e.duration && <span className="text-[8px] text-[#888]">{e.duration}</span>}
                </div>
                {e.location && <p className="text-[7px] text-[#888]">{e.location}</p>}
                {e.bullets?.filter((b: string) => b.trim()).slice(0, 3).map((b: string, j: number) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <>
            <SectionTitle>Certifications</SectionTitle>
            {certs.map((c: any, i: number) => (
              <p key={i} className="text-[8px] text-[#333] leading-[1.5]">
                <span className="font-[700] text-[#1A1A2E]">{c.name}</span>
                {(c.issuer || c.year) && <span className="text-[#666]"> — {[c.issuer, c.year].filter(Boolean).join(', ')}</span>}
              </p>
            ))}
          </>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <>
            <SectionTitle>Achievements</SectionTitle>
            {achievements.map((a: any, i: number) => {
              const text = typeof a === 'string' ? a : a.title || '';
              return text.trim() ? <Bullet key={i}>{text}</Bullet> : null;
            })}
          </>
        )}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════
   DATA SUMMARY — shows what's filled vs empty
   ═══════════════════════════════════════════════════════════ */
const DataSummary = ({ data }: { data: any }) => {
  const sections = [
    { key: 'personal', label: 'Personal Info', icon: User, check: () => data?.personal?.name },
    { key: 'summary', label: 'Summary', icon: Notebook, check: () => data?.summary?.trim() },
    { key: 'education', label: 'Education', icon: GraduationCap, check: () => data?.personal?.current_education || data?.education_history?.length },
    { key: 'skills', label: 'Skills', icon: Code, check: () => {
      const s = data?.skills || {};
      return s.languages?.length || s.frameworks?.length || s.tools?.length || s.databases?.length;
    }},
    { key: 'projects', label: 'Projects', icon: Briefcase, check: () => data?.projects?.length },
    { key: 'experience', label: 'Experience', icon: Briefcase, check: () => data?.experience?.length },
    { key: 'certs', label: 'Certifications', icon: Certificate, check: () => data?.certifications?.length },
    { key: 'achievements', label: 'Achievements', icon: Trophy, check: () => data?.achievements?.length },
  ];

  const filledCount = sections.filter(s => s.check()).length;

  return (
    <div className="space-y-3">
      {/* Completion bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Profile Completeness</span>
          <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">{Math.round((filledCount / sections.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(filledCount / sections.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" />
        </div>
      </div>

      {/* Section checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {sections.map(s => {
          const filled = !!s.check();
          const Icon = s.icon;
          return (
            <div key={s.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              filled 
                ? 'bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400'
            }`}>
              {filled ? <Check size={12} weight="bold" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
              {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════
   MAIN TAB COMPONENT
   ═══════════════════════════════════════════════════════════ */
const ResumeStudioTab = ({ navigate }: any) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [template, setTemplate] = useState('classic');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Merge auto-filled + editable data into a single preview model
  const buildPreviewData = useCallback((autoFilled: any, editable: any) => {
    return {
      personal: {
        name: autoFilled.name || '',
        email: editable.email || autoFilled.email || '',
        phone: editable.phone || autoFilled.phone || '',
        location: editable.location || '',
        linkedin: editable.linkedin || '',
        github: editable.github || '',
        portfolio: editable.portfolio || '',
        current_education: {
          degree: 'B.Tech',
          institution: autoFilled.institution || '',
          branch: autoFilled.department || '',
          batch: autoFilled.batch || '',
        },
      },
      summary: editable.summary || '',
      education_history: editable.education_history || [],
      skills: editable.skills || {},
      projects: editable.projects || [],
      experience: editable.experience || [],
      certifications: editable.certifications || [],
      achievements: editable.achievements || [],
    };
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const { data: res } = await resumeProfileAPI.get();
      const merged = buildPreviewData(res.auto_filled || {}, res.editable || {});
      setProfileData(merged);
    } catch {
      toast.error('Failed to load resume profile');
    }
    setLoading(false);
  }, [buildPreviewData]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleDownloadDocx = async () => {
    setDownloading('docx');
    try {
      const response = await resumeProfileAPI.generateDocx(template);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from Content-Disposition header or use default
      const disposition = response.headers['content-disposition'];
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match ? match[1] : 'Resume.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded!');
    } catch {
      toast.error('Failed to generate resume');
    }
    setDownloading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={22} weight="duotone" className="text-teal-500" />
            Resume Studio
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Build and preview your resume from your AcadMix profile</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/profile', { state: { tab: 'resume' } })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors border border-slate-200 dark:border-white/5">
            <PencilSimple size={15} weight="bold" />
            Edit Profile Data
          </motion.button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Controls & Data Summary */}
        <div className="space-y-5">

          {/* Template selector */}
          <div className="soft-card p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Template</h3>
            <div className="flex gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => !t.disabled && setTemplate(t.id)} disabled={t.disabled}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                    template === t.id
                      ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/25 shadow-sm'
                      : t.disabled
                        ? 'bg-slate-50 dark:bg-white/[0.02] text-slate-300 dark:text-slate-600 border-transparent cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                  }`}>
                  {t.label}
                  {t.disabled && <span className="text-[9px] block text-slate-300 dark:text-slate-600 mt-0.5">Soon</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Data summary */}
          <div className="soft-card p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Resume Data</h3>
            <DataSummary data={profileData} />
            <button onClick={() => navigate('/profile', { state: { tab: 'resume' } })}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/15 transition-colors">
              <PencilSimple size={14} weight="bold" />
              Edit Resume Profile
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          {/* Download buttons */}
          <div className="soft-card p-5 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Download</h3>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleDownloadDocx} disabled={downloading === 'docx'}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
              {downloading === 'docx' ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : (
                <><FileDoc size={18} weight="fill" /> Download .docx</>
              )}
            </motion.button>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              disabled
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-extrabold text-sm bg-slate-100 dark:bg-white/[0.04] text-slate-400 cursor-not-allowed">
              <FilePdf size={18} weight="fill" /> Download PDF
              <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 ml-1">Coming soon</span>
            </motion.button>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Eye size={14} weight="bold" /> Live Preview
            </h3>
            <span className="text-[10px] text-slate-400">Scaled to fit — actual document is A4</span>
          </div>
          <div className="soft-card p-4 bg-slate-100 dark:bg-slate-900/50">
            <ResumePreview data={profileData} template={template} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeStudioTab;
