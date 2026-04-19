import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, EnvelopeSimple, IdentificationCard, House, GraduationCap,
  Heart, Users, CurrencyCircleDollar, Drop, FileText, UploadSimple, Trash,
  Star, DownloadSimple, CheckCircle, Warning, CaretLeft, CloudArrowUp,
  FilePdf, FileDoc, Shield
} from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import { resumeVaultAPI } from '../services/api';

const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };

/* ── Reusable info row ─────────────────────── */
const InfoRow = ({ icon: Icon, label, value, masked }: {
  icon: any; label: string; value?: string | number | null; masked?: boolean;
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={16} weight="duotone" className="text-slate-500 dark:text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
        {masked && value ? String(value).replace(/.(?=.{4})/g, '•') : (value || '—')}
      </p>
    </div>
  </div>
);

/* ── File size formatter ────────────────────── */
const formatBytes = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

/* ── Active section nav ─────────────────────── */
const SECTIONS = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'academic', label: 'Academic Details', icon: GraduationCap },
  { key: 'community', label: 'Community & Social', icon: Heart },
  { key: 'family', label: 'Family Details', icon: Users },
  { key: 'address', label: 'Address', icon: House },
  { key: 'resumes', label: 'Resume Vault', icon: FileText },
];

/* ═══════════════════════════════════════════════════════════════════════════════
 *  Main Component
 * ═══════════════════════════════════════════════════════════════════════════════ */
