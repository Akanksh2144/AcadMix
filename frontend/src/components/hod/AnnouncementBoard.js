import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Trash, X, WarningCircle, Info, Lightning } from '@phosphor-icons/react';
import { announcementsAPI } from '../../services/api';

const PRIORITY_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', label: 'Info' },
  warning: { icon: WarningCircle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', label: 'Warning' },
  urgent: { icon: Lightning, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', label: 'Urgent' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AnnouncementBoard({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', priority: 'info', visibility: 'all' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await announcementsAPI.list();
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handlePost = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      await announcementsAPI.create(form);
      setForm({ title: '', message: '', priority: 'info', visibility: 'all' });
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to post:', err);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    setConfirmDeleteId(null);
    try {
      await announcementsAPI.delete(id);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDeleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="fixed inset-0 z-[81] flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-[#151B2B] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/[0.06] w-full max-w-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/15 flex items-center justify-center mb-4">
                    <Trash size={28} weight="duotone" className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1.5">Delete Announcement?</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">This announcement will be permanently removed and students will no longer see it.</p>
                </div>
                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />
                <div className="px-6 py-4 flex gap-3">
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(confirmDeleteId)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone size={24} weight="duotone" className="text-indigo-500" />
            Announcement Board
          </h4>
          <p className="text-sm text-slate-500 mt-1">Post department-wide notices visible to faculty & students</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          <Plus size={16} weight="bold" /> New Announcement
        </button>
      </div>

      {/* New Announcement Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-in slide-in-from-top">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-slate-700">New Announcement</h5>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
          </div>
          <input type="text" placeholder="Announcement Title"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="soft-input w-full text-sm" />
          <textarea placeholder="Write your announcement message..."
            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={4} className="soft-input w-full text-sm resize-none" />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Priority</label>
              <div className="flex gap-2">
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, priority: key }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${form.priority === key ? cfg.badge + ' border-current' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                    <cfg.icon size={14} />{cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Visibility</label>
              <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                className="soft-input w-full text-sm">
                <option value="all">All (Faculty + Students)</option>
                <option value="faculty">Faculty Only</option>
                <option value="students">Students Only</option>
              </select>
            </div>
          </div>
          <button onClick={handlePost} disabled={submitting || !form.title.trim() || !form.message.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-all">
            {submitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      )}

      {/* Announcements Feed */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Megaphone size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No announcements yet</p>
          <p className="text-sm mt-1">Post your first department-wide announcement above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.info;
            const IconComp = cfg.icon;
            return (
              <div key={ann.id} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-5 transition-all hover:shadow-md group`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-xl ${cfg.badge}`}>
                      <IconComp size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className={`font-bold ${cfg.text}`}>{ann.title}</h5>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.badge} uppercase`}>
                          {ann.visibility === 'all' ? 'Everyone' : ann.visibility}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{ann.message}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span>By {ann.posted_by}</span>
                        <span>•</span>
                        <span>{timeAgo(ann.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setConfirmDeleteId(ann.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-xl transition-all">
                    <Trash size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
