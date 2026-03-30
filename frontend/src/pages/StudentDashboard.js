import React from 'react';
import { Clock, Trophy, ChartLine, Fire, BookOpen, Calendar, Target, SignOut } from '@phosphor-icons/react';
import Marquee from 'react-fast-marquee';

const StudentDashboard = ({ navigate }) => {
  const upcomingQuizzes = [
    { id: 1, title: 'Data Structures - Arrays & Linked Lists', subject: 'Computer Science', date: '2024-01-28', time: '10:00 AM', duration: 60, marks: 50 },
    { id: 2, title: 'Thermodynamics Mid-Term', subject: 'Physics', date: '2024-01-29', time: '2:00 PM', duration: 90, marks: 75 },
    { id: 3, title: 'Calculus - Integration Techniques', subject: 'Mathematics', date: '2024-01-30', time: '11:00 AM', duration: 45, marks: 40 },
  ];

  const recentResults = [
    { id: 1, title: 'DBMS Quiz - Normalization', score: 42, total: 50, percentage: 84, date: '2024-01-20' },
    { id: 2, title: 'Operating Systems - Process Management', score: 38, total: 45, percentage: 84.4, date: '2024-01-18' },
    { id: 3, title: 'Algorithms - Sorting Techniques', score: 45, total: 50, percentage: 90, date: '2024-01-15' },
  ];

  const stats = [
    { label: 'CGPA', value: '8.7', icon: Trophy, color: 'bg-amber-50 text-amber-600' },
    { label: 'Avg Quiz Score', value: '86%', icon: Target, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Quizzes Taken', value: '24', icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Current Rank', value: '#12', icon: Fire, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <BookOpen size={22} weight="duotone" className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">QuizPortal</h1>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Student</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button data-testid="profile-button" className="btn-ghost !px-4 !py-2 text-sm">
                Rajesh Kumar
              </button>
              <button data-testid="logout-button" onClick={() => navigate('login')} className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                <SignOut size={20} weight="duotone" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Announcement Ticker */}
      <div className="bg-indigo-500 text-white py-2">
        <Marquee gradient={false} speed={50}>
          <span className="mx-8 font-bold text-sm">New Quiz Available: Operating Systems - Deadlock Prevention</span>
          <span className="mx-8 font-bold text-sm">Congratulations! You're in the Top 20 this semester!</span>
          <span className="mx-8 font-bold text-sm">Semester Results for BE-3rd Sem are now live</span>
          <span className="mx-8 font-bold text-sm">Quiz Reminder: Data Structures quiz starts in 2 hours</span>
        </Marquee>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome Back, Rajesh!</h2>
          <p className="text-base font-medium text-slate-500">Here's what's happening with your academics today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="soft-card-hover p-6" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                  <div className={`${stat.color} p-2.5 rounded-xl`}>
                    <Icon size={20} weight="duotone" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <button data-testid="view-all-quizzes-button" onClick={() => navigate('quiz-results')}
            className="soft-card-hover p-6 text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <BookOpen size={24} weight="duotone" className="text-indigo-500" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">My Quizzes</p>
              <p className="text-sm font-medium text-slate-400">View all attempts</p>
            </div>
          </button>
          <button data-testid="view-semester-results-button" onClick={() => navigate('semester-results')}
            className="soft-card-hover p-6 text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <Calendar size={24} weight="duotone" className="text-teal-500" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">Semester Results</p>
              <p className="text-sm font-medium text-slate-400">Check your grades</p>
            </div>
          </button>
          <button data-testid="view-analytics-button" onClick={() => navigate('analytics')}
            className="soft-card-hover p-6 text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ChartLine size={24} weight="duotone" className="text-amber-500" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">Analytics</p>
              <p className="text-sm font-medium text-slate-400">Track performance</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Quizzes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold tracking-tight text-slate-800">Upcoming Quizzes</h3>
              <span className="soft-badge bg-indigo-50 text-indigo-600">{upcomingQuizzes.length} Active</span>
            </div>
            <div className="space-y-4">
              {upcomingQuizzes.map((quiz) => (
                <div key={quiz.id} className="soft-card-hover p-6" data-testid={`upcoming-quiz-${quiz.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-1">{quiz.title}</h4>
                      <p className="text-sm font-medium text-slate-400">{quiz.subject}</p>
                    </div>
                    <span className="soft-badge bg-amber-50 text-amber-600">{quiz.marks} marks</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={15} weight="duotone" />
                      <span>{quiz.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={15} weight="duotone" />
                      <span>{quiz.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={15} weight="duotone" />
                      <span>{quiz.duration} min</span>
                    </div>
                  </div>
                  <button data-testid={`start-quiz-${quiz.id}`} onClick={() => navigate('quiz-attempt', quiz)} className="btn-primary w-full text-sm">
                    Start Quiz
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold tracking-tight text-slate-800">Recent Results</h3>
              <button data-testid="view-all-results-button" onClick={() => navigate('quiz-results')} className="text-sm font-bold text-indigo-500 hover:text-indigo-600">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentResults.map((result) => (
                <div key={result.id} className="soft-card-hover p-6" data-testid={`recent-result-${result.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-1">{result.title}</h4>
                      <p className="text-sm font-medium text-slate-400">{result.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-slate-900">{result.percentage}%</p>
                      <p className="text-xs font-medium text-slate-400">{result.score}/{result.total}</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${result.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard Teaser */}
            <div className="mt-6 soft-card-hover p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Trophy size={32} weight="duotone" />
                <div>
                  <h4 className="font-extrabold text-xl">You're Rank #12</h4>
                  <p className="text-sm font-medium text-white/70">in your batch</p>
                </div>
              </div>
              <button data-testid="view-leaderboard-button" onClick={() => navigate('leaderboard')} className="w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-bold text-sm hover:bg-white/30 transition-colors">
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
