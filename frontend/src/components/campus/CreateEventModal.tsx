import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Tag, PaperPlaneTilt, Crosshair } from '@phosphor-icons/react';
import api from '../../services/api';

interface Building {
  id: string; name: string; short_name: string | null; building_type: string; color: string | null;
}

interface CreateEventModalProps {
  buildings: Building[];
  selectedBuilding?: Building | null;
  onClose: () => void;
  onCreated: () => void;
  onSwitchToMap?: () => void;
}

const CATEGORIES = [
  { value: 'food', label: '🍕 Food', color: '#ef4444' },
  { value: 'tech', label: '💻 Tech', color: '#6366f1' },
  { value: 'cultural', label: '🎭 Cultural', color: '#ec4899' },
  { value: 'sports', label: '⚽ Sports', color: '#22c55e' },
  { value: 'guest_lecture', label: '🎤 Guest Lecture', color: '#f59e0b' },
  { value: 'workshop', label: '🔧 Workshop', color: '#06b6d4' },
  { value: 'other', label: '📌 Other', color: '#94a3b8' },
];

export default function CreateEventModal({ buildings, selectedBuilding, onClose, onCreated, onSwitchToMap }: CreateEventModalProps) {
  const [form, setForm] = useState({
    title: '', description: '',
    building_id: selectedBuilding?.id || '',
    category: 'other',
    starts_at: '', ends_at: '', contact_info: '', max_attendees: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pinBuilding = selectedBuilding || buildings.find(b => b.id === form.building_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.building_id || !form.starts_at || !form.ends_at) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await api.post('/campus/events', {
        ...form,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto',
          borderRadius: 20, padding: 24, background: 'var(--card-bg, #fff)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={18} weight="fill" color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>Pin Event</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary, #64748b)' }}>Submit for HOD approval</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--card-bg-alt, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Location ────────────────────── */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} weight="bold" /> Location *
            </label>
            {pinBuilding ? (
              /* Locked building chip */
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderRadius: 12, border: `2px solid ${pinBuilding.color || '#6366f1'}44`,
                background: `${pinBuilding.color || '#6366f1'}08`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${pinBuilding.color || '#6366f1'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={14} weight="duotone" style={{ color: pinBuilding.color || '#6366f1' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1e293b)', flex: 1 }}>
                  {pinBuilding.name}
                </span>
                {!selectedBuilding && (
                  <button type="button" onClick={() => setForm({ ...form, building_id: '' })} style={{
                    width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: 'var(--card-bg-alt, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            ) : (
              /* Building dropdown */
              <select style={{
                width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
                border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
                color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
                cursor: 'pointer',
              }}
                value={form.building_id} onChange={e => setForm({ ...form, building_id: e.target.value })}>
                <option value="">Select building...</option>
                {buildings.filter(b => b.building_type !== 'gate' && b.building_type !== 'parking').map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            {/* Pin on map link */}
            {!selectedBuilding && onSwitchToMap && (
              <button type="button" onClick={onSwitchToMap}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, marginTop: 6,
                  padding: 0, border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#6366f1',
                }}>
                <Crosshair size={13} weight="bold" />
                Or pick directly on the map
              </button>
            )}
          </div>

          {/* ── Title ────────────────────── */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'block' }}>
              Event Title *
            </label>
            <input style={{
              width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
              border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
              color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
            }} placeholder="e.g. Dominos Party 🍕"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          {/* ── Category ────────────────────── */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag size={13} weight="bold" /> Category
            </label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                  style={{
                    padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
                    background: form.category === c.value ? `${c.color}22` : 'var(--card-bg-alt, #f1f5f9)',
                    color: form.category === c.value ? c.color : 'var(--text-secondary, #64748b)',
                    outline: form.category === c.value ? `2px solid ${c.color}` : 'none',
                  }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Date/Time ────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} weight="bold" /> Starts *
              </label>
              <input type="datetime-local" style={{
                width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
                border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
                color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
              }}
                value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'block' }}>
                Ends *
              </label>
              <input type="datetime-local" style={{
                width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
                border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
                color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
              }}
                value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>

          {/* ── Description ────────────────────── */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'block' }}>
              Description
            </label>
            <textarea style={{
              width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
              border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
              color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
              resize: 'vertical' as const, minHeight: 60,
            }} placeholder="What's happening?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* ── Contact + Capacity ────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'block' }}>
                Contact
              </label>
              <input style={{
                width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
                border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
                color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
              }} placeholder="Phone or email"
                value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: 5, display: 'block' }}>
                Max Attendees
              </label>
              <input type="number" style={{
                width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
                border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--card-bg-alt, #f8fafc)',
                color: 'var(--text-primary, #1e293b)', outline: 'none', boxSizing: 'border-box' as const,
              }} placeholder="Unlimited"
                value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })} />
            </div>
          </div>

          {/* ── Error ────────────────────── */}
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 12, background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Submit ────────────────────── */}
          <button type="submit" disabled={submitting} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 0', borderRadius: 14, border: 'none', cursor: submitting ? 'wait' : 'pointer',
            background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}>
            {submitting ? 'Submitting...' : <><PaperPlaneTilt size={16} weight="bold" /> Submit for Approval</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
