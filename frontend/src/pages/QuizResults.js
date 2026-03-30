import React from 'react';
import { Trophy, Clock, CheckCircle, XCircle, Target, ArrowLeft } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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

const QuizResults = ({ navigate, userRole }) => {
  const attemptedQuizzes = [
    { id: 1, title: 'DBMS - Normalization', subject: 'Computer Science', score: 42, total: 50, percentage: 84, timeTaken: 35, date: '2024-01-20', rank: 8 },
    { id: 2, title: 'Operating Systems - Process Management', subject: 'Computer Science', score: 38, total: 45, percentage: 84.4, timeTaken: 40, date: '2024-01-18', rank: 12 },
    { id: 3, title: 'Algorithms - Sorting', subject: 'Computer Science', score: 45, total: 50, percentage: 90, timeTaken: 42, date: '2024-01-15', rank: 3 },
    { id: 4, title: 'Data Structures - Trees', subject: 'Computer Science', score: 38, total: 50, percentage: 76, timeTaken: 48, date: '2024-01-10', rank: 15 },
  ];

  const trendData = [
    { date: 'Jan 10', score: 76 },
    { date: 'Jan 15', score: 90 },
    { date: 'Jan 18', score: 84.4 },
    { date: 'Jan 20', score: 84 },
  ];

  const topicAccuracy = [
    { topic: 'Arrays', accuracy: 92 },
    { topic: 'Trees', accuracy: 78 },
    { topic: 'Sorting', accuracy: 95 },
    { topic: 'Graphs', accuracy: 68 },
  ];

  const averageScore = (attemptedQuizzes.reduce((sum, q) => sum + q.percentage, 0) / attemptedQuizzes.length).toFixed(1);

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
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Quiz Results</h1>
              <p className="text-sm font-medium text-slate-400">Your performance overview</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Quizzes', value: attemptedQuizzes.length, icon: Target, color: 'bg-indigo-50 text-indigo-500' },
            { label: 'Avg Score', value: `${averageScore}%`, icon: Trophy, color: 'bg-amber-50 text-amber-500' },
            { label: 'Best Score', value: '90%', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-500' },
            { label: 'Avg Time', value: '41m', icon: Clock, color: 'bg-sky-50 text-sky-500' },
          ].map((stat, i) => (
            <div key={i} className="soft-card p-6" data-testid={`${stat.label.toLowerCase().replace(/\s+/g, '-')}-stat`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                <div className={`${stat.color} p-2 rounded-xl`}><stat.icon size={18} weight="duotone" /></div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', r: 5, strokeWidth: 0 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Topic-wise Accuracy</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="topic" stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" fill="#6366F1" radius={[8, 8, 0, 0]} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="soft-card p-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">All Quiz Attempts</h3>
          <div className="space-y-4">
            {attemptedQuizzes.map((quiz) => (
              <div key={quiz.id} className="soft-card-hover p-6" data-testid={`quiz-result-${quiz.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{quiz.title}</h4>
                    <p className="text-sm font-medium text-slate-400">{quiz.subject} &bull; {quiz.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-slate-900">{quiz.percentage}%</p>
                      <p className="text-xs font-medium text-slate-400">{quiz.score}/{quiz.total} marks</p>
                    </div>
                    <span className="soft-badge bg-amber-50 text-amber-600">Rank #{quiz.rank}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Clock size={16} weight="duotone" /><span>{quiz.timeTaken} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <CheckCircle size={16} weight="duotone" /><span>{Math.round(quiz.score / quiz.total * 20)} Correct</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                    <XCircle size={16} weight="duotone" /><span>{20 - Math.round(quiz.score / quiz.total * 20)} Wrong</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full" style={{ width: `${quiz.percentage}%` }}></div>
                </div>
                <button data-testid={`view-review-${quiz.id}`} className="btn-secondary !px-4 !py-2 text-sm">View Answer Review</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
