import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, MapPin, Calendar, Lightning, X, Plus, ForkKnife, Desktop, Radio, BookOpen, Wrench, HardHat, Microphone, Trophy, Car, House, DoorOpen, Crown, SoccerBall, CaretDown, Clock, Users as UsersIcon, CheckCircle, Warning } from '@phosphor-icons/react';
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
  pending_principal: { label: 'Pending Principal', color: '#f59e0b' },
  approved_college: { label: 'College Live', color: '#3b82f6' },
  pending_director: { label: 'Pending Director', color: '#f59e0b' },
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            <MapPin size={22} weight="duotone" style={{ verticalAlign: -3, marginRight: 8, color: '#6366f1' }} />
            Campus Map
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
            {buildings.length} buildings · {events.length} active events
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View toggle pill */}
          <div style={{ display: 'flex', background: 'var(--card-bg, #f1f5f9)', borderRadius: 999, padding: 3 }}>
            {(['map', 'events'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: viewMode === v ? '#6366f1' : 'transparent',
                color: viewMode === v ? '#fff' : 'var(--text-secondary, #64748b)',
              }}>
                {v === 'map' ? '🗺 Map' : '📅 Events'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateEvent(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            <Plus size={16} weight="bold" /> Pin Event
          </button>
        </div>
      </div>

      {/* ── Map View ────────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxX}, 1fr)`,
          gridTemplateRows: `repeat(${maxY}, minmax(100px, 1fr))`,
          gap: 8, padding: 16, borderRadius: 16,
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {buildings.map(b => {
            const IconComp = ICON_MAP[b.icon || 'Buildings'] || Buildings;
            const evtCount = b.event_count;
            const isSelected = selectedBuilding?.id === b.id;
            return (
              <motion.div
                key={b.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBuilding(isSelected ? null : b)}
                style={{
                  gridColumn: `${b.grid_x + 1} / span ${b.grid_w}`,
                  gridRow: `${b.grid_y + 1} / span ${b.grid_h}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: 12, borderRadius: 14, cursor: 'pointer',
                  position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                  background: isSelected
                    ? `linear-gradient(135deg, ${b.color || '#6366f1'}22, ${b.color || '#6366f1'}11)`
                    : 'var(--card-bg-alt, #f8fafc)',
                  border: `2px solid ${isSelected ? b.color || '#6366f1' : 'var(--border, #e2e8f0)'}`,
                  boxShadow: isSelected ? `0 4px 16px ${b.color || '#6366f1'}33` : 'none',
                }}
              >
                {/* Event badge */}
                {evtCount > 0 && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6, width: 22, height: 22,
                    borderRadius: '50%', background: '#ef4444', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, animation: 'pulse 2s infinite',
                  }}>
                    {evtCount}
                  </div>
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${b.color || '#6366f1'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComp size={20} weight="duotone" style={{ color: b.color || '#6366f1' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--text-primary, #1e293b)' }}>
                  {b.short_name || b.name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary, #94a3b8)', textAlign: 'center' }}>
                  {b.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Events List View ─────────────────────────────────────── */}
      {viewMode === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary, #94a3b8)' }}>
              <Calendar size={48} weight="duotone" style={{ marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>No active events</p>
              <p style={{ fontSize: 13 }}>Pin an event to get started!</p>
            </div>
          ) : events.map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', gap: 14, padding: 16, borderRadius: 14,
                background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${CATEGORY_COLORS[e.category] || '#94a3b8'}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calendar size={22} weight="duotone" style={{ color: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{e.title}</h4>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: `${STATUS_LABELS[e.status]?.color || '#94a3b8'}18`,
                    color: STATUS_LABELS[e.status]?.color || '#94a3b8',
                  }}>
                    {STATUS_LABELS[e.status]?.label || e.status}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary, #64748b)' }}>
                  📍 {e.building_name || 'Unknown'} · 🕐 {new Date(e.starts_at).toLocaleString()}
                </p>
                {e.description && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                    {e.description}
                  </p>
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
            style={{
              padding: 20, borderRadius: 16, background: 'var(--card-bg, #fff)',
              border: `2px solid ${selectedBuilding.color || '#6366f1'}44`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${selectedBuilding.color || '#6366f1'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {React.createElement(ICON_MAP[selectedBuilding.icon || 'Buildings'] || Buildings, {
                    size: 24, weight: 'duotone', style: { color: selectedBuilding.color || '#6366f1' }
                  })}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                    {selectedBuilding.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary, #64748b)' }}>
                    {selectedBuilding.building_type} · {selectedBuilding.floor_count} floors
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedBuilding(null)} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--card-bg-alt, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Departments */}
            {selectedBuilding.departments.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {selectedBuilding.departments.map((d: string) => (
                  <span key={d} style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: `${selectedBuilding.color || '#6366f1'}15`,
                    color: selectedBuilding.color || '#6366f1',
                  }}>{d}</span>
                ))}
              </div>
            )}

            {/* Facilities */}
            {selectedBuilding.facilities.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {selectedBuilding.facilities.map((f: string) => (
                  <span key={f} style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: 'var(--card-bg-alt, #f1f5f9)', color: 'var(--text-secondary, #64748b)',
                  }}>✓ {f}</span>
                ))}
              </div>
            )}

            {/* Events in building */}
            <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              Events ({buildingEvents(selectedBuilding.id).length})
            </h4>
            {buildingEvents(selectedBuilding.id).length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>No active events here.</p>
            ) : buildingEvents(selectedBuilding.id).map(e => (
              <div key={e.id} style={{
                display: 'flex', gap: 10, padding: 10, borderRadius: 10, marginBottom: 6,
                background: 'var(--card-bg-alt, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
              }}>
                <div style={{ width: 6, borderRadius: 3, background: CATEGORY_COLORS[e.category] || '#94a3b8', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{e.title}</span>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary, #64748b)' }}>
                    {new Date(e.starts_at).toLocaleString()} — by {e.creator_name || 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Event Modal ───────────────────────────────────── */}
      {showCreateEvent && (
        <CreateEventModal
          buildings={buildings}
          onClose={() => setShowCreateEvent(false)}
          onCreated={() => { setShowCreateEvent(false); loadData(); }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
