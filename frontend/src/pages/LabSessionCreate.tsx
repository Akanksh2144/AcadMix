import React, { useState, useEffect } from 'react';
import { Plus, Trash, Eye, Clock, X, Warning, ArrowRight, CaretDown, CaretUp, ListBullets, CheckCircle, Shuffle, ArrowsCounterClockwise } from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import { facultyAPI, labAPI } from '../services/api';
import { toast } from 'sonner';

interface LabSessionCreateProps {
  navigate: (path: string, state?: any) => void;
  user: any;
  onLogout?: () => void;
}

const LabSessionCreate: React.FC<LabSessionCreateProps> = ({ navigate, user, onLogout }) => {
  const [step, setStep] = useState(1); // 1: Config, 2: Questions, 3: Assignment & Start
  
  // Config state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [batch, setBatch] = useState('');
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState(1);
  const [assignmentMode, setAssignmentMode] = useState('cyclic'); // cyclic | random | manual
  const [questionsPerStudent, setQuestionsPerStudent] = useState(1);
  
  // Selection state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [qBank, setQBank] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [manualAssignments, setManualAssignments] = useState<{ [studentId: string]: string }>({}); // student_id -> question_id
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [assignmentPreview, setAssignmentPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await facultyAPI.assignments();
        setAssignments(data || []);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    };
    fetchAssignments();
  }, []);

  // Fetch questions when subject is selected
  useEffect(() => {
    if (!subject) return;
    const fetchQuestions = async () => {
      try {
        const { data } = await labAPI.listQuestions({ subject });
        setQBank(data || []);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        toast.error('Failed to load question bank');
      }
    };
    fetchQuestions();
  }, [subject]);

  // Auto-resolve semester when subject, batch, and section match an assignment
  useEffect(() => {
    if (subject && batch && section) {
      const match = assignments.find(
        (a: any) => a.subject_name === subject && a.batch === batch && a.section === section
      );
      if (match) {
        setSemester(match.semester);
      }
    }
  }, [subject, batch, section, assignments]);

  const handleCreateSession = async () => {
    if (!title.trim()) { toast.error('Please enter a session title'); return; }
    if (!subject) { toast.error('Please select a subject'); return; }
    if (!batch) { toast.error('Please select batch'); return; }
    if (!section) { toast.error('Please select section'); return; }
    if (!semester) { toast.error('Please select semester'); return; }

    setLoading(true);
    try {
      const res = await labAPI.createSession({
        title,
        subject,
        batch,
        section,
        semester: Number(semester),
        assignment_mode: assignmentMode,
        questions_per_student: Number(questionsPerStudent),
      });
      setSessionId(res.id || res.data?.id);
      setSessionCode(res.session_code || res.data?.session_code);
      toast.success('Lab session draft created!');
      setStep(2);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create session');
    }
    setLoading(false);
  };

  const handleToggleQuestion = (q: any) => {
    setSelectedQuestions(prev => {
      if (prev.find(x => x.id === q.id)) {
        return prev.filter(x => x.id !== q.id);
      }
      return [...prev, q];
    });
  };

  const handleGenerateAssignments = async () => {
    if (!sessionId) return;
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    if (assignmentMode !== 'manual' && selectedQuestions.length < questionsPerStudent) {
      toast.error(`Need at least ${questionsPerStudent} questions selected for assignment`);
      return;
    }

    setLoading(true);
    try {
      const qIds = selectedQuestions.map(q => q.id);
      if (assignmentMode === 'cyclic') {
        await labAPI.assignCyclic(sessionId, qIds);
      } else if (assignmentMode === 'random') {
        await labAPI.assignRandom(sessionId, qIds);
      } else {
        // Manual assignment
        const list = Object.entries(manualAssignments).map(([student_id, question_id]) => ({
          student_id,
          question_id,
          slot_number: 1,
        }));
        if (list.length === 0) {
          toast.error('Please assign questions to at least one student');
          setLoading(false);
          return;
        }
        await labAPI.assignManual(sessionId, list);
      }

      // Fetch preview
      const previewRes = await labAPI.getAssignments(sessionId);
      setAssignmentPreview(previewRes.assignments || previewRes.data?.assignments || []);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Assignment failed');
    }
    setLoading(false);
  };

  // Fetch students for manual assignment
  const handleLoadStudentsForManual = async () => {
    if (assignmentMode !== 'manual') return;
    setLoading(true);
    try {
      const dept = user?.department || 'CSE';
      const studentRes = await facultyAPI.students(dept, batch, section);
      setStudents(studentRes.data || studentRes || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students list');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (step === 2 && assignmentMode === 'manual') {
      handleLoadStudentsForManual();
    }
  }, [step]);

  const handleStartExam = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await labAPI.startSession(sessionId);
      toast.success('🧪 Lab Exam is now live!');
      navigate('teacher-dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to start exam');
    }
    setLoading(false);
  };

  const availableSubjects = [...new Set(assignments.map((a: any) => a.subject_name))];
  const filteredBySubject = subject
    ? assignments.filter((a: any) => a.subject_name === subject)
    : assignments;
  const batches = [...new Set(filteredBySubject.map((a: any) => a.batch))];
  const filteredByBatch = batch
    ? filteredBySubject.filter((a: any) => a.batch === batch)
    : filteredBySubject;
  const sections = [...new Set(filteredByBatch.map((a: any) => a.section))];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader
        navigate={navigate}
        user={user}
        title="Schedule Lab Exam"
        subtitle="Step-by-step exam session wizard"
        onLogout={onLogout}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[
            { num: 1, title: 'Configure Session' },
            { num: 2, title: 'Select Questions' },
            { num: 3, title: 'Review & Start' },
          ].map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step === s.num
                  ? 'bg-emerald-500 text-white shadow-md'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {s.num}
              </div>
              <span className={`text-sm font-bold hidden sm:inline ${
                step === s.num ? 'text-slate-800 dark:text-white' : 'text-slate-400'
              }`}>
                {s.title}
              </span>
              {s.num < 3 && <div className="h-[2px] w-12 bg-slate-200 dark:bg-slate-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* STEP 1: CONFIGURE */}
        {step === 1 && (
          <div className="soft-card p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Exam Session Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g. End Semester Practical Exam Batch A"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="soft-input w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject</label>
                  <select
                    value={subject}
                    onChange={e => {
                      setSubject(e.target.value);
                      setBatch('');
                      setSection('');
                    }}
                    className="soft-input w-full"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Semester</label>
                  <select
                    value={semester}
                    onChange={e => setSemester(Number(e.target.value))}
                    className="soft-input w-full"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Batch / Year</label>
                  <select
                    value={batch}
                    onChange={e => {
                      setBatch(e.target.value);
                      setSection('');
                    }}
                    className="soft-input w-full"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Section</label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    className="soft-input w-full"
                  >
                    <option value="">Select Section</option>
                    {sections.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-extrabold text-indigo-500">Assignment Algorithm</label>
                  <select
                    value={assignmentMode}
                    onChange={e => setAssignmentMode(e.target.value)}
                    className="soft-input w-full"
                  >
                    <option value="cyclic">Cyclic (R1→Q1, R2→Q2, R3→Q3, R4→Q1...)</option>
                    <option value="random">Anti-Consecutive Random</option>
                    <option value="manual">Manual Assign per Student</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    {assignmentMode === 'cyclic' && 'Distributes selected questions sequentially matching the students\' roll order. Ensures no adjacent students get the same question.'}
                    {assignmentMode === 'random' && 'Shuffles the question list and assigns randomly. Guarantees student[i] does not get the same question as student[i-1].'}
                    {assignmentMode === 'manual' && 'Allows you to pick exactly which question goes to which student roll number.'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Questions Per Student</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={questionsPerStudent}
                    onChange={e => setQuestionsPerStudent(Number(e.target.value))}
                    disabled={assignmentMode === 'manual'}
                    className="soft-input w-full disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Usually set to 1. If set to greater than 1, students will see multiple question tabs inside the IDE.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="btn-primary !px-6 flex items-center gap-2"
              >
                {loading ? 'Creating...' : 'Continue to Question Bank'}
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT QUESTIONS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="soft-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Selected Questions ({selectedQuestions.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select from the registry bank below to attach to this exam session</p>
                </div>
                {selectedQuestions.length > 0 && (
                  <button
                    onClick={() => setSelectedQuestions([])}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedQuestions.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  No questions selected yet. Choose from below.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedQuestions.map(q => (
                    <div key={q.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-100">
                      <span>{q.title}</span>
                      <button onClick={() => handleToggleQuestion(q)}>
                        <X size={12} weight="bold" className="hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Assignment Grid if mode == manual */}
            {assignmentMode === 'manual' && students.length > 0 && selectedQuestions.length > 0 && (
              <div className="soft-card p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Manual Question Grid</h3>
                <p className="text-xs text-slate-400 mb-4">Assign one of the selected questions to each student in the class</p>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map(std => (
                    <div key={std.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{std.name}</p>
                        <p className="text-xs text-slate-400 font-semibold">{std.roll_number || 'No Roll'}</p>
                      </div>
                      <select
                        value={manualAssignments[std.id] || ''}
                        onChange={e => setManualAssignments(prev => ({ ...prev, [std.id]: e.target.value }))}
                        className="soft-input !py-1.5 !px-3 text-xs w-48"
                      >
                        <option value="">Unassigned</option>
                        {selectedQuestions.map(q => (
                          <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Bank List */}
            <div className="soft-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ListBullets size={20} className="text-indigo-500" /> Subject Question Bank ({subject})
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {qBank.map(q => {
                  const isSelected = !!selectedQuestions.find(x => x.id === q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleToggleQuestion(q)}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                          : 'bg-white border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`soft-badge text-[10px] uppercase font-bold ${
                            q.source === 'platform'
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {q.source === 'platform' ? 'Platform Lib' : 'College Registry'}
                          </span>
                          <span className="soft-badge text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-700 font-bold uppercase">{q.language}</span>
                          <span className={`soft-badge text-[10px] font-bold uppercase ${
                            q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                            q.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>{q.difficulty}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{q.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{q.description}</p>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle size={14} weight="fill" />}
                      </div>
                    </div>
                  );
                })}

                {qBank.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    No questions available for subject: {subject}. Add questions to registry first.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary text-sm"
              >
                Back
              </button>
              <button
                onClick={handleGenerateAssignments}
                disabled={loading || selectedQuestions.length === 0}
                className="btn-primary !px-6 flex items-center gap-2"
              >
                {loading ? 'Processing...' : 'Run Assignment & Preview'}
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & START */}
        {step === 3 && (
          <div className="soft-card p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Ready to Launch</span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subject} · Semester {semester} · Batch {batch} {section}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-2xl flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Exam Code</span>
                <span className="text-xl font-extrabold text-emerald-600 tracking-widest">{sessionCode}</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
              <Warning size={20} weight="fill" className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Exam Code Lock</p>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">
                  The exam is currently in draft. Students cannot join until you click "Start Practical Exam". Once started, the session will accept student joins.
                </p>
              </div>
            </div>

            {/* Assignment Preview Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100">Assignment Mapping Preview</h4>
                <span className="text-xs text-slate-400">{assignmentPreview.length} students assigned</span>
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3">Roll Number</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Assigned Question(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-semibold">
                    {assignmentPreview.map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="p-3 text-slate-900 dark:text-white">{a.roll_number}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{a.name}</td>
                        <td className="p-3 text-indigo-500">
                          {a.questions.map((q: any) => q.question_title).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary text-sm"
              >
                Back
              </button>
              <button
                onClick={handleStartExam}
                disabled={loading}
                className="btn-primary !px-8 flex items-center gap-2 !bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:opacity-90"
              >
                {loading ? 'Starting...' : 'Start Practical Exam 🧪'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabSessionCreate;
