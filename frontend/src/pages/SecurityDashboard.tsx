import React, { useState, useEffect, useCallback } from 'react';
import { visitorAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';
import CampusMap from '../components/campus/CampusMap';


// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY DASHBOARD — Main gate security guard's landing page
// ═══════════════════════════════════════════════════════════════════════════════

const QUICK_ACTIONS = [
  { id: 'checkin', icon: '🚪', label: 'Check In', sublabel: 'Walk-in visitor', accent: '#6366f1' },
  { id: 'checkout', icon: '✅', label: 'Check Out', sublabel: 'Outgoing visitor', accent: '#10b981' },
  { id: 'preapprove', icon: '📋', label: 'Pre-Approved', sublabel: 'Expected arrivals', accent: '#3b82f6' },
  { id: 'log', icon: '📜', label: 'Visitor Log', sublabel: 'History & reports', accent: '#8b5cf6' },
];

export default function SecurityDashboard({ navigate, user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeVisitors, setActiveVisitors] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, activeRes] = await Promise.all([
        visitorAPI.dashboard({ gate_type: 'main_gate' }),
        visitorAPI.getActive({ gate_type: 'main_gate' }),
      ]);
      setStats(dashRes.data.data);
      setActiveVisitors(activeRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const firstName = user?.name?.split(' ')[0] || 'Guard';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title="Security Dashboard"
        subtitle="Main gate operations"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
      />

      <div className="max-w-6xl mx-auto px-4 pb-12 pt-6">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            Welcome, {firstName} 🛡️
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Live Gate Status</span>
        </div>

        {/* Stats */}
        {loading ? (
          <DashboardSkeleton variant="content-cards" />
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
            <div className="stat-card" style={{ '--stat-accent': '#6366f1', '--stat-accent-end': '#8b5cf6' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">In Campus Now</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.currently_in_campus}</p>
            </div>
            <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-accent-end': '#06b6d4' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Today Total</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.total_today}</p>
            </div>
            <div className="stat-card" style={{ '--stat-accent': '#f59e0b', '--stat-accent-end': '#ef4444' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.pending_approval}</p>
              {stats.pending_approval > 0 && <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">Needs action</p>}
            </div>
            <div className="stat-card" style={{ '--stat-accent': '#3b82f6', '--stat-accent-end': '#6366f1' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pre-Approved</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.pre_approved_upcoming}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => navigate('visitor-management', { defaultTab: action.id })}
              className="soft-card p-5 text-left hover:scale-[1.02] transition-all active:scale-95 group"
              id={`security-action-${action.id}`}
            >
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{action.icon}</span>
              <h4 className="font-bold text-slate-800 dark:text-white">{action.label}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{action.sublabel}</p>
            </button>
          ))}
        </div>

        {/* Recent Active Visitors */}
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">
          Currently In Campus ({activeVisitors.length})
        </h3>
        {activeVisitors.length === 0 ? (
          <div className="text-center py-12 soft-card">
            <p className="text-4xl mb-3">🏫</p>
            <p className="text-slate-500 font-medium">No visitors currently on campus</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {activeVisitors.slice(0, 5).map(v => (
              <div key={v.id} className="soft-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                  {v.visitor_name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{v.visitor_name}</h4>
                  <p className="text-xs text-slate-400 truncate">{v.purpose}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {v.duration_minutes != null ? (v.duration_minutes < 60 ? `${v.duration_minutes}m` : `${Math.floor(v.duration_minutes / 60)}h ${v.duration_minutes % 60}m`) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Since {v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            ))}
            {activeVisitors.length > 5 && (
              <button
                onClick={() => navigate('visitor-management', { defaultTab: 'checkout' })}
                className="w-full text-center py-3 text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                View all {activeVisitors.length} visitors →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
