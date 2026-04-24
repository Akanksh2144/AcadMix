import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Student, BookOpen, Briefcase, IdentificationCard, Warning, CheckCircle, ArrowClockwise, Database } from '@phosphor-icons/react';
import { accreditationAPI, formatApiError } from '../../services/api';

interface NEPMetrics {
  abc_coverage_pct: number;
  mooc_enrollment_pct: number;
  multidisciplinary_pct: number;
  enrollment_status_breakdown: {
    active: number;
    academic_break: number;
    dropped_out: number;
    graduated: number;
  };
  total_students: number;
}

interface NEPTrackerProps {
  viewMode: 'principal' | 'nodal';
  collegeId?: string;
}

const NEPTracker: React.FC<NEPTrackerProps> = ({ viewMode, collegeId }) => {
  const [metrics, setMetrics] = useState<NEPMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!collegeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await accreditationAPI.getNEPStatus(collegeId);
      setMetrics(res.data || res);
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [collegeId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex flex-col items-center text-center space-y-3">
        <Warning size={32} weight="duotone" className="text-red-500" />
        <div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Failed to load NEP Status</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowClockwise size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!metrics || metrics.total_students === 0) {
    return (
      <div className="p-12 soft-card flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
          <Database size={32} weight="duotone" className="text-violet-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No NEP data available</h3>
          <p className="text-sm text-slate-500 mt-1">
            Student records must be present to calculate NEP 2020 compliance metrics.
          </p>
        </div>
      </div>
    );
  }

  const progressRings = [
    {
      label: 'ABC ID Coverage',
      value: metrics.abc_coverage_pct,
      icon: IdentificationCard,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500',
      trackColor: 'stroke-violet-100 dark:stroke-violet-500/20',
      ringColor: 'stroke-violet-500',
      desc: 'Students with Academic Bank of Credits ID',
      alert: metrics.abc_coverage_pct < 80 ? `${Math.round((1 - metrics.abc_coverage_pct / 100) * metrics.total_students)} students missing ABC IDs` : null,
    },
    {
      label: 'Multidisciplinary Enrollment',
      value: metrics.multidisciplinary_pct,
      icon: BookOpen,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500',
      trackColor: 'stroke-teal-100 dark:stroke-teal-500/20',
      ringColor: 'stroke-teal-500',
      desc: 'Students enrolled in cross-department electives',
      alert: metrics.multidisciplinary_pct < 30 ? 'Below NEP target of 30%' : null,
    },
    {
      label: 'MOOC/SWAYAM Adoption',
      value: metrics.mooc_enrollment_pct,
      icon: Briefcase,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
      trackColor: 'stroke-amber-100 dark:stroke-amber-500/20',
      ringColor: 'stroke-amber-500',
      desc: 'Students with NPTEL/SWAYAM credit equivalence',
      alert: metrics.mooc_enrollment_pct < 15 ? 'Low adoption — consider awareness campaigns' : null,
    },
  ];

  const statusBreakdown = [
    { label: 'Active', value: metrics.enrollment_status_breakdown.active, color: 'bg-emerald-500' },
    { label: 'Academic Break', value: metrics.enrollment_status_breakdown.academic_break, color: 'bg-amber-500' },
    { label: 'Dropped Out', value: metrics.enrollment_status_breakdown.dropped_out, color: 'bg-red-500' },
    { label: 'Graduated', value: metrics.enrollment_status_breakdown.graduated, color: 'bg-blue-500' },
  ];

  const totalEnrollment = Object.values(metrics.enrollment_status_breakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Student size={24} weight="duotone" className="text-violet-500" />
          NEP 2020 Compliance Tracker
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {viewMode === 'principal' ? 'Institutional NEP adoption trends' : 'Student-level compliance gaps'}
        </p>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {progressRings.map((ring, i) => {
          const Icon = ring.icon;
          const circumference = 2 * Math.PI * 45;
          const offset = circumference - (ring.value / 100) * circumference;

          return (
            <motion.div
              key={ring.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="soft-card p-6 text-center"
            >
              <div className="relative w-28 h-28 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className={ring.trackColor} />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" strokeWidth="6"
                    strokeLinecap="round"
                    className={ring.ringColor}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 1, ease: 'easeOut' }}
                    style={{ strokeDasharray: circumference }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black ${ring.color}`}>{Math.round(ring.value)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon size={16} weight="duotone" className={ring.color} />
                <p className="text-sm font-bold text-slate-800 dark:text-white">{ring.label}</p>
              </div>
              <p className="text-xs text-slate-400">{ring.desc}</p>

              {/* Nodal-specific alerts */}
              {viewMode === 'nodal' && ring.alert && (
                <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                  <Warning size={12} weight="fill" className="text-amber-500 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">{ring.alert}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Enrollment Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="soft-card p-6"
      >
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Enrollment Status (Multiple Entry/Exit)
        </h3>

        {/* Stacked Bar */}
        <div className="h-4 rounded-full overflow-hidden flex mb-4">
          {statusBreakdown.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${(s.value / totalEnrollment) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
              className={`${s.color} first:rounded-l-full last:rounded-r-full`}
              title={`${s.label}: ${s.value}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusBreakdown.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NEPTracker;
