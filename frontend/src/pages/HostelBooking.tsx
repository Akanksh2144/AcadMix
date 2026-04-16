import React, { useState, useEffect, useCallback, useRef } from 'react';
import { hostelAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS (inline SVG to avoid heavy dependency)
// ═══════════════════════════════════════════════════════════════════════════════
const BedIcon = ({ status, premium }) => {
  const colors = {
    AVAILABLE: premium ? '#f59e0b' : '#10b981',
    LOCKED: '#94a3b8',
    BOOKED: '#ef4444',
    MAINTENANCE: '#1e293b',
  };
  const fill = colors[status] || '#94a3b8';
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="20" height="12" rx="2" fill={fill} opacity="0.18" />
      <rect x="2" y="6" width="20" height="12" rx="2" stroke={fill} strokeWidth="1.8" />
      <rect x="4" y="8" width="6" height="4" rx="1" fill={fill} opacity="0.5" />
      {premium && status === 'AVAILABLE' && (
        <polygon points="19,3 20,6 23,6 20.5,8 21.5,11 19,9 16.5,11 17.5,8 15,6 18,6" fill="#f59e0b" />
      )}
    </svg>
  );
};

const BuildingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" />
    <line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" />
    <line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" />
    <rect x="9" y="18" width="6" height="4" />
  </svg>
);

const BackArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const TimerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function CountdownTimer({ expiresAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
        onExpired?.();
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      setUrgent(diff < 120000); // under 2 min
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${urgent ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`} style={{ animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none' }}>
      <TimerIcon />
      <span>{timeLeft === 'EXPIRED' ? '⏰ Lock Expired' : `${timeLeft} remaining`}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BED GRID COMPONENT — The "Sleeper Bus" View
// ═══════════════════════════════════════════════════════════════════════════════
function BedGrid({ gridData, onSelectBed, selectedBedId }) {
  if (!gridData) return null;
  const { grid_rows, grid_cols, beds } = gridData;

  return (
    <div className="relative">
      {/* Room outline */}
      <div
        className="grid gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900/50"
        style={{
          gridTemplateRows: `repeat(${grid_rows}, 1fr)`,
          gridTemplateColumns: `repeat(${grid_cols}, 1fr)`,
        }}
        id="hostel-bed-grid"
      >
        {beds.map((bed) => {
          const isSelected = selectedBedId === bed.id;
          const isClickable = bed.status === 'AVAILABLE';
          return (
            <button
              key={bed.id}
              id={`bed-${bed.bed_identifier}`}
              onClick={() => isClickable && onSelectBed(bed)}
              disabled={!isClickable}
              className={`
                relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl
                transition-all duration-300 min-h-[100px]
                ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed opacity-60'}
                ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-xl' : ''}
                ${bed.status === 'AVAILABLE' && bed.is_premium ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-300/50 dark:border-amber-500/30' : ''}
                ${bed.status === 'AVAILABLE' && !bed.is_premium ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-500/30' : ''}
                ${bed.status === 'LOCKED' ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : ''}
                ${bed.status === 'BOOKED' ? 'bg-red-50 dark:bg-red-900/15 border border-red-200/50 dark:border-red-500/20' : ''}
                ${bed.status === 'MAINTENANCE' ? 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600' : ''}
              `}
              style={{
                gridRow: bed.grid_row,
                gridColumn: bed.grid_col,
              }}
            >
              <BedIcon status={bed.status} premium={bed.is_premium} />
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{bed.bed_identifier}</span>
              {bed.is_premium && bed.status === 'AVAILABLE' && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  ★ ₹{bed.selection_fee}
                </span>
              )}
              {bed.status === 'LOCKED' && (
                <span className="text-[10px] font-bold text-slate-400">Reserved</span>
              )}
              {bed.status === 'BOOKED' && (
                <span className="text-[10px] font-bold text-red-400">Occupied</span>
              )}
              {bed.category && bed.status === 'AVAILABLE' && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-full">{bed.category}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Premium</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Occupied</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT — Progressive Selection Funnel
// ═══════════════════════════════════════════════════════════════════════════════
export default function HostelBooking({ navigate, user }) {
  // Navigation state: 'blocks' → 'floors' → 'grid' → 'locked'
  const [step, setStep] = useState('blocks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data state
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [expandedFloor, setExpandedFloor] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Booking state
  const [selectedBed, setSelectedBed] = useState(null);
  const [lockData, setLockData] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [myAllocation, setMyAllocation] = useState(null);

  // Gatepass state
  const [showGatepass, setShowGatepass] = useState(false);
  const [gatepasses, setGatepasses] = useState([]);
  const [gpForm, setGpForm] = useState({ reason: '', requested_exit: '', expected_return: '' });
  const [gpLoading, setGpLoading] = useState(false);

  // ── Step 1: Load hostels ──
  const loadHostels = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await hostelAPI.getAvailableHostels();
      setHostels(data.data || []);
      // Also check if student already has an allocation
      const allocRes = await hostelAPI.getMyAllocation();
      if (allocRes.data.data) {
        setMyAllocation(allocRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to load hostels');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadHostels(); }, [loadHostels]);

  // ── Step 2: Load rooms ──
  const selectHostel = async (hostel) => {
    setSelectedHostel(hostel);
    setStep('floors');
    setLoading(true);
    try {
      const { data } = await hostelAPI.getFloors(hostel.id);
      setRooms(data.data || []);
    } catch (err) {
      setError('Failed to load rooms');
    }
    setLoading(false);
  };

  // ── Step 3: Load bed grid ──
  const selectRoom = async (room) => {
    setSelectedRoom(room);
    setStep('grid');
    setLoading(true);
    try {
      const { data } = await hostelAPI.getRoomGrid(room.id);
      setGridData(data.data);
    } catch (err) {
      setError('Failed to load room layout');
    }
    setLoading(false);
  };

  // ── Step 3b: Lock bed ──
  const handleLockBed = async () => {
    if (!selectedBed) return;
    setBookingLoading(true);
    setError('');
    try {
      const { data } = await hostelAPI.lockBed({ bed_id: selectedBed.id });
      setLockData(data.data);
      setStep('locked');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to lock bed');
    }
    setBookingLoading(false);
  };

  // ── Step 4: Confirm booking ──
  const handleConfirm = async () => {
    if (!lockData) return;
    setBookingLoading(true);
    setError('');
    try {
      const { data } = await hostelAPI.confirmBooking({
        bed_id: lockData.bed_id,
        payment_reference: '', // Direct booking for now; Razorpay integration later
      });
      setMyAllocation({
        ...data.data,
        hostel_name: selectedHostel?.name,
        room_number: selectedRoom?.room_number,
        bed_identifier: lockData.bed_identifier,
      });
      setStep('blocks');
      setLockData(null);
      setSelectedBed(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Booking failed');
    }
    setBookingLoading(false);
  };

  const handleLockExpired = () => {
    setLockData(null);
    setStep('grid');
    setError('Your lock has expired. Please select a bed again.');
    // Reload grid
    if (selectedRoom) selectRoom(selectedRoom);
  };

  // ── Gatepass handlers ──
  const loadGatepasses = async () => {
    try {
      const { data } = await hostelAPI.myGatepasses();
      setGatepasses(data.data || []);
    } catch {}
  };

  const submitGatepass = async () => {
    if (!gpForm.reason || !gpForm.requested_exit || !gpForm.expected_return) return;
    setGpLoading(true);
    try {
      await hostelAPI.applyGatepass(gpForm);
      setGpForm({ reason: '', requested_exit: '', expected_return: '' });
      loadGatepasses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit gatepass');
    }
    setGpLoading(false);
  };

  // ── Navigation back ──
  const goBack = () => {
    if (step === 'locked') { setStep('grid'); setLockData(null); }
    else if (step === 'grid') { setStep('floors'); setGridData(null); setSelectedBed(null); }
    else if (step === 'floors') { setStep('blocks'); setSelectedHostel(null); }
    else if (showGatepass) { setShowGatepass(false); }
    else { navigate(user?.role === 'student' ? 'student-dashboard' : 'warden-dashboard'); }
  };

  // Group rooms by floor
  const floors = {};
  rooms.forEach(r => {
    if (!floors[r.floor]) floors[r.floor] = [];
    floors[r.floor].push(r);
  });

  const statusColor = (s) => ({
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }[s] || 'bg-slate-100 text-slate-600');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title="Hostel Booking"
        subtitle="Select your ideal room and bed"
        navigate={navigate}
        user={user}
        onLogout={() => navigate('login')}
      />

      <div className="max-w-5xl mx-auto px-4 pb-12 pt-6">
        {/* Current allocation banner */}
        {myAllocation && !showGatepass && (
          <div className="soft-card p-5 mb-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">🏠 Your Current Allocation</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{myAllocation.hostel_name}</span>
                  {' '} → Room <span className="font-bold">{myAllocation.room_number}</span>
                  {' '} → Bed <span className="font-bold">{myAllocation.bed_identifier}</span>
                  {myAllocation.is_premium && <span className="ml-2 text-amber-500 font-bold">★ Premium</span>}
                </p>
              </div>
              <button
                onClick={() => { setShowGatepass(true); loadGatepasses(); }}
                className="btn-secondary text-sm"
                id="hostel-gatepass-btn"
              >
                🚪 Gate Pass
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium animate-fade-in-up">
            {error}
            <button onClick={() => setError('')} className="ml-3 font-bold text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* ── GATEPASS VIEW ── */}
        {showGatepass && (
          <div className="animate-fade-in-up">
            <button onClick={goBack} className="flex items-center gap-1 text-indigo-500 font-bold mb-4 hover:underline"><BackArrow /> Back to Hostel</button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Gate Pass Management</h2>

            {/* Apply */}
            <div className="soft-card p-5 mb-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Apply for Gate Pass</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input type="datetime-local" className="soft-input text-sm" value={gpForm.requested_exit} onChange={e => setGpForm(p => ({ ...p, requested_exit: e.target.value }))} placeholder="Exit Time" id="gp-exit-time" />
                <input type="datetime-local" className="soft-input text-sm" value={gpForm.expected_return} onChange={e => setGpForm(p => ({ ...p, expected_return: e.target.value }))} placeholder="Return Time" id="gp-return-time" />
                <input type="text" className="soft-input text-sm" value={gpForm.reason} onChange={e => setGpForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave" id="gp-reason" />
              </div>
              <button onClick={submitGatepass} disabled={gpLoading} className="btn-primary text-sm" id="gp-submit-btn">
                {gpLoading ? 'Submitting...' : 'Submit Gate Pass'}
              </button>
            </div>

            {/* History */}
            <div className="soft-card p-5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">My Gate Passes</h3>
              {gatepasses.length === 0 ? (
                <p className="text-slate-400 text-sm">No gate passes yet.</p>
              ) : (
                <div className="space-y-3">
                  {gatepasses.map(gp => (
                    <div key={gp.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="font-medium text-sm text-slate-700 dark:text-slate-300">{gp.reason}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(gp.requested_exit).toLocaleDateString()} → {new Date(gp.expected_return).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`soft-badge text-xs ${statusColor(gp.approval_status)}`}>{gp.approval_status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 1: BLOCK SELECTION ── */}
        {!showGatepass && step === 'blocks' && (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Choose Your Block</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Select a hostel building to browse available rooms</p>
            </div>

            {loading ? (
              <DashboardSkeleton variant="content-cards" />
            ) : hostels.length === 0 ? (
              <div className="text-center py-16 soft-card">
                <p className="text-6xl mb-4">🏗️</p>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No hostels available yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Contact admin to set up hostel buildings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                {hostels.map(hostel => (
                  <button
                    key={hostel.id}
                    onClick={() => selectHostel(hostel)}
                    className="soft-card-hover p-6 text-left group"
                    id={`hostel-block-${hostel.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <BuildingIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{hostel.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{hostel.gender_type} • {hostel.total_floors} Floor{hostel.total_floors > 1 ? 's' : ''}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                            🟢 {hostel.available_beds} Available
                          </span>
                          {hostel.premium_beds > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                              ★ {hostel.premium_beds} Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: FLOOR & ROOM LIST ── */}
        {!showGatepass && step === 'floors' && (
          <div className="animate-fade-in-up">
            <button onClick={goBack} className="flex items-center gap-1 text-indigo-500 font-bold mb-4 hover:underline"><BackArrow /> Back to Blocks</button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedHostel?.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Browse floors and rooms</p>
            </div>

            {loading ? (
              <DashboardSkeleton variant="content-list" />
            ) : Object.keys(floors).length === 0 ? (
              <div className="text-center py-12 soft-card">
                <p className="text-4xl mb-3">🚧</p>
                <p className="text-slate-500 font-medium">No rooms set up yet</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {Object.entries(floors).sort(([a], [b]) => Number(a) - Number(b)).map(([floorNum, floorRooms]) => (
                  <div key={floorNum} className="soft-card overflow-hidden">
                    <button
                      onClick={() => setExpandedFloor(expandedFloor === Number(floorNum) ? null : Number(floorNum))}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      id={`floor-${floorNum}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">{floorNum}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Floor {floorNum}</span>
                        <span className="text-xs text-slate-400">{floorRooms.length} rooms</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${expandedFloor === Number(floorNum) ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {expandedFloor === Number(floorNum) && (
                      <div className="border-t border-slate-100 dark:border-slate-700/50 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {floorRooms.map(room => {
                          const isFull = room.available_count === 0;
                          return (
                            <button
                              key={room.id}
                              onClick={() => !isFull && selectRoom(room)}
                              disabled={isFull}
                              className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${isFull ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer'} border border-transparent`}
                              id={`room-${room.room_number}`}
                            >
                              <div>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{room.room_number}</span>
                                {room.template_name && <span className="text-xs text-slate-400 ml-2">{room.template_name}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {room.premium_count > 0 && (
                                  <span className="text-xs font-bold text-amber-500">★{room.premium_count}</span>
                                )}
                                <span className={`soft-badge text-xs ${isFull ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                  {isFull ? 'FULL' : `${room.available_count} left`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: BED GRID ── */}
        {!showGatepass && step === 'grid' && (
          <div className="animate-fade-in-up">
            <button onClick={goBack} className="flex items-center gap-1 text-indigo-500 font-bold mb-4 hover:underline"><BackArrow /> Back to Rooms</button>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {selectedHostel?.name} — Room {gridData?.room_number}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Tap on an available bed to select it</p>
              </div>
            </div>

            {loading ? (
              <DashboardSkeleton variant="content-cards" />
            ) : gridData ? (
              <>
                <BedGrid
                  gridData={gridData}
                  onSelectBed={(bed) => setSelectedBed(bed.id === selectedBed?.id ? null : bed)}
                  selectedBedId={selectedBed?.id}
                />

                {/* Selected bed details + lock button */}
                {selectedBed && (
                  <div className="mt-6 soft-card p-5 border-l-4 border-indigo-500 animate-fade-in-up">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">
                          Bed {selectedBed.bed_identifier}
                          {selectedBed.is_premium && <span className="ml-2 text-amber-500">★ Premium</span>}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {selectedBed.category || 'Standard'}
                          {selectedBed.is_premium && <span className="ml-2 font-bold text-amber-600">+ ₹{selectedBed.selection_fee} selection fee</span>}
                        </p>
                      </div>
                      <button
                        onClick={handleLockBed}
                        disabled={bookingLoading}
                        className="btn-primary"
                        id="hostel-lock-bed-btn"
                      >
                        {bookingLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Locking...
                          </span>
                        ) : (
                          '🔒 Reserve This Bed'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ── STEP 4: LOCKED — Payment/Confirm ── */}
        {!showGatepass && step === 'locked' && lockData && (
          <div className="animate-fade-in-up max-w-lg mx-auto text-center">
            <div className="soft-card p-8 glow-indigo">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Bed Reserved!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Bed <span className="font-bold text-indigo-600 dark:text-indigo-400">{lockData.bed_identifier}</span> is held for you
              </p>

              <CountdownTimer expiresAt={lockData.lock_expires_at} onExpired={handleLockExpired} />

              {lockData.is_premium && lockData.selection_fee > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    Premium selection fee: <span className="text-lg font-bold">₹{lockData.selection_fee}</span>
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={bookingLoading}
                  className="btn-primary w-full text-lg py-4"
                  id="hostel-confirm-booking-btn"
                >
                  {bookingLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : lockData.is_premium && lockData.selection_fee > 0 ? (
                    `Pay ₹${lockData.selection_fee} & Confirm`
                  ) : (
                    '✓ Confirm Booking'
                  )}
                </button>
                <button onClick={goBack} className="btn-ghost text-sm" id="hostel-cancel-lock-btn">
                  Cancel & Release Bed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
