import React, { useState, useEffect } from 'react';
import { ArrowLeft, MagnifyingGlass, GraduationCap, Trophy, BookOpen, ChartLine, Target } from '@phosphor-icons/react';
import { studentsAPI } from '../services/api';

const StudentProfileView = ({ studentId, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await studentsAPI.profile(studentId);
        setProfile(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!profile) return <div className="soft-card p-8 text-center"><p className="text-slate-400">Student not found</p></div>;

  const { student, semesters, quiz_attempts, mid_marks } = profile;
  const latestCgpa = semesters.length > 0 ? semesters[semesters.length - 1].cgpa : null;

  return (
    <div data-testid="student-profile-view">
      {/* Back + Header */}
      <button data-testid="profile-back-button" onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft size={18} weight="duotone" /> Back to search
      </button>

      {/* Student Info Card */}
      <div className="soft-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold">
              {student.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900" data-testid="profile-student-name">{student.name}</h3>
              <p className="text-sm font-medium text-slate-500">{student.college_id} &bull; {student.department || '-'} &bull; Batch {student.batch || '-'} Sec {student.section || '-'}</p>
            </div>
          </div>
          {latestCgpa && (
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">CGPA</p>
              <p className="text-3xl font-extrabold text-indigo-600">{latestCgpa.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="soft-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={16} weight="duotone" className="text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Semesters</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{semesters.length}</p>
        </div>
        <div className="soft-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} weight="duotone" className="text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Latest SGPA</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{semesters.length > 0 ? semesters[semesters.length - 1].sgpa?.toFixed(2) : '-'}</p>
        </div>
        <div className="soft-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} weight="duotone" className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Quizzes</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{quiz_attempts.length}</p>
        </div>
        <div className="soft-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} weight="duotone" className="text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Mid-terms</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{mid_marks.length}</p>
        </div>
      </div>

      {/* Semester Results */}
      {semesters.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-bold text-slate-800 mb-4">Semester Results</h4>
          <div className="space-y-4">
            {semesters.map((sem, i) => (
              <div key={i} className="soft-card p-5" data-testid={`semester-result-${sem.semester}`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-lg font-bold text-slate-800">Semester {sem.semester}</h5>
                  <div className="flex gap-3">
                    <span className="soft-badge bg-indigo-50 text-indigo-600">SGPA: {sem.sgpa?.toFixed(2)}</span>
                    <span className="soft-badge bg-emerald-50 text-emerald-600">CGPA: {sem.cgpa?.toFixed(2)}</span>
                  </div>
                </div>
                {sem.subjects && sem.subjects.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs uppercase tracking-widest">Code</th>
                          <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs uppercase tracking-widest">Subject</th>
                          <th className="text-center py-2 px-3 font-bold text-slate-500 text-xs uppercase tracking-widest">Credits</th>
                          <th className="text-center py-2 px-3 font-bold text-slate-500 text-xs uppercase tracking-widest">Grade</th>
                          <th className="text-center py-2 px-3 font-bold text-slate-500 text-xs uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.subjects.map((sub, j) => (
                          <tr key={j} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-slate-600">{sub.code}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{sub.name}</td>
                            <td className="py-2 px-3 text-center font-medium text-slate-600">{sub.credits}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`soft-badge ${sub.grade === 'O' ? 'bg-emerald-50 text-emerald-600' : sub.grade === 'A+' ? 'bg-indigo-50 text-indigo-600' : sub.grade === 'A' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`text-xs font-bold ${sub.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>{sub.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mid-term Marks */}
      {mid_marks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xl font-bold text-slate-800 mb-4">Mid-term Marks</h4>
          <div className="soft-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Subject</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Exam</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Marks</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {mid_marks.map((m, i) => {
                  const pct = m.max_marks > 0 ? ((m.marks / m.max_marks) * 100).toFixed(1) : '-';
                  return (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{m.subject_name} ({m.subject_code})</td>
                      <td className="py-2.5 px-4 text-center"><span className="soft-badge bg-slate-100 text-slate-600">{m.exam_type?.toUpperCase()}</span></td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">{m.marks ?? '-'} / {m.max_marks}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-sm font-bold ${parseFloat(pct) >= 60 ? 'text-emerald-600' : parseFloat(pct) >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quiz Attempts */}
      {quiz_attempts.length > 0 && (
        <div>
          <h4 className="text-xl font-bold text-slate-800 mb-4">Recent Quiz Attempts</h4>
          <div className="soft-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Quiz</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Score</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {quiz_attempts.map((a, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2.5 px-4 font-medium text-slate-800">{a.quiz_title}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-900">{a.score} / {a.total}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-sm font-bold ${a.percentage >= 60 ? 'text-emerald-600' : a.percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {a.percentage?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {semesters.length === 0 && mid_marks.length === 0 && quiz_attempts.length === 0 && (
        <div className="soft-card p-8 text-center">
          <p className="text-slate-400 font-medium">No academic records found for this student.</p>
        </div>
      )}
    </div>
  );
};

const StudentResultsSearch = ({ user, departmentLocked }) => {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    // Load all students initially
    const init = async () => {
      setLoading(true);
      try {
        const { data } = await studentsAPI.search('', departmentLocked ? undefined : undefined);
        setStudents(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    init();
  }, []);

  const handleSearch = async (value) => {
    setSearch(value);
    setLoading(true);
    try {
      const { data } = await studentsAPI.search(value);
      setStudents(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (selectedStudent) {
    return <StudentProfileView studentId={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <div data-testid="student-results-search">
      <h3 className="text-2xl font-bold text-slate-800 mb-2">Student Results</h3>
      <p className="text-sm text-slate-500 mb-6">
        {departmentLocked ? `Showing students in ${user?.department || 'your'} department` : 'Search across all departments'}
      </p>

      {/* Search Bar */}
      <div className="relative mb-6">
        <MagnifyingGlass size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input data-testid="student-results-search-input" type="text" value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or college ID..."
          className="soft-input w-full pl-12" />
      </div>

      {/* Student List */}
      <div className="soft-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">College ID</th>
              <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Name</th>
              <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Department</th>
              <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Batch / Sec</th>
              <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors" data-testid={`result-student-${s.college_id}`}>
                <td className="py-3 px-4 font-bold text-indigo-600">{s.college_id}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{s.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{s.department || '-'}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{s.batch || '-'} / {s.section || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <button data-testid={`view-profile-${s.college_id}`} onClick={() => setSelectedStudent(s.id)}
                    className="btn-primary !px-4 !py-1.5 text-xs">
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-slate-400 font-medium">{loading ? 'Searching...' : 'No students found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { StudentProfileView, StudentResultsSearch };
