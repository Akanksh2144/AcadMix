import React from 'react';
import { BookOpen, Users, ChartBar, GraduationCap, SignOut, Database } from '@phosphor-icons/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-lg border border-slate-100">
        <p className="font-bold text-sm text-slate-800">{label}</p>
        {payload.map((p, i) => (<p key={i} className="text-sm font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = ({ navigate }) => {
  const stats = [
    { label: 'Total Students', value: '1,248', icon: Users, color: 'bg-indigo-50 text-indigo-500' },
    { label: 'Total Teachers', value: '89', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-500' },
    { label: 'Active Quizzes', value: '45', icon: ChartBar, color: 'bg-amber-50 text-amber-500' },
    { label: 'Departments', value: '8', icon: Database, color: 'bg-sky-50 text-sky-500' },
  ];
  const departmentPerformance = [
    { dept: 'CSE', avgScore: 85 }, { dept: 'ECE', avgScore: 82 }, { dept: 'MECH', avgScore: 78 }, { dept: 'CIVIL', avgScore: 80 },
  ];
  const enrollmentTrend = [
    { month: 'Aug', students: 1180 }, { month: 'Sep', students: 1200 }, { month: 'Oct', students: 1220 },
    { month: 'Nov', students: 1235 }, { month: 'Dec', students: 1240 }, { month: 'Jan', students: 1248 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><BookOpen size={22} weight="duotone" className="text-white" /></div>
              <div><h1 className="text-xl font-extrabold tracking-tight text-slate-900">QuizPortal</h1><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin</p></div>
            </div>
            <div className="flex items-center gap-3">
              <button data-testid="profile-button" className="btn-ghost !px-4 !py-2 text-sm">Admin Panel</button>
              <button data-testid="logout-button" onClick={() => navigate('login')} className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"><SignOut size={20} weight="duotone" /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">College Overview</h2>
          <p className="text-base font-medium text-slate-500">Manage your institution's academic platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="soft-card-hover p-6" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                  <div className={`${stat.color} p-2.5 rounded-xl`}><Icon size={20} weight="duotone" /></div>
                </div>
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <button data-testid="user-management-button" onClick={() => navigate('user-management')} className="soft-card-hover p-6 text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors"><Users size={24} weight="duotone" className="text-indigo-500" /></div>
            <div><p className="font-extrabold text-slate-900">User Management</p><p className="text-sm font-medium text-slate-400">Add/edit users</p></div>
          </button>
          <button data-testid="view-all-results-button" onClick={() => navigate('quiz-results')} className="soft-card-hover p-6 text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors"><ChartBar size={24} weight="duotone" className="text-emerald-500" /></div>
            <div><p className="font-extrabold text-slate-900">View All Results</p><p className="text-sm font-medium text-slate-400">College-wide data</p></div>
          </button>
          <button data-testid="analytics-button" onClick={() => navigate('analytics')} className="soft-card-hover p-6 text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors"><Database size={24} weight="duotone" className="text-amber-500" /></div>
            <div><p className="font-extrabold text-slate-900">Analytics</p><p className="text-sm font-medium text-slate-400">Insights & trends</p></div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Department Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="dept" stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                <Bar dataKey="avgScore" fill="#6366F1" radius={[8, 8, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Student Enrollment Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="students" stroke="#14B8A6" strokeWidth={3} dot={{ fill: '#14B8A6', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 soft-card p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[{ action: 'New quiz created', user: 'Dr. Sarah Johnson', time: '10 mins ago' },
                { action: '42 students completed quiz', user: 'DBMS - Normalization', time: '25 mins ago' },
                { action: 'Semester results uploaded', user: 'Admin', time: '1 hour ago' },
                { action: '8 new students added', user: 'Admin', time: '2 hours ago' }].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl" data-testid={`activity-${i}`}>
                  <div><p className="font-bold text-sm text-slate-800">{a.action}</p><p className="text-xs font-medium text-slate-400">{a.user}</p></div>
                  <span className="text-xs font-medium text-slate-400">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="soft-card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <h4 className="font-extrabold text-xl mb-3">This Month</h4>
              <div className="space-y-2 text-sm font-medium text-white/90">
                <p>125 quizzes conducted</p><p>1,248 active students</p><p>College avg: 82.5%</p><p>8 new faculty joined</p>
              </div>
            </div>
            <div className="soft-card p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <h4 className="font-extrabold text-xl mb-3">Top Department</h4>
              <p className="text-3xl font-extrabold mb-2">CSE</p>
              <p className="text-sm font-medium text-white/90">Average Score: 85%</p>
              <p className="text-sm font-medium text-white/90">320 Students</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
