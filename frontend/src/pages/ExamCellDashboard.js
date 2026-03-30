import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, CheckCircle, Clock, SignOut, FileText, ChartBar, Eye, PaperPlaneTilt } from '@phosphor-icons/react';
import { examCellAPI, marksAPI } from '../services/api';

const ExamCellDashboard = ({ navigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [approvedMarks, setApprovedMarks] = useState([]);
  const [endtermEntries, setEndtermEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadForm, setUploadForm] = useState({ subject_code: '', subject_name: '', department: 'DS', batch: '2022', section: 'A', semester: 3 });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [manualEntry, setManualEntry] = useState(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const { data } = await examCellAPI.examCellDashboard();
        setDashboard(data);
      }
      if (activeTab === 'midterm') {
        const { data } = await examCellAPI.approvedMarks();
        setApprovedMarks(data);
      }
      if (activeTab === 'endterm') {
        const { data } = await examCellAPI.endtermList();
        setEndtermEntries(data);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadFile) return alert('Please select a file');
    if (!uploadForm.subject_code) return alert('Please fill all fields');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      Object.entries(uploadForm).forEach(([k, v]) => fd.append(k, v));
      const { data } = await examCellAPI.uploadFile(fd);
      alert(data.message);
      setUploadFile(null);
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Upload failed'); }
    setUploading(false);
  };

  const handlePublish = async (entryId) => {
    if (!window.confirm('Publish these results? Students will be able to view them.')) return;
    try {
      await examCellAPI.publish(entryId);
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Publish failed'); }
  };

  const stats = dashboard ? [
    { label: 'Approved Midterms', value: dashboard.total_approved_midterms, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-500' },
    { label: 'End-term Entries', value: dashboard.total_endterm, icon: FileText, color: 'bg-indigo-50 text-indigo-500' },
    { label: 'Published', value: dashboard.total_published, icon: ChartBar, color: 'bg-amber-50 text-amber-500' },
    { label: 'Draft', value: dashboard.total_draft, icon: Clock, color: 'bg-slate-100 text-slate-500' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
              <BookOpen size={22} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">QuizPortal</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Exam Cell</p>
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
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">Exam Cell</h2>
        <p className="text-base font-medium text-slate-500 mb-8">Manage end-term marks and publish results</p>

        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 w-fit mb-8" data-testid="examcell-tabs">
          {[{ id: 'overview', label: 'Overview' }, { id: 'midterm', label: 'Approved Midterms' }, { id: 'endterm', label: 'End-term Marks' }, { id: 'upload', label: 'Upload Marks' }].map(tab => (
            <button key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
              className={`pill-tab ${activeTab === tab.id ? 'pill-tab-active' : 'pill-tab-inactive'}`}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div data-testid="overview-content">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="soft-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                    <div className={`${stat.color} p-2 rounded-xl`}><stat.icon size={18} weight="duotone" /></div>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'midterm' && (
          <div data-testid="midterm-content">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">HOD-Approved Mid-term Marks</h3>
            <div className="space-y-4">
              {approvedMarks.map(m => (
                <div key={m.id} className="soft-card p-6" data-testid={`midterm-${m.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-slate-800">{m.subject_name} ({m.subject_code})</p>
                      <p className="text-sm text-slate-500">{m.exam_type?.toUpperCase()} | Teacher: {m.teacher_name} | Batch {m.batch} Sec {m.section}</p>
                    </div>
                    <span className="soft-badge bg-emerald-50 text-emerald-600">Approved</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs uppercase">College ID</th>
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs uppercase">Name</th>
                        <th className="text-center py-2 px-3 font-bold text-slate-500 text-xs uppercase">Marks / {m.max_marks}</th>
                      </tr></thead>
                      <tbody>
                        {m.entries?.map((e, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-600">{e.college_id}</td>
                            <td className="py-2 px-3 text-slate-800">{e.student_name}</td>
                            <td className="py-2 px-3 text-center font-bold">{e.marks ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {approvedMarks.length === 0 && <div className="soft-card p-8 text-center"><p className="text-slate-400">No approved midterm marks yet</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'endterm' && (
          <div data-testid="endterm-content">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">End-term Results</h3>
            <div className="space-y-4">
              {endtermEntries.map(e => (
                <div key={e.id} className="soft-card p-6" data-testid={`endterm-${e.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-slate-800">{e.subject_name} ({e.subject_code})</p>
                      <p className="text-sm text-slate-500">Sem {e.semester} | Batch {e.batch} Sec {e.section} | {e.entries?.length} students</p>
                    </div>
                    <span className={`soft-badge ${e.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{e.status}</span>
                  </div>
                  {e.status === 'draft' && (
                    <button data-testid={`publish-${e.id}`} onClick={() => handlePublish(e.id)} className="btn-primary !py-2 text-sm flex items-center gap-2">
                      <PaperPlaneTilt size={16} weight="duotone" /> Publish Results
                    </button>
                  )}
                </div>
              ))}
              {endtermEntries.length === 0 && <div className="soft-card p-8 text-center"><p className="text-slate-400">No end-term entries yet. Upload marks to get started.</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div data-testid="upload-content">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Upload End-term Marks</h3>
            <div className="soft-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject Code</label>
                  <input data-testid="upload-subject-code" value={uploadForm.subject_code} onChange={(e) => setUploadForm({ ...uploadForm, subject_code: e.target.value })} className="soft-input w-full" placeholder="e.g., 22PC0DS17" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject Name</label>
                  <input data-testid="upload-subject-name" value={uploadForm.subject_name} onChange={(e) => setUploadForm({ ...uploadForm, subject_name: e.target.value })} className="soft-input w-full" placeholder="e.g., Machine Learning" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Semester</label>
                  <input data-testid="upload-semester" type="number" value={uploadForm.semester} onChange={(e) => setUploadForm({ ...uploadForm, semester: parseInt(e.target.value) })} className="soft-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Department</label>
                  <input value={uploadForm.department} onChange={(e) => setUploadForm({ ...uploadForm, department: e.target.value })} className="soft-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Batch</label>
                  <input value={uploadForm.batch} onChange={(e) => setUploadForm({ ...uploadForm, batch: e.target.value })} className="soft-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Section</label>
                  <input value={uploadForm.section} onChange={(e) => setUploadForm({ ...uploadForm, section: e.target.value })} className="soft-input w-full" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Marks File (CSV or Excel)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                  <Upload size={40} weight="duotone" className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm font-medium text-slate-500 mb-3">Upload CSV or XLSX file with columns: college_id, marks, grade</p>
                  <input data-testid="file-upload" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setUploadFile(e.target.files[0])} className="text-sm" />
                  {uploadFile && <p className="mt-2 text-sm font-bold text-indigo-600">{uploadFile.name}</p>}
                </div>
              </div>
              <button data-testid="upload-submit-button" onClick={handleUpload} disabled={uploading} className="btn-primary !py-2.5 text-sm flex items-center gap-2 disabled:opacity-60">
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} weight="duotone" />}
                {uploading ? 'Uploading...' : 'Upload Marks'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamCellDashboard;
