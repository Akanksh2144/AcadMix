import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, MapPin, Calendar, X, ForkKnife, Desktop, Radio, BookOpen, Wrench, HardHat, Microphone, Trophy, Car, House, DoorOpen, Crown, SoccerBall, Lightning } from '@phosphor-icons/react';
import api from '../../services/api';
import CreateEventModal from './CreateEventModal';

// ── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Buildings, MapPin, ForkKnife, Desktop, Radio, BookOpen, Wrench, HardHat,
  Microphone, Trophy, Car, House, DoorOpen, Crown, SoccerBall, Lightning,
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#ef4444', tech: '#6366f1', cultural: '#ec4899', sports: '#22c55e',
  guest_lecture: '#f59e0b', workshop: '#06b6d4', other: '#94a3b8',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_hod: { label: 'Pending HOD', color: '#f59e0b' },
  approved_dept: { label: 'Dept Live', color: '#22c55e' },
  approved_college: { label: 'College Live', color: '#3b82f6' },
  approved_group: { label: 'Group Live', color: '#8b5cf6' },
  rejected: { label: 'Rejected', color: '#ef4444' },
};

interface Building {
  id: string; campus_id: string; college_id: string | null;
  name: string; short_name: string | null; building_type: string;
  floor_count: number; grid_x: number; grid_y: number; grid_w: number; grid_h: number;
  color: string | null; icon: string | null;
  departments: string[]; facilities: string[]; event_count: number;
}

interface CampusEvent {
  id: string; building_id: string; building_name: string | null;
  college_id: string; department_id: string | null; created_by: string;
  creator_name: string | null; title: string; description: string | null;
  category: string; starts_at: string; ends_at: string;
  status: string; visibility: string; contact_info: string | null;
  max_attendees: number | null; created_at: string;
}

interface CampusMapProps {
  user: any;
  navigate?: (page: string, data?: any) => void;
}

