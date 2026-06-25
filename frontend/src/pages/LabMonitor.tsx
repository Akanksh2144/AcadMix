import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, Clock, Warning, Eye, ArrowLeft, StopCircle, 
  DownloadSimple, CircleNotch, ListBullets, Play, FileText, Flask,
  UserCheck, ShieldWarning, ArrowUpRight
} from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import { labAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ── Confirm Modal ──
interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmClass?: string;
  icon: any;
  iconClass?: string;
  iconBg?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  open, onConfirm, onCancel, title, description, 
  confirmLabel = 'Confirm', confirmClass = 'bg-indigo-600 hover:bg-indigo-700 text-white', 
  icon: Icon, iconClass = 'text-indigo-500', iconBg = 'bg-indigo-50 dark:bg-indigo-500/15' 
}) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative bg-white dark:bg-[#151B2B] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/[0.06] w-full max-w-sm overflow-hidden z-10"
        >
          <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
              {Icon && <Icon size={28} weight="duotone" className={iconClass} />}
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1.5">{title}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
          </div>
          <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />
          <div className="px-6 py-4 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── Main Page Component ──
interface LabMonitorProps {
  navigate: (path: string, state?: any) => void;
  user: any;
}

const LabMonitor: React.FC<LabMonitorProps> = ({ navigate, user }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [boardData, setBoardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'report' | 'assignments'>('board');
  const [reportData, setReportData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Track rows that received recent updates to apply transition flash
  const [updatedStudents, setUpdatedStudents] = useState<{ [studentId: string]: string }>({}); // student_id -> type ('submission' | 'join')

  // Fetch initial details
  const fetchDetails = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await labAPI.getSession(sessionId);
      const data = res.data || res;
      setSession(data);
      if (data.status === 'draft') {
        setActiveTab('assignments');
      } else if (data.status === 'ended') {
        setActiveTab('report');
      } else {
        setActiveTab('board');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load exam session details');
    }
  }, [sessionId]);

  // Fetch live board data
  const fetchBoard = useCallback(async () => {
    if (!sessionId || session?.status === 'draft') return;
    try {
      const res = await labAPI.liveBoard(sessionId);
      const data = res.data || res;
      setBoardData(data.board || []);
    } catch (err) {
      console.error('Failed to fetch board data', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, session?.status]);

  // Fetch ended report
  const fetchReport = useCallback(async () => {
    if (!sessionId || session?.status !== 'ended') return;
    try {
      const res = await labAPI.report(sessionId);
      setReportData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch report data', err);
    }
  }, [sessionId, session?.status]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDetails();
    };
    init();
  }, [fetchDetails]);

  useEffect(() => {
    if (session?.status === 'active') {
      fetchBoard();
    } else if (session?.status === 'ended') {
      fetchReport();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session?.status, fetchBoard, fetchReport]);

  // Keep track of current time for away/inactivity detection
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // WebSockets for Real-time board updates
  const { data: wsMessage } = useWebSocket(`/ws/lab/${sessionId}/monitor`, {
    enabled: !!sessionId && session?.status === 'active'
  });

  useEffect(() => {
    if (!wsMessage) return;

    if (wsMessage.type === 'student_joined') {
      toast.info(`Student ${wsMessage.name} joined the exam`);
      setUpdatedStudents(prev => ({ ...prev, [wsMessage.student_id]: 'join' }));
      setTimeout(() => {
        setUpdatedStudents(prev => {
          const next = { ...prev };
          delete next[wsMessage.student_id];
          return next;
        });
      }, 3500);
      fetchBoard();
    }

    if (wsMessage.type === 'submission') {
      if (wsMessage.is_passed) {
        toast.success(`🎉 ${wsMessage.name} passed a question!`);
      } else {
        toast.warning(`${wsMessage.name} submitted code (Not Passed)`);
      }
      setUpdatedStudents(prev => ({ ...prev, [wsMessage.student_id]: 'submission' }));
      setTimeout(() => {
        setUpdatedStudents(prev => {
          const next = { ...prev };
          delete next[wsMessage.student_id];
          return next;
        });
      }, 3500);
      fetchBoard();
    }
  }, [wsMessage, fetchBoard]);

  const handleStartExam = async () => {
    if (!sessionId) return;
    setActionLoading(true);
    try {
      await labAPI.startSession(sessionId);
      toast.success('🧪 Practical Exam has started!');
      await fetchDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to start exam');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndExam = async () => {
    if (!sessionId) return;
    setShowEndConfirm(false);
    setActionLoading(true);
    try {
      await labAPI.endSession(sessionId);
      toast.success('🛑 Practical Exam has been closed.');
      await fetchDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to end exam');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = reportData || boardData;
    if (!dataToExport || (Array.isArray(dataToExport) && dataToExport.length === 0)) {
      toast.error('No data available to export');
      return;
    }

    const rows = (reportData?.students || boardData).map((std: any) => {
      const questionsStr = std.questions.map((q: any) => 
        `${q.question_title} (${q.is_passed ? 'PASSED' : 'PENDING'} - ${q.attempt_count} attempts)`
      ).join('; ');

      const totalQs = std.questions.length;
      const passedQs = std.questions.filter((q: any) => q.is_passed).length;

      return {
        'Roll Number': std.roll_number,
        'Student Name': std.name,
        'Assigned Questions Status': questionsStr,
        'Solved': `${passedQs}/${totalQs}`,
        'Total Attempts': std.questions.reduce((sum: number, q: any) => sum + (q.attempt_count || 0), 0),
        'Last Active': std.last_activity ? new Date(std.last_activity).toLocaleString() : 'Never'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 60 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lab Results');
    XLSX.writeFile(wb, `${(session?.title || 'lab').replace(/\s+/g, '_')}_results.xlsx`);
    toast.success('Excel log exported successfully!');
  };

  // Helper to calculate minutes inactive
  const getInactivityInfo = (lastActivityStr: string | null) => {
    if (!lastActivityStr) return null;
    const last = new Date(lastActivityStr);
    const diffMs = currentTime.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins >= 5 ? diffMins : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <CircleNotch size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading live feed...</p>
        </div>
      </div>
    );
  }

  const onlineStudents = boardData.length;
  const passedAllStudents = boardData.filter(s => s.all_passed).length;
  const startedStudents = boardData.filter(s => s.last_activity !== null).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      
      {/* End Exam Confirm Modal */}
      <ConfirmModal
        open={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={handleEndExam}
        title="End Lab Exam Now?"
        description={`"${session?.title}" will be stopped immediately. All students will be locked out of editing and their workspace code will freeze.`}
        confirmLabel="Yes, End Exam"
        confirmClass="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
        icon={StopCircle}
        iconClass="text-red-500"
        iconBg="bg-red-50 dark:bg-red-500/15"
      />

      <PageHeader
        navigate={navigate}
        user={user}
        title="Lab Exam Control Panel"
        subtitle={session?.title}
        rightContent={
          <>
            <span className={`soft-badge uppercase tracking-wider font-extrabold text-[10px] ${
              session?.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 animate-pulse' :
              session?.status === 'ended' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
            }`}>
              {session?.status === 'active' ? '🔴 LIVE' : session?.status?.toUpperCase()}
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/40 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-100 dark:border-white/[0.04]">
              <Clock size={16} weight="duotone" className="text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{session?.subject}</span>
            </div>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Session details widget / banner */}
        <div className="soft-card p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Flask size={24} weight="duotone" className="text-indigo-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Session Registry Code: <span className="font-black text-indigo-500 tracking-wider select-all">{session?.session_code}</span></h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Batch {session?.batch} · Section {session?.section} · Semester {session?.semester} · {session?.assignment_mode} assignment
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {session?.status === 'draft' && (
              <button
                onClick={handleStartExam}
                disabled={actionLoading}
                className="btn-primary flex-1 md:flex-initial !px-6 flex items-center justify-center gap-2 !bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:opacity-90"
              >
                {actionLoading ? 'Starting...' : 'Start Exam 🧪'}
                <Play size={16} weight="bold" />
              </button>
            )}
            
            {session?.status === 'active' && (
              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={actionLoading}
                className="btn-primary flex-1 md:flex-initial !px-6 flex items-center justify-center gap-2 !bg-red-500 hover:!bg-red-600 shadow-md shadow-red-500/20"
              >
                {actionLoading ? 'Ending...' : 'End Exam 🛑'}
                <StopCircle size={16} weight="bold" />
              </button>
            )}

            {(session?.status === 'active' || session?.status === 'ended') && (
              <button
                onClick={handleExportExcel}
                className="btn-secondary flex-1 md:flex-initial flex items-center justify-center gap-2"
              >
                Export Excel
                <DownloadSimple size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100/80 dark:bg-white/[0.04] p-1 rounded-xl mb-6 w-fit backdrop-blur-sm border border-slate-200/50 dark:border-white/[0.06]">
          {session?.status === 'draft' && (
            <button
              onClick={() => setActiveTab('assignments')}
              className="pill-tab pill-tab-active !px-6"
            >
              Question Assignments
            </button>
          )}
          
          {session?.status !== 'draft' && (
            <>
              <button
                onClick={() => setActiveTab('board')}
                disabled={session?.status === 'draft'}
                className={`pill-tab ${activeTab === 'board' ? 'pill-tab-active' : 'pill-tab-inactive'} !px-6`}
              >
                Live Monitor
              </button>
              <button
                onClick={() => { setActiveTab('report'); fetchReport(); }}
                disabled={session?.status === 'draft'}
                className={`pill-tab ${activeTab === 'report' ? 'pill-tab-active' : 'pill-tab-inactive'} !px-6`}
              >
                Evaluation Report
              </button>
            </>
          )}
        </div>

        {/* Tab Content: ASSIGNMENTS (Draft view) */}
        {activeTab === 'assignments' && session && (
          <div className="soft-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-white">Assigned Questions Grid</h3>
              <span className="text-xs text-slate-400 font-bold">Preview allocation before starting exam</span>
            </div>
            
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Assigned Question</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-semibold">
                  {boardData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400">
                        No student assignments mapped yet. Use assignment tools in Creation wizard.
                      </td>
                    </tr>
                  ) : (
                    boardData.map((std: any, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="p-4 text-slate-900 dark:text-white">{std.roll_number}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{std.name}</td>
                        <td className="p-4 text-indigo-500">
                          {std.questions.map((q: any) => q.question_title).join(', ')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: LIVE MONITOR */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            {/* Live Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="soft-card p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Assigned Students</span>
                  <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{onlineStudents}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                  <Users size={20} weight="duotone" />
                </div>
              </div>
              <div className="soft-card p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Attempts</span>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{startedStudents}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <UserCheck size={20} weight="duotone" />
                </div>
              </div>
              <div className="soft-card p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">All Solved ✅</span>
                  <p className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">{passedAllStudents}</p>
                </div>
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500">
                  <CheckCircle size={20} weight="duotone" />
                </div>
              </div>
            </div>

            {/* Live Grid Table */}
            <div className="soft-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" /> Real-Time Monitor Grid
                </h3>
                <span className="text-xs text-slate-400 font-bold">Auto-updates as students run and save code</span>
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4">Roll</th>
                      <th className="p-4">Student</th>
                      <th className="p-4 text-center">Questions Progress</th>
                      <th className="p-4 text-center">Total Attempts</th>
                      <th className="p-4 text-center">Last Active</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-semibold">
                    {boardData.map((std: any) => {
                      const inactivity = getInactivityInfo(std.last_activity);
                      const isUpdated = updatedStudents[std.student_id];
                      const totalAttempts = std.questions.reduce((sum: number, q: any) => sum + (q.attempt_count || 0), 0);
                      
                      return (
                        <tr 
                          key={std.student_id} 
                          className={`transition-all duration-700 ${
                            isUpdated === 'submission' ? 'bg-emerald-50/50 dark:bg-emerald-500/10' :
                            isUpdated === 'join' ? 'bg-indigo-50/50 dark:bg-indigo-500/10' :
                            'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="p-4 text-slate-900 dark:text-white">{std.roll_number}</td>
                          <td className="p-4">
                            <p className="text-slate-800 dark:text-white">{std.name}</p>
                            {inactivity && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">
                                <ShieldWarning size={12} weight="fill" /> Away {inactivity}m
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {std.questions.map((q: any, idx: number) => {
                                const statusColor = q.is_passed 
                                  ? 'bg-emerald-500 text-white' 
                                  : q.attempt_count > 0 
                                  ? 'bg-amber-400 text-white' 
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600';
                                  
                                return (
                                  <div 
                                    key={idx}
                                    title={`${q.question_title}: ${q.is_passed ? 'PASSED' : 'PENDING'} (${q.attempt_count} attempts)`}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${statusColor}`}
                                  >
                                    {q.slot_number}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                            {totalAttempts}
                          </td>
                          <td className="p-4 text-center text-xs text-slate-400">
                            {std.last_activity ? new Date(std.last_activity).toLocaleTimeString() : '—'}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`soft-badge text-[10px] ${
                              std.all_passed ? 'bg-emerald-50 text-emerald-600' :
                              std.last_activity ? 'bg-indigo-50 text-indigo-600 animate-pulse' :
                              'bg-slate-100 text-slate-400 dark:bg-slate-800'
                            }`}>
                              {std.all_passed ? 'DONE' : std.last_activity ? 'SOLVING' : 'WAITING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {boardData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Waiting for students to join...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: EVALUATION REPORT */}
        {activeTab === 'report' && reportData && (
          <div className="space-y-6">
            {/* Summary Widget */}
            <div className="soft-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Students</span>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{reportData.summary.total_students}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Solved / Assigned</span>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{reportData.summary.total_passed} / {reportData.summary.total_assigned}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pass Rate</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{reportData.summary.pass_rate}%</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Completed At</span>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-2">
                  {reportData.session.ended_at ? new Date(reportData.session.ended_at).toLocaleDateString() : 'Active'}
                </p>
              </div>
            </div>

            {/* Student Reports List */}
            <div className="soft-card p-6">
              <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" /> Evaluation Breakdown
              </h3>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4">Roll</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Solved / Total</th>
                      <th className="p-4">Submissions Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-semibold">
                    {reportData.students.map((std: any) => {
                      const totalQs = std.questions.length;
                      const passedQs = std.questions.filter((q: any) => q.is_passed).length;
                      
                      return (
                        <tr key={std.student_id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="p-4 text-slate-900 dark:text-white">{std.roll_number}</td>
                          <td className="p-4 text-slate-800 dark:text-white">{std.name}</td>
                          <td className="p-4">
                            <span className={`text-base font-extrabold ${passedQs === totalQs ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {passedQs} / {totalQs}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {std.questions.map((q: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className={q.is_passed ? 'text-emerald-500' : 'text-slate-400'}>
                                    {q.is_passed ? '✅' : '❌'}
                                  </span>
                                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{q.question_title}</span>
                                  <span className="text-slate-400">({q.attempt_count || 0} attempts)</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabMonitor;
