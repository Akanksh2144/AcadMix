import React, { useState, useEffect, useCallback } from 'react';
import { visitorAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';

// ═══════════════════════════════════════════════════════════════════════════════
// VISITOR MANAGEMENT — Full campus & hostel visitor tracking
// ═══════════════════════════════════════════════════════════════════════════════

const VISITOR_TYPES = [
  { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
  { value: 'industry', label: 'Industry', icon: '🏢' },
  { value: 'delivery', label: 'Delivery', icon: '📦' },
  { value: 'official', label: 'Official', icon: '🏛️' },
  { value: 'interview_candidate', label: 'Interview', icon: '🎯' },
  { value: 'alumni', label: 'Alumni', icon: '🎓' },
  { value: 'other', label: 'Other', icon: '👤' },
];

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  pre_approved: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  approved: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  checked_in: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  checked_out: { bg: 'bg-slate-100 dark:bg-slate-700/30', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  expired: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-500', dot: 'bg-gray-400' },
};

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function VisitorTypeBadge({ type }) {
  const t = VISITOR_TYPES.find(v => v.value === type) || VISITOR_TYPES[6];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
      {t.icon} {t.label}
    </span>
  );
}

export default function VisitorManagement({ navigate, user, onLogout, gateType: defaultGateType }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gate type for the current view
  const isSecurityRole = user?.role === 'security';
  const isWardenRole = user?.role === 'warden';
  const defaultGate = defaultGateType || (isSecurityRole ? 'main_gate' : isWardenRole ? 'hostel' : null);
  const [gateFilter, setGateFilter] = useState(defaultGate);

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [preApproved, setPreApproved] = useState([]);
  const [visitLog, setVisitLog] = useState([]);

  // Check-in form
  const [checkInForm, setCheckInForm] = useState({
    visitor_name: '', visitor_phone: '', visitor_type: 'other',
    gate_type: defaultGate || 'main_gate', purpose: '', host_name: '',
    host_department: '', num_accompanying: 0, vehicle_number: '', badge_number: '',
    remarks: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-approve form
  const [preApproveForm, setPreApproveForm] = useState({
    visitor_name: '', visitor_phone: '', visitor_type: 'other',
    gate_type: defaultGate || 'main_gate', purpose: '', expected_arrival: '',
    expected_departure: '', num_accompanying: 0, vehicle_number: '', remarks: '',
  });

  // Log filters
  const [logSearch, setLogSearch] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');

  // ── Data Loading ──
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (gateFilter) params.gate_type = gateFilter;
      const { data } = await visitorAPI.dashboard(params);
      setStats(data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    }
    setLoading(false);
  }, [gateFilter]);

  const loadActive = useCallback(async () => {
    try {
      const params = {};
      if (gateFilter) params.gate_type = gateFilter;
      const { data } = await visitorAPI.getActive(params);
      setActiveVisitors(data.data || []);
    } catch {}
  }, [gateFilter]);

  const loadPending = useCallback(async () => {
    try {
      const params = {};
      if (gateFilter) params.gate_type = gateFilter;
      const { data } = await visitorAPI.getPending(params);
      setPendingVisits(data.data || []);
    } catch {}
  }, [gateFilter]);

  const loadPreApproved = useCallback(async () => {
    try {
      const params = {};
      if (gateFilter) params.gate_type = gateFilter;
      const { data } = await visitorAPI.getPreApproved(params);
      setPreApproved(data.data || []);
    } catch {}
  }, [gateFilter]);

  const loadLog = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (gateFilter) params.gate_type = gateFilter;
      if (logSearch) params.search = logSearch;
      if (logDateFrom) params.date_from = logDateFrom;
      if (logDateTo) params.date_to = logDateTo;
      const { data } = await visitorAPI.getLog(params);
      setVisitLog(data.data || []);
    } catch {}
  }, [gateFilter, logSearch, logDateFrom, logDateTo]);

  useEffect(() => {
    loadDashboard();
    loadActive();
    loadPending();
    loadPreApproved();
  }, [loadDashboard, loadActive, loadPending, loadPreApproved]);

  useEffect(() => {
    if (activeTab === 'log') loadLog();
  }, [activeTab, loadLog]);

  // Auto-refresh active visitors every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        loadDashboard();
        loadActive();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, loadDashboard, loadActive]);

  // ── Visitor Search ──
  const handleVisitorSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await visitorAPI.search(query);
      setSearchResults(data.data || []);
    } catch {}
  };

  const selectExistingVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setCheckInForm(prev => ({
      ...prev,
      visitor_name: visitor.name,
      visitor_phone: visitor.phone,
      visitor_type: visitor.visitor_type || 'other',
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  // ── Check-In ──
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.visitor_name || !checkInForm.visitor_phone || !checkInForm.purpose) {
      setError('Name, phone, and purpose are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...checkInForm };
      if (selectedVisitor) payload.visitor_id = selectedVisitor.id;
      await visitorAPI.checkIn(payload);
      setSuccess('Visitor checked in successfully!');
      setCheckInForm({
        visitor_name: '', visitor_phone: '', visitor_type: 'other',
        gate_type: defaultGate || 'main_gate', purpose: '', host_name: '',
        host_department: '', num_accompanying: 0, vehicle_number: '', badge_number: '',
        remarks: '',
      });
      setSelectedVisitor(null);
      loadDashboard();
      loadActive();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-in failed');
    }
    setSubmitting(false);
  };

  // ── Check-Out ──
  const handleCheckOut = async (visitId) => {
    try {
      await visitorAPI.checkOut({ visit_id: visitId });
      setSuccess('Visitor checked out successfully');
      loadActive();
      loadDashboard();
      loadLog();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-out failed');
    }
  };

  // ── Pre-Approve ──
  const handlePreApprove = async (e) => {
    e.preventDefault();
    if (!preApproveForm.visitor_name || !preApproveForm.visitor_phone || !preApproveForm.purpose || !preApproveForm.expected_arrival) {
      setError('Name, phone, purpose, and expected arrival are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await visitorAPI.preApprove(preApproveForm);
      setSuccess('Visitor pre-approved successfully!');
      setPreApproveForm({
        visitor_name: '', visitor_phone: '', visitor_type: 'other',
        gate_type: defaultGate || 'main_gate', purpose: '', expected_arrival: '',
        expected_departure: '', num_accompanying: 0, vehicle_number: '', remarks: '',
      });
      loadPreApproved();
      loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Pre-approval failed');
    }
    setSubmitting(false);
  };

  // ── Quick Check-In Pre-Approved ──
  const handleQuickCheckIn = async (visitId) => {
    try {
      await visitorAPI.checkInPreApproved(visitId);
      setSuccess('Visitor checked in!');
      loadPreApproved();
      loadActive();
      loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-in failed');
    }
  };

  // ── Approve / Reject Pending ──
  const handleReview = async (visitId, action) => {
    try {
      await visitorAPI.review(visitId, { action });
      setSuccess(`Visit ${action}d successfully`);
      loadPending();
      loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Review failed');
    }
  };

  const refreshAll = () => {
    loadDashboard();
    loadActive();
    loadPending();
    loadPreApproved();
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'checkin', label: '🚪 Check In' },
    { id: 'checkout', label: '✅ Check Out' },
    { id: 'preapprove', label: '📋 Pre-Approve' },
    { id: 'log', label: '📜 Visitor Log' },
  ];

  const pageTitle = isSecurityRole ? 'Security — Visitor Gate' : isWardenRole ? 'Hostel — Visitor Management' : 'Visitor Management';
  const pageSubtitle = isSecurityRole ? 'Main campus gate operations' : isWardenRole ? 'Hostel visitor tracking' : 'Campus & hostel visitor tracking';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        hideBack={isSecurityRole || isWardenRole}
      />

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium animate-fade-in-up">
            {error}
            <button onClick={() => setError('')} className="ml-3 font-bold text-red-500">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fade-in-up">
            ✓ {success}
          </div>
        )}

        {/* Gate Filter (admin only — security/warden auto-scoped) */}
        {user?.role === 'admin' && (
          <div className="flex gap-2 mb-4">
            {[{ v: null, l: 'All Gates' }, { v: 'main_gate', l: '🏫 Main Gate' }, { v: 'hostel', l: '🏠 Hostel' }].map(g => (
              <button
                key={g.v || 'all'}
                onClick={() => setGateFilter(g.v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  gateFilter === g.v
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {g.l}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-8 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`visitor-tab-${tab.id}`}
              className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent relative ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm dark:border-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
              {tab.id === 'checkout' && activeVisitors.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">{activeVisitors.length}</span>
              )}
              {tab.id === 'dashboard' && (stats?.pending_approval || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════ DASHBOARD TAB ════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in-up">
            {loading ? (
              <DashboardSkeleton variant="content-cards" />
            ) : stats && (
              <>
                {/* Live indicator */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Live</span>
                  <span className="text-xs text-slate-400">Auto-refreshes every 30s</span>
                  <button onClick={refreshAll} className="ml-auto text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">↻ Refresh Now</button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-children">
                  <div className="stat-card" style={{ '--stat-accent': '#6366f1', '--stat-accent-end': '#8b5cf6' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">In Campus</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.currently_in_campus}</p>
                    <p className="text-xs text-indigo-500 font-medium mt-1">Right now</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-accent-end': '#06b6d4' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Today Total</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.total_today}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#f59e0b', '--stat-accent-end': '#ef4444' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Checked Out</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.checked_out_today}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#ef4444', '--stat-accent-end': '#f43f5e' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.pending_approval}</p>
                    {stats.pending_approval > 0 && <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">Needs action</p>}
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#3b82f6', '--stat-accent-end': '#6366f1' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pre-Approved</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.pre_approved_upcoming}</p>
                    <p className="text-xs text-blue-500 font-medium mt-1">Upcoming</p>
                  </div>
                </div>

                {/* Breakdown cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* By Visitor Type */}
                  {Object.keys(stats.by_type || {}).length > 0 && (
                    <div className="soft-card p-5">
                      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3">Today by Visitor Type</h3>
                      <div className="space-y-2">
                        {Object.entries(stats.by_type).map(([type, count]) => {
                          const t = VISITOR_TYPES.find(v => v.value === type) || VISITOR_TYPES[6];
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">{t.icon} {t.label}</span>
                              <span className="font-bold text-slate-800 dark:text-white">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* By Gate */}
                  {Object.keys(stats.by_gate || {}).length > 0 && (
                    <div className="soft-card p-5">
                      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3">Today by Gate</h3>
                      <div className="space-y-2">
                        {Object.entries(stats.by_gate).map(([gate, count]) => (
                          <div key={gate} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{gate === 'main_gate' ? '🏫 Main Gate' : '🏠 Hostel'}</span>
                            <span className="font-bold text-slate-800 dark:text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active visitors */}
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">
                  Currently In Campus ({activeVisitors.length})
                </h3>
                {activeVisitors.length === 0 ? (
                  <div className="text-center py-12 soft-card">
                    <p className="text-4xl mb-3">🏫</p>
                    <p className="text-slate-500 font-medium">No visitors currently in campus</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                    {activeVisitors.map(v => (
                      <div key={v.id} className="soft-card p-4 border-l-4 border-indigo-500">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{v.visitor_name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{v.visitor_phone}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-indigo-500">{formatDuration(v.duration_minutes)} in</span>
                            <p className="text-xs text-slate-400">Since {formatTime(v.checked_in_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <VisitorTypeBadge type={v.visitor_type} />
                          <span className="text-xs text-slate-500">→ {v.host_name || 'General'}</span>
                          {v.badge_number && <span className="text-xs font-mono text-amber-600 dark:text-amber-400">🏷️ {v.badge_number}</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{v.purpose}</p>
                        <button
                          onClick={() => handleCheckOut(v.id)}
                          className="mt-3 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition-colors active:scale-95 w-full"
                        >
                          ← Check Out
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending approvals */}
                {pendingVisits.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">
                      ⚠️ Pending Approval ({pendingVisits.length})
                    </h3>
                    <div className="space-y-3 stagger-children">
                      {pendingVisits.map(v => (
                        <div key={v.id} className="soft-card p-5 flex items-center justify-between flex-wrap gap-4 border-l-4 border-amber-500">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{v.visitor_name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{v.purpose}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <VisitorTypeBadge type={v.visitor_type} />
                              <span className="text-xs text-slate-400">{v.visitor_phone}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(v.id, 'approve')}
                              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReview(v.id, 'reject')}
                              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-600 font-bold text-sm hover:bg-red-500/20 transition-colors active:scale-95"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pre-approved upcoming */}
                {preApproved.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">
                      📋 Pre-Approved — Awaiting Arrival ({preApproved.length})
                    </h3>
                    <div className="space-y-3 stagger-children">
                      {preApproved.map(v => (
                        <div key={v.id} className="soft-card p-5 flex items-center justify-between flex-wrap gap-4 border-l-4 border-blue-500">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{v.visitor_name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{v.purpose}</p>
                            <p className="text-xs text-blue-500 mt-1">Expected: {formatDateTime(v.expected_arrival)}</p>
                            <p className="text-xs text-slate-400">Host: {v.host_name || '—'}</p>
                          </div>
                          <button
                            onClick={() => handleQuickCheckIn(v.id)}
                            className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors active:scale-95"
                          >
                            🚪 Check In
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════ CHECK-IN TAB ════════════════════════════════ */}
        {activeTab === 'checkin' && (
          <div className="animate-fade-in-up">
            <div className="max-w-2xl mx-auto">
              <div className="soft-card p-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">🚪 Walk-In Check In</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Register and check in a new visitor at the gate</p>

                {/* Quick search for returning visitors */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Search Returning Visitor</label>
                  <input
                    type="text"
                    className="soft-input w-full mt-1"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => handleVisitorSearch(e.target.value)}
                    id="visitor-search"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map(v => (
                        <button
                          key={v.id}
                          onClick={() => selectExistingVisitor(v)}
                          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{v.name}</span>
                              <span className="text-xs text-slate-400 ml-2">{v.phone}</span>
                            </div>
                            <span className="text-xs text-indigo-500 font-bold">{v.total_visits} visits</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedVisitor && (
                    <div className="mt-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-indigo-700 dark:text-indigo-300">{selectedVisitor.name}</span>
                        <span className="text-xs text-indigo-500 ml-2">{selectedVisitor.phone}</span>
                        <span className="text-xs text-slate-400 ml-2">({selectedVisitor.total_visits} previous visits)</span>
                      </div>
                      <button onClick={() => { setSelectedVisitor(null); setCheckInForm(prev => ({ ...prev, visitor_name: '', visitor_phone: '' })); }} className="text-xs font-bold text-indigo-500">✕ Clear</button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Visitor Name *</label>
                      <input type="text" className="soft-input w-full mt-1" value={checkInForm.visitor_name}
                        onChange={e => setCheckInForm(p => ({ ...p, visitor_name: e.target.value }))}
                        required id="checkin-name" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Phone *</label>
                      <input type="tel" className="soft-input w-full mt-1" value={checkInForm.visitor_phone}
                        onChange={e => setCheckInForm(p => ({ ...p, visitor_phone: e.target.value }))}
                        required id="checkin-phone" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Visitor Type</label>
                      <select className="soft-input w-full mt-1" value={checkInForm.visitor_type}
                        onChange={e => setCheckInForm(p => ({ ...p, visitor_type: e.target.value }))}
                        id="checkin-type">
                        {VISITOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    {user?.role === 'admin' && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Gate</label>
                        <select className="soft-input w-full mt-1" value={checkInForm.gate_type}
                          onChange={e => setCheckInForm(p => ({ ...p, gate_type: e.target.value }))}
                          id="checkin-gate">
                          <option value="main_gate">🏫 Main Gate</option>
                          <option value="hostel">🏠 Hostel</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Purpose of Visit *</label>
                    <input type="text" className="soft-input w-full mt-1" value={checkInForm.purpose}
                      onChange={e => setCheckInForm(p => ({ ...p, purpose: e.target.value }))}
                      placeholder="e.g., Meeting with Prof. X, Admission enquiry..."
                      required id="checkin-purpose" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Person to Meet</label>
                      <input type="text" className="soft-input w-full mt-1" value={checkInForm.host_name}
                        onChange={e => setCheckInForm(p => ({ ...p, host_name: e.target.value }))}
                        placeholder="Faculty / Staff name" id="checkin-host" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                      <input type="text" className="soft-input w-full mt-1" value={checkInForm.host_department}
                        onChange={e => setCheckInForm(p => ({ ...p, host_department: e.target.value }))}
                        placeholder="CSE, ECE, Admin..." id="checkin-dept" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Accompanying</label>
                      <input type="number" className="soft-input w-full mt-1" value={checkInForm.num_accompanying}
                        onChange={e => setCheckInForm(p => ({ ...p, num_accompanying: parseInt(e.target.value) || 0 }))}
                        min="0" max="50" id="checkin-accompanying" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Vehicle No.</label>
                      <input type="text" className="soft-input w-full mt-1" value={checkInForm.vehicle_number}
                        onChange={e => setCheckInForm(p => ({ ...p, vehicle_number: e.target.value }))}
                        placeholder="AP 09 XX 1234" id="checkin-vehicle" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Badge No.</label>
                      <input type="text" className="soft-input w-full mt-1" value={checkInForm.badge_number}
                        onChange={e => setCheckInForm(p => ({ ...p, badge_number: e.target.value }))}
                        placeholder="V-001" id="checkin-badge" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Remarks</label>
                    <textarea className="soft-input w-full mt-1" rows="2" value={checkInForm.remarks}
                      onChange={e => setCheckInForm(p => ({ ...p, remarks: e.target.value }))}
                      placeholder="Any additional notes..." id="checkin-remarks" />
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full" id="checkin-submit">
                    {submitting ? '⏳ Processing...' : '🚪 Check In Visitor'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════ CHECK-OUT TAB ════════════════════════════════ */}
        {activeTab === 'checkout' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                Currently In Campus ({activeVisitors.length})
              </h3>
              <button onClick={loadActive} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">↻ Refresh</button>
            </div>

            {activeVisitors.length === 0 ? (
              <div className="text-center py-16 soft-card">
                <p className="text-6xl mb-4">✅</p>
                <p className="text-slate-500 font-medium">No visitors currently checked in</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {activeVisitors.map(v => (
                  <div key={v.id} className="soft-card p-5 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                          {v.visitor_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-white truncate">{v.visitor_name}</h4>
                          <p className="text-xs text-slate-400">{v.visitor_phone} • {v.purpose}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 ml-13">
                        <VisitorTypeBadge type={v.visitor_type} />
                        <span className="text-xs text-slate-500">→ {v.host_name || 'General'}</span>
                        {v.badge_number && <span className="text-xs font-mono bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2 py-0.5 rounded">🏷️ {v.badge_number}</span>}
                        {v.num_accompanying > 0 && <span className="text-xs text-slate-400">+{v.num_accompanying} guests</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatDuration(v.duration_minutes)}</p>
                        <p className="text-xs text-slate-400">In: {formatTime(v.checked_in_at)}</p>
                      </div>
                      <button
                        onClick={() => handleCheckOut(v.id)}
                        className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95 shadow-md shadow-emerald-500/25"
                        id={`checkout-${v.id}`}
                      >
                        ✓ Check Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════ PRE-APPROVE TAB ════════════════════════════════ */}
        {activeTab === 'preapprove' && (
          <div className="animate-fade-in-up">
            <div className="max-w-2xl mx-auto">
              <div className="soft-card p-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">📋 Pre-Approve Visitor</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Pre-approve an expected visitor for quick check-in at the gate</p>

                <form onSubmit={handlePreApprove} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Visitor Name *</label>
                      <input type="text" className="soft-input w-full mt-1" value={preApproveForm.visitor_name}
                        onChange={e => setPreApproveForm(p => ({ ...p, visitor_name: e.target.value }))}
                        required id="preapprove-name" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Phone *</label>
                      <input type="tel" className="soft-input w-full mt-1" value={preApproveForm.visitor_phone}
                        onChange={e => setPreApproveForm(p => ({ ...p, visitor_phone: e.target.value }))}
                        required id="preapprove-phone" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Visitor Type</label>
                      <select className="soft-input w-full mt-1" value={preApproveForm.visitor_type}
                        onChange={e => setPreApproveForm(p => ({ ...p, visitor_type: e.target.value }))}
                        id="preapprove-type">
                        {VISITOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    {user?.role === 'admin' && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Gate</label>
                        <select className="soft-input w-full mt-1" value={preApproveForm.gate_type}
                          onChange={e => setPreApproveForm(p => ({ ...p, gate_type: e.target.value }))}
                          id="preapprove-gate">
                          <option value="main_gate">🏫 Main Gate</option>
                          <option value="hostel">🏠 Hostel</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Purpose *</label>
                    <input type="text" className="soft-input w-full mt-1" value={preApproveForm.purpose}
                      onChange={e => setPreApproveForm(p => ({ ...p, purpose: e.target.value }))}
                      required id="preapprove-purpose" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Expected Arrival *</label>
                      <input type="datetime-local" className="soft-input w-full mt-1" value={preApproveForm.expected_arrival}
                        onChange={e => setPreApproveForm(p => ({ ...p, expected_arrival: e.target.value }))}
                        required id="preapprove-arrival" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Expected Departure</label>
                      <input type="datetime-local" className="soft-input w-full mt-1" value={preApproveForm.expected_departure}
                        onChange={e => setPreApproveForm(p => ({ ...p, expected_departure: e.target.value }))}
                        id="preapprove-departure" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Accompanying</label>
                      <input type="number" className="soft-input w-full mt-1" value={preApproveForm.num_accompanying}
                        onChange={e => setPreApproveForm(p => ({ ...p, num_accompanying: parseInt(e.target.value) || 0 }))}
                        min="0" id="preapprove-accompanying" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Vehicle No.</label>
                      <input type="text" className="soft-input w-full mt-1" value={preApproveForm.vehicle_number}
                        onChange={e => setPreApproveForm(p => ({ ...p, vehicle_number: e.target.value }))}
                        id="preapprove-vehicle" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Remarks</label>
                    <textarea className="soft-input w-full mt-1" rows="2" value={preApproveForm.remarks}
                      onChange={e => setPreApproveForm(p => ({ ...p, remarks: e.target.value }))}
                      id="preapprove-remarks" />
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full" id="preapprove-submit">
                    {submitting ? '⏳ Processing...' : '📋 Pre-Approve Visitor'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════ VISITOR LOG TAB ════════════════════════════════ */}
        {activeTab === 'log' && (
          <div className="animate-fade-in-up">
            {/* Filters */}
            <div className="soft-card p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Search</label>
                  <input type="text" className="soft-input w-full mt-1" placeholder="Name, phone, purpose..."
                    value={logSearch} onChange={e => setLogSearch(e.target.value)} id="log-search" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Date From</label>
                  <input type="date" className="soft-input w-full mt-1" value={logDateFrom}
                    onChange={e => setLogDateFrom(e.target.value)} id="log-date-from" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Date To</label>
                  <input type="date" className="soft-input w-full mt-1" value={logDateTo}
                    onChange={e => setLogDateTo(e.target.value)} id="log-date-to" />
                </div>
                <div className="flex items-end">
                  <button onClick={loadLog} className="btn-primary w-full" id="log-apply">
                    🔍 Search
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {visitLog.length === 0 ? (
              <div className="text-center py-16 soft-card">
                <p className="text-6xl mb-4">📜</p>
                <p className="text-slate-500 font-medium">No visit records found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Visitor</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Purpose</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Gate</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Check In</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Check Out</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Duration</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitLog.map(v => (
                      <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">{v.visitor_name}</p>
                            <p className="text-xs text-slate-400">{v.visitor_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{v.purpose}</p>
                          {v.host_name && <p className="text-xs text-slate-400">→ {v.host_name}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500">{v.gate_type === 'main_gate' ? '🏫 Main' : '🏠 Hostel'}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{formatDateTime(v.checked_in_at)}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{formatDateTime(v.checked_out_at)}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">{formatDuration(v.duration_minutes)}</td>
                        <td className="py-3 px-4"><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
