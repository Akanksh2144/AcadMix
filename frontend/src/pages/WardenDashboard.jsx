import React, { useState, useEffect, useCallback } from 'react';
import { hostelAPI } from '../services/api';
import PageHeader from '../components/PageHeader';

// ═══════════════════════════════════════════════════════════════════════════════
// WARDEN DASHBOARD — Building management + gatepass approvals
// ═══════════════════════════════════════════════════════════════════════════════

export default function WardenDashboard({ navigate, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data
  const [dashboard, setDashboard] = useState(null);
  const [pendingGatepasses, setPendingGatepasses] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [gridData, setGridData] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Bulk room creation
  const [bulkForm, setBulkForm] = useState({
    template_id: '', floor_start: 1, floor_end: 1, rooms_per_floor: 10, room_number_prefix: 'R',
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await hostelAPI.wardenDashboard();
      setDashboard(data.data);
      if (data.data?.hostels?.length > 0 && !selectedHostelId) {
        setSelectedHostelId(data.data.hostels[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to load dashboard');
    }
    setLoading(false);
  }, [selectedHostelId]);

  const loadGatepasses = useCallback(async (hostelId) => {
    if (!hostelId) return;
    try {
      const { data } = await hostelAPI.getPendingGatepasses(hostelId);
      setPendingGatepasses(data.data || []);
    } catch {}
  }, []);

  const loadRooms = useCallback(async (hostelId) => {
    if (!hostelId) return;
    try {
      const { data } = await hostelAPI.getRooms(hostelId);
      setRooms(data.data || []);
    } catch {}
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const { data } = await hostelAPI.getTemplates();
      setTemplates(data.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadDashboard(); loadTemplates(); }, [loadDashboard, loadTemplates]);
  useEffect(() => {
    if (selectedHostelId) {
      loadGatepasses(selectedHostelId);
      loadRooms(selectedHostelId);
    }
  }, [selectedHostelId, loadGatepasses, loadRooms]);

  const handleReviewGatepass = async (gpId, action) => {
    try {
      await hostelAPI.reviewGatepass(gpId, { action });
      loadGatepasses(selectedHostelId);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to review gatepass');
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedHostelId || !bulkForm.template_id) return;
    setBulkLoading(true);
    try {
      await hostelAPI.bulkCreateRooms(selectedHostelId, bulkForm);
      loadRooms(selectedHostelId);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create rooms');
    }
    setBulkLoading(false);
  };

  const loadBedGrid = async (roomId) => {
    setSelectedRoomId(roomId);
    try {
      const { data } = await hostelAPI.getBedGrid(roomId);
      setGridData(data.data);
    } catch {}
  };

  const handleTogglePremium = async (bed) => {
    if (!selectedRoomId) return;
    try {
      const newPremium = !bed.is_premium;
      await hostelAPI.togglePremium(selectedRoomId, bed.id, {
        is_premium: newPremium,
        selection_fee: newPremium ? 500 : 0,
      });
      loadBedGrid(selectedRoomId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle premium');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'gatepasses', label: 'Gatepasses' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'setup', label: 'Setup' },
  ];

  const occupancyPct = (occupied, total) => total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title="Warden Dashboard"
        subtitle="Hostel management & operations"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
      />

      <div className="max-w-6xl mx-auto px-4 pb-12 pt-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
            <button onClick={() => setError('')} className="ml-3 font-bold text-red-500">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-8 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`warden-tab-${tab.id}`}
              className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent relative ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm dark:border-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
              {tab.id === 'gatepasses' && pendingGatepasses.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
              </div>
            ) : dashboard ? (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                  <div className="stat-card" style={{ '--stat-accent': '#6366f1', '--stat-accent-end': '#8b5cf6' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Beds</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dashboard.total_beds}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-accent-end': '#06b6d4' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Occupied</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dashboard.occupied}</p>
                    <p className="text-xs text-emerald-500 font-medium mt-1">{occupancyPct(dashboard.occupied, dashboard.total_beds)}% occupancy</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#f59e0b', '--stat-accent-end': '#ef4444' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Available</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dashboard.available}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#ef4444', '--stat-accent-end': '#f43f5e' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending Passes</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dashboard.pending_gatepasses}</p>
                  </div>
                </div>

                {/* Hostel cards */}
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">Your Buildings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                  {dashboard.hostels.map(h => (
                    <div key={h.id} className="soft-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 dark:text-white">{h.name}</h4>
                        <span className="soft-badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 capitalize">{h.gender_type}</span>
                      </div>
                      {/* Occupancy bar */}
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${occupancyPct(h.occupied, h.total_beds)}%`,
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{h.occupied} / {h.total_beds} beds occupied</span>
                        <span className="font-bold">{occupancyPct(h.occupied, h.total_beds)}%</span>
                      </div>
                      {h.pending_gatepasses > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="pulse-dot bg-red-500" />
                          <span className="text-xs text-red-500 font-bold">{h.pending_gatepasses} pending gate passes</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Visitor Management Quick Action */}
                <div className="mt-6">
                  <button
                    onClick={() => navigate('visitor-management', { gateType: 'hostel' })}
                    className="soft-card p-5 w-full text-left hover:scale-[1.01] transition-all active:scale-[0.99] group"
                    id="warden-visitor-mgmt"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl group-hover:scale-110 transition-transform">🛡️</span>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Visitor Management</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track hostel visitors — check-in, check-out, pre-approve</p>
                      </div>
                      <div className="ml-auto text-slate-400 group-hover:text-indigo-500 transition-colors">→</div>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 soft-card">
                <p className="text-6xl mb-4">🏗️</p>
                <p className="text-slate-500 font-medium">No hostels assigned to you yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── GATEPASSES TAB ── */}
        {activeTab === 'gatepasses' && (
          <div className="animate-fade-in-up">
            {/* Hostel selector */}
            {dashboard?.hostels?.length > 1 && (
              <div className="flex gap-2 mb-4">
                {dashboard.hostels.map(h => (
                  <button
                    key={h.id}
                    onClick={() => { setSelectedHostelId(h.id); loadGatepasses(h.id); }}
                    className={`pill-tab text-xs ${selectedHostelId === h.id ? 'pill-tab-active' : 'pill-tab-inactive'}`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}

            {pendingGatepasses.length === 0 ? (
              <div className="text-center py-12 soft-card">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-slate-500 font-medium">No pending gate passes</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {pendingGatepasses.map(gp => (
                  <div key={gp.id} className="soft-card p-5 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{gp.student_name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{gp.reason}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Exit: {new Date(gp.requested_exit).toLocaleString()} → Return: {new Date(gp.expected_return).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewGatepass(gp.id, 'approve')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors active:scale-95"
                        id={`gp-approve-${gp.id}`}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReviewGatepass(gp.id, 'reject')}
                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-600 font-bold text-sm hover:bg-red-500/20 transition-colors active:scale-95"
                        id={`gp-reject-${gp.id}`}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ROOMS TAB ── */}
        {activeTab === 'rooms' && (
          <div className="animate-fade-in-up">
            {/* Hostel selector */}
            {dashboard?.hostels?.length > 1 && (
              <div className="flex gap-2 mb-4">
                {dashboard.hostels.map(h => (
                  <button
                    key={h.id}
                    onClick={() => { setSelectedHostelId(h.id); loadRooms(h.id); setGridData(null); setSelectedRoomId(null); }}
                    className={`pill-tab text-xs ${selectedHostelId === h.id ? 'pill-tab-active' : 'pill-tab-inactive'}`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Room list */}
              <div className="lg:col-span-1">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Rooms</h3>
                {rooms.length === 0 ? (
                  <div className="soft-card p-5 text-center">
                    <p className="text-slate-400 text-sm">No rooms yet. Use Setup tab to create.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {rooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => loadBedGrid(room.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${selectedRoomId === room.id ? 'bg-indigo-50 dark:bg-indigo-900/15 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                        id={`warden-room-${room.room_number}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{room.room_number}</span>
                          <span className="text-xs text-slate-400">F{room.floor}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${room.available_count > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {room.available_count}/{room.capacity} avail
                          </span>
                          {room.premium_count > 0 && (
                            <span className="text-xs text-amber-500 font-medium">★{room.premium_count}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bed grid */}
              <div className="lg:col-span-2">
                {gridData ? (
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">
                      Room {gridData.room_number} — Bed Layout
                    </h3>
                    <div
                      className="grid gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900/50"
                      style={{
                        gridTemplateRows: `repeat(${gridData.grid_rows}, 1fr)`,
                        gridTemplateColumns: `repeat(${gridData.grid_cols}, 1fr)`,
                      }}
                    >
                      {gridData.beds.map(bed => (
                        <div
                          key={bed.id}
                          onClick={() => bed.status !== 'BOOKED' && handleTogglePremium(bed)}
                          className={`
                            flex flex-col items-center justify-center gap-1 p-4 rounded-xl cursor-pointer
                            transition-all duration-200 hover:scale-105
                            ${bed.is_premium ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}
                            ${bed.status === 'BOOKED' ? 'opacity-60 cursor-not-allowed' : ''}
                            ${bed.status === 'MAINTENANCE' ? 'bg-slate-200 dark:bg-slate-700' : ''}
                          `}
                          style={{ gridRow: bed.grid_row, gridColumn: bed.grid_col }}
                          title={`Click to toggle premium for ${bed.bed_identifier}`}
                        >
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{bed.bed_identifier}</span>
                          <span className={`text-[10px] font-bold ${
                            bed.status === 'AVAILABLE' ? 'text-emerald-500' :
                            bed.status === 'BOOKED' ? 'text-red-500' :
                            bed.status === 'LOCKED' ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {bed.status}
                          </span>
                          {bed.is_premium && (
                            <span className="text-[10px] text-amber-500 font-bold">★ ₹{bed.selection_fee}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">💡 Click any non-booked bed to toggle its premium status</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 soft-card">
                    <p className="text-slate-400 text-sm">← Select a room to view its bed layout</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SETUP TAB ── */}
        {activeTab === 'setup' && (
          <div className="animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bulk room creation */}
              <div className="soft-card p-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">📐 Bulk Create Rooms</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Generate rooms from a template across multiple floors. Beds are auto-created.
                </p>

                {dashboard?.hostels?.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Building</label>
                      <select
                        className="soft-input w-full mt-1"
                        value={selectedHostelId || ''}
                        onChange={e => setSelectedHostelId(e.target.value)}
                        id="setup-hostel-select"
                      >
                        {dashboard.hostels.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Room Template</label>
                      <select
                        className="soft-input w-full mt-1"
                        value={bulkForm.template_id}
                        onChange={e => setBulkForm(p => ({ ...p, template_id: e.target.value }))}
                        id="setup-template-select"
                      >
                        <option value="">Select template...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.total_capacity}-seater)</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Floor Start</label>
                        <input type="number" className="soft-input w-full mt-1" value={bulkForm.floor_start} onChange={e => setBulkForm(p => ({ ...p, floor_start: parseInt(e.target.value) || 1 }))} id="setup-floor-start" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Floor End</label>
                        <input type="number" className="soft-input w-full mt-1" value={bulkForm.floor_end} onChange={e => setBulkForm(p => ({ ...p, floor_end: parseInt(e.target.value) || 1 }))} id="setup-floor-end" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Rooms / Floor</label>
                        <input type="number" className="soft-input w-full mt-1" value={bulkForm.rooms_per_floor} onChange={e => setBulkForm(p => ({ ...p, rooms_per_floor: parseInt(e.target.value) || 1 }))} id="setup-rooms-per-floor" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Room Prefix</label>
                        <input type="text" className="soft-input w-full mt-1" value={bulkForm.room_number_prefix} onChange={e => setBulkForm(p => ({ ...p, room_number_prefix: e.target.value }))} id="setup-room-prefix" />
                      </div>
                    </div>
                    <button onClick={handleBulkCreate} disabled={bulkLoading || !bulkForm.template_id} className="btn-primary w-full mt-2" id="setup-bulk-create-btn">
                      {bulkLoading ? 'Creating...' : '🏗️ Generate Rooms & Beds'}
                    </button>
                  </div>
                )}
              </div>

              {/* Templates list */}
              <div className="soft-card p-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">📋 Room Templates</h3>
                {templates.length === 0 ? (
                  <p className="text-slate-400 text-sm">No templates available. Ask admin to create them.</p>
                ) : (
                  <div className="space-y-3">
                    {templates.map(t => (
                      <div key={t.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{t.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {t.total_capacity}-seater • {t.grid_rows}×{t.grid_cols} grid
                            </p>
                          </div>
                          {t.is_global && (
                            <span className="soft-badge bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 text-xs">System</span>
                          )}
                        </div>
                        {/* Mini grid preview */}
                        <div
                          className="grid gap-1 mt-3"
                          style={{
                            gridTemplateRows: `repeat(${t.grid_rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${t.grid_cols}, 1fr)`,
                          }}
                        >
                          {(t.bed_layout || []).map((bed, idx) => (
                            <div
                              key={idx}
                              className={`h-8 rounded flex items-center justify-center text-[10px] font-bold ${bed.is_premium ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}
                              style={{ gridRow: bed.row, gridColumn: bed.col }}
                            >
                              {bed.identifier}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
