import React, { useState, useEffect } from 'react';
import { BookOpen, Users, ClipboardText, CheckCircle, Clock, SignOut, Plus, Trash, UserPlus, ChartLine, Eye } from '@phosphor-icons/react';
import { facultyAPI, examCellAPI, marksAPI } from '../services/api';

const HodDashboard = ({ navigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ teacher_id: '', subject_code: '', subject_name: '', department: user?.department || 'DS', batch: '2022', section: 'A', semester: 3 });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const { data } = await examCellAPI.hodDashboard();
        setDashboard(data);
      }
      if (activeTab === 'faculty' || activeTab === 'overview') {
        const [a, t] = await Promise.all([facultyAPI.assignments(), facultyAPI.teachers()]);
        setAssignments(a.data);
        setTeachers(t.data);
      }
      if (activeTab === 'review') {
        const { data } = await marksAPI.submissions();
        setSubmissions(data);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddAssignment = async () => {
    try {
      await facultyAPI.createAssignment(newAssignment);
      setShowAddForm(false);
      setNewAssignment({ ...newAssignment, teacher_id: '', subject_code: '', subject_name: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Failed to create assignment'); }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try { await facultyAPI.deleteAssignment(id); fetchData(); } catch {}
  };

  const handleReview = async (entryId, action) => {
    const remarks = action === 'reject' ? prompt('Enter rejection remarks:') || '' : '';
    try {
      await marksAPI.review(entryId, { action, remarks });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Review failed'); }
  };

  const stats = dashboard ? [
    { label: 'Teachers', value: dashboard.total_teachers, icon: Users, color: 'bg-indigo-50 text-indigo-500' },
    { label: 'Students', value: dashboard.total_students, icon: BookOpen, color: 'bg-emerald-50 text-emerald-500' },
    { label: 'Assignments', value: dashboard.total_assignments, icon: ClipboardText, color: 'bg-amber-50 text-amber-500' },
    { label: 'Pending Reviews', value: dashboard.pending_reviews, icon: Clock, color: 'bg-rose-50 text-rose-500' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
              <BookOpen size={22} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">QuizPortal</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Head of Department</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="btn-ghost !px-4 !py-2 text-sm">{user?.name}</span>
            <button data-testid="logout-button" onClick={onLogout} className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
              <SignOut size={20} weight="duotone" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome, {user?.name?.split(' ').pop()}!</h2>
        <p className="text-base font-medium text-slate-500 mb-8">Department: {user?.department || 'DS'}</p>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 w-fit mb-8" data-testid="hod-tabs">
          {[{ id: 'overview', label: 'Overview' }, { id: 'faculty', label: 'Faculty Management' }, { id: 'review', label: 'Mark Reviews' }].map(tab => (
            <button key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
              className={`pill-tab ${activeTab === tab.id ? 'pill-tab-active' : 'pill-tab-inactive'}`}>{tab.label}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div data-testid="overview-content">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="soft-card p-6" data-testid={`stat-${stat.label.toLowerCase()}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                    <div className={`${stat.color} p-2 rounded-xl`}><stat.icon size={18} weight="duotone" /></div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
            {dashboard?.recent_submissions?.length > 0 && (
              <div className="soft-card p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Pending Mark Submissions</h3>
                <div className="space-y-3">
                  {dashboard.recent_submissions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{s.teacher_name} - {s.subject_name}</p>
                        <p className="text-sm text-slate-500">{s.exam_type?.toUpperCase()} | {s.batch} {s.section} | {s.entries?.length} students</p>
                      </div>
                      <button onClick={() => setActiveTab('review')} className="btn-primary !px-4 !py-2 text-sm">Review</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Faculty Management */}
        {activeTab === 'faculty' && (
          <div data-testid="faculty-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Faculty Assignments</h3>
              <button data-testid="add-assignment-button" onClick={() => setShowAddForm(!showAddForm)} className="btn-primary !px-4 !py-2.5 text-sm flex items-center gap-2">
                <UserPlus size={18} weight="duotone" /> Add Assignment
              </button>
            </div>

            {showAddForm && (
              <div className="soft-card p-6 mb-6" data-testid="add-assignment-form">
                <h4 className="font-bold text-slate-800 mb-4">New Faculty Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Teacher</label>
                    <select data-testid="teacher-select" value={newAssignment.teacher_id} onChange={(e) => setNewAssignment({ ...newAssignment, teacher_id: e.target.value })} className="soft-input w-full">
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.college_id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject Code</label>
                    <input data-testid="subject-code-input" value={newAssignment.subject_code} onChange={(e) => setNewAssignment({ ...newAssignment, subject_code: e.target.value })} className="soft-input w-full" placeholder="e.g., 22PC0DS17" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject Name</label>
                    <input data-testid="subject-name-input" value={newAssignment.subject_name} onChange={(e) => setNewAssignment({ ...newAssignment, subject_name: e.target.value })} className="soft-input w-full" placeholder="e.g., Machine Learning" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Department</label>
                    <input value={newAssignment.department} onChange={(e) => setNewAssignment({ ...newAssignment, department: e.target.value })} className="soft-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Batch</label>
                    <input value={newAssignment.batch} onChange={(e) => setNewAssignment({ ...newAssignment, batch: e.target.value })} className="soft-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Section</label>
                    <input value={newAssignment.section} onChange={(e) => setNewAssignment({ ...newAssignment, section: e.target.value })} className="soft-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Semester</label>
                    <input type="number" value={newAssignment.semester} onChange={(e) => setNewAssignment({ ...newAssignment, semester: parseInt(e.target.value) })} className="soft-input w-full" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button data-testid="save-assignment-button" onClick={handleAddAssignment} className="btn-primary !py-2.5 text-sm">Save Assignment</button>
                  <button onClick={() => setShowAddForm(false)} className="btn-ghost !py-2.5 text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {assignments.map(a => (
                <div key={a.id} className="soft-card p-5 flex items-center justify-between" data-testid={`assignment-${a.id}`}>
                  <div>
                    <p className="font-bold text-slate-800">{a.teacher_name}</p>
                    <p className="text-sm font-medium text-slate-500">{a.subject_code} - {a.subject_name}</p>
                    <p className="text-xs text-slate-400">Batch {a.batch} | Section {a.section} | Sem {a.semester}</p>
                  </div>
                  <button onClick={() => handleDeleteAssignment(a.id)} className="p-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                    <Trash size={18} weight="duotone" />
                  </button>
                </div>
              ))}
              {assignments.length === 0 && <div className="soft-card p-8 text-center"><p className="text-slate-400 font-medium">No faculty assignments yet</p></div>}
            </div>
          </div>
        )}

        {/* Mark Reviews */}
        {activeTab === 'review' && (
          <div data-testid="review-content">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Mark Submissions</h3>
            <div className="space-y-4">
              {submissions.map(s => (
                <div key={s.id} className="soft-card p-6" data-testid={`submission-${s.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg text-slate-800">{s.subject_name} ({s.subject_code})</p>
                      <p className="text-sm font-medium text-slate-500">By: {s.teacher_name} | {s.exam_type?.toUpperCase()} | Batch {s.batch} Sec {s.section}</p>
                      <p className="text-xs text-slate-400">{s.entries?.length} students | Max: {s.max_marks} marks</p>
                    </div>
                    <span className={`soft-badge ${s.status === 'submitted' ? 'bg-amber-50 text-amber-600' : s.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {s.status}
                    </span>
                  </div>
                  {s.entries && (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs uppercase">College ID</th>
                            <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs uppercase">Name</th>
                            <th className="text-center py-2 px-3 font-bold text-slate-500 text-xs uppercase">Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.entries.slice(0, 5).map((e, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-2 px-3 font-medium text-slate-600">{e.college_id}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{e.student_name}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-900">{e.marks ?? '-'}</td>
                            </tr>
                          ))}
                          {s.entries.length > 5 && <tr><td colSpan="3" className="py-2 px-3 text-center text-xs text-slate-400">...and {s.entries.length - 5} more</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {s.status === 'submitted' && (
                    <div className="flex gap-3">
                      <button data-testid={`approve-${s.id}`} onClick={() => handleReview(s.id, 'approve')} className="btn-primary !py-2 text-sm flex items-center gap-2">
                        <CheckCircle size={16} weight="duotone" /> Approve
                      </button>
                      <button data-testid={`reject-${s.id}`} onClick={() => handleReview(s.id, 'reject')} className="btn-ghost !py-2 text-sm text-red-600">Reject</button>
                    </div>
                  )}
                  {s.review_remarks && <p className="text-sm text-slate-500 mt-2">Remarks: {s.review_remarks}</p>}
                </div>
              ))}
              {submissions.length === 0 && <div className="soft-card p-8 text-center"><p className="text-slate-400 font-medium">No submissions to review</p></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HodDashboard;