export default function CampusMap({ user }: CampusMapProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [pinBuilding, setPinBuilding] = useState<Building | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'events'>('map');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, eRes] = await Promise.all([
        api.get('/campus/buildings'),
        api.get('/campus/events'),
      ]);
      setBuildings(bRes.data?.data || bRes.data || []);
      setEvents(eRes.data?.data || eRes.data || []);
    } catch (err) {
      console.error('Failed to load campus data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute grid dimensions
  const maxX = Math.max(...buildings.map(b => b.grid_x + b.grid_w), 4);
  const maxY = Math.max(...buildings.map(b => b.grid_y + b.grid_h), 5);

  const buildingEvents = (buildingId: string) =>
    events.filter(e => e.building_id === buildingId);

  const handleBuildingClick = (b: Building) => {
    if (selectedBuilding?.id === b.id) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(b);
    }
  };

  const handlePinEvent = (b: Building) => {
    setPinBuilding(b);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: 300 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin size={20} weight="duotone" className="text-indigo-500" />
            Campus Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {buildings.length} buildings · {events.length} active events · <span className="text-indigo-400 font-semibold">Click a building to pin an event</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle pill */}
          <div className="flex bg-slate-100 dark:bg-white/[0.06] rounded-full p-0.5">
            {(['map', 'events'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === v
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}>
                {v === 'map' ? '🗺 Map' : '📅 Events'}
              </button>
            ))}
          </div>
          {/* Pin Event button (opens modal with building dropdown) */}
          <button onClick={() => setShowCreateEvent(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            <MapPin size={14} weight="bold" /> Pin Event
          </button>
        </div>
      </div>

      {/* ── Map View ────────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-sm p-3 sm:p-4 overflow-x-auto">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `72px repeat(${maxX}, 1fr)`,
            gridTemplateRows: `repeat(${maxY}, minmax(80px, 1fr))`,
            gap: 5, minWidth: 600,
          }}>
            {/* ── Zone Labels (left column) ─── */}
            {[
              { row: 0, label: '🚪 Entrance', color: '#78716c' },
              { row: 1, label: '🏛 Admin', color: '#8b5cf6' },
              { row: 2, label: '📚 Academic', color: '#6366f1', span: 2 },
              { row: 4, label: '📖 Resources', color: '#0d9488' },
              { row: 5, label: '🎭 Social', color: '#ec4899' },
              { row: 6, label: '⚽ Sports', color: '#16a34a', span: 2 },
              { row: 8, label: '🏠 Hostels', color: '#3b82f6' },
            ].map(z => (
              <div key={z.row} style={{
                gridColumn: '1', gridRow: `${z.row + 1} / span ${z.span || 1}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
                fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                color: z.color, opacity: 0.7, userSelect: 'none',
              }}>
                {z.label}
              </div>
            ))}

            {/* ── Building Cells ─── */}
            {buildings.map(b => {
              const IconComp = ICON_MAP[b.icon || 'Buildings'] || Buildings;
              const evtCount = b.event_count;
              const isSelected = selectedBuilding?.id === b.id;
              return (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleBuildingClick(b)}
                  className="relative cursor-pointer transition-all group"
                  style={{
                    gridColumn: `${b.grid_x + 2} / span ${b.grid_w}`,
                    gridRow: `${b.grid_y + 1} / span ${b.grid_h}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 3, padding: 8, borderRadius: 12, overflow: 'hidden',
                    background: isSelected
                      ? `linear-gradient(135deg, ${b.color || '#6366f1'}22, ${b.color || '#6366f1'}11)`
                      : 'var(--card-bg-alt, #f8fafc)',
                    border: `2px solid ${isSelected ? b.color || '#6366f1' : 'var(--border, #e2e8f0)'}`,
                    boxShadow: isSelected ? `0 4px 16px ${b.color || '#6366f1'}33` : 'none',
                  }}
                >
                  {/* Event badge */}
                  {evtCount > 0 && (
                    <div className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold" style={{ animation: 'pulse 2s infinite', width: 18, height: 18 }}>
                      {evtCount}
                    </div>
                  )}
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `${b.color || '#6366f1'}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconComp size={15} weight="duotone" style={{ color: b.color || '#6366f1' }} />
                  </div>
                  <span className="text-[10px] font-bold text-center text-slate-800 dark:text-white leading-tight">
                    {b.short_name || b.name}
                  </span>
                  <span className="text-[8px] text-slate-400 text-center leading-tight hidden sm:block truncate w-full px-1">
                    {b.name !== (b.short_name || b.name) ? b.name : b.building_type}
                </span>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}

      {/* ── Events List View ─────────────────────────────────────── */}
      {viewMode === 'events' && (
        <div className="flex flex-col gap-2.5">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={48} weight="duotone" className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold">No active events</p>
              <p className="text-xs">Click a building on the map to pin one!</p>
            </div>
          ) : events.map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-3.5 p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `${CATEGORY_COLORS[e.category] || '#94a3b8'}18` }}>
                <Calendar size={20} weight="duotone" style={{ color: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{e.title}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: `${STATUS_LABELS[e.status]?.color || '#94a3b8'}18`,
                      color: STATUS_LABELS[e.status]?.color || '#94a3b8',
                    }}>
                    {STATUS_LABELS[e.status]?.label || e.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  📍 {e.building_name || 'Unknown'} · 🕐 {new Date(e.starts_at).toLocaleString()}
                </p>
                {e.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Building Detail Panel ────────────────────────────────── */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="rounded-2xl bg-white dark:bg-white/[0.03] shadow-lg"
            style={{ padding: 20, border: `2px solid ${selectedBuilding.color || '#6366f1'}44` }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedBuilding.color || '#6366f1'}18` }}>
                  {React.createElement(ICON_MAP[selectedBuilding.icon || 'Buildings'] || Buildings, {
                    size: 22, weight: 'duotone', style: { color: selectedBuilding.color || '#6366f1' }
                  })}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">{selectedBuilding.name}</h3>
                  <p className="text-xs text-slate-500">{selectedBuilding.building_type} · {selectedBuilding.floor_count} floors</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedBuilding.building_type !== 'gate' && selectedBuilding.building_type !== 'parking' && (
                  <button onClick={() => handlePinEvent(selectedBuilding)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                    <MapPin size={14} weight="bold" /> Pin Event Here
                  </button>
                )}
                <button onClick={() => setSelectedBuilding(null)}
                  className="w-8 h-8 rounded-lg border-none cursor-pointer bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Departments */}
            {selectedBuilding.departments.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {selectedBuilding.departments.map((d: string) => (
                  <span key={d} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: `${selectedBuilding.color || '#6366f1'}15`, color: selectedBuilding.color || '#6366f1' }}>
                    {d}
                  </span>
                ))}
              </div>
            )}

            {/* Facilities */}
            {selectedBuilding.facilities.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-4">
                {selectedBuilding.facilities.map((f: string) => (
                  <span key={f} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}

            {/* Events in building */}
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Events ({buildingEvents(selectedBuilding.id).length})
            </h4>
            {buildingEvents(selectedBuilding.id).length === 0 ? (
              <p className="text-xs text-slate-400">No active events here.</p>
            ) : buildingEvents(selectedBuilding.id).map(e => (
              <div key={e.id} className="flex gap-2.5 p-2.5 rounded-xl mb-1.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                <div className="w-1.5 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{e.title}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(e.starts_at).toLocaleString()} — by {e.creator_name || 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Event Modal (from map-click, building pre-selected) ── */}
      {pinBuilding && (
        <CreateEventModal
          buildings={buildings}
          selectedBuilding={pinBuilding}
          onClose={() => setPinBuilding(null)}
          onCreated={() => { setPinBuilding(null); loadData(); }}
        />
      )}

      {/* ── Create Event Modal (from header button, choose building) ── */}
      {showCreateEvent && (
        <CreateEventModal
          buildings={buildings}
          onClose={() => setShowCreateEvent(false)}
          onCreated={() => { setShowCreateEvent(false); loadData(); }}
          onSwitchToMap={() => { setShowCreateEvent(false); setViewMode('map'); }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
