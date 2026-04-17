import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BedGridItem } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING BAR — Sticky bottom CTA bar (BookMyShow-style)
// ═══════════════════════════════════════════════════════════════════════════════

interface BookingBarProps {
  selectedBed: BedGridItem | null;
  onLock: () => void;
  loading: boolean;
}

export default function BookingBar({ selectedBed, onLock, loading }: BookingBarProps) {
  return (
    <AnimatePresence>
      {selectedBed ? (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-700"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 sm:px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              {/* Bed info */}
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                  Bed {selectedBed.bed_identifier}
                  {selectedBed.is_premium && (
                    <span className="ml-2 text-amber-500">★ Premium</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedBed.category || 'Standard'}
                  {selectedBed.is_premium && selectedBed.selection_fee > 0 && (
                    <span className="ml-1 font-bold text-amber-600 dark:text-amber-400">
                      + ₹{selectedBed.selection_fee}
                    </span>
                  )}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={onLock}
                disabled={loading}
                className="btn-primary whitespace-nowrap text-sm sm:text-base py-3 px-5 sm:px-8 flex items-center gap-2"
                id="hostel-lock-bed-btn"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Locking...
                  </>
                ) : selectedBed.is_premium && selectedBed.selection_fee > 0 ? (
                  `🔒 Hold — ₹${selectedBed.selection_fee}`
                ) : (
                  '🔒 Hold for 10 min'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-700"
        >
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-3 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              Tap on an available bed to select it
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