const StudentProfilePage = ({ navigate, user }: any) => {
  const profile = user?.profile_data || {};
  const [activeSection, setActiveSection] = useState('personal');

  // Resume vault state
  const [resumes, setResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id?: string; filename?: string }>({ open: false });

  /* ── Load resumes ────────────────────────── */
  const loadResumes = useCallback(async () => {
    try {
      const { data } = await resumeVaultAPI.list();
      setResumes(data || []);
    } catch {
      /* ignore */
    }
    setLoadingResumes(false);
  }, []);

  useEffect(() => { loadResumes(); }, [loadResumes]);

  /* ── Upload handler ──────────────────────── */
  const handleUpload = async (file: File) => {
    if (!file) return;

    if (resumes.length >= 3) {
      setMessage({ type: 'error', text: 'Upload limit reached. Delete existing ones to free up space.' });
      return;
    }

    if (resumes.some((r: any) => r.filename === file.name)) {
      setMessage({ type: 'error', text: 'Already a file exists with the same name. Rename the file and try again or try removing the existing one.' });
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF and DOCX files are allowed.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 2MB.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await resumeVaultAPI.upload(formData);
      setMessage({ type: 'success', text: `"${file.name}" uploaded successfully!` });
      await loadResumes();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Upload failed. Please try again.' });
    }
    setUploading(false);
  };

  /* ── Set primary ────────────────────────── */
  const handleSetPrimary = async (id: string) => {
    try {
      await resumeVaultAPI.setPrimary(id);
      await loadResumes();
      setMessage({ type: 'success', text: 'Primary resume updated.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update primary resume.' });
    }
  };

  /* ── Delete resume ──────────────────────── */
  const handleDelete = (id: string, filename: string) => {
    setDeleteModal({ open: true, id, filename });
  };

  const processDelete = async (id: string, filename: string) => {
    try {
      await resumeVaultAPI.remove(id);
      setMessage({ type: 'success', text: `"${filename}" deleted.` });
      await loadResumes();
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete resume.' });
    }
    setDeleteModal({ open: false });
  };

  /* ── Download resume ────────────────────── */
  const handleDownload = async (id: string, filename: string) => {
    try {
      // API returns a binary Blob securely proxied through backend
      const response = await resumeVaultAPI.download(id);
      
      const fileType = filename.toLowerCase().endsWith('.docx') 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/pdf';

      const blob = new Blob([response.data || response], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab using a custom HTML shell to strictly enforce the tab title
      const viewerWindow = window.open('', '_blank');
      if (viewerWindow) {
        viewerWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${filename}</title>
              <style>
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #333; }
                iframe { width: 100vw; height: 100vh; border: none; display: block; }
              </style>
            </head>
            <body>
              <iframe src="${url}"></iframe>
            </body>
          </html>
        `);
        viewerWindow.document.close();
      }
      
      // We can't immediately revoke the URL if we open it in a new tab because 
      // the iframe needs time to load the blob. Use a timeout.
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      setMessage({ type: 'error', text: 'Download failed.' });
    }
  };

  /* ── Drag & Drop ────────────────────────── */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  /* ── Profile info sections ─────────────── */
  const infoSections: Record<string, Array<{ icon: any; label: string; value: any; masked?: boolean }>> = {
    personal: [
      { icon: User, label: 'Full Name', value: user?.name },
      { icon: EnvelopeSimple, label: 'Email', value: user?.email },
      { icon: Phone, label: 'Phone', value: profile.phone },
      { icon: IdentificationCard, label: 'Roll No / Hall Ticket / Reg. No', value: profile.register_number || user?.roll_number || user?.college_id },
      { icon: IdentificationCard, label: 'ABC ID', value: profile.abc_id },
      { icon: IdentificationCard, label: 'Aadhaar Number', value: profile.aadhaar, masked: true },
      { icon: Drop, label: 'Blood Group', value: profile.blood_group },
      { icon: User, label: 'Date of Birth', value: profile.dob },
      { icon: User, label: 'Gender', value: profile.gender },
    ],
    academic: [
      { icon: GraduationCap, label: 'Stream', value: profile.stream || user?.stream },
      { icon: GraduationCap, label: 'Department', value: user?.department || profile.department },
      { icon: GraduationCap, label: 'Branch', value: user?.branch || profile.branch },
      { icon: GraduationCap, label: 'Batch', value: user?.batch || profile.batch },
      { icon: GraduationCap, label: 'Section', value: user?.section || profile.section },
      { icon: GraduationCap, label: 'Current Semester', value: profile.current_semester },
      { icon: GraduationCap, label: 'Admission Year', value: profile.admission_year },
    ],
    community: [
      { icon: Heart, label: 'Community', value: profile.community },
      { icon: Heart, label: 'Religion', value: profile.religion },
      { icon: Heart, label: 'Caste', value: profile.caste },
      { icon: Heart, label: 'Nationality', value: profile.nationality || 'Indian' },
      { icon: Heart, label: 'Mother Tongue', value: profile.mother_tongue },
    ],
    family: [
      { icon: Users, label: "Father's Name", value: profile.father_name },
      { icon: Users, label: "Mother's Name", value: profile.mother_name },
      { icon: Phone, label: "Parent Phone", value: profile.parent_phone },
      { icon: Users, label: 'Guardian Name', value: profile.guardian_name },
      { icon: CurrencyCircleDollar, label: 'Annual Income', value: profile.annual_income ? `₹${Number(profile.annual_income).toLocaleString()}` : null },
      { icon: Users, label: 'Siblings', value: profile.siblings_count },
    ],
    address: [
      { icon: House, label: 'Address', value: profile.address },
      { icon: House, label: 'City', value: profile.city },
      { icon: House, label: 'State', value: profile.state },
      { icon: House, label: 'Pincode', value: profile.pincode },
    ],
  };

  const currentInfoSection = infoSections[activeSection];
  const isResumeTab = activeSection === 'resumes';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader
        navigate={navigate} user={user}
        title="Student Profile"
        subtitle="Your personal information & resume vault"
        backTo="student-dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">

          {/* ── Profile Hero Card ── */}
          <motion.div variants={itemVariants} className="soft-card overflow-hidden">
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold">
                  {user?.name?.[0] || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">{user?.name}</h2>
                  <p className="text-sm font-medium text-white/70">{profile.register_number || user?.college_id}</p>
                  <p className="text-xs font-bold text-white/50 mt-0.5">{user?.department} • Batch {user?.batch} • Section {user?.section}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Layout: Sidebar + Content ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* Section Nav */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="soft-card p-3 space-y-1 lg:sticky lg:top-24">
                {SECTIONS.map(s => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.key;
                  const isVault = s.key === 'resumes';
                  const vaultCount = resumes.length;
                  return (
                    <button key={s.key} onClick={() => setActiveSection(s.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                        isActive ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} weight="duotone" />
                      <span className="flex-1 truncate">{s.label}</span>
                      {isVault && vaultCount > 0 && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-xl ${
                          isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>{vaultCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Content Area */}
            <motion.div variants={itemVariants} className="lg:col-span-3 space-y-4">

              {/* ── Personal Info Sections ── */}
              {!isResumeTab && currentInfoSection && (
                <div className="soft-card p-5 sm:p-6">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
                    {SECTIONS.find(s => s.key === activeSection)?.label}
                  </h3>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl px-4">
                    {currentInfoSection.map((item, ii) => (
                      <InfoRow key={ii} icon={item.icon} label={item.label} value={item.value} masked={item.masked} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Resume Vault Tab ── */}
              {isResumeTab && (
                <>
                  {/* Upload Zone */}
                  <div className="soft-card p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Resume Vault</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Store up to 3 resumes securely. Your primary resume is used for one-click applications.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Shield size={14} weight="duotone" className="text-emerald-500" />
                        Encrypted
                      </div>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => { if (resumes.length < 3) { e.preventDefault(); setDragOver(true); } }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { if (resumes.length < 3) handleDrop(e); }}
                      onClick={() => { if (resumes.length < 3) fileInputRef.current?.click(); }}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                        resumes.length >= 3
                          ? 'border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/5 opacity-60 cursor-not-allowed'
                          : dragOver
                            ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 cursor-pointer'
                            : 'border-slate-200 dark:border-white/10 hover:border-indigo-300 hover:bg-slate-50/50 dark:hover:bg-white/5 cursor-pointer'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(file);
                          e.target.value = '';
                        }}
                      />
                      <CloudArrowUp size={40} weight="duotone" className={`mx-auto mb-3 ${
                        dragOver ? 'text-indigo-500' : 'text-slate-400'
                      }`} />
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Uploading & parsing...</p>
                        </div>
                      ) : resumes.length >= 3 ? (
                        <>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Upload limit reached
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Delete existing ones to free up space
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {dragOver ? 'Drop your resume here' : 'Drag & drop your resume here'}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                            PDF or DOCX • Max 2MB • {resumes.length}/3 uploaded
                          </p>
                        </>
                      )}
                    </div>

                    {/* Status Messages */}
                    <AnimatePresence>
                      {message && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                            message.type === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {message.type === 'success' ? <CheckCircle size={16} weight="fill" /> : <Warning size={16} weight="fill" />}
                          {message.text}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Resume List */}
                  <div className="soft-card p-5 sm:p-6">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
                      My Resumes ({resumes.length})
                    </h4>

                    {loadingResumes ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                          </div>
                        ))}
                      </div>
                    ) : resumes.length === 0 ? (
                      <div className="py-12 text-center">
                        <FileText size={40} weight="duotone" className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No resumes uploaded yet</p>
                        <p className="text-xs text-slate-400 mt-1">Upload your first resume to get started with one-click apply</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {resumes.map((r: any) => (
                          <motion.div
                            key={r.id}
                            layout
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-2xl border transition-all ${
                              r.is_primary
                                ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* File icon */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                r.content_type?.includes('pdf')
                                  ? 'bg-red-50 dark:bg-red-500/10'
                                  : 'bg-blue-50 dark:bg-blue-500/10'
                              }`}>
                                {r.content_type?.includes('pdf')
                                  ? <FilePdf size={22} weight="duotone" className="text-red-500" />
                                  : <FileDoc size={22} weight="duotone" className="text-blue-500" />
                                }
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.filename}</p>
                                  {r.is_primary && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex-shrink-0">
                                      <Star size={10} weight="fill" /> Primary
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                  v{r.version} • {formatBytes(r.file_size)} • {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!r.is_primary && (
                                  <button
                                    onClick={() => handleSetPrimary(r.id)}
                                    className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-colors"
                                    title="Set as primary"
                                  >
                                    <Star size={16} weight="duotone" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownload(r.id, r.filename)}
                                  className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-colors"
                                  title="Download"
                                >
                                  <DownloadSimple size={16} weight="duotone" />
                                </button>
                                <button
                                  onClick={() => handleDelete(r.id, r.filename)}
                                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash size={16} weight="duotone" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Footer notice */}
              <div className="px-4 py-3">
                <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                  {isResumeTab
                    ? 'Resumes are stored securely on Cloudflare R2 with encryption at rest.'
                    : 'Contact your department admin to update profile information.'
                  }
                </p>
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertModal
        open={deleteModal.open}
        title="Delete Resume"
        message={`Are you sure you want to delete "${deleteModal.filename}"?\n\nThis cannot be undone and you will lose any associated ATS insights.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteModal.id && deleteModal.filename) {
            processDelete(deleteModal.id, deleteModal.filename);
          }
        }}
        onCancel={() => setDeleteModal({ open: false })}
      />
    </div>
  );
};

export default StudentProfilePage;
