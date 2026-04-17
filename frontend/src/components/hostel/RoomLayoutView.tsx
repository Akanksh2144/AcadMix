import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BedCell from './BedCell';
import RoomShell from './RoomShell';
import BookingBar from './BookingBar';
import CountdownRing from './CountdownRing';
import type { RoomGridData, BedGridItem, BedLockData } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM LAYOUT VIEW — Full room bed picker with SVG shell
// The actual seat-picker screen with individual beds
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomLayoutViewProps {
  gridData: RoomGridData;
  loading: boolean;
  onBack: () => void;
  onLockBed: (bedId: string) => Promise<BedLockData>;
  onConfirmBooking: (bedId: string, paymentRef?: string) => Promise<void>;
  lockError: string | null;
  userId?: string;
}

type ViewState = 'selecting' | 'locked' | 'confirming' | 'success';

export default function RoomLayoutView({
  gridData,
  loading,
  onBack,
  onLockBed,
  onConfirmBooking,
  lockError: externalLockError,
  userId,
}: RoomLayoutViewProps) {
  const [selectedBed, setSelectedBed] = useState<BedGridItem | null>(null);
  const [lockedBed, setLockedBed] = useState<BedLockData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('selecting');
  const [locking, setLocking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [bedErrors, setBedErrors] = useState<Record<string, string>>({});

  const handleBedSelect = useCallback((bed: BedGridItem) => {
    if (viewState === 'locked') return;
    setSelectedBed(prev => prev?.id === bed.id ? null : bed);
    // Clear any previous error on this bed
    setBedErrors(prev => {
      const next = { ...prev };
      delete next[bed.id];
      return next;
    });
  }, [viewState]);

  const handleLock = useCallback(async () => {
    if (!selectedBed) return;
    setLocking(true);
    try {
      const lockData = await onLockBed(selectedBed.id);
      setLockedBed(lockData);
      setViewState('locked');
    } catch (err: any) {
      // 409 Conflict = race condition — someone else locked it
      const status = err?.response?.status;
      if (status === 409 || status === 400) {
        setBedErrors(prev => ({
          ...prev,
          [selectedBed.id]: 'Just taken!',
        }));
        setSelectedBed(null);
      }
    } finally {
      setLocking(false);
    }
  }, [selectedBed, onLockBed]);

  const handleConfirm = useCallback(async () => {
    if (!lockedBed) return;
    setConfirming(true);
    try {
      await onConfirmBooking(lockedBed.bed_id, paymentRef || undefined);
      setViewState('success');
    } catch (err) {
      // Let the parent handle error display
    } finally {
      setConfirming(false);
    }
  }, [lockedBed, paymentRef, onConfirmBooking]);

  const handleLockExpired = useCallback(() => {
    setLockedBed(null);
    setViewState('selecting');
    setSelectedBed(null);
  }, []);

  const decorators = gridData.metadata?.room_decorators;

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="skeleton-shimmer h-8 w-48 rounded-xl" />
        <div className="skeleton-shimmer h-[300px] rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      layoutId={`room-${gridData.room_id}`}
      className="space-y-4 animate-fade-in-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            id="room-layout-back-btn"
          >
            ←
          </button>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              Room {gridData.room_number}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {gridData.hostel_name} • {gridData.beds.filter(b => b.status === 'AVAILABLE').length} bed{gridData.beds.filter(b => b.status === 'AVAILABLE').length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-600" />
            <span className="text-slate-400">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600" />
            <span className="text-slate-400">Reserved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
            <span className="text-slate-400">Occupied</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewState === 'success' ? (
          /* ── SUCCESS STATE ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 soft-card"
          >
            <p className="text-6xl mb-4">🎉</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Booking Confirmed!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Bed {lockedBed?.bed_identifier} in Room {gridData.room_number} is yours
            </p>
            {lockedBed?.is_premium && (
              <p className="text-amber-500 font-bold mt-2">★ Premium — ₹{lockedBed.selection_fee} applied</p>
            )}
            <button
              onClick={onBack}
              className="btn-secondary mt-6"
            >
              View My Allocation
            </button>
          </motion.div>
        ) : viewState === 'locked' && lockedBed ? (
          /* ── LOCKED STATE — Countdown + Confirm ── */
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="soft-card p-6 space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <CountdownRing
                expiresAt={lockedBed.lock_expires_at}
                onExpired={handleLockExpired}
              />
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-1">
                  Bed {lockedBed.bed_identifier} is held for you
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Complete your booking before the timer expires
                </p>
                {lockedBed.is_premium && (
                  <p className="text-amber-500 font-bold mt-1">★ Premium — ₹{lockedBed.selection_fee}</p>
                )}
              </div>
            </div>

            {/* Payment reference or confirmation */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Payment Reference (Optional)
              </label>
              <input
                type="text"
                className="soft-input w-full mt-1"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                placeholder="Enter transaction ID or receipt number"
                id="hostel-payment-ref"
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="btn-primary w-full py-4 text-base"
              id="hostel-confirm-booking-btn"
            >
              {confirming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming...
                </span>
              ) : (
                '✓ Confirm Booking'
              )}
            </button>

            <button
              onClick={handleLockExpired}
              className="text-xs text-slate-400 dark:text-slate-500 font-medium hover:text-indigo-500 transition-colors text-center w-full"
            >
              ← Choose a different bed
            </button>
          </motion.div>
        ) : (
          /* ── SELECTING STATE — Bed Grid ── */
          <motion.div key="selecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RoomShell decorators={decorators} roomNumber={gridData.room_number}>
              <div
                className="grid gap-3"
                style={{
                  gridTemplateRows: `repeat(${gridData.grid_rows}, 1fr)`,
                  gridTemplateColumns: `repeat(${gridData.grid_cols}, 1fr)`,
                }}
              >
                {gridData.beds.map(bed => (
                  <BedCell
                    key={bed.id}
                    bed={bed}
                    isSelected={selectedBed?.id === bed.id}
                    isYourLock={bed.status === 'LOCKED' && false /* TODO: check against userId once lock API returns user info */}
                    onSelect={handleBedSelect}
                    lockError={bedErrors[bed.id]}
                  />
                ))}
              </div>
            </RoomShell>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking bar (only in selecting state) */}
      {viewState === 'selecting' && (
        <BookingBar
          selectedBed={selectedBed}
          onLock={handleLock}
          loading={locking}
        />
      )}
    </motion.div>
  );
}
