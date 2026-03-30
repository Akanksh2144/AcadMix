import React from 'react';
import { ArrowLeft, TrendUp, Target, BookOpen, CheckCircle } from '@phosphor-icons/react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-lg border border-slate-100">
        <p className="font-bold text-sm text-slate-800">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = ({ navigate, userRole }) => {
  const performanceTrend = [
    { month: 'Aug', quizScore: 75, cgpa: 8.2 }, { month: 'Sep', quizScore: 82, cgpa: 8.3 },
    { month: 'Oct', quizScore: 85, cgpa: 8.4 }, { month: 'Nov', quizScore: 88, cgpa: 8.5 },
    { month: 'Dec', quizScore: 86, cgpa: 8.5 }, { month: 'Jan', quizScore: 90, cgpa: 8.7 },
  ];
  const subjectComparison = [
    { subject: 'DBMS', quizAvg: 84, semesterMarks: 85 }, { subject: 'OS', quizAvg: 82, semesterMarks: 78 },
    { subject: 'Networks', quizAvg: 88, semesterMarks: 82 }, { subject: 'SE', quizAvg: 86, semesterMarks: 88 },
  ];
  const strengthsWeaknesses = [
    { category: 'Problem Solving', score: 92 }, { category: 'Theory', score: 85 }, { category: 'Coding', score: 88 },
    { category: 'SQL', score: 90 }, { category: 'Networking', score: 78 },
  ];
  const questionTypeAccuracy = [
    { name: 'MCQ', value: 87 }, { name: 'True/False', value: 92 }, { name: 'Short Answer', value: 82 }, { name: 'Coding', value: 85 },
  ];
  const COLORS = ['#6366F1', '#14B8A6', '#F59E0B', '#EC4899'];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button data-testid="back-button" onClick={() => navigate(userRole === 'student' ? 'student-dashboard' : 'teacher-dashboard')}
              className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft size={22} weight="duotone" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Performance Analytics</h1>
              <p className="text-sm font-medium text-slate-400">Comprehensive academic insights</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Overall Score', value: '86.5%', sub: '+4.2% from last month', icon: Target, color: 'bg-indigo-50 text-indigo-500', subColor: 'text-emerald-500' },
            { label: 'Quiz Completion', value: '96%', sub: '24 out of 25 quizzes', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-500' },
            { label: 'Study Hours', value: '142h', sub: 'This semester', icon: BookOpen, color: 'bg-sky-50 text-sky-500' },
            { label: 'Improvement', value: '+15%', sub: 'Since start of sem', icon: TrendUp, color: 'bg-amber-50 text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="soft-card p-6" data-testid={`${stat.label.toLowerCase().replace(/\s+/g, '-')}-metric`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                <div className={`${stat.color} p-2 rounded-xl`}><stat.icon size={18} weight="duotone" /></div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
              <p className={`text-sm font-medium mt-1 ${stat.subColor || 'text-slate-400'}`}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                <Line type="monotone" dataKey="quizScore" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 5 }} name="Quiz Score" />
                <Line type="monotone" dataKey="cgpa" stroke="#14B8A6" strokeWidth={3} dot={{ fill: '#14B8A6', r: 5 }} name="CGPA (x10)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Quiz vs Semester Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="subject" stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                <Bar dataKey="quizAvg" fill="#6366F1" radius={[8, 8, 0, 0]} name="Quiz Average" />
                <Bar dataKey="semesterMarks" fill="#14B8A6" radius={[8, 8, 0, 0]} name="Semester Marks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Skills Radar</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={strengthsWeaknesses}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="category" stroke="#64748B" style={{ fontWeight: 'bold', fontSize: '11px' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#CBD5E1" />
                <Radar name="Score" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Question Type Accuracy</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={questionTypeAccuracy} cx="50%" cy="50%" labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`} outerRadius={120} dataKey="value" strokeWidth={0}>
                  {questionTypeAccuracy.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="soft-card p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <h4 className="text-lg font-bold mb-3">Strengths</h4>
            <ul className="space-y-2 text-sm font-medium text-white/90">
              <li>Excellent at problem-solving questions (92%)</li>
              <li>Strong SQL and database concepts</li>
              <li>Consistent improvement trend</li>
            </ul>
          </div>
          <div className="soft-card p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <h4 className="text-lg font-bold mb-3">Areas to Improve</h4>
            <ul className="space-y-2 text-sm font-medium text-white/90">
              <li>Focus more on networking concepts</li>
              <li>Practice more short answer questions</li>
              <li>Review OS process management</li>
            </ul>
          </div>
          <div className="soft-card p-6 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
            <h4 className="text-lg font-bold mb-3">Recommendations</h4>
            <ul className="space-y-2 text-sm font-medium text-white/90">
              <li>Take practice quizzes on weak topics</li>
              <li>Aim for 90%+ in next 3 quizzes</li>
              <li>Join study group for networking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
