import React from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// FLOOR SWITCHER — Pill bar for floor navigation with slide animation
// ═══════════════════════════════════════════════════════════════════════════════

interface FloorSwitcherProps {
  totalFloors: number;
  currentFloor: number;
  onFloorChange: (floor: number) => void;
  roomCountPerFloor?: Record<number, number>;
}

export default function FloorSwitcher({
  totalFloors,
  currentFloor,
  onFloorChange,
  roomCountPerFloor,
}: FloorSwitcherProps) {
  const floors = Array.from({ length: totalFloors }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mr-1 whitespace-nowrap">
        Floor
      </span>
      {floors.map(floor => {
        const isActive = floor === currentFloor;
        const count = roomCountPerFloor?.[floor];

        return (
          <motion.button
            key={floor}
            onClick={() => onFloorChange(floor)}
            whileTap={{ scale: 0.95 }}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            id={`floor-pill-${floor}`}
          >
            {isActive && (
              <motion.span
                layoutId="floor-indicator"
                className="absolute inset-0 bg-indigo-500 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">
              {floor}
              {count != null && (
                <span className={`ml-1 text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                  ({count})
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
