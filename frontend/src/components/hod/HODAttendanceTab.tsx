import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { attendanceAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt, 
  Calendar, 
  FileArrowUp, 
  Check, 
  Warning, 
  ArrowsClockwise,
  Fingerprint
} from '@phosphor-icons/react';

const HODAttendanceTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('defaulters'); // 'defaulters' or 'staff'
  const [defaulters, setDefaulters] = useState([]);
  const [staffSummary, setStaffSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(75.0);
  const [date, setDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [sendingAlerts, setSendingAlerts] = useState(false);

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getHodDefaulters("", threshold);
      setDefaulters(res.data || []);
    } catch (err) {
      toast.error('Failed to load attendance defaulters');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffSummary = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getDailyStaffSummary({ date });
      setStaffSummary(res.data || []);
    } catch (err) {
      toast.error('Failed to load daily staff logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'defaulters') {
      fetchDefaulters();
    } else {
      fetchStaffSummary();
    }
  }, [activeSubTab, date]);

  const triggerAlerts = async () => {
    if (defaulters.length === 0) {
      toast.info('No defaulters found below the threshold.');
      return;
    }
    try {
      setSendingAlerts(true);
      const res = await attendanceAPI.sendDefaulterAlerts({ threshold });
      toast.success(res.data?.message || `Successfully sent alerts to parents.`);
      fetchDefaulters();
    } catch (err) {
      toast.error('Failed to send attendance warnings');
    } finally {
      setSendingAlerts(false);
    }
  };

  const markManualPunch = async (employeeCode: string) => {
    try {
      const nowStr = new Date().toISOString();
      const payload = {
        identifier: employeeCode,
        timestamp: nowStr,
        source: 'manual',
        remarks: 'HOD Manual Override'
      };
      const res = await attendanceAPI.recordDailyPunch(payload);
      toast.success(res.data?.message || 'Manual punch recorded successfully');
      fetchStaffSummary();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record manual punch');
    }
  };

  const calculateNeededClasses = (present: number, total: number) => {
    const factor = threshold / 100.0;
    if (factor >= 1.0) return total - present;
    const numerator = (factor * total) - present;
    const denominator = 1.0 - factor;
    return Math.max(0, Math.ceil(numerator / denominator));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Fingerprint size={24} className="text-slate-800 dark:text-slate-100" />
            Attendance Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track student attendance compliance and staff daily check-in logs.
          </p>
        </div>

        {/* Sub-tabs menu inside the container */}
        <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200/50 dark:border-white/[0.06] w-fit">
          <button
            onClick={() => setActiveSubTab('defaulters')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'defaulters'
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Student Defaulters
          </button>
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'staff'
                ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Staff Daily Logs
          </button>
        </div>
      </div>

      {activeSubTab === 'defaulters' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Defaulter Threshold:</span>
              <input
                type="number"
                min="50"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 75)}
                className="w-16 px-2 py-1 bg-slate-55 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-center font-bold text-gray-900 dark:text-white"
              />
              <span className="text-sm font-bold text-gray-900 dark:text-white">%</span>
              <button
                onClick={fetchDefaulters}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 rounded-lg transition-all"
                title="Refresh Defaulters List"
              >
                <ArrowsClockwise size={18} />
              </button>
            </div>

            <button
              onClick={triggerAlerts}
              disabled={sendingAlerts || defaulters.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                defaulters.length === 0
                  ? 'bg-slate-100 dark:bg-gray-800 text-slate-400 cursor-not-allowed border dark:border-gray-700'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/10'
              }`}
            >
              <PaperPlaneTilt size={18} weight="bold" />
              {sendingAlerts ? 'Sending warnings to parents...' : `Send Warnings to Parents (${defaulters.length})`}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-850 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.04]">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Classes</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Percentage</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Classes Needed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 animate-pulse">
                          Loading defaulters list...
                        </td>
                      </tr>
                    ) : defaulters.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                          No student records fall below {threshold}% threshold in your department.
                        </td>
                      </tr>
                    ) : (
                      defaulters.map((item, idx) => {
                        const needed = calculateNeededClasses(item.present_slots, item.total_slots);
                        return (
                          <motion.tr
                            key={`${item.student_id}-${item.subject_code}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{item.roll_no}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 uppercase font-medium">{item.subject_code}</td>
                            <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400">
                              {item.present_slots} / {item.total_slots}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
                                <Warning size={14} weight="fill" />
                                {item.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-center font-bold text-amber-600 dark:text-amber-400">
                              {needed} classes
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white"
              />
              <button
                onClick={fetchStaffSummary}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 rounded-lg transition-all"
                title="Refresh Logs List"
              >
                <ArrowsClockwise size={18} />
              </button>
            </div>
            
            <div className="text-xs text-slate-500">
              Total staff loaded: <span className="font-bold text-slate-800 dark:text-slate-200">{staffSummary.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-850 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.04]">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Check-In</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Check-Out</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 animate-pulse">
                          Loading staff logs...
                        </td>
                      </tr>
                    ) : staffSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                          No staff profile records found.
                        </td>
                      </tr>
                    ) : (
                      staffSummary.map((staff, idx) => {
                        const hasCheckIn = !!staff.check_in;
                        const hasCheckOut = !!staff.check_out;

                        let statusBadge = '';
                        if (staff.status === 'present') {
                          statusBadge = 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-900/30';
                        } else if (staff.status === 'absent') {
                          statusBadge = 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
                        } else {
                          statusBadge = 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
                        }

                        return (
                          <motion.tr
                            key={staff.user_id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                              <div>
                                {staff.name}
                                <span className="block text-[10px] text-slate-500 font-normal">{staff.department}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{staff.employee_code || '—'}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{staff.designation || '—'}</td>
                            <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400 font-mono">
                              {hasCheckIn ? new Date(staff.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400 font-mono">
                              {hasCheckOut ? new Date(staff.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${statusBadge}`}>
                                {staff.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => markManualPunch(staff.employee_code || staff.user_id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                              >
                                <Check size={14} weight="bold" />
                                {hasCheckIn ? 'Punch Out' : 'Punch In'}
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODAttendanceTab;
