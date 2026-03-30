import React, { useState, useEffect } from 'react';
import { ArrowLeft, PaperPlaneTilt, FloppyDisk, CheckCircle, Clock, Warning } from '@phosphor-icons/react';
import { marksAPI } from '../services/api';

const MarksEntry = ({ navigate, user }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [examType, setExamType] = useState('mid1');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [maxMarks, setMaxMarks] = useState(30);
  const [entryId, setEntryId] = useState(null);
  const [status, setStatus] = useState('new');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await marksAPI.myAssignments();
        setAssignments(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchAssignments();
  }, []);

  const loadStudentsAndMarks = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    try {
      const [studentsRes, entryRes] = await Promise.all([
        marksAPI.students(assignment.department, assignment.batch, assignment.section),
        marksAPI.getEntry(assignment.id, examType)
      ]);
      setStudents(studentsRes.data);
      if (entryRes.data) {
        const savedMarks = {};
        (entryRes.data.entries || []).forEach(e => { savedMarks[e.student_id] = e.marks; });
        setMarks(savedMarks);
        setEntryId(entryRes.data.id);
        setStatus(entryRes.data.status);
        setMaxMarks(entryRes.data.max_marks || 30);
      } else {
        setMarks({});
        setEntryId(null);
        setStatus('new');
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedAssignment) loadStudentsAndMarks(selectedAssignment);
  }, [examType]);

  const handleMarkChange = (studentId, value) => {
    const num = value === '' ? null : parseFloat(value);
    if (num !== null && (num < 0 || num > maxMarks)) return;
    setMarks({ ...marks, [studentId]: num });
  };

  const handleSave = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      const entries = students.map(s => ({
        student_id: s.id, college_id: s.college_id, student_name: s.name,
        marks: marks[s.id] ?? null
      }));
      const { data } = await marksAPI.saveEntry({
        assignment_id: selectedAssignment.id, exam_type: examType,
        semester: selectedAssignment.semester, max_marks: maxMarks, entries
      });
      setEntryId(data.id);
      setStatus('draft');
      alert('Marks saved as draft');
    } catch (err) { alert(err.response?.data?.detail || 'Save failed'); }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!entryId) return alert('Save marks first');
    if (!window.confirm('Submit marks for HOD approval? You cannot edit after submission.')) return;
    try {
      await marksAPI.submit(entryId);
      setStatus('submitted');
      alert('Marks submitted for HOD approval');
    } catch (err) { alert(err.response?.data?.detail || 'Submit failed'); }
  };

  const isEditable = status === 'new' || status === 'draft' || status === 'rejected';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button data-testid="back-button" onClick={() => selectedAssignment ? setSelectedAssignment(null) : navigate('teacher-dashboard')}
            className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={22} weight="duotone" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {selectedAssignment ? `${selectedAssignment.subject_name}` : 'Mid-term Marks Entry'}
            </h1>
            <p className="text-sm font-medium text-slate-400">
              {selectedAssignment ? `${selectedAssignment.subject_code} | Batch ${selectedAssignment.batch} Sec ${selectedAssignment.section}` : 'Select a subject to enter marks'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedAssignment ? (
          <div data-testid="assignment-list">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">My Subject Assignments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map(a => (
                <button key={a.id} data-testid={`assignment-${a.id}`} onClick={() => loadStudentsAndMarks(a)}
                  className="soft-card-hover p-6 text-left">
                  <p className="font-bold text-lg text-slate-800">{a.subject_name}</p>
                  <p className="text-sm font-medium text-slate-500">{a.subject_code}</p>
                  <p className="text-xs text-slate-400 mt-1">Batch {a.batch} | Section {a.section} | Semester {a.semester}</p>
                </button>
              ))}
              {assignments.length === 0 && (
                <div className="col-span-2 soft-card p-8 text-center">
                  <p className="text-slate-400 font-medium">No subjects assigned. Contact your HOD.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div data-testid="marks-entry-form">
            {/* Exam Type & Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5" data-testid="exam-type-tabs">
                <button data-testid="tab-mid1" onClick={() => setExamType('mid1')}
                  className={`pill-tab ${examType === 'mid1' ? 'pill-tab-active' : 'pill-tab-inactive'}`}>Mid-term 1</button>
                <button data-testid="tab-mid2" onClick={() => setExamType('mid2')}
                  className={`pill-tab ${examType === 'mid2' ? 'pill-tab-active' : 'pill-tab-inactive'}`}>Mid-term 2</button>
              </div>
              <div className="flex items-center gap-3">
                <span className={`soft-badge ${
                  status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                  status === 'submitted' ? 'bg-amber-50 text-amber-600' :
                  status === 'rejected' ? 'bg-red-50 text-red-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {status === 'new' ? 'Not Started' : status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400">Max Marks:</label>
                  <input data-testid="max-marks-input" type="number" value={maxMarks} onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 30)}
                    className="soft-input !py-1.5 !px-3 w-20 text-sm" disabled={!isEditable} />
                </div>
              </div>
            </div>

            {status === 'rejected' && (
              <div className="mb-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3">
                <Warning size={20} weight="duotone" className="text-red-500" />
                <p className="text-sm font-medium text-red-600">Marks were rejected by HOD. Please review and resubmit.</p>
              </div>
            )}

            {/* Marks Table */}
            <div className="soft-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest w-12">#</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">College ID</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Student Name</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest w-32">Marks / {maxMarks}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors" data-testid={`student-row-${s.college_id}`}>
                      <td className="py-3 px-4 text-sm text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{s.college_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{s.name}</td>
                      <td className="py-3 px-4 text-center">
                        {isEditable ? (
                          <input data-testid={`marks-input-${s.college_id}`} type="number" min="0" max={maxMarks} step="0.5"
                            value={marks[s.id] ?? ''} onChange={(e) => handleMarkChange(s.id, e.target.value)}
                            className="soft-input !py-1.5 !px-3 w-24 text-center text-sm font-bold mx-auto" placeholder="-" />
                        ) : (
                          <span className="font-bold text-slate-900">{marks[s.id] ?? '-'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="p-8 text-center"><p className="text-slate-400 font-medium">No students found for this class</p></div>
              )}
            </div>

            {/* Actions */}
            {isEditable && students.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-500">{Object.values(marks).filter(m => m !== null && m !== undefined).length} / {students.length} students graded</p>
                <div className="flex gap-3">
                  <button data-testid="save-marks-button" onClick={handleSave} disabled={saving} className="btn-ghost !py-2.5 text-sm flex items-center gap-2 disabled:opacity-60">
                    <FloppyDisk size={16} weight="duotone" /> {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button data-testid="submit-marks-button" onClick={handleSubmit} disabled={!entryId || status !== 'draft'} className="btn-primary !py-2.5 text-sm flex items-center gap-2 disabled:opacity-60">
                    <PaperPlaneTilt size={16} weight="duotone" /> Submit for Approval
                  </button>
                </div>
              </div>
            )}

            {status === 'submitted' && (
              <div className="mt-6 p-4 bg-amber-50 rounded-2xl flex items-center gap-3">
                <Clock size={20} weight="duotone" className="text-amber-500" />
                <p className="text-sm font-medium text-amber-700">Marks submitted. Waiting for HOD approval.</p>
              </div>
            )}
            {status === 'approved' && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
                <CheckCircle size={20} weight="duotone" className="text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700">Marks approved by HOD.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;
