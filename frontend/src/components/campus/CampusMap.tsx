import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, MapPin, Calendar, X, ForkKnife, Desktop, Radio, BookOpen, Wrench, HardHat, Microphone, Trophy, Car, House, DoorOpen, Crown, SoccerBall, Lightning, TreeEvergreen, Crosshair } from '@phosphor-icons/react';
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

// ── Zone definitions for road labels ─────────────────────────────────────────
const ROAD_ROWS = [
  { row: 0, label: 'Main Campus Road', icon: '🛣️' },
  { row: 4, label: 'Admin Avenue', icon: '🏛️' },
  { row: 10, label: 'Academic Ring Road', icon: '📚' },
  { row: 19, label: 'Knowledge Lane', icon: '📖' },
  { row: 25, label: 'Plaza Walkway', icon: '🎭' },
  { row: 30, label: 'Sports Avenue', icon: '⚽' },
  { row: 38, label: 'Residential Road', icon: '🏠' },
];

// Building type → background tint
const TYPE_TINTS: Record<string, string> = {
  gate: 'rgba(120,113,108,0.12)',
  security: 'rgba(100,116,139,0.12)',
  parking: 'rgba(148,163,184,0.08)',
  transport: 'rgba(14,165,233,0.10)',
  administrative: 'rgba(139,92,246,0.10)',
  academic: 'rgba(99,102,241,0.10)',
  library: 'rgba(13,148,136,0.12)',
  auditorium: 'rgba(236,72,153,0.10)',
  canteen: 'rgba(244,63,94,0.10)',
  sports: 'rgba(22,163,74,0.08)',
  hostel: 'rgba(59,130,246,0.10)',
  amenity: 'rgba(34,197,94,0.10)',
  medical: 'rgba(239,68,68,0.10)',
  shop: 'rgba(245,158,11,0.10)',
  workshop: 'rgba(168,85,247,0.10)',
  research: 'rgba(14,165,233,0.10)',
  infrastructure: 'rgba(71,85,105,0.10)',
  amphitheatre: 'rgba(163,230,53,0.10)',
  religious: 'rgba(245,158,11,0.10)',
  garden: 'rgba(16,185,129,0.12)',
  residential: 'rgba(15,118,110,0.10)',
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

  // Compute grid dimensions from building data
  const maxX = Math.max(...buildings.map(b => b.grid_x + b.grid_w), 24);
  const maxY = Math.max(...buildings.map(b => b.grid_y + b.grid_h), 44);

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
    setSelectedBuilding(null);
  };

  const canPin = (b: Building) => b.building_type !== 'gate' && b.building_type !== 'parking';

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
            {buildings.length} buildings · {events.length} active events
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button onClick={() => setShowCreateEvent(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            <MapPin size={14} weight="bold" /> Pin Event
          </button>
        </div>
      </div>

      {/* ── Map View ────────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          border: '2px solid #1e293b',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* Map title bar */}
          <div style={{
            padding: '8px 14px',
            background: 'rgba(99,102,241,0.15)',
            borderBottom: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: 1, textTransform: 'uppercase' }}>
              📐 AITS Campus Blueprint — Hyderabad
            </span>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              30 × 44 grid · N↑
            </span>
          </div>

          {/* Scrollable map area */}
          <div style={{ overflow: 'auto', padding: 12 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${maxX}, 1fr)`,
              gridTemplateRows: `repeat(${maxY}, 18px)`,
              gap: 2,
              minWidth: 700,
              position: 'relative',
            }}>
              {/* ── Roads ─── */}
              {ROAD_ROWS.map(r => (
                <div key={r.row} style={{
                  gridColumn: `1 / -1`,
                  gridRow: `${r.row + 1}`,
                  background: 'rgba(148,163,184,0.12)',
                  borderTop: '1px dashed rgba(148,163,184,0.25)',
                  borderBottom: '1px dashed rgba(148,163,184,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 4, minHeight: 18,
                }}>
                  <div style={{
                    flex: 1, height: 1,
                    background: 'repeating-linear-gradient(90deg, rgba(250,204,21,0.4) 0px, rgba(250,204,21,0.4) 8px, transparent 8px, transparent 16px)',
                  }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {r.icon} {r.label}
                  </span>
                  <div style={{
                    flex: 1, height: 1,
                    background: 'repeating-linear-gradient(90deg, rgba(250,204,21,0.4) 0px, rgba(250,204,21,0.4) 8px, transparent 8px, transparent 16px)',
                  }} />
                </div>
              ))}

              {/* ── Green patches (decorative) ─── */}
              {[
                { x: 16, y: 5, w: 8, h: 5 },   // garden next to admin
                { x: 20, y: 15, w: 4, h: 4 },   // garden near academic
                { x: 24, y: 26, w: 3, h: 4 },   // garden near social
              ].map((g, i) => (
                <div key={`green-${i}`} style={{
                  gridColumn: `${g.x + 1} / span ${g.w}`,
                  gridRow: `${g.y + 1} / span ${g.h}`,
                  background: 'radial-gradient(ellipse, rgba(34,197,94,0.08) 40%, transparent 70%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <TreeEvergreen size={14} weight="duotone" style={{ color: 'rgba(34,197,94,0.2)' }} />
                </div>
              ))}

              {/* ── Building Cells ─── */}
              {buildings.map(b => {
                const IconComp = ICON_MAP[b.icon || 'Buildings'] || Buildings;
                const evtCount = b.event_count;
                const isSelected = selectedBuilding?.id === b.id;
                const tint = TYPE_TINTS[b.building_type] || 'rgba(99,102,241,0.10)';
                const isSports = b.building_type === 'sports' || b.building_type === 'garden' || b.building_type === 'amphitheatre';
                const isLarge = b.grid_w >= 6 || b.grid_h >= 4;

                return (
                  <motion.div
                    key={b.id}
                    whileHover={{ scale: 1.03, zIndex: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBuildingClick(b)}
                    className="group"
                    style={{
                      gridColumn: `${b.grid_x + 1} / span ${b.grid_w}`,
                      gridRow: `${b.grid_y + 1} / span ${b.grid_h}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 2, padding: '4px 3px',
                      borderRadius: isSports ? 6 : 4,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',

                      // Blueprint style: dark bg with colored border
                      background: isSelected
                        ? `linear-gradient(135deg, ${b.color || '#6366f1'}30, ${b.color || '#6366f1'}15)`
                        : tint,
                      border: `1.5px solid ${isSelected ? b.color || '#6366f1' : `${b.color || '#6366f1'}40`}`,
                      boxShadow: isSelected
                        ? `0 0 12px ${b.color || '#6366f1'}40, inset 0 0 20px ${b.color || '#6366f1'}10`
                        : `inset 0 0 10px rgba(0,0,0,0.1)`,
                    }}
                  >
                    {/* Event badge */}
                    {evtCount > 0 && (
                      <div style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#ef4444', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 800,
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                      }}>
                        {evtCount}
                      </div>
                    )}

                    {/* Icon */}
                    <div style={{
                      width: isLarge ? 22 : 16, height: isLarge ? 22 : 16,
                      borderRadius: 4,
                      background: `${b.color || '#6366f1'}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconComp size={isLarge ? 13 : 10} weight="duotone" style={{ color: b.color || '#6366f1' }} />
                    </div>

                    {/* Label */}
                    <span style={{
                      fontSize: isLarge ? 9 : 7,
                      fontWeight: 700,
                      color: '#e2e8f0',
                      textAlign: 'center',
                      lineHeight: 1.1,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {b.short_name || b.name}
                    </span>

                    {/* Sub-label (only for larger buildings) */}
                    {isLarge && (
                      <span style={{
                        fontSize: 7, color: '#64748b',
                        textAlign: 'center', lineHeight: 1.1,
                        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {b.name !== (b.short_name || b.name) ? b.name : `${b.floor_count}F`}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Map legend bar */}
          <div style={{
            padding: '6px 14px',
            background: 'rgba(15,23,42,0.8)',
            borderTop: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          }}>
            {[
              { label: 'Academic', color: '#6366f1' },
              { label: 'Admin', color: '#8b5cf6' },
              { label: 'Sports', color: '#16a34a' },
              { label: 'Hostel', color: '#3b82f6' },
              { label: 'Canteen', color: '#f43f5e' },
              { label: 'Infra', color: '#64748b' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, border: `1px solid ${l.color}60` }} />
                <span style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Building Detail Panel ──────────────────────────────── */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4"
            style={{ boxShadow: `0 4px 20px ${selectedBuilding.color || '#6366f1'}20` }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${selectedBuilding.color || '#6366f1'}15`,
                  border: `2px solid ${selectedBuilding.color || '#6366f1'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {React.createElement(ICON_MAP[selectedBuilding.icon || 'Buildings'] || Buildings, {
                    size: 20, weight: 'duotone', style: { color: selectedBuilding.color || '#6366f1' }
                  })}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">{selectedBuilding.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedBuilding.building_type.replace('_', ' ')} · {selectedBuilding.floor_count} floor{selectedBuilding.floor_count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canPin(selectedBuilding) && (
                  <button onClick={() => handlePinEvent(selectedBuilding)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <MapPin size={12} weight="bold" /> Pin Event Here
                  </button>
                )}
                <button onClick={() => setSelectedBuilding(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--card-bg-alt, #f1f5f9)' }}>
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Facilities */}
            {selectedBuilding.facilities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedBuilding.facilities.map((f: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${selectedBuilding.color || '#6366f1'}12`, color: selectedBuilding.color || '#6366f1' }}>
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Events at this building */}
            {buildingEvents(selectedBuilding.id).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Live Events</p>
                {buildingEvents(selectedBuilding.id).map(e => (
                  <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{e.title}</span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(e.starts_at).toLocaleString()} — {e.creator_name || 'Unknown'}
                      </p>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: `${STATUS_LABELS[e.status]?.color || '#94a3b8'}18`, color: STATUS_LABELS[e.status]?.color }}>
                      {STATUS_LABELS[e.status]?.label || e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Events List View ─────────────────────────────────────── */}
      {viewMode === 'events' && (
        <div className="flex flex-col gap-2.5">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={48} weight="duotone" className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold">No active events</p>
              <p className="text-xs">Click a building on the map to pin one!</p>
            </div>
          ) : (
            events.map(e => {
              const bld = buildings.find(b => b.id === e.building_id);
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                  <div style={{
                    width: 10, height: 10, borderRadius: 5,
                    background: CATEGORY_COLORS[e.category] || '#94a3b8',
                    flexShrink: 0,
                  }} />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{e.title}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(e.starts_at).toLocaleString()} — by {e.creator_name || 'Unknown'}
                    </p>
                  </div>
                  {bld && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: `${bld.color || '#6366f1'}15`, color: bld.color || '#6366f1' }}>
                      📍 {bld.short_name}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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
