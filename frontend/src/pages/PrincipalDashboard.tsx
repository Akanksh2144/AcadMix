import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bank,
  Users,
  CheckCircle,
  WarningOctagon,
  ChartBar,
  FilePdf,
  SignOut,
  Bell,
  Sun,
  Moon,
  Buildings,
  ChartLineUp,
  EnvelopeOpen,
  ClipboardText,
  CalendarCheck,
  NotePencil,
  Briefcase,
  Sparkle,
  Trash,
  Info
} from "@phosphor-icons/react";
import { Toaster, toast } from 'sonner';
import { principalAPI, authAPI, setAuthToken, insightsAPI, notificationsAPI, accreditationAPI } from "../services/api";
import InsightsCanvas from "../components/insights/InsightsCanvas";
import InsightsChat from "../components/insights/InsightsChat";
import { useTheme } from "../contexts/ThemeContext";
import DashboardSkeleton from "../components/DashboardSkeleton";
import UserProfileModal from "../components/UserProfileModal";
import CampusMap from "../components/campus/CampusMap";
import EventApprovalPanel from "../components/campus/EventApprovalPanel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const cardHover = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const PrincipalDashboard = ({ navigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const { isDark, toggle: toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  // Tab Data States
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [academicPerf, setAcademicPerf] = useState([]);
  const [ciaStatus, setCiaStatus] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [activityReports, setActivityReports] = useState([]);
  const [institutionProfile, setInstitutionProfile] = useState(null);
  const [expandedCompliance, setExpandedCompliance] = useState("attendance"); // attendance, staff, grievances, activities

  // Insights State
  const [pins, setPins] = useState([]);
  const [activePinData, setActivePinData] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  // Academic Year Settings
  const currentAcademicYear = "2023-2024";
  const currentSemester = 3;

  // Real notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsAPI.getAll({ limit: 10 }).then(res => {
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    }).catch(() => {});
  }, []);

  const handleMarkAllRead = () => {
    notificationsAPI.markAllRead().then(() => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setShowNotifications(false);
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (activeTab === "overview") {
        const { data } = await principalAPI.dashboard();
        setDashboard(data);
      }
      if (activeTab === "leaves") {
        const { data } = await principalAPI.pendingLeaves();
        setPendingLeaves(data);
      }
      if (activeTab === "compliance") {
        const [attRes, staffRes, grievRes, actRes] = await Promise.all([
          principalAPI.attendanceCompliance(currentAcademicYear),
          principalAPI.staffProfiles(),
          principalAPI.grievances({ status: "pending" }),
          principalAPI.activityReports()
        ]);
        setAttendance(attRes.data);
        setStaffProfiles(staffRes.data);
        setGrievances(grievRes.data);
        setActivityReports(actRes.data);
      }
      if (activeTab === "academics") {
        const [acadRes, ciaRes] = await Promise.all([
          principalAPI.academicPerformance(currentSemester, currentAcademicYear),
          principalAPI.ciaStatus(currentAcademicYear)
        ]);
        setAcademicPerf(acadRes.data);
        setCiaStatus(ciaRes.data);
      }
      if (activeTab === "institution") {
        const { data } = await principalAPI.institutionProfile();
        setInstitutionProfile(data || { recognitions: [], infrastructure: {}, mous: [] });
      }
      if (activeTab === "insights") {
        const { data } = await insightsAPI.getPins();
        setPins(data);
      }
    } catch (err) {
      console.error(err);
      setFetchError("Failed to fetch dashboard data. Access might be restricted.");
    }
    setLoading(false);
  };

  const handleExportAnnual = async () => {
    try {
      toast.loading('Queuing NAAC SSR Generation...', { id: 'naac_report' });
      const res = await accreditationAPI.generateReport({
        report_type: 'NAAC',
        academic_year: currentAcademicYear,
      });

      toast.loading(`Job queued! Generating PDF...`, { id: 'naac_report' });

      const jobId = res.data?.job_id || res.job_id;
      if (!jobId) {
         toast.success('Job queued successfully, but job tracking ID was not returned.', { id: 'naac_report' });
         return;
      }

      const pollInterval = setInterval(async () => {
         try {
            const statusRes = await accreditationAPI.getReportStatus(jobId);
            const status = statusRes.data?.status || statusRes.status;
            const reportUrl = statusRes.data?.report_url || statusRes.report_url;

            if (status === 'COMPLETED') {
               clearInterval(pollInterval);
               toast.success('Report generation complete! Downloading...', { id: 'naac_report' });
               if (reportUrl) {
                  window.open(reportUrl, '_blank');
               }
            } else if (status === 'FAILED') {
               clearInterval(pollInterval);
               toast.error('Report generation failed. Please check backend logs.', { id: 'naac_report' });
            }
         } catch (e) {
           clearInterval(pollInterval);
           toast.error('Connection lost while checking report status.', { id: 'naac_report' });
         }
      }, 3000);
    } catch (err) {
      toast.error("Failed to export report: " + (err.response?.data?.detail || err.message), { id: 'naac_report' });
    }
  };

  const handleReviewLeave = async (id, action) => {
    const remarks = action === "reject" ? prompt("Enter rejection remarks:") || "Rejected by Principal" : "Approved by Principal";
    try {
      await principalAPI.approveLeave(id, { action, remarks });
      fetchData();
      toast.success(`Leave ${action}ed successfully.`);
    } catch (err) {
      toast.error("Failed to review leave: " + (err.response?.data?.detail || err.message));
    }
  };

  const refreshPins = async () => {
    try {
      const { data } = await insightsAPI.getPins();
      setPins(data);
    } catch (err) {
      console.error('[Insights] Failed to refresh pins', err);
    }
  };

  const executePin = async (pin) => {
    setPinLoading(true);
    setActivePinData(null);
    try {
      const response = await insightsAPI.query({
        message: pin.nl_query || "Pinned Query",
        cached_sql: pin.cached_sql,
        session_history: []
      });
      setActivePinData(response.data);
    } catch (err) {
      console.error('[Insights] Failed to load pin data', err);
    }
    setPinLoading(false);
  };

  const deletePin = async (id) => {
    try {
      await insightsAPI.deletePin(id);
      setPins(prev => prev.filter(p => p.id !== id));
      setActivePinData(null);
    } catch (err) {
      console.error('[Insights] Delete failed', err);
    }
  };

  const TopStats = [
    {
      label: "Institutional Strength",
      value: dashboard?.total_students || "—",
      sub: "Total enrolled students",
      icon: Users,
      color: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15",
    },
    {
      label: "Total Faculty",
      value: dashboard?.total_faculty || "—",
      sub: "across " + (dashboard?.total_departments || "—") + " departments",
      icon: Briefcase,
      color: "bg-emerald-50 text-emerald-500",
    },
    {
      label: "HOD Leave Queue",
      value: dashboard?.pending_hod_leaves || 0,
      sub: "Requires Principal Approval",
      icon: EnvelopeOpen,
      color: "bg-amber-50 text-amber-500",
      onClick: () => setActiveTab("leaves")
    },
    {
      label: "Escalated Activities",
      value: dashboard?.pending_activities || 0,
      sub: "Awaiting Principal Notation",
      icon: CheckCircle,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
      onClick: () => setActiveTab("compliance"),
    },
    {
      label: "Campus View",
      value: "Live",
      sub: "Infrastructure Map",
      icon: Buildings,
      color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
      onClick: () => setActiveTab("campus"),
    },
  ];

  if (loading && !dashboard) return <DashboardSkeleton variant="admin" />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] dark:from-slate-800 dark:via-slate-900 dark:to-[#0F172A] text-slate-800 dark:text-slate-200 transition-colors duration-300 font-sans selection:bg-indigo-500/30">
      <Toaster position="top-right" theme={isDark ? "dark" : "light"} richColors />
      
      {/* Header Profile Trigger Component (Reusable) */}
      {showProfile && (
        <UserProfileModal 
           onClose={() => setShowProfile(false)} 
           user={user} 
           onLogout={onLogout} 
        />
      )}

      <header className="sticky top-0 z-40 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/20 dark:border-white/20">
              <Bank size={22} weight="fill" className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
                AcadMix <span className="font-light opacity-70">Insights</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Principal Executive
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 shadow-sm"
                aria-label="Notifications"
              >
                <Bell size={20} weight={showNotifications ? "fill" : "regular"} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.5)] border border-rose-400">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
            </div>
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifications(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="fixed top-20 right-4 sm:right-8 z-[61] w-80 sm:w-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 border-t-white/80 dark:border-t-white/20 overflow-hidden"
                  >
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm tracking-wide">Action Center</h4>
                      <button onClick={handleMarkAllRead} className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Mark Read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-12 text-center text-xs text-slate-500 uppercase tracking-widest">Inbox Zero</div>
                      ) : notifications.map((item) => (
                        <div key={item.id} className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!item.is_read ? 'bg-indigo-50 dark:bg-indigo-500/5' : ''}`}>
                          <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${item.type === 'alert' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-2 block">{formatTime(item.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 shadow-sm"
            >
              {isDark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
            </motion.button>

            {/* User Profile Trigger */}
            <button
               onClick={() => setShowProfile(true)}
               className="hidden sm:flex items-center gap-3 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all rounded-full pl-2 pr-5 py-1.5 cursor-pointer shadow-sm"
             >
               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                 <Bank size={14} weight="fill" className="text-indigo-600 dark:text-indigo-400" />
               </div>
               <div className="text-left">
                 <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight drop-shadow-sm">{user?.name}</p>
                 <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">{user?.designation || "Principal"}</p>
               </div>
             </button>
             
             <button onClick={onLogout} className="p-2.5 rounded-2xl bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 transition-all border border-slate-200 dark:border-white/5 hover:border-rose-300 dark:hover:border-rose-500/30 ml-1 shadow-sm" title="Sign Out">
               <SignOut size={18} weight="duotone" />
             </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex items-start justify-between flex-wrap gap-6"
        >
          <div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2 drop-shadow-md">
              {getGreeting()}, <span className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{user?.name || "Principal"}</span>
            </h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              Institutional Governance <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span> Academic Year {currentAcademicYear}
            </p>
          </div>
          <button
            onClick={handleExportAnnual}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(99,102,241,0.3)] border border-white/20 transition-all hover:scale-[1.02] active:scale-95 hover:shadow-[0_12px_25px_rgba(99,102,241,0.4)]"
          >
            <FilePdf size={20} weight="fill" />
            Generate NAAC SSR
          </button>
        </motion.div>

        {/* Pill-Shaped Glassmorphism Navigation */}
        <div className="flex overflow-x-auto gap-2 p-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-full mb-12 hide-scrollbar border border-slate-200 dark:border-white/10 dark:border-t-white/20 shadow-md dark:shadow-lg">
            {[
              { id: "overview", label: "Overview", icon: ChartBar },
              { id: "leaves", label: "HOD Leaves", icon: EnvelopeOpen },
              { id: "compliance", label: "Compliance & Governance", icon: CheckCircle },
              { id: "academics", label: "Academic Performance", icon: ChartLineUp },
              { id: "institution", label: "Institution Profile", icon: Buildings },
              { id: "insights", label: "AI Insights", icon: Sparkle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] border border-indigo-400/30"
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "duotone"} />
                {tab.label}
              </button>
            ))}
        </div>

        {/* Content Modules */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {fetchError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20">
                <p className="font-semibold flex items-center gap-2"><WarningOctagon weight="fill" /> Error Loading Data</p>
                <p className="text-sm opacity-80">{fetchError}</p>
              </div>
            )}

            {/* ─── Overview Tab ─── */}
            {activeTab === "overview" && (
               <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TopStats.map((stat, i) => (
                    <motion.div
                      variants={itemVariants}
                      whileHover={cardHover}
                      key={i}
                      onClick={stat.onClick}
                      className={`bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6 relative overflow-hidden group hover:bg-white/80 dark:hover:bg-slate-800/60 transition-all duration-300 ${stat.onClick ? "cursor-pointer" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                          {stat.label}
                        </span>
                        <div className={`p-2 rounded-2xl bg-white/5 border border-white/10 ${stat.color === 'indigo' ? 'text-indigo-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
                          <stat.icon size={20} weight="duotone" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1 drop-shadow-md">
                        {stat.value}
                      </p>
                      <p className="text-xs font-medium text-slate-400">{stat.sub}</p>
                    </motion.div>
                  ))}
               </motion.div>
            )}

            {/* ─── Leaves Tab ─── */}
            {activeTab === "leaves" && (
                <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6 min-h-[400px]">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">HOD Leave Inbox</h3>
                  {pendingLeaves.length === 0 ? (
                      <div className="text-center py-16 opacity-50">
                        <CheckCircle size={48} className="mx-auto mb-4 text-emerald-600 dark:text-emerald-400" weight="duotone"/>
                        <p className="font-semibold text-slate-800 dark:text-white">All caught up!</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">No pending HOD leaves require your attention.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                        {pendingLeaves.map(leave => (
                            <div key={leave.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {leave.applicant_name}
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 uppercase text-[10px] font-bold tracking-wider">HOD • {leave.applicant_department}</span>
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 mt-1">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{leave.leave_type}</span>: {new Date(leave.from_date).toLocaleDateString()} to {new Date(leave.to_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500">Reason: {leave.reason}</p>
                                </div>
                                <div className="flex gap-2 min-w-[200px]">
                                    <button onClick={() => handleReviewLeave(leave.id, "reject")} className="flex-1 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm">Reject</button>
                                    <button onClick={() => handleReviewLeave(leave.id, "approve")} className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white dark:text-slate-900 hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] border border-emerald-400/30 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md">Approve</button>
                                </div>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
            )}

            {/* ─── Compliance Tab ─── */}
            {activeTab === "compliance" && (
                <div className="space-y-6">
                    <div className="flex bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-1 mb-6 overflow-x-auto hide-scrollbar shadow-inner">
                        {['attendance', 'staff', 'grievances', 'activities'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setExpandedCompliance(tab)}
                                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap px-4 ${expandedCompliance === tab ? 'bg-indigo-500 shadow-md text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {expandedCompliance === "attendance" && (
                        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Department Attendance Compliance</h3>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* Sort worst compliance to the top */}
                                    <BarChart 
                                        layout="vertical"
                                        data={[...attendance].sort((a,b) => a.student_attendance.compliance_rate - b.student_attendance.compliance_rate)}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                        <XAxis type="number" domain={[0, 100]} stroke={isDark ? "#94a3b8" : "#64748b"}/>
                                        <YAxis dataKey="department_id" type="category" width={80} stroke={isDark ? "#94a3b8" : "#64748b"} fontWeight="bold" />
                                        <Tooltip 
                                            cursor={{fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}}
                                            contentStyle={{borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', color: isDark ? '#fff' : '#0f172a', boxShadow: '0 20px 40px -5px rgba(0,0,0,0.3)'}}
                                        />
                                        <Bar dataKey="student_attendance.compliance_rate" name="Compliance Rate %" radius={[0, 8, 8, 0]}>
                                            {
                                                [...attendance].sort((a,b) => a.student_attendance.compliance_rate - b.student_attendance.compliance_rate).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.student_attendance.compliance_rate < 70 ? '#F43F5E' : '#10B981'} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {expandedCompliance === "activities" && (
                        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                Escalated Activity Reports 
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold">{activityReports.length}</span>
                            </h3>
                            {activityReports.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 py-4 italic">No escalated reports pending notation.</p>
                            ) : (
                                <div className="space-y-4">
                                   {activityReports.map(act => (
                                       <div key={act.id} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                           <div>
                                               <p className="font-bold text-slate-900 dark:text-white text-lg">{act.event_title} <span className="uppercase text-[10px] ml-2 text-indigo-600 dark:text-indigo-400 font-extrabold tracking-wider bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">{act.activity_type}</span></p>
                                               <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">By: <span className="text-slate-800 dark:text-slate-300 font-medium">{act.faculty_name}</span> ({act.department}) • Post-event report accepted by HOD.</p>
                                           </div>
                                           <button className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 py-2 px-5 text-sm font-semibold rounded-xl text-slate-800 dark:text-white transition-colors" onClick={() => toast.info("Notation API to be implemented")}>Acknowledge</button>
                                       </div>
                                   ))}
                                </div>
                            )}
                        </div>
                    )}

                    {expandedCompliance === "staff" && (
                        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Staff Profile Completeness</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {staffProfiles.map(s => (
                                    <div key={s.department_id} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{s.department_id}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Total Faculty: {s.total_faculty}</p>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-300 dark:border-white/5">
                                            <div className={`h-full rounded-full shadow-[0_0_10px_currentColor] ${s.completeness_percentage < 80 ? 'bg-amber-400 text-amber-400' : 'bg-emerald-400 text-emerald-400'}`} style={{ width: s.completeness_percentage + '%' }}></div>
                                        </div>
                                        <p className="text-[11px] font-bold text-right mt-2 text-slate-600 dark:text-slate-300">{s.completeness_percentage}% Complete</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {expandedCompliance === "grievances" && (
                        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">Pending Grievances <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold">{grievances.length}</span></h3>
                            {grievances.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 italic">No pending grievances.</p>
                            ) : (
                                <div className="space-y-4">
                                    {grievances.map(g => (
                                        <div key={g.id} className="p-5 border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400 dark:bg-rose-500/50"></div>
                                            <div className="flex justify-between items-start">
                                               <h4 className="font-bold text-slate-900 dark:text-white text-lg">{g.subject}</h4>
                                               <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-1 rounded-md border border-rose-300 dark:border-rose-500/20">{g.category}</span>
                                            </div>
                                            <p className="text-sm mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">{g.description}</p>
                                            <p className="text-xs font-medium mt-4 text-slate-500">Submitted by: <span className="text-slate-700 dark:text-slate-400">{g.submitted_by_name}</span> ({g.submitted_by_role})</p>
                                            <div className="mt-5">
                                                <button className="text-xs font-semibold bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-slate-300 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-xl transition-colors shadow-sm" onClick={() => {
                                                    const dept = prompt("Enter department to reassign to (e.g. CSE):");
                                                    if (dept) {
                                                        principalAPI.reassignGrievance(g.id, { department_id: dept }).then(() => fetchData()).catch(console.error);
                                                    }
                                                }}>Reassign Ticket</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Academic Performance Tab ─── */}
            {activeTab === "academics" && (
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pass/Fail Demographics (Sem {currentSemester})</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={academicPerf}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                    <XAxis dataKey="department_id" stroke={isDark ? "#94a3b8" : "#64748b"} fontWeight="bold"/>
                                    <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} />
                                    <Tooltip 
                                        cursor={{fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}}
                                        contentStyle={{borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', color: isDark ? '#fff' : '#0f172a', boxShadow: '0 20px 40px -5px rgba(0,0,0,0.3)'}}
                                    />
                                    <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                    <Bar dataKey="passed_students" name="Passed" fill="#10B981" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="failed_students" name="Failed" fill="#F43F5E" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">CIA Publication Pipeline</h3>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 shadow-inner">
                           <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
                               <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase font-bold text-xs border-b border-slate-200 dark:border-white/10">
                                   <tr>
                                       <th className="px-6 py-4">Department</th>
                                       <th className="px-6 py-4">Subject Code</th>
                                       <th className="px-6 py-4">CIA Status</th>
                                       <th className="px-6 py-4">Entry Volume</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                   {ciaStatus.map((row, i) => (
                                       <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.department_id}</td>
                                            <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-300">{row.subject_code}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                                                    ${row.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                                      row.status === 'submitted' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                                                      'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{row.count} entries</td>
                                       </tr>
                                   ))}
                                   {ciaStatus.length === 0 && (
                                       <tr>
                                           <td colSpan="4" className="px-6 py-8 text-center text-slate-500 italic">No CIA assignments tracked for the current academic year.</td>
                                       </tr>
                                   )}
                               </tbody>
                           </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Institutional Profile Tab ─── */}
            {activeTab === "institution" && (
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 dark:border-t-white/20 rounded-3xl shadow-xl dark:shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Institutional Governance Settings</h3>
                            <button className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] border border-indigo-400/30 py-2.5 px-6 rounded-2xl text-sm font-bold transition-all" onClick={() => toast.success("Save functionality connected.")}>Save Changes</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><Buildings weight="duotone" className="text-indigo-600 dark:text-indigo-400"/> Infrastructure Map</h4>
                                <textarea 
                                    className="w-full h-40 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 font-mono text-xs text-indigo-600 dark:text-indigo-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 shadow-inner leading-relaxed" 
                                    readOnly 
                                    value={JSON.stringify(institutionProfile?.infrastructure || {}, null, 2)}
                                />
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-3">Format: JSON Key-Value pairs.</p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><CheckCircle weight="duotone" className="text-emerald-600 dark:text-emerald-400"/> Institutional Recognitions</h4>
                                <textarea 
                                    className="w-full h-40 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 font-mono text-xs text-emerald-600 dark:text-emerald-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 shadow-inner leading-relaxed" 
                                    readOnly 
                                    value={JSON.stringify(institutionProfile?.recognitions || [], null, 2)}
                                />
                                 <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-3">NAAC, NBA, NIRF Accreditations Map.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Placeholder Views */}
                        <div className="bg-white/40 dark:bg-slate-800/20 backdrop-blur-md border border-dashed border-slate-300 dark:border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-48">
                             <NotePencil size={32} weight="duotone" className="text-slate-500 mb-4" />
                             <h4 className="font-bold text-slate-900 dark:text-white mb-2">Administrative Tasks</h4>
                             <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pipeline Blocked</p>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-800/20 backdrop-blur-md border border-dashed border-slate-300 dark:border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-48">
                             <CalendarCheck size={32} weight="duotone" className="text-slate-500 mb-4" />
                             <h4 className="font-bold text-slate-900 dark:text-white mb-2">Department Meetings</h4>
                             <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pipeline Blocked</p>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-800/20 backdrop-blur-md border border-dashed border-slate-300 dark:border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-48">
                             <ChartLineUp size={32} weight="duotone" className="text-slate-500 mb-4" />
                             <h4 className="font-bold text-slate-900 dark:text-white mb-2">Placement Overview</h4>
                             <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pipeline Blocked</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── AI Insights Tab ─── */}
            {activeTab === "insights" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           <Sparkle weight="fill" className="text-indigo-400" /> Conversational Insights
                       </h3>
                       <button 
                           onClick={() => { setIsChatting(!isChatting); setActivePinData(null); }} 
                           className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] border border-indigo-400/30 py-2.5 px-6 rounded-2xl text-sm font-bold transition-all"
                       >
                           {isChatting ? "View Pinned Dashboards" : "New Query"}
                       </button>
                    </div>

                    {isChatting ? (
                        <div className="flex overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                             <InsightsChat user={user} activeCollegeId={null} onPinsChanged={refreshPins} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="md:col-span-1 space-y-4">
                               <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-2">Pinned Dashboards</h4>
                               {pins.length === 0 ? (
                                   <div className="p-5 bg-slate-800/20 backdrop-blur-md border border-dashed border-white/10 rounded-2xl text-center shadow-inner">
                                       <p className="text-sm font-semibold text-slate-400">No pinned insights yet.</p>
                                       <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-3 hover:text-indigo-300 cursor-pointer transition-colors" onClick={() => setIsChatting(true)}>Try asking a question to see magic!</p>
                                   </div>
                               ) : (
                                   pins.map(pin => (
                                       <div 
                                          key={pin.id} 
                                          onClick={() => executePin(pin)}
                                          className="group p-5 bg-slate-900/50 backdrop-blur-md border border-white/5 shadow-inner rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all truncate"
                                       >
                                          <div className="flex justify-between items-start">
                                              <p className="font-bold text-white text-sm truncate pr-2 leading-tight" title={pin.title}>{pin.title}</p>
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); deletePin(pin.id); }} 
                                                  className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                  <Trash size={16} weight="duotone" />
                                              </button>
                                          </div>
                                          <p className="text-[11px] font-medium text-slate-400 truncate mt-2 leading-relaxed" title={pin.nl_query}>"{pin.nl_query}"</p>
                                       </div>
                                   ))
                               )}
                           </div>
                           
                           <div className="md:col-span-3 bg-slate-800/40 backdrop-blur-xl border border-white/10 border-t-white/20 rounded-3xl shadow-2xl p-6 min-h-[400px] flex flex-col">
                               {pinLoading ? (
                                   <div className="h-full flex-1 flex flex-col items-center justify-center text-slate-400">
                                       <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-5 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                                       <p className="font-semibold tracking-wide">Running query securely...</p>
                                   </div>
                               ) : activePinData ? (
                                   <div className="flex-1 rounded-2xl overflow-hidden bg-slate-900/50 border border-white/5 p-4">
                                       <InsightsCanvas result={activePinData} />
                                   </div>
                               ) : (
                                   <div className="h-full flex-1 flex flex-col items-center justify-center text-slate-500 dark:opacity-80">
                                       <Sparkle size={56} weight="duotone" className="mb-5 text-indigo-300 dark:text-indigo-400/50 dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                       <p className="font-bold text-slate-800 dark:text-slate-300 text-lg mb-1">Select a pinned insight</p>
                                       <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data is queried in real-time instantly without AI overhead.</p>
                                   </div>
                               )}
                           </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Campus Tab ─── */}
            {activeTab === "campus" && (
              <div className="space-y-6">
                <EventApprovalPanel user={user} />
                <CampusMap user={user} navigate={navigate} />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PrincipalDashboard;

