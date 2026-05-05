import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, MapPin, Calendar, X, ForkKnife, Desktop, Radio, BookOpen, Wrench, HardHat, Microphone, Trophy, Car, House, DoorOpen, Crown, SoccerBall, Lightning } from '@phosphor-icons/react';
import api from '../../services/api';
import CreateEventModal from './CreateEventModal';

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

// Road definitions — creates an actual connected network
const H_ROADS = [
  { row: 0, label: 'Main Campus Road' },
  { row: 5, label: 'Admin Avenue' },
  { row: 11, label: 'Academic Ring Road' },
  { row: 21, label: 'Knowledge Lane' },
  { row: 27, label: 'Plaza Walkway' },
  { row: 33, label: 'Sports Avenue' },
  { row: 41, label: 'Residential Road' },
];
const V_ROAD_COLS = [7, 17]; // vertical spine roads connecting all H roads
const GRID_COLS = 24;

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
interface CampusMapProps { user: any; navigate?: (page: string, data?: any) => void; }

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
      const [bRes, eRes] = await Promise.all([api.get('/campus/buildings'), api.get('/campus/events')]);
      setBuildings(bRes.data?.data || bRes.data || []);
      setEvents(eRes.data?.data || eRes.data || []);
    } catch (err) { console.error('Failed to load campus data:', err); }
    finally { setLoading(false); }
  };

  const maxY = Math.max(...buildings.map(b => b.grid_y + b.grid_h), 47);
  const buildingEvents = (id: string) => events.filter(e => e.building_id === id);
  const handleBuildingClick = (b: Building) => setSelectedBuilding(selectedBuilding?.id === b.id ? null : b);
  const handlePinEvent = (b: Building) => { setPinBuilding(b); setSelectedBuilding(null); };
  const canPin = (b: Building) => b.building_type !== 'gate' && b.building_type !== 'parking';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--accent, #6366f1)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={18} weight="duotone" style={{ color: 'var(--accent, #6366f1)' }} /> Campus Map
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
            {buildings.length} buildings · {events.length} active events
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg-muted, #f1f5f9)', borderRadius: 999, padding: 2 }}>
            {(['map', 'events'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: viewMode === v ? 'var(--accent, #6366f1)' : 'transparent',
                color: viewMode === v ? '#fff' : 'var(--text-muted, #94a3b8)',
              }}>
                {v === 'map' ? '🗺 Map' : '📅 Events'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateEvent(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 16px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', color: '#fff',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}>
            <MapPin size={12} weight="bold" /> Pin Event
          </button>
        </div>
      </div>

      {/* ── MAP VIEW ── */}
      {viewMode === 'map' && (
        <div className="campus-map-container" style={{
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
          background: 'var(--bg-surface, #f8fafc)',
        }}>
          {/* Title */}
          <div style={{
            padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-muted, #f1f5f9)', borderBottom: '1px solid var(--border, #e2e8f0)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', letterSpacing: 1, textTransform: 'uppercase' }}>
              📐 AITS Campus Layout
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted, #94a3b8)' }}>N ↑</span>
          </div>

          {/* Grid */}
          <div style={{ overflow: 'auto', padding: 10 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${maxY}, 20px)`,
              gap: 2, minWidth: 720, position: 'relative',
            }}>
              {/* ── Horizontal Roads ── */}
              {H_ROADS.map(r => (
                <div key={`hr-${r.row}`} style={{
                  gridColumn: '1 / -1', gridRow: `${r.row + 1}`,
                  background: 'var(--road-bg, #d1d5db)', borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <div style={{ flex: 1, height: 1, borderTop: '2px dashed var(--road-line, #fbbf24)' }} />
                  <span style={{ fontSize: 7, fontWeight: 800, color: 'var(--road-text, #6b7280)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {r.label}
                  </span>
                  <div style={{ flex: 1, height: 1, borderTop: '2px dashed var(--road-line, #fbbf24)' }} />
                </div>
              ))}

              {/* ── Vertical Roads ── */}
              {V_ROAD_COLS.map(col => (
                <div key={`vr-${col}`} style={{
                  gridColumn: `${col + 1}`, gridRow: `1 / ${maxY + 1}`,
                  background: 'var(--road-bg, #e2e8f0)', borderRadius: 2,
                  position: 'relative', pointerEvents: 'none', zIndex: 0,
                }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: 0, bottom: 0, width: 0,
                    borderLeft: '2px dashed var(--road-line, #fbbf24)',
                  }} />
                </div>
              ))}

              {/* ── Buildings ── */}
              {buildings.map(b => {
                const IconComp = ICON_MAP[b.icon || 'Buildings'] || Buildings;
                const isSelected = selectedBuilding?.id === b.id;
                const isLarge = b.grid_w >= 5 || b.grid_h >= 4;
                const isSports = ['sports','garden','amphitheatre'].includes(b.building_type);

                return (
                  <motion.div key={b.id}
                    whileHover={{ scale: 1.04, zIndex: 20 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleBuildingClick(b)}
                    style={{
                      gridColumn: `${b.grid_x + 1} / span ${b.grid_w}`,
                      gridRow: `${b.grid_y + 1} / span ${b.grid_h}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 2, padding: 4, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      borderRadius: isSports ? 8 : 5,
                      background: isSelected ? `${b.color}18` : 'var(--building-bg, #ffffff)',
                      border: `1.5px solid ${isSelected ? b.color || '#6366f1' : 'var(--building-border, #e2e8f0)'}`,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${b.color}30, 0 2px 8px ${b.color}20`
                        : '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Event badge */}
                    {b.event_count > 0 && (
                      <div style={{
                        position: 'absolute', top: 2, right: 2, width: 14, height: 14,
                        borderRadius: '50%', background: '#ef4444', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 7, fontWeight: 800,
                      }}>{b.event_count}</div>
                    )}
                    {/* Color strip at top */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: b.color || '#6366f1', borderRadius: '5px 5px 0 0', opacity: 0.7,
                    }} />
                    <IconComp size={isLarge ? 14 : 10} weight="duotone" style={{ color: b.color || '#6366f1', flexShrink: 0, marginTop: 2 }} />
                    <span style={{
                      fontSize: isLarge ? 8 : 6.5, fontWeight: 700, textAlign: 'center', lineHeight: 1.1,
                      color: 'var(--text-primary, #1e293b)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{b.short_name}</span>
                    {isLarge && (
                      <span style={{ fontSize: 6, color: 'var(--text-muted, #94a3b8)', textAlign: 'center', lineHeight: 1.1 }}>
                        {b.name}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            padding: '5px 14px', borderTop: '1px solid var(--border, #e2e8f0)',
            background: 'var(--bg-muted, #f1f5f9)', display: 'flex', gap: 12, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Academic', color: '#6366f1' }, { label: 'Admin', color: '#8b5cf6' },
              { label: 'Sports', color: '#16a34a' }, { label: 'Hostel', color: '#3b82f6' },
              { label: 'Canteen', color: '#f43f5e' }, { label: 'Road', color: '#d1d5db', isDashed: true },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 6, borderRadius: 1, background: l.color, border: l.isDashed ? '1px dashed #fbbf24' : 'none' }} />
                <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Building Detail Panel ── */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{
              borderRadius: 16, padding: 16,
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-card, #fff)',
              boxShadow: `0 4px 20px ${selectedBuilding.color || '#6366f1'}15`,
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${selectedBuilding.color}12`, border: `2px solid ${selectedBuilding.color}30`,
                }}>
                  {React.createElement(ICON_MAP[selectedBuilding.icon || 'Buildings'] || Buildings, {
                    size: 18, weight: 'duotone', style: { color: selectedBuilding.color }
                  })}
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700 }}>{selectedBuilding.name}</h3>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {selectedBuilding.building_type.replace('_', ' ')} · {selectedBuilding.floor_count}F
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {canPin(selectedBuilding) && (
                  <button onClick={() => handlePinEvent(selectedBuilding)} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 999,
                    fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', color: '#fff',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  }}><MapPin size={10} weight="bold" /> Pin Event Here</button>
                )}
                <button onClick={() => setSelectedBuilding(null)} style={{
                  width: 28, height: 28, borderRadius: 999, border: '1px solid var(--border)', cursor: 'pointer',
                  background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><X size={12} /></button>
              </div>
            </div>
            {selectedBuilding.facilities?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {selectedBuilding.facilities.map((f: string, i: number) => (
                  <span key={i} style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 600,
                    background: `${selectedBuilding.color}10`, color: selectedBuilding.color,
                  }}>{f}</span>
                ))}
              </div>
            )}
            {buildingEvents(selectedBuilding.id).length > 0 && (
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Live Events</p>
                {buildingEvents(selectedBuilding.id).map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: CATEGORY_COLORS[e.category] || '#94a3b8', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{e.title}</span>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>{new Date(e.starts_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Events List View ── */}
      {viewMode === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <Calendar size={40} weight="duotone" style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>No active events</p>
              <p style={{ fontSize: 11 }}>Pin one from the map!</p>
            </div>
          ) : events.map(e => {
            const bld = buildings.find(b => b.id === e.building_id);
            return (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--bg-card)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: CATEGORY_COLORS[e.category] || '#94a3b8', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{e.title}</span>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(e.starts_at).toLocaleString()} — {e.creator_name || 'Unknown'}
                  </p>
                </div>
                {bld && <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: `${bld.color}12`, color: bld.color }}>📍 {bld.short_name}</span>}
              </div>
            );
          })}
        </div>
      )}

      {pinBuilding && <CreateEventModal buildings={buildings} selectedBuilding={pinBuilding} onClose={() => setPinBuilding(null)} onCreated={() => { setPinBuilding(null); loadData(); }} />}
      {showCreateEvent && <CreateEventModal buildings={buildings} onClose={() => setShowCreateEvent(false)} onCreated={() => { setShowCreateEvent(false); loadData(); }} onSwitchToMap={() => { setShowCreateEvent(false); setViewMode('map'); }} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .campus-map-container {
          --road-bg: #e2e8f0; --road-line: #fbbf24; --road-text: #64748b;
          --building-bg: #ffffff; --building-border: #e2e8f0;
        }
        .dark .campus-map-container, [data-theme="dark"] .campus-map-container {
          --road-bg: #334155; --road-line: #ca8a04; --road-text: #94a3b8;
          --building-bg: #1e293b; --building-border: #334155;
        }
        @media (prefers-color-scheme: dark) {
          .campus-map-container {
            --road-bg: #334155; --road-line: #ca8a04; --road-text: #94a3b8;
            --building-bg: #1e293b; --building-border: #334155;
          }
        }
      `}</style>
    </div>
  );
}
