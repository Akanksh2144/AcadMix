import React, { useState } from 'react';
import { useMyGatepasses, useApplyGatepass } from '../../hooks/queries/useHostelQueries';

// ═══════════════════════════════════════════════════════════════════════════════
// GATEPASS PANEL — Apply + view gate passes
// Extracted from HostelBooking.tsx (preserves existing logic)
// ═══════════════════════════════════════════════════════════════════════════════

interface GatepassPanelProps {
  hostelId: string | null;
}

export default function GatepassPanel({ hostelId }: GatepassPanelProps) {
  const { data: gatepasses, isLoading: loadingPasses } = useMyGatepasses();
  const applyMutation = useApplyGatepass();

  const [reason, setReason] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!reason || !exitDate || !returnDate) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    try {
      await applyMutation.mutateAsync({
        reason,
        requested_exit: new Date(exitDate).toISOString(),
        expected_return: new Date(returnDate).toISOString(),
      });
      setReason('');
      setExitDate('');
      setReturnDate('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to apply for gate pass');
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    expired: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Apply form */}
      <div className="soft-card p-5">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
          🎫 Apply for Gate Pass
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
            <input
              className="soft-input w-full mt-1"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Going home for weekend"
              id="gatepass-reason"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Exit Date & Time</label>
              <input
                type="datetime-local"
                className="soft-input w-full mt-1"
                value={exitDate}
                onChange={e => setExitDate(e.target.value)}
                id="gatepass-exit"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Expected Return</label>
              <input
                type="datetime-local"
                className="soft-input w-full mt-1"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                id="gatepass-return"
              />
            </div>
          </div>
          <button
            onClick={handleApply}
            disabled={applyMutation.isPending}
            className="btn-primary w-full"
            id="gatepass-apply-btn"
          >
            {applyMutation.isPending ? 'Submitting...' : '📋 Submit Gate Pass Request'}
          </button>
        </div>
      </div>

      {/* Pass history */}
      <div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-3">
          My Gate Passes
        </h3>
        {loadingPasses ? (
          <div className="space-y-3 stagger-children">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-20 rounded-xl" />)}
          </div>
        ) : !gatepasses?.data?.length ? (
          <div className="text-center py-8 soft-card">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-slate-400 font-medium text-sm">No gate passes yet</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {(gatepasses.data || []).map((gp: any) => (
              <div key={gp.id} className="soft-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{gp.reason}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(gp.requested_exit).toLocaleDateString()} → {new Date(gp.expected_return).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`soft-badge text-[10px] capitalize flex-shrink-0 ${statusColor[gp.approval_status] || statusColor.pending}`}>
                    {gp.approval_status}
                  </span>
                </div>
                {gp.remarks && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">"{gp.remarks}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
