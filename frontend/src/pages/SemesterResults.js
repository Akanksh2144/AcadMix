import React, { useState } from 'react';
import { ArrowLeft, Download, TrendUp, TrendDown } from '@phosphor-icons/react';

const SemesterResults = ({ navigate, userRole }) => {
  const [selectedSemester, setSelectedSemester] = useState(3);

  const semesterData = {
    3: {
      subjects: [
        { code: 'CS301', name: 'Database Management Systems', marks: 85, maxMarks: 100, grade: 'A+', attendance: 92 },
        { code: 'CS302', name: 'Operating Systems', marks: 78, maxMarks: 100, grade: 'A', attendance: 88 },
        { code: 'CS303', name: 'Computer Networks', marks: 82, maxMarks: 100, grade: 'A', attendance: 90 },
        { code: 'CS304', name: 'Software Engineering', marks: 88, maxMarks: 100, grade: 'A+', attendance: 95 },
        { code: 'MA301', name: 'Discrete Mathematics', marks: 75, maxMarks: 100, grade: 'B+', attendance: 85 },
      ],
      sgpa: 8.7, cgpa: 8.5, rank: 12, totalStudents: 120, status: 'Pass'
    }
  };

  const cgpaHistory = [{ sem: 1, cgpa: 8.2 }, { sem: 2, cgpa: 8.4 }, { sem: 3, cgpa: 8.5 }];
  const currentSem = semesterData[selectedSemester];
  const totalMarks = currentSem.subjects.reduce((sum, s) => sum + s.marks, 0);
  const maxTotalMarks = currentSem.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = ((totalMarks / maxTotalMarks) * 100).toFixed(2);

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-600';
    if (grade.startsWith('B')) return 'bg-amber-50 text-amber-600';
    return 'bg-rose-50 text-rose-600';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button data-testid="back-button" onClick={() => navigate(userRole === 'student' ? 'student-dashboard' : 'teacher-dashboard')}
                className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                <ArrowLeft size={22} weight="duotone" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Semester Results</h1>
                <p className="text-sm font-medium text-slate-400">Academic performance & grades</p>
              </div>
            </div>
            <button data-testid="download-report-button" className="btn-primary flex items-center gap-2 text-sm">
              <Download size={18} weight="duotone" /> Download Report
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Semester Selector */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Select Semester</label>
          <div className="bg-slate-100 rounded-full p-1 inline-flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <button key={sem} data-testid={`semester-${sem}-button`} onClick={() => setSelectedSemester(sem)} disabled={sem > 3}
                className={`pill-tab ${selectedSemester === sem ? 'pill-tab-active' : sem <= 3 ? 'pill-tab-inactive' : 'text-slate-300 cursor-not-allowed'}`}>
                Sem {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="soft-card p-5" data-testid="sgpa-card">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">SGPA</span>
            <p className="text-3xl font-extrabold text-slate-900">{currentSem.sgpa}</p>
          </div>
          <div className="soft-card p-5" data-testid="cgpa-card">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">CGPA</span>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-slate-900">{currentSem.cgpa}</p>
              <TrendUp size={20} weight="duotone" className="text-emerald-500" />
            </div>
          </div>
          <div className="soft-card p-5" data-testid="percentage-card">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">Percentage</span>
            <p className="text-3xl font-extrabold text-slate-900">{percentage}%</p>
          </div>
          <div className="soft-card p-5" data-testid="rank-card">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">Rank</span>
            <p className="text-3xl font-extrabold text-slate-900">#{currentSem.rank}</p>
          </div>
          <div className="soft-card p-5" data-testid="status-card">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">Status</span>
            <span className="soft-badge bg-emerald-50 text-emerald-600 text-base mt-1">{currentSem.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="soft-card p-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Subject-wise Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="subjects-table">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Subject</th>
                      <th className="text-center p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Marks</th>
                      <th className="text-center p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Grade</th>
                      <th className="text-center p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSem.subjects.map((subject, index) => (
                      <tr key={subject.code} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors rounded-2xl" data-testid={`subject-row-${index}`}>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{subject.name}</p>
                          <p className="text-sm font-medium text-slate-400">{subject.code}</p>
                        </td>
                        <td className="text-center p-4">
                          <p className="font-bold text-lg text-slate-900">{subject.marks}</p>
                          <p className="text-xs font-medium text-slate-400">/ {subject.maxMarks}</p>
                        </td>
                        <td className="text-center p-4">
                          <span className={`soft-badge ${getGradeColor(subject.grade)}`}>{subject.grade}</span>
                        </td>
                        <td className="text-center p-4"><p className="font-bold text-slate-700">{subject.attendance}%</p></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="soft-card p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">CGPA Progression</h3>
              <div className="space-y-4">
                {cgpaHistory.map((item) => (
                  <div key={item.sem} className="flex items-center justify-between" data-testid={`cgpa-history-sem-${item.sem}`}>
                    <span className="font-bold text-slate-700">Semester {item.sem}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-slate-900">{item.cgpa}</span>
                      {item.sem > 1 && item.cgpa > cgpaHistory[item.sem - 2].cgpa && <TrendUp size={16} weight="duotone" className="text-emerald-500" />}
                      {item.sem > 1 && item.cgpa < cgpaHistory[item.sem - 2].cgpa && <TrendDown size={16} weight="duotone" className="text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <h3 className="text-xl font-bold mb-3">Performance Summary</h3>
              <div className="space-y-2 text-sm font-medium text-white/90">
                <p>You scored above 80% in 4 subjects</p>
                <p>Attendance is excellent in all subjects</p>
                <p>You're in the top 10% of your batch</p>
                <p>CGPA improved by 0.1 this semester</p>
              </div>
            </div>

            <div className="soft-card p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Grade Distribution</h3>
              <div className="space-y-3">
                {[{ label: 'A+ Grades', count: 2, pct: 40, color: 'from-indigo-500 to-indigo-400' },
                  { label: 'A Grades', count: 2, pct: 40, color: 'from-teal-500 to-teal-400' },
                  { label: 'B+ Grades', count: 1, pct: 20, color: 'from-amber-500 to-amber-400' }].map((g, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-700">{g.label}</span>
                      <span className="text-sm font-bold text-slate-500">{g.count}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${g.color} rounded-full`} style={{ width: `${g.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemesterResults;
