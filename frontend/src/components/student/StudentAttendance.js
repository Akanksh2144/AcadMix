import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CaretLeft, CaretRight, Funnel, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';
import { studentAPI, attendanceAPI } from '../../services/api';
import Lottie from 'lottie-react';
import { searchEmptyAnimation } from '../../assets/lottieAnimations';

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: '#10b981' },
  od:      { label: 'OD',      color: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',   dot: '#f59e0b' },
  absent:  { label: 'Absent',  color: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-500/10',       dot: '#ef4444' },
  medical: { label: 'Medical', color: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10',     dot: '#3b82f6' },
  late:    { label: 'Late',    color: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-500/10', dot: '#f97316' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };

const StudentAttendance = () => {
  const [view, setView] = useState('calendar'); // calendar | subjects
  const [consolidated, setConsolidated] = useState([]);
  const [detail, setDetail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterSubject, setFilterSubject] = useState('');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [consRes, detailRes] = await Promise.all([
          attendanceAPI.getStudentConsolidated(),
          studentAPI.attendanceDetail({ month: month + 1, year }),
        ]);
        setConsolidated(consRes.data);
        setDetail(detailRes.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [month, year]);

  const subjects = useMemo(() => [...new Set(consolidated.map(c => c.subject_code))], [consolidated]);

  const overallPct = useMemo(() => {
    const tot = consolidated.reduce((s, c) => s + c.total_count, 0);
    const pres = consolidated.reduce((s, c) => s + c.present_count, 0);
    return tot > 0 ? Math.round(pres * 100 / tot) : 0;
  }, [consolidated]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
  }, [month, year]);

  // Map date -> dominant status for calendar colouring
  const dateStatusMap = useMemo(() => {
    const map = {};
    detail.forEach(r => {
      const day = parseInt(r.date.split('-')[2], 10);
      if (!map[day]) map[day] = [];
      map[day].push(r.status);
    });
    // Determine dominant: if any absent -> red, else if all present -> green, else mixed
    const result = {};
    Object.entries(map).forEach(([day, statuses]) => {
      const hasAbsent = statuses.includes('absent');
      const allPresent = statuses.every(s => s === 'present' || s === 'od');
      result[day] = hasAbsent ? 'absent' : allPresent ? 'present' : 'mixed';
    });
    return result;
  }, [detail]);

  const dayDetail = useMemo(() => {
    if (!selectedDay) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return detail.filter(r => r.date === dateStr);
  }, [selectedDay, detail, month, year]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

  const filteredConsolidated = filterSubject ? consolidated.filter(c => c.subject_code === filterSubject) : consolidated;

  const getPctColor = (pct) => pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const getPctBg = (pct) => pct >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10' : pct >= 65 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="soft-card p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* ── Summary Stats ───────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="soft-card p-4 sm:p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Overall</p>
          <p className={`text-3xl font-extrabold ${getPctColor(overallPct)}`}>{overallPct}%</p>
        </div>
        <div className="soft-card p-4 sm:p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Subjects</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{consolidated.length}</p>
        </div>
        <div className="soft-card p-4 sm:p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Classes</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{consolidated.reduce((s, c) => s + c.total_count, 0)}</p>
        </div>
        <div className="soft-card p-4 sm:p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">At Risk</p>
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{consolidated.filter(c => c.percentage < 75).length}</p>
        </div>
      </motion.div>

      {/* ── View Toggle ───────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-[#1A202C]/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1.5 shadow-sm">
          {[{ id: 'calendar', label: 'Calendar View', icon: Calendar }, { id: 'subjects', label: 'Subject Grid', icon: Funnel }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3.5 py-2 rounded-[14px] text-xs font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                view === v.id ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <v.icon size={14} weight="duotone" /> {v.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Calendar View ───────────────────────── */}
      {view === 'calendar' && (
        <motion.div variants={itemVariants} className="soft-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <CaretLeft size={20} weight="bold" className="text-slate-600 dark:text-slate-300" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <CaretRight size={20} weight="bold" className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const status = dateStatusMap[day];
              const isSelected = selectedDay === day;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              
              let cellBg = 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10';
              if (status === 'present') cellBg = 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20';
              else if (status === 'absent') cellBg = 'bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20';
              else if (status === 'mixed') cellBg = 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20';

              return (
                <button key={i} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-150 ${cellBg} ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-[#0B0F19]' : ''
                  } ${isToday ? 'border-2 border-indigo-400' : 'border border-transparent'}`}
                >
                  <span className={`${status === 'absent' ? 'text-red-700 dark:text-red-300' : status === 'present' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500"></span>Present</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-red-500"></span>Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-amber-500"></span>Mixed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md border-2 border-indigo-400"></span>Today</span>
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3">
                {selectedDay} {MONTHS[month]} {year} — Period Details
              </h4>
              {dayDetail.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No attendance data for this date.</p>
              ) : (
                <div className="space-y-2">
                  {dayDetail.map((r, i) => {
                    const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.absent;
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                          <span className="text-white text-xs font-extrabold">P{r.period_no}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{r.subject_name || r.subject_code}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{r.start_time} – {r.end_time}</p>
                        </div>
                        <span className={`text-xs font-extrabold uppercase ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── Subject Grid View ───────────────────────── */}
      {view === 'subjects' && (
        <motion.div variants={itemVariants}>
          {filteredConsolidated.length === 0 ? (
            <div className="soft-card p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-3"><Lottie animationData={searchEmptyAnimation} loop autoplay /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConsolidated.map((subj, i) => {
                const pct = subj.percentage;
                const barWidth = Math.max(pct, 3);
                return (
                  <motion.div key={i} variants={itemVariants} className="soft-card p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{subj.subject_code}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{subj.present_count} / {subj.total_count} classes</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-extrabold ${getPctBg(pct)} ${getPctColor(pct)}`}>
                        {pct}%
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                        className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                      />
                    </div>
                    {pct < 75 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600 dark:text-red-400">
                        <Warning size={12} weight="fill" /> Below 75% threshold
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default StudentAttendance;
