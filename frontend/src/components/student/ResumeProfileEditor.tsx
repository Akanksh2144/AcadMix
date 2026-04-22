import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LinkedinLogo, GithubLogo, Globe, MapPin, Briefcase, Certificate,
  Trophy, Code, Plus, Trash, FloppyDisk, CaretDown, Sparkle,
  GraduationCap, Lightning, Check, Warning, Notebook
} from '@phosphor-icons/react';
import { resumeProfileAPI } from '../../services/api';
import { toast } from 'sonner';

const itemV = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

/* ── Shared small components ─────────────────────── */
const SectionHeader = ({ icon: Icon, title, count, color, expanded, onToggle, onAdd }: any) => (
  <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all group">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${color}`}>
      <Icon size={18} weight="fill" className="text-white" />
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-extrabold text-slate-800 dark:text-white">{title}</p>
      {count !== undefined && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{count} {count === 1 ? 'entry' : 'entries'}</p>}
    </div>
    {onAdd && (
      <span onClick={(e) => { e.stopPropagation(); onAdd(); }} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-500/15 text-slate-400 hover:text-teal-500 transition-colors">
        <Plus size={14} weight="bold" />
      </span>
    )}
    <CaretDown size={14} weight="bold" className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
  </button>
);

const FieldInput = ({ label, value, onChange, placeholder, type = 'text', rows }: any) => (
  <div>
    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
    {rows ? (
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="soft-input w-full text-sm resize-none" />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="soft-input w-full text-sm" />
    )}
  </div>
);

const RemoveBtn = ({ onClick }: any) => (
  <button onClick={onClick} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
    <Trash size={14} weight="bold" />
  </button>
);

