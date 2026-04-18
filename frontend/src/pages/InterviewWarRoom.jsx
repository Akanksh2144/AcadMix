import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Brain, FileText, Clock, Trophy, ArrowRight, Lightning, Target, ChartLineUp, Microphone, Sparkle, Upload, CaretRight, Medal, Fire, Star, Users, Toolbox } from '@phosphor-icons/react';
import { interviewAPI, resumeAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
const cardHover = { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } };

// ─── AI Interview Setup Tab ──────────────────────────────────────────────────

const AIInterviewTab = ({ navigate, quota, readiness }) => {
  const [interviewType, setInterviewType] = useState('technical');
  const [targetRole, setTargetRole] = useState('Software Developer');
  const [targetCompany, setTargetCompany] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');

  const types = [
    { id: 'technical', label: 'Technical', icon: Brain, desc: 'DSA, OS, DBMS, OOP' },
    { id: 'hr', label: 'HR', icon: Users, desc: 'Behavioral & soft skills' },
    { id: 'behavioral', label: 'Behavioral', icon: Star, desc: 'STAR method scenarios' },
    { id: 'mixed', label: 'Full Mock', icon: Lightning, desc: 'Complete interview round' },
  ];

  const companies = ['', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture', 'Google', 'Amazon', 'Microsoft', 'Other'];
  const roles = ['Software Developer', 'Data Analyst', 'System Design', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Full Stack Developer'];

  const handleStart = () => {
    if (!quota || quota.remaining <= 0) {
      toast.error('Monthly quota exhausted. Resets next month.');
      return;
    }
    navigate('ai-interview-session', {
      interview_type: interviewType,
      target_role: targetRole,
      target_company: targetCompany || undefined,
      difficulty,
    });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {/* Readiness Score Hero */}
      {readiness && readiness.total_interviews > 0 && (
        <motion.div variants={itemVariants} className="soft-card p-6 mb-6 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/5 dark:to-cyan-500/5 border-teal-200/50 dark:border-teal-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1">Interview Readiness</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">{readiness.readiness_score}</span>
                <span className="text-sm font-bold text-slate-400">/100</span>
              </div>
              {readiness.badge === 'interview_ready' && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <Medal size={12} weight="fill" /> Interview Ready
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">{readiness.total_interviews} sessions</p>
              <p className="text-sm font-medium text-slate-500">Avg: {readiness.avg_score}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quota Card */}
      <motion.div variants={itemVariants} className="soft-card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-500/15 rounded-xl flex items-center justify-center">
            <Microphone size={20} weight="duotone" className="text-teal-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Mock Interviews</p>
            <p className="text-xs font-medium text-slate-400">{quota?.month || 'This month'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: quota?.total || 5 }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < (quota?.used || 0) ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{quota?.remaining ?? 5} left</span>
        </div>
      </motion.div>

      {/* Interview Type Selection */}
      <motion.div variants={itemVariants} className="mb-6">
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-3">Interview Type</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {types.map(t => {
            const Icon = t.icon;
            return (
              <motion.button key={t.id} whileHover={cardHover} whileTap={{ scale: 0.97 }}
                onClick={() => setInterviewType(t.id)}
                className={`soft-card p-4 text-left transition-all ${interviewType === t.id ? 'ring-2 ring-teal-500 border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/10' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${interviewType === t.id ? 'bg-teal-100 dark:bg-teal-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon size={20} weight="duotone" className={interviewType === t.id ? 'text-teal-500' : 'text-slate-400'} />
                </div>
                <p className="font-bold text-sm text-slate-800 dark:text-white">{t.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Config Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Target Role</label>
          <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className="soft-input w-full text-sm">
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Company (Optional)</label>
          <select value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="soft-input w-full text-sm">
            {companies.map(c => <option key={c} value={c}>{c || '— General —'}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Difficulty</label>
          <div className="flex gap-2">
            {['beginner', 'intermediate', 'advanced'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${difficulty === d ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div variants={itemVariants}>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={!quota || quota.remaining <= 0}
          className="w-full py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
          <Sparkle size={24} weight="fill" />
          Start Ami Mock Interview
          <ArrowRight size={20} weight="bold" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ─── ATS Resume Scorer Tab (Moved to Career Toolkit) ───────────────────────

// ─── Interview History Tab ───────────────────────────────────────────────────

const HistoryTab = ({ navigate }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    interviewAPI.history().then(res => { setHistory(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton variant="content-list" />;

  const completed = history.filter(h => h.status === 'completed');
  const scoreData = completed.slice(0, 10).reverse().map((h, i) => ({
    name: `#${i + 1}`,
    score: h.overall_score || 0,
  }));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {/* Score Trend */}
      {scoreData.length >= 2 && (
        <motion.div variants={itemVariants} className="soft-card p-5 mb-6">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3">Score Trend</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreData}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-white dark:bg-[#1A202C] rounded-xl p-3 shadow-lg border border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-sm text-teal-600">{payload[0].value}%</p>
                  </div>
                ) : null} />
                <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} fill="url(#scoreFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <motion.div variants={itemVariants} className="soft-card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain size={28} weight="duotone" className="text-slate-400" />
          </div>
          <h4 className="font-bold text-lg text-slate-600 dark:text-slate-400 mb-1">No interviews yet</h4>
          <p className="text-sm text-slate-400">Complete your first Ami mock interview to see results here.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {history.map(h => (
            <motion.div key={h.id} variants={itemVariants} whileHover={{ x: 4 }}
              onClick={() => navigate('ai-interview-session', { viewId: h.id })}
              className="soft-card p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${h.status === 'completed' ? 'bg-teal-50 dark:bg-teal-500/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Brain size={18} weight="duotone" className={h.status === 'completed' ? 'text-teal-500' : 'text-slate-400'} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                    {h.interview_type?.charAt(0).toUpperCase() + h.interview_type?.slice(1)} — {h.target_role}
                    {h.target_company && <span className="text-slate-400"> @ {h.target_company}</span>}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {h.question_count} questions • {h.duration_seconds ? `${Math.floor(h.duration_seconds / 60)}m` : '—'} • {h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {h.overall_score != null && (
                  <span className={`text-lg font-extrabold ${h.overall_score >= 70 ? 'text-emerald-600' : h.overall_score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {Math.round(h.overall_score)}%
                  </span>
                )}
                <ArrowRight size={14} weight="bold" className="text-slate-300 group-hover:text-teal-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Prep Resources Tab ──────────────────────────────────────────────────────

const PrepTab = () => {
  const categories = [
    { title: 'Data Structures & Algorithms', desc: 'Arrays, Trees, Graphs, DP, Sorting', icon: Brain, color: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-500', tips: ['Practice 2-3 problems daily on LeetCode', 'Focus on time & space complexity analysis', 'Master common patterns: sliding window, two pointers, BFS/DFS'] },
    { title: 'System Design', desc: 'Architecture, scalability, trade-offs', icon: Target, color: 'bg-purple-50 dark:bg-purple-500/15 text-purple-500', tips: ['Learn to estimate capacity and throughput', 'Study common designs: URL shortener, chat system, feed', 'Practice drawing architecture diagrams'] },
    { title: 'HR & Behavioral', desc: 'STAR method, culture fit, motivation', icon: Users, color: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-500', tips: ['Prepare 5-6 STAR stories from projects/internships', 'Practice: "Tell me about yourself" (2 min version)', '"Why this company?" — Research the company beforehand'] },
    { title: 'Aptitude & Reasoning', desc: 'Quantitative, logical, verbal', icon: Lightning, color: 'bg-amber-50 dark:bg-amber-500/15 text-amber-500', tips: ['Practice speed math: percentages, averages, ratios', 'Solve 10 logical reasoning puzzles daily', 'Read comprehension passages to improve verbal'] },
  ];

  const starMethod = [
    { letter: 'S', word: 'Situation', desc: 'Set the scene. What was the context? When and where did it happen?' },
    { letter: 'T', word: 'Task', desc: 'What was your specific role? What was expected of you?' },
    { letter: 'A', word: 'Action', desc: 'What steps did you take? Be specific about YOUR contribution.' },
    { letter: 'R', word: 'Result', desc: 'What was the outcome? Quantify if possible. What did you learn?' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div key={i} variants={itemVariants} className="soft-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <Icon size={20} weight="duotone" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{cat.title}</h4>
                  <p className="text-xs text-slate-400">{cat.desc}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {cat.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CaretRight size={12} weight="bold" className="text-teal-500 mt-1 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </motion.div>

      {/* STAR Method Guide */}
      <motion.div variants={itemVariants} className="soft-card p-6">
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Star size={22} weight="fill" className="text-amber-500" /> STAR Method for Behavioral Questions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {starMethod.map((s, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-white font-extrabold text-lg">{s.letter}</div>
              <p className="font-extrabold text-sm text-slate-800 dark:text-white mb-1">{s.word}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main War Room Page ──────────────────────────────────────────────────────

const InterviewWarRoom = ({ navigate, user }) => {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('warroom_tab') || 'interview');
  const [quota, setQuota] = useState(null);
  const [readiness, setReadiness] = useState(null);

  useEffect(() => { sessionStorage.setItem('warroom_tab', activeTab); }, [activeTab]);
  useEffect(() => {
    interviewAPI.getQuota().then(res => setQuota(res.data)).catch(() => {});
    interviewAPI.readiness().then(res => setReadiness(res.data)).catch(() => {});
  }, []);

  const tabs = [
    { id: 'interview', label: 'Ami Interview', icon: Microphone },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'prep', label: 'Prep Hub', icon: Fire },
    { id: 'toolkit', label: 'Career Toolkit', icon: Toolbox },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader navigate={navigate} user={user} title="Interview War Room" subtitle="Powered by Ami" maxWidth="max-w-7xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-8 hide-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-teal-500/15 text-teal-600 dark:text-teal-300 shadow-sm dark:border-teal-500/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
                }`}>
                <Icon size={16} weight={activeTab === tab.id ? 'fill' : 'duotone'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'interview' && <AIInterviewTab key="interview" navigate={navigate} quota={quota} readiness={readiness} />}
          {activeTab === 'history' && <HistoryTab key="history" navigate={navigate} />}
          {activeTab === 'prep' && <PrepTab key="prep" />}
          {activeTab === 'toolkit' && (
            <motion.div key="toolkit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={itemVariants} className="soft-card p-8 sm:p-12 text-center bg-gradient-to-br from-teal-500/10 to-cyan-500/10 dark:from-teal-500/5 dark:to-cyan-500/5 border-teal-200/50 dark:border-teal-500/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Toolbox size={32} weight="duotone" className="text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Career Toolkit</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">8 AI-powered tools: Cover Letter Generator, JD Analyzer, Cold Email Drafter, Skill Gap Analyzer, HR Round Simulator, DSA Recommender, Career Path Explorer & Company Intel Cards.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('career-toolkit')}
                    className="px-8 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-teal-500/20 inline-flex items-center gap-2">
                    <Sparkle size={18} weight="fill" /> Open Career Toolkit <ArrowRight size={16} weight="bold" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterviewWarRoom;
