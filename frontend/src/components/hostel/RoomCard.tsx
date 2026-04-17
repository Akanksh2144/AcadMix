import React from 'react';
import { motion } from 'framer-motion';
import type { RoomSummary } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM CARD — Individual room card on the floor plan
// Shows room number, capacity bar, smart badges
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomCardProps {
  room: RoomSummary;
  onSelect: (room: RoomSummary) => void;
  isSelected: boolean;
}

export default function RoomCard({ room, onSelect, isSelected }: RoomCardProps) {
  const bookedCount = room.capacity - room.available_count;
  const isFull = room.available_count === 0;
  const fillingFast = room.available_count > 0 && room.available_count <= 2;
  const hasPremium = room.premium_count > 0;
  const occupancyPct = room.capacity > 0 ? Math.round((bookedCount / room.capacity) * 100) : 0;
  const isAC = room.meta_data?.ac;

  return (
    <motion.button
      layoutId={`room-${room.id}`}
      onClick={() => !isFull && onSelect(room)}
      disabled={isFull}
      whileHover={!isFull ? { scale: 1.03, y: -2 } : undefined}
      whileTap={!isFull ? { scale: 0.98 } : undefined}
      className={`text-left w-full p-3.5 rounded-xl transition-all border-2 min-h-[100px] ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500 shadow-lg'
          : isFull
          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/30 opacity-50 cursor-not-allowed'
          : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/40 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer'
      }`}
      id={`room-card-${room.room_number}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-slate-800 dark:text-white">
          {room.room_number}
        </span>
        <div className="flex items-center gap-1">
          {isAC && (
            <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full font-bold">
              ❄
            </span>
          )}
          {hasPremium && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
              ★{room.premium_count}
            </span>
          )}
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${occupancyPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            background: occupancyPct > 80
              ? '#ef4444'
              : occupancyPct > 50
              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
              : 'linear-gradient(90deg, #10b981, #06b6d4)',
          }}
        />
      </div>

      {/* Availability text */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold ${
          isFull ? 'text-red-500' :
          fillingFast ? 'text-amber-500' :
          'text-emerald-500'
        }`}>
          {isFull
            ? 'Full'
            : `${room.available_count}/${room.capacity} avail`
          }
        </span>
        {fillingFast && (
          <span className="filling-fast-badge">🔥</span>
        )}
      </div>
    </motion.button>
  );
}
