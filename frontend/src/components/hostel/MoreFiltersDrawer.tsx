import React from 'react';
import type { HostelFilters } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// MORE FILTERS DRAWER — Vaul bottom sheet for Tier 2 filters
// Since Vaul may not be installed, falls back to a modal-style overlay
// ═══════════════════════════════════════════════════════════════════════════════

interface MoreFiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: HostelFilters;
  onFiltersChange: (filters: HostelFilters) => void;
}

const BED_CATEGORIES = ['Standard', 'Window', 'Aisle', 'Corner', 'Bunk-Upper', 'Bunk-Lower'];
const AMENITIES = ['WiFi', 'Study Table', 'Locker', 'Charging Point', 'Fan', 'Geyser'];

export default function MoreFiltersDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
}: MoreFiltersDrawerProps) {
  if (!open) return null;

  const update = (partial: Partial<HostelFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const toggleCategory = (cat: string) => {
    const current = filters.bedCategory || [];
    update({
      bedCategory: current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat],
    });
  };

  const toggleAmenity = (a: string) => {
    const current = filters.amenities || [];
    update({
      amenities: current.includes(a)
        ? current.filter(x => x !== a)
        : [...current, a],
    });
  };

  const handleClear = () => {
    update({
      bedCategory: [],
      priceRange: null,
      attachedBathroom: null,
      amenities: [],
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in-up"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col animate-fade-in-up">
        {/* Handle */}
        <div className="flex items-center justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">More Filters</h3>
          <button
            onClick={handleClear}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600"
          >
            Clear All
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Bed Category */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Bed Category</label>
            <div className="flex flex-wrap gap-2">
              {BED_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filters.bedCategory.includes(cat)
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Attached Bathroom */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Attached Bathroom</label>
            <div className="flex gap-2">
              {[
                { label: 'Any', value: null },
                { label: '🚿 Yes', value: true },
                { label: 'No', value: false },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => update({ attachedBathroom: opt.value })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filters.attachedBathroom === opt.value
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filters.amenities.includes(amenity)
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
