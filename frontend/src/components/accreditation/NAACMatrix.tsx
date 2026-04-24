import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { ShieldCheck, Upload, Lock, Warning, CheckCircle } from '@phosphor-icons/react';

interface NAACCriterion {
  number: number;
  name: string;
  score: number | null;
  max_score: number;
  evidence_count: number;
  snapshot_locked: boolean;
}

interface NAACMatrixProps {
  viewMode: 'principal' | 'nodal';
  collegeId?: string;
}

const CRITERIA_LABELS: Record<number, string> = {
  1: 'Curricular Aspects',
  2: 'Teaching-Learning',
  3: 'Research & Innovation',
  4: 'Infrastructure',
  5: 'Student Support',
  6: 'Governance',
  7: 'Institutional Values',
};

const NAACMatrix: React.FC<NAACMatrixProps> = ({ viewMode, collegeId }) => {
  const [criteria, setCriteria] = useState<NAACCriterion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for initial render — replace with API call to /api/accreditation/naac/summary
    const mockCriteria: NAACCriterion[] = Object.entries(CRITERIA_LABELS).map(([num, name]) => ({
      number: parseInt(num),
      name,
      score: Math.random() > 0.15 ? Math.round((2 + Math.random() * 2) * 100) / 100 : null,
      max_score: 4.0,
      evidence_count: Math.floor(Math.random() * 15),
      snapshot_locked: Math.random() > 0.6,
    }));
    setCriteria(mockCriteria);
    setLoading(false);
  }, [collegeId]);

  const radarData = criteria.map(c => ({
    criterion: `C${c.number}`,
    fullName: c.name,
    score: c.score ?? 0,
    fullMark: c.max_score,
  }));

  const overallScore = criteria.filter(c => c.score !== null).length > 0
    ? (criteria.reduce((sum, c) => sum + (c.score ?? 0), 0) / criteria.filter(c => c.score !== null).length).toFixed(2)
    : '—';

  const getScoreColor = (score: number | null, max: number) => {
    if (score === null) return 'text-slate-400';
    const pct = score / max;
    if (pct >= 0.75) return 'text-emerald-500';
    if (pct >= 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarWidth = (score: number | null, max: number) => {
    if (score === null) return '0%';
    return `${(score / max) * 100}%`;
  };

  const getBarColor = (score: number | null, max: number) => {
    if (score === null) return 'bg-slate-200 dark:bg-slate-700';
    const pct = score / max;
    if (pct >= 0.75) return 'bg-emerald-500';
    if (pct >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={24} weight="duotone" className="text-indigo-500" />
            NAAC Quality Assessment
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {viewMode === 'principal' ? 'Year-over-Year Criterion Health' : 'Actionable Criterion Breakdown'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">CGPA</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{overallScore}</span>
          <span className="text-xs text-indigo-400">/4.0</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="soft-card p-6"
        >
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Criterion Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="criterion"
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 4]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-xl border border-slate-100 dark:border-white/10">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{d.fullName}</p>
                          <p className="text-xs text-slate-500">{d.score} / {d.fullMark}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Criterion Cards */}
        <div className="space-y-3">
          {criteria.map((c, i) => (
            <motion.div
              key={c.number}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="soft-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {c.number}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">
                      {c.evidence_count} evidence{c.evidence_count !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.snapshot_locked ? (
                    <Lock size={14} weight="fill" className="text-emerald-500" />
                  ) : (
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Upload Evidence">
                      <Upload size={14} className="text-slate-400" />
                    </button>
                  )}
                  <span className={`text-lg font-black ${getScoreColor(c.score, c.max_score)}`}>
                    {c.score !== null ? c.score.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: getBarWidth(c.score, c.max_score) }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getBarColor(c.score, c.max_score)}`}
                />
              </div>

              {/* Nodal-specific missing data alerts */}
              {viewMode === 'nodal' && c.score === null && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Warning size={12} weight="fill" />
                  <span>No data available — action required</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NAACMatrix;
