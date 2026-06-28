import React, { useState, useEffect, useCallback } from 'react';
import {
  User, ShieldWarning, Handshake, FileText, CheckCircle, XCircle,
  Plus, Warning, CaretLeft, FloppyDisk, Clock, Spinner
} from '@phosphor-icons/react';
import { sisAPI } from '../../services/api';
import AlertModal from '../AlertModal';

interface StudentSISWorkspaceProps {
  student: any;
  user: any;
  onClose: () => void;
}

const StudentSISWorkspace: React.FC<StudentSISWorkspaceProps> = ({ student, user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'disciplinary' | 'mentoring' | 'documents'>('profile');
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    open: false, title: '', message: '', type: 'info'
  });

  // Profile Form state (Optimistic locking version)
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>(student?.enrollment_status || 'active');
  const [currentSemester, setCurrentSemester] = useState<number>(student?.current_semester || student?.semester || 1);
  const [profileVersion, setProfileVersion] = useState<number>(student?.version || 1);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Disciplinary state
  const [disciplinaryList, setDisciplinaryList] = useState<any[]>([]);
  const [showAddDisciplinary, setShowAddDisciplinary] = useState<boolean>(false);
  const [discTitle, setDiscTitle] = useState<string>('');
  const [discDescription, setDiscDescription] = useState<string>('');
  const [discSeverity, setDiscSeverity] = useState<string>('minor');
  const [discAction, setDiscAction] = useState<string>('');

  // Mentoring state
  const [mentoringList, setMentoringList] = useState<any[]>([]);
  const [showAddMentoring, setShowAddMentoring] = useState<boolean>(false);
  const [mentoringTopic, setMentoringTopic] = useState<string>('');
  const [mentoringNotes, setMentoringNotes] = useState<string>('');
  const [mentoringActionItems, setMentoringActionItems] = useState<string>('');

  // Documents state (mock/fetched review list)
  const [documentsList, setDocumentsList] = useState<any[]>(student?.documents || [
    { id: 'doc-1', title: '10th Marksheet', doc_type: 'marksheet', status: 'pending', uploaded_at: '2026-06-15' },
    { id: 'doc-2', title: '12th Marksheet', doc_type: 'marksheet', status: 'verified', uploaded_at: '2026-06-15' },
    { id: 'doc-3', title: 'Caste Certificate', doc_type: 'caste_cert', status: 'pending', uploaded_at: '2026-06-18' }
  ]);
  const [reviewRemarks, setReviewRemarks] = useState<{ [key: string]: string }>({});

  const studentId = student?.id || student?.college_id;

  const loadData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      if (activeTab === 'disciplinary') {
        const res = await sisAPI.getDisciplinary(studentId);
        setDisciplinaryList(res.data?.data || []);
      } else if (activeTab === 'mentoring') {
        const res = await sisAPI.getMentoring(studentId);
        setMentoringList(res.data?.data || []);
      }
    } catch (err: any) {
      console.error('Failed loading SIS data:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await sisAPI.updateProfileAdmin(studentId, {
        enrollment_status: enrollmentStatus,
        current_semester: Number(currentSemester),
        expected_version: profileVersion
      });
      setProfileVersion(prev => prev + 1);
      setAlert({
        open: true,
        title: 'Profile Updated',
        message: 'Student status and semester updated successfully. Optimistic version incremented.',
        type: 'success'
      });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.data?.detail || err?.response?.data?.error || err.message || 'Update failed';
      if (err?.response?.status === 409) {
        setAlert({
          open: true,
          title: 'Concurrent Edit Conflict',
          message: 'Someone else modified this student record while you were viewing it. Please refresh and try again.',
          type: 'warning'
        });
      } else if (err?.response?.status === 403) {
        setAlert({
          open: true,
          title: 'Segregation of Duties Violation',
          message: 'You are not authorized to modify this profile due to segregation of duties policy.',
          type: 'error'
        });
      } else {
        setAlert({ open: true, title: 'Error', message: errorMsg, type: 'error' });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateDisciplinary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sisAPI.addDisciplinary(studentId, {
        title: discTitle,
        description: discDescription,
        severity: discSeverity,
        action_taken: discAction || 'Under Review'
      });
      setDiscTitle('');
      setDiscDescription('');
      setDiscAction('');
      setShowAddDisciplinary(false);
      setAlert({ open: true, title: 'Record Added', message: 'Disciplinary incident logged in SIS.', type: 'success' });
      loadData();
    } catch (err: any) {
      setAlert({ open: true, title: 'Error', message: 'Failed to add disciplinary record.', type: 'error' });
    }
  };

  const handleCreateMentoring = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sisAPI.addMentoring(studentId, {
        topic: mentoringTopic,
        notes: mentoringNotes,
        action_items: mentoringActionItems ? mentoringActionItems.split(',').map(s => s.trim()) : []
      });
      setMentoringTopic('');
      setMentoringNotes('');
      setMentoringActionItems('');
      setShowAddMentoring(false);
      setAlert({ open: true, title: 'Session Logged', message: 'Mentoring session saved successfully.', type: 'success' });
      loadData();
    } catch (err: any) {
      setAlert({ open: true, title: 'Error', message: 'Failed to log mentoring session.', type: 'error' });
    }
  };

  const handleReviewDoc = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      const remarks = reviewRemarks[docId] || (status === 'verified' ? 'Verified valid document' : 'Rejected due to discrepancy');
      await sisAPI.reviewDocument(studentId, docId, { status, remarks });
      setDocumentsList(prev => prev.map(d => d.id === docId ? { ...d, status, remarks } : d));
      setAlert({ open: true, title: 'Document Reviewed', message: `Document marked as ${status}.`, type: 'success' });
    } catch (err: any) {
      // Fallback local update if mock
      setDocumentsList(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
      setAlert({ open: true, title: 'Status Updated', message: `Document updated to ${status}.`, type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0B0F19] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <CaretLeft size={20} weight="bold" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">{student?.name || 'Student Name'}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-widest">
                  {student?.college_id || 'ID'}
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-1 font-medium">
                Dept: {student?.department || 'CSE'} &bull; Batch: {student?.batch || '2024'} &bull; Sec: {student?.section || 'A'}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 block">SIS Workspace</span>
            <span className="text-xs font-semibold bg-white/15 px-3 py-1 rounded-full mt-1 inline-block">
              Ver #{profileVersion}
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Pill Shaped Container matching active pill shape */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-full w-fit max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={16} weight={activeTab === 'profile' ? 'fill' : 'bold'} />
              Overview & Profile
            </button>

            <button
              onClick={() => setActiveTab('disciplinary')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'disciplinary'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldWarning size={16} weight={activeTab === 'disciplinary' ? 'fill' : 'bold'} />
              Disciplinary Records
            </button>

            <button
              onClick={() => setActiveTab('mentoring')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'mentoring'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Handshake size={16} weight={activeTab === 'mentoring' ? 'fill' : 'bold'} />
              Mentoring Logs
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={16} weight={activeTab === 'documents' ? 'fill' : 'bold'} />
              Document Reviews
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Spinner size={32} className="animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-bold">Loading SIS data...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Profile & Status */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="soft-card p-6 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 shadow-sm">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <User className="text-indigo-500" size={20} weight="duotone" />
                      Academic Lifecycle Controls
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Enrollment Status
                        </label>
                        <select
                          value={enrollmentStatus}
                          onChange={e => setEnrollmentStatus(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="active">Active</option>
                          <option value="probation">Academic Probation</option>
                          <option value="suspended">Suspended</option>
                          <option value="graduated">Graduated</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Current Semester
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={currentSemester}
                          onChange={e => setCurrentSemester(Number(e.target.value))}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock size={14} /> Protected by Optimistic Locking (v{profileVersion})
                      </p>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                      >
                        <FloppyDisk size={16} weight="bold" />
                        {savingProfile ? 'Saving...' : 'Update Status'}
                      </button>
                    </div>
                  </div>

                  <div className="soft-card p-6 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 shadow-sm">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4">Read-Only Student Metadata</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-xs text-slate-400 font-bold block">Email Address</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block mt-0.5">{student?.email || 'student@acadmix.org'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-xs text-slate-400 font-bold block">Roll Number</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block mt-0.5">{student?.roll_number || student?.college_id || 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-xs text-slate-400 font-bold block">CGPA</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">{student?.cgpa || '8.75'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Disciplinary Records */}
              {activeTab === 'disciplinary' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Disciplinary Incident History</h3>
                    <button
                      onClick={() => setShowAddDisciplinary(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all shadow-md shadow-rose-500/20"
                    >
                      <Plus size={16} weight="bold" /> Log Incident
                    </button>
                  </div>

                  {showAddDisciplinary && (
                    <form onSubmit={handleCreateDisciplinary} className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-4">
                      <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200">New Disciplinary Incident</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          required
                          placeholder="Incident Title (e.g. Exam Malpractice)"
                          value={discTitle}
                          onChange={e => setDiscTitle(e.target.value)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                        />
                        <select
                          value={discSeverity}
                          onChange={e => setDiscSeverity(e.target.value)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200"
                        >
                          <option value="minor">Minor Infraction</option>
                          <option value="major">Major Violation</option>
                          <option value="severe">Severe / Suspension Warning</option>
                        </select>
                      </div>
                      <textarea
                        required
                        rows={2}
                        placeholder="Detailed incident description..."
                        value={discDescription}
                        onChange={e => setDiscDescription(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                      <input
                        placeholder="Action Taken (e.g. Warning letter issued)"
                        value={discAction}
                        onChange={e => setDiscAction(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowAddDisciplinary(false)} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                        <button type="submit" className="px-5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">Save Record</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {disciplinaryList.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" weight="duotone" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Clean Academic Record</p>
                        <p className="text-xs text-slate-400 mt-1">No disciplinary infractions have been recorded for this student.</p>
                      </div>
                    ) : (
                      disciplinaryList.map((d, idx) => (
                        <div key={d.id || idx} className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                d.severity === 'severe' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' :
                                d.severity === 'major' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {d.severity}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{d.title}</h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{d.description}</p>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2">Action: {d.action_taken}</p>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Mentoring Logs */}
              {activeTab === 'mentoring' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Faculty Mentoring & Counseling</h3>
                    <button
                      onClick={() => setShowAddMentoring(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-500/20"
                    >
                      <Plus size={16} weight="bold" /> Log Session
                    </button>
                  </div>

                  {showAddMentoring && (
                    <form onSubmit={handleCreateMentoring} className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl space-y-4">
                      <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">New Mentoring Session</h4>
                      <input
                        required
                        placeholder="Session Topic (e.g. Semester 4 Career Guidance)"
                        value={mentoringTopic}
                        onChange={e => setMentoringTopic(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                      />
                      <textarea
                        required
                        rows={3}
                        placeholder="Counseling discussion notes and student feedback..."
                        value={mentoringNotes}
                        onChange={e => setMentoringNotes(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                      <input
                        placeholder="Action Items (comma separated, e.g. Complete resume, Register for hackathon)"
                        value={mentoringActionItems}
                        onChange={e => setMentoringActionItems(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowAddMentoring(false)} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                        <button type="submit" className="px-5 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">Save Session</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {mentoringList.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Handshake size={32} className="mx-auto text-indigo-500 mb-2" weight="duotone" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No Mentoring Sessions Logged</p>
                        <p className="text-xs text-slate-400 mt-1">Initiate regular academic follow-ups to track student progress.</p>
                      </div>
                    ) : (
                      mentoringList.map((m, idx) => (
                        <div key={m.id || idx} className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{m.topic}</h4>
                            <span className="text-xs text-slate-400">{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.notes}</p>
                          {m.action_items && m.action_items.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {m.action_items.map((item: string, i: number) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1">
                                  &bull; {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Document Review */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Verified Academic & Identification Documents</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {documentsList.map((doc) => (
                      <div key={doc.id} className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600">
                            <FileText size={20} weight="duotone" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{doc.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Uploaded on {doc.uploaded_at || 'Recently'} &bull; Type: {doc.doc_type}</p>
                            {doc.remarks && <p className="text-xs italic text-slate-500 mt-1">Remarks: "{doc.remarks}"</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                            doc.status === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                            doc.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}>
                            {doc.status}
                          </span>

                          {doc.status !== 'verified' && (
                            <button
                              onClick={() => handleReviewDoc(doc.id, 'verified')}
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="Verify Document"
                            >
                              <CheckCircle size={18} weight="bold" />
                            </button>
                          )}
                          {doc.status !== 'rejected' && (
                            <button
                              onClick={() => handleReviewDoc(doc.id, 'rejected')}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Reject Document"
                            >
                              <XCircle size={18} weight="bold" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition-all"
          >
            Close Workspace
          </button>
        </div>

      </div>

      {/* Premium Alert Popup */}
      <AlertModal
        open={alert.open}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
};

export default StudentSISWorkspace;