/* ── Bullet list editor ─────────────────────────── */
const BulletEditor = ({ bullets = [], onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Bullet Points</label>
    {bullets.map((b: string, i: number) => (
      <div key={i} className="flex gap-2">
        <span className="text-slate-400 text-xs mt-2.5 shrink-0">•</span>
        <input value={b} onChange={e => { const n = [...bullets]; n[i] = e.target.value; onChange(n); }}
          placeholder="Action verb + what you did + impact..." className="soft-input flex-1 text-sm" />
        <RemoveBtn onClick={() => { const n = bullets.filter((_: any, j: number) => j !== i); onChange(n); }} />
      </div>
    ))}
    {bullets.length < 5 && (
      <button onClick={() => onChange([...bullets, ''])} className="text-xs font-bold text-teal-500 hover:text-teal-600 flex items-center gap-1 transition-colors">
        <Plus size={12} weight="bold" /> Add bullet
      </button>
    )}
  </div>
);

/* ── Tag/chip input ─────────────────────────────── */
const TagInput = ({ label, tags = [], onChange, placeholder }: any) => {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v && !tags.includes(v)) { onChange([...tags, v]); } setInput(''); };
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t: string, i: number) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold">
            {t}
            <button onClick={() => onChange(tags.filter((_: any, j: number) => j !== i))} className="hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="soft-input flex-1 text-sm" />
        <button onClick={add} disabled={!input.trim()} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-500/15 dark:hover:text-teal-400 disabled:opacity-40 transition-colors">Add</button>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const ResumeProfileEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoFilled, setAutoFilled] = useState<any>({});
  const [data, setData] = useState<any>({});
  const [expanded, setExpanded] = useState<string | null>('links');
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await resumeProfileAPI.get();
      setAutoFilled(res.auto_filled || {});
      setData(res.editable || {});
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (key: string, value: any) => {
    setData((prev: any) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await resumeProfileAPI.update(data);
      toast.success('Resume profile saved!');
      setDirty(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Save failed');
    }
    setSaving(false);
  };

  const toggle = (key: string) => setExpanded(expanded === key ? null : key);

  // List helpers
  const addItem = (key: string, template: any) => {
    const list = [...(data[key] || []), template];
    update(key, list);
    setExpanded(key);
  };
  const updateItem = (key: string, index: number, field: string, value: any) => {
    const list = [...(data[key] || [])];
    list[index] = { ...list[index], [field]: value };
    update(key, list);
  };
  const removeItem = (key: string, index: number) => {
    update(key, (data[key] || []).filter((_: any, i: number) => i !== index));
  };

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5 animate-pulse" />)}
    </div>
  );

  const projects = data.projects || [];
  const experience = data.experience || [];
  const certs = data.certifications || [];
  const eduHistory = data.education_history || [];
  const achievements = data.achievements || [];
  const skills = data.skills || {};

  return (
    <div className="space-y-4">
      {/* Auto-filled notice */}
      <motion.div variants={itemV} className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-500/5 border border-teal-200/50 dark:border-teal-500/20 flex items-start gap-3">
        <Sparkle size={18} weight="fill" className="text-teal-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-teal-700 dark:text-teal-300">Auto-filled from your AcadMix profile</p>
          <p className="text-xs text-teal-600/70 dark:text-teal-400/70 mt-0.5">
            {autoFilled.name} · {autoFilled.email} · {autoFilled.department} · Batch {autoFilled.batch} · {autoFilled.institution}
          </p>
        </div>
      </motion.div>

      {/* ── Links & Location ──────────────── */}
      <SectionHeader icon={Globe} title="Links & Location" color="from-blue-500 to-indigo-600" expanded={expanded === 'links'} onToggle={() => toggle('links')} />
      <AnimatePresence>
        {expanded === 'links' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="soft-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="LinkedIn URL" value={data.linkedin} onChange={(v: string) => update('linkedin', v)} placeholder="linkedin.com/in/your-profile" />
              <FieldInput label="GitHub URL" value={data.github} onChange={(v: string) => update('github', v)} placeholder="github.com/username" />
              <FieldInput label="Portfolio / Website" value={data.portfolio} onChange={(v: string) => update('portfolio', v)} placeholder="yoursite.com" />
              <FieldInput label="City / Location" value={data.location} onChange={(v: string) => update('location', v)} placeholder="Hyderabad, Telangana" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Professional Summary ──────────── */}
      <SectionHeader icon={Notebook} title="Professional Summary" color="from-violet-500 to-purple-600" expanded={expanded === 'summary'} onToggle={() => toggle('summary')} />
      <AnimatePresence>
        {expanded === 'summary' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="soft-card p-5">
              <FieldInput label="Summary (2-3 lines)" value={data.summary} onChange={(v: string) => update('summary', v)}
                placeholder="Aspiring software developer with experience in full-stack web development..." rows={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Education History (10th/12th) ─── */}
      <SectionHeader icon={GraduationCap} title="Education History (10th / 12th)" color="from-amber-500 to-orange-600" count={eduHistory.length}
        expanded={expanded === 'education_history'} onToggle={() => toggle('education_history')}
        onAdd={() => addItem('education_history', { level: '', school: '', board: '', year: '', percentage: '' })} />
      <AnimatePresence>
        {expanded === 'education_history' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3">
              {eduHistory.map((e: any, i: number) => (
                <div key={i} className="soft-card p-5">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500">#{i + 1}</span>
                    <RemoveBtn onClick={() => removeItem('education_history', i)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Level</label>
                      <select value={e.level || ''} onChange={ev => updateItem('education_history', i, 'level', ev.target.value)} className="soft-input w-full text-sm">
                        <option value="">Select...</option>
                        <option value="10th">10th (SSC / CBSE / ICSE)</option>
                        <option value="12th">12th (Intermediate / HSC)</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <FieldInput label="School / College" value={e.school} onChange={(v: string) => updateItem('education_history', i, 'school', v)} placeholder="e.g., Delhi Public School" />
                    <FieldInput label="Board / University" value={e.board} onChange={(v: string) => updateItem('education_history', i, 'board', v)} placeholder="e.g., CBSE, AP Board" />
                    <FieldInput label="Year" value={e.year} onChange={(v: string) => updateItem('education_history', i, 'year', v)} placeholder="2020" />
                    <FieldInput label="Percentage / CGPA" value={e.percentage} onChange={(v: string) => updateItem('education_history', i, 'percentage', v)} placeholder="92% or 9.2 CGPA" />
                  </div>
                </div>
              ))}
              {eduHistory.length === 0 && (
                <div className="soft-card p-8 text-center">
                  <p className="text-sm text-slate-400">No education history added yet. Click + to add your 10th/12th details.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Skills ────────────────────────── */}
      <SectionHeader icon={Code} title="Technical Skills" color="from-cyan-500 to-teal-600" expanded={expanded === 'skills'} onToggle={() => toggle('skills')} />
      <AnimatePresence>
        {expanded === 'skills' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="soft-card p-5 space-y-4">
              <TagInput label="Programming Languages" tags={skills.languages || []} onChange={(v: string[]) => update('skills', { ...skills, languages: v })} placeholder="e.g., Python" />
              <TagInput label="Frameworks / Libraries" tags={skills.frameworks || []} onChange={(v: string[]) => update('skills', { ...skills, frameworks: v })} placeholder="e.g., React" />
              <TagInput label="Tools / Platforms" tags={skills.tools || []} onChange={(v: string[]) => update('skills', { ...skills, tools: v })} placeholder="e.g., Docker" />
              <TagInput label="Databases" tags={skills.databases || []} onChange={(v: string[]) => update('skills', { ...skills, databases: v })} placeholder="e.g., PostgreSQL" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Projects ──────────────────────── */}
      <SectionHeader icon={Lightning} title="Projects" color="from-emerald-500 to-green-600" count={projects.length}
        expanded={expanded === 'projects'} onToggle={() => toggle('projects')}
        onAdd={() => addItem('projects', { title: '', tech_stack: '', duration: '', bullets: [''], link: '' })} />
      <AnimatePresence>
        {expanded === 'projects' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3">
              {projects.map((p: any, i: number) => (
                <div key={i} className="soft-card p-5">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-extrabold text-emerald-500">Project #{i + 1}</span>
                    <RemoveBtn onClick={() => removeItem('projects', i)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <FieldInput label="Project Title" value={p.title} onChange={(v: string) => updateItem('projects', i, 'title', v)} placeholder="e.g., E-Commerce Platform" />
                    <FieldInput label="Tech Stack" value={p.tech_stack} onChange={(v: string) => updateItem('projects', i, 'tech_stack', v)} placeholder="React, Node.js, MongoDB" />
                    <FieldInput label="Duration" value={p.duration} onChange={(v: string) => updateItem('projects', i, 'duration', v)} placeholder="Jan 2024 – Mar 2024" />
                    <FieldInput label="Link (GitHub / Live)" value={p.link} onChange={(v: string) => updateItem('projects', i, 'link', v)} placeholder="github.com/..." />
                  </div>
                  <BulletEditor bullets={p.bullets || []} onChange={(v: string[]) => updateItem('projects', i, 'bullets', v)} />
                </div>
              ))}
              {projects.length === 0 && <div className="soft-card p-8 text-center"><p className="text-sm text-slate-400">No projects added yet. Click + to add your first project.</p></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Experience ────────────────────── */}
      <SectionHeader icon={Briefcase} title="Experience / Internships" color="from-rose-500 to-pink-600" count={experience.length}
        expanded={expanded === 'experience'} onToggle={() => toggle('experience')}
        onAdd={() => addItem('experience', { company: '', role: '', duration: '', location: '', bullets: [''] })} />
      <AnimatePresence>
        {expanded === 'experience' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3">
              {experience.map((e: any, i: number) => (
                <div key={i} className="soft-card p-5">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-extrabold text-rose-500">Experience #{i + 1}</span>
                    <RemoveBtn onClick={() => removeItem('experience', i)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <FieldInput label="Company" value={e.company} onChange={(v: string) => updateItem('experience', i, 'company', v)} placeholder="e.g., Google" />
                    <FieldInput label="Role / Title" value={e.role} onChange={(v: string) => updateItem('experience', i, 'role', v)} placeholder="e.g., SDE Intern" />
                    <FieldInput label="Duration" value={e.duration} onChange={(v: string) => updateItem('experience', i, 'duration', v)} placeholder="May 2024 – Jul 2024" />
                    <FieldInput label="Location" value={e.location} onChange={(v: string) => updateItem('experience', i, 'location', v)} placeholder="Bangalore, India" />
                  </div>
                  <BulletEditor bullets={e.bullets || []} onChange={(v: string[]) => updateItem('experience', i, 'bullets', v)} />
                </div>
              ))}
              {experience.length === 0 && <div className="soft-card p-8 text-center"><p className="text-sm text-slate-400">No experience added yet. Internships, freelance, and part-time work count!</p></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Certifications ────────────────── */}
      <SectionHeader icon={Certificate} title="Certifications" color="from-indigo-500 to-blue-600" count={certs.length}
        expanded={expanded === 'certifications'} onToggle={() => toggle('certifications')}
        onAdd={() => addItem('certifications', { name: '', issuer: '', year: '', url: '' })} />
      <AnimatePresence>
        {expanded === 'certifications' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3">
              {certs.map((c: any, i: number) => (
                <div key={i} className="soft-card p-4 flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <FieldInput label="Certificate Name" value={c.name} onChange={(v: string) => updateItem('certifications', i, 'name', v)} placeholder="AWS Cloud Practitioner" />
                    <FieldInput label="Issuer" value={c.issuer} onChange={(v: string) => updateItem('certifications', i, 'issuer', v)} placeholder="Amazon Web Services" />
                    <FieldInput label="Year" value={c.year} onChange={(v: string) => updateItem('certifications', i, 'year', v)} placeholder="2024" />
                    <FieldInput label="Credential URL" value={c.url} onChange={(v: string) => updateItem('certifications', i, 'url', v)} placeholder="https://..." />
                  </div>
                  <div className="mt-5"><RemoveBtn onClick={() => removeItem('certifications', i)} /></div>
                </div>
              ))}
              {certs.length === 0 && <div className="soft-card p-8 text-center"><p className="text-sm text-slate-400">No certifications added yet.</p></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Achievements ──────────────────── */}
      <SectionHeader icon={Trophy} title="Achievements" color="from-yellow-500 to-amber-600" count={achievements.length}
        expanded={expanded === 'achievements'} onToggle={() => toggle('achievements')}
        onAdd={() => update('achievements', [...achievements, ''])} />
      <AnimatePresence>
        {expanded === 'achievements' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="soft-card p-5 space-y-2">
              {achievements.map((a: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <span className="text-amber-500 text-xs mt-2.5 shrink-0">🏆</span>
                  <input value={a} onChange={e => { const n = [...achievements]; n[i] = e.target.value; update('achievements', n); }}
                    placeholder="e.g., Won Smart India Hackathon 2024" className="soft-input flex-1 text-sm" />
                  <RemoveBtn onClick={() => update('achievements', achievements.filter((_: any, j: number) => j !== i))} />
                </div>
              ))}
              {achievements.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No achievements added yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Save Button ──────────────────── */}
      <motion.div variants={itemV} className="sticky bottom-4 z-10">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={save} disabled={saving || !dirty}
          className={`w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-lg transition-all ${
            dirty ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-teal-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
          }`}>
          {saving ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : (
            <><FloppyDisk size={20} weight="fill" /> {dirty ? 'Save Resume Profile' : 'All changes saved'}</>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ResumeProfileEditor;
