import React, { useMemo, useState } from 'react';
import type { HostelFilters } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER BAR — Horizontal Tier 1 filter chips (Airbnb pattern)
// ═══════════════════════════════════════════════════════════════════════════════

interface FilterBarProps {
  filters: HostelFilters;
  onFiltersChange: (filters: HostelFilters) => void;
  matchCount: number;
  onOpenMore: () => void;
  tier2ActiveCount: number;
}

interface ChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  id?: string;
}

function Chip({ label, isActive, onClick, id }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
        isActive
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600'
          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      id={id}
    >
      {label}
    </button>
  );
}

export default function FilterBar({
  filters,
  onFiltersChange,
  matchCount,
  onOpenMore,
  tier2ActiveCount,
}: FilterBarProps) {
  const update = (partial: Partial<HostelFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  // Occupancy filter options
  const occupancyOptions = [
    { label: 'All', value: null },
    { label: '1 Bed', value: 1 },
    { label: '2 Beds', value: 2 },
    { label: '3 Beds', value: 3 },
    { label: '4+', value: 4 },
  ];

  // AC filter options
  const acOptions = [
    { label: 'Any', value: null },
    { label: '❄ AC', value: true },
    { label: 'Non-AC', value: false },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center overflow-x-auto hide-scrollbar gap-2 pb-1">
        {/* Occupancy pills */}
        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
          {occupancyOptions.map(opt => (
            <Chip
              key={opt.label}
              label={opt.label}
              isActive={filters.occupancy === opt.value}
              onClick={() => update({ occupancy: opt.value })}
              id={`filter-occupancy-${opt.value ?? 'all'}`}
            />
          ))}
        </div>

        {/* AC pills */}
        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
          {acOptions.map(opt => (
            <Chip
              key={opt.label}
              label={opt.label}
              isActive={filters.ac === opt.value}
              onClick={() => update({ ac: opt.value })}
              id={`filter-ac-${opt.value ?? 'any'}`}
            />
          ))}
        </div>

        {/* Availability toggle */}
        <Chip
          label={filters.availability ? '✓ Available' : 'Show All'}
          isActive={filters.availability}
          onClick={() => update({ availability: !filters.availability })}
          id="filter-availability"
        />

        {/* More filters */}
        <button
          onClick={onOpenMore}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 flex items-center gap-1.5"
          id="filter-more-btn"
        >
          ⚙ More
          {tier2ActiveCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center">
              {tier2ActiveCount}
            </span>
          )}
        </button>
      </div>

      {/* Match count */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
          {matchCount} room{matchCount !== 1 ? 's' : ''} match{matchCount === 1 ? 'es' : ''}
        </span>
      </div>
    </div>
  );
}
