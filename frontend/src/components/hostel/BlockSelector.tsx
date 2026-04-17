import React from 'react';
import { motion } from 'framer-motion';
import type { HostelBuilding } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK SELECTOR — Hostel building cards before floor plan
// First step in the booking funnel: choose which building to explore
// ═══════════════════════════════════════════════════════════════════════════════

interface BlockSelectorProps {
  hostels: HostelBuilding[];
  selectedId: string | null;
  onSelect: (hostel: HostelBuilding) => void;
  loading: boolean;
}

const genderIcon: Record<string, string> = {
  male: '👨',
  female: '👩',
  coed: '🏢',
};

export default function BlockSelector({ hostels, selectedId, onSelect, loading }: BlockSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-shimmer h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (hostels.length === 0) {
    return (
      <div className="text-center py-16 soft-card">
        <p className="text-5xl mb-3">🏗️</p>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No hostels available for booking</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Contact your admin if you believe this is an error</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
        Select Your Block
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        {hostels.map(hostel => {
          const isSelected = selectedId === hostel.id;
          const availPct = hostel.total_beds > 0
            ? Math.round((hostel.available_beds / hostel.total_beds) * 100)
            : 0;
          const fillingFast = hostel.available_beds > 0 && hostel.available_beds <= 5;

          return (
            <motion.button
              key={hostel.id}
              onClick={() => onSelect(hostel)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left p-5 rounded-2xl transition-all duration-200 border-2 ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500 shadow-lg glow-indigo'
                  : 'bg-white dark:bg-slate-800/60 border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
              }`}
              id={`hostel-block-${hostel.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{genderIcon[hostel.gender_type] || '🏢'}</span>
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{hostel.name}</h4>
                  </div>
                  <span className="soft-badge bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 text-[10px] capitalize">
                    {hostel.gender_type} • {hostel.total_floors} floor{hostel.total_floors > 1 ? 's' : ''}
                  </span>
                </div>
                {fillingFast && (
                  <span className="filling-fast-badge">🔥 Filling Fast</span>
                )}
              </div>

              {/* Availability bar */}
              <div className="mt-3">
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${availPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      background: availPct > 30
                        ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                        : availPct > 10
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{hostel.available_beds}</span> beds available
                  </span>
                  <span className="text-xs font-bold text-slate-400">{availPct}%</span>
                </div>
              </div>

              {/* Premium indicator */}
              {hostel.premium_beds > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
                  <span>★</span>
                  <span>{hostel.premium_beds} premium bed{hostel.premium_beds > 1 ? 's' : ''} available</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
