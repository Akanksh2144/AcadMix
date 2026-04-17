import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { BedGridItem, BedStatus } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// BED CELL — Individual bed with Framer Motion state animations
// ═══════════════════════════════════════════════════════════════════════════════

interface BedCellProps {
  bed: BedGridItem;
  isSelected: boolean;
  isYourLock: boolean;
  onSelect: (bed: BedGridItem) => void;
  lockError?: string;
}

const statusConfig: Record<BedStatus, {
  bg: string;
  border: string;
  icon: string;
  label: string;
  cursor: string;
}> = {
  AVAILABLE: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
    border: 'border-emerald-200/60 dark:border-emerald-500/30',
    icon: '🛏️',
    label: 'Available',
    cursor: 'cursor-pointer',
  },
  LOCKED: {
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    border: 'border-amber-200/60 dark:border-amber-500/30',
    icon: '🔒',
    label: 'Reserved',
    cursor: 'cursor-not-allowed',
  },
  BOOKED: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    border: 'border-slate-200/60 dark:border-slate-600/30',
    icon: '👤',
    label: 'Occupied',
    cursor: 'cursor-not-allowed',
  },
  MAINTENANCE: {
    bg: 'bed-cell-maintenance',
    border: 'border-red-200/60 dark:border-red-700/30',
    icon: '🔧',
    label: 'Maintenance',
    cursor: 'cursor-not-allowed',
  },
};

export default function BedCell({ bed, isSelected, isYourLock, onSelect, lockError }: BedCellProps) {
  const config = statusConfig[bed.status];
  const isClickable = bed.status === 'AVAILABLE';
  const isPremium = bed.is_premium && bed.status === 'AVAILABLE';

  const cellClasses = useMemo(() => {
    const base = `relative flex flex-col items-center justify-center gap-1 p-3 sm:p-4 rounded-xl border transition-all duration-200 min-h-[90px] sm:min-h-[100px]`;

    if (isYourLock) {
      return `${base} bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-400 dark:border-teal-500 bed-cell-your-lock cursor-default`;
    }
    if (isSelected) {
      return `${base} ${config.bg} ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-[1.03] shadow-xl border-indigo-300 dark:border-indigo-500 cursor-pointer`;
    }
    if (isPremium) {
      return `${base} bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-300/70 dark:border-amber-500/40 bed-cell-premium ${config.cursor}`;
    }
    if (lockError) {
      return `${base} bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-500 animate-shake cursor-not-allowed`;
    }

    return `${base} ${config.bg} border ${config.border} ${config.cursor}`;
  }, [bed.status, isSelected, isYourLock, isPremium, lockError, config]);

  const handleClick = () => {
    if (isClickable) onSelect(bed);
  };

  const tooltipContent = (
    <div className="text-xs space-y-0.5">
      <p className="font-bold">{bed.bed_identifier}</p>
      {bed.category && <p className="text-slate-400">{bed.category}</p>}
      {isPremium && <p className="text-amber-500 font-bold">★ Premium — ₹{bed.selection_fee}</p>}
      {bed.status === 'LOCKED' && <p className="text-amber-500">Reserved by another student</p>}
      {bed.status === 'BOOKED' && <p className="text-slate-400">Already occupied</p>}
      {bed.status === 'MAINTENANCE' && <p className="text-red-400">Under maintenance</p>}
    </div>
  );

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.button
            onClick={handleClick}
            disabled={!isClickable}
            className={cellClasses}
            style={{ gridRow: bed.grid_row, gridColumn: bed.grid_col }}
            whileHover={isClickable ? { scale: 1.04 } : undefined}
            whileTap={isClickable ? { scale: 0.97 } : undefined}
            layout
            id={`bed-${bed.bed_identifier}`}
          >
            {/* Premium star badge */}
            {isPremium && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center text-[10px] text-white shadow-sm">
                ★
              </span>
            )}

            {/* Bed icon */}
            <span className="text-2xl leading-none">{isYourLock ? '🔒' : config.icon}</span>

            {/* Identifier */}
            <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {bed.bed_identifier}
            </span>

            {/* Status label */}
            {isPremium ? (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-full">
                ₹{bed.selection_fee}
              </span>
            ) : bed.status !== 'AVAILABLE' ? (
              <span className={`text-[10px] font-bold ${
                bed.status === 'LOCKED' ? 'text-amber-500' :
                bed.status === 'BOOKED' ? 'text-slate-400' :
                'text-red-400'
              }`}>
                {isYourLock ? 'Your hold' : config.label}
              </span>
            ) : bed.category ? (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-full">
                {bed.category}
              </span>
            ) : null}

            {/* Lock error flash */}
            {lockError && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[9px] font-bold text-red-500 mt-0.5"
              >
                {lockError}
              </motion.span>
            )}
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-lg shadow-xl z-50"
            sideOffset={6}
          >
            {tooltipContent}
            <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-700" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
