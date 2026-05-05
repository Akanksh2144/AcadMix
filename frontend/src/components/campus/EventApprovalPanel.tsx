import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, MapPin, Clock, User, CaretDown } from '@phosphor-icons/react';
import api from '../../services/api';

interface CampusEvent {
  id: string; building_name: string | null; title: string; description: string | null;
  category: string; starts_at: string; ends_at: string; status: string;
  creator_name: string | null; visibility: string;
}

interface Props { user: any; }

const ROLE_STATUS_MAP: Record<string, string> = {
  hod: 'pending_hod',
  principal: 'approved_dept',
  director: 'approved_college',
};

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍕', tech: '💻', cultural: '🎭', sports: '⚽',
  guest_lecture: '🎤', workshop: '🔧', other: '📌',
};

export default function EventApprovalPanel({ user }: Props) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showReject, setShowReject] = useState<string | null>(null);

  const pendingStatus = ROLE_STATUS_MAP[user.role] || 'pending_hod';

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campus/events', { params: { status: pendingStatus } });
      setEvents(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load pending events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      setActionId(eventId);
      await api.post(`/campus/events/${eventId}/approve`, { comment: null });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err: any) {
      console.error('Approval failed:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      setActionId(eventId);
      await api.post(`/campus/events/${eventId}/reject`, { comment: rejectComment });
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowReject(null);
      setRejectComment('');
    } catch (err: any) {
      console.error('Rejection failed:', err);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary, #94a3b8)' }}>
        <CheckCircle size={40} weight="duotone" style={{ marginBottom: 8, opacity: 0.4 }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>No pending approvals</p>
        <p style={{ fontSize: 12 }}>All events are up to date.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
        📋 Event Approvals ({events.length})
      </h3>

      {events.map(e => (
        <motion.div key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          style={{
            padding: 16, borderRadius: 14, background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[e.category] || '📌'}</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{e.title}</h4>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary, #64748b)' }}>
                <span><MapPin size={13} style={{ verticalAlign: -2 }} /> {e.building_name || 'N/A'}</span>
                <span><Clock size={13} style={{ verticalAlign: -2 }} /> {new Date(e.starts_at).toLocaleString()}</span>
                <span><User size={13} style={{ verticalAlign: -2 }} /> {e.creator_name || 'Student'}</span>
              </div>
              {e.description && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>{e.description}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => handleApprove(e.id)} disabled={actionId === e.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#22c55e', color: '#fff', fontSize: 12, fontWeight: 700,
                  opacity: actionId === e.id ? 0.6 : 1,
                }}>
                <CheckCircle size={16} weight="bold" /> Approve
              </button>
              <button onClick={() => setShowReject(showReject === e.id ? null : e.id)}
                disabled={actionId === e.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#fee2e2', color: '#ef4444', fontSize: 12, fontWeight: 700,
                  opacity: actionId === e.id ? 0.6 : 1,
                }}>
                <XCircle size={16} weight="bold" /> Reject
              </button>
            </div>
          </div>

          {/* Reject comment */}
          <AnimatePresence>
            {showReject === e.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={rejectComment}
                    onChange={ev => setRejectComment(ev.target.value)}
                    placeholder="Reason for rejection..."
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 12,
                      border: '1.5px solid #fca5a5', background: '#fef2f2', outline: 'none',
                    }}
                  />
                  <button onClick={() => handleReject(e.id)} style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700,
                  }}>
                    Confirm
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
