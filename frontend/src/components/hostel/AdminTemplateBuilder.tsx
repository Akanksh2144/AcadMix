import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BedLayoutItem, RoomDecorators } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN TEMPLATE BUILDER — Click-to-toggle grid builder for room templates
// No @dnd-kit — pure click interaction. Deferred drag-and-drop to Phase 2.
// ═══════════════════════════════════════════════════════════════════════════════

interface AdminTemplateBuilderProps {
  onSave: (template: {
    name: string;
    total_capacity: number;
    grid_rows: number;
    grid_cols: number;
    beds: BedLayoutItem[];
    meta_data: { room_decorators: RoomDecorators };
  }) => void;
  saving: boolean;
}

function generateIdentifier(row: number, col: number): string {
  const letter = String.fromCharCode(64 + row); // A, B, C...
  return `${letter}${col}`;
}

export default function AdminTemplateBuilder({ onSave, saving }: AdminTemplateBuilderProps) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(3);
  const [beds, setBeds] = useState<BedLayoutItem[]>([]);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);

  // Decorators
  const [windowWall, setWindowWall] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [doorPosition, setDoorPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [bathroomCorner, setBathroomCorner] = useState<string | null>(null);

  // Build a lookup map for fast cell queries
  const bedMap = useMemo(() => {
    const map = new Map<string, BedLayoutItem>();
    beds.forEach(b => map.set(`${b.row}-${b.col}`, b));
    return map;
  }, [beds]);

  const toggleCell = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    const existing = bedMap.get(key);

    if (existing) {
      // If this bed is selected for editing, just deselect
      if (selectedBed === key) {
        setSelectedBed(null);
      } else {
        // Select for editing
        setSelectedBed(key);
      }
    } else {
      // Place a new bed
      const newBed: BedLayoutItem = {
        identifier: generateIdentifier(row, col),
        row,
        col,
        category: 'Standard',
        is_premium: false,
        base_fee: 0,
      };
      setBeds(prev => [...prev, newBed]);
      setSelectedBed(key);
    }
  }, [bedMap, selectedBed]);

  const removeBed = useCallback((row: number, col: number) => {
    setBeds(prev => prev.filter(b => !(b.row === row && b.col === col)));
    setSelectedBed(null);
  }, []);

  const updateBed = useCallback((key: string, updates: Partial<BedLayoutItem>) => {
    setBeds(prev => prev.map(b => {
      if (`${b.row}-${b.col}` === key) return { ...b, ...updates };
      return b;
    }));
  }, []);

  const selectedBedData = selectedBed ? bedMap.get(selectedBed) : null;

  const handleSave = () => {
    if (!name || beds.length === 0) return;
    onSave({
      name,
      total_capacity: beds.length,
      grid_rows: rows,
      grid_cols: cols,
      beds,
      meta_data: {
        room_decorators: {
          window_wall: windowWall,
          door_position: doorPosition,
          ...(bathroomCorner ? { bathroom_corner: bathroomCorner as any } : {}),
        },
      },
    });
  };

  // When rows/cols change, prune beds that are out of bounds
  const handleRowsChange = (newRows: number) => {
    setRows(newRows);
    setBeds(prev => prev.filter(b => b.row <= newRows));
    setSelectedBed(null);
  };

  const handleColsChange = (newCols: number) => {
    setCols(newCols);
    setBeds(prev => prev.filter(b => b.col <= newCols));
    setSelectedBed(null);
  };

  return (
    <div className="space-y-6">
      {/* Template name */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Template Name</label>
        <input
          type="text"
          className="soft-input w-full mt-1"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. 3-Seater Window Room"
          id="template-name-input"
        />
      </div>

      {/* Grid dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Rows</label>
          <select
            className="soft-input w-full mt-1"
            value={rows}
            onChange={e => handleRowsChange(parseInt(e.target.value))}
            id="template-rows-select"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n} row{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Columns</label>
          <select
            className="soft-input w-full mt-1"
            value={cols}
            onChange={e => handleColsChange(parseInt(e.target.value))}
            id="template-cols-select"
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} col{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual grid builder */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">
          Click to Place Beds ({beds.length} placed)
        </label>
        <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div
            className="grid gap-3"
            style={{
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {Array.from({ length: rows }, (_, rIdx) =>
              Array.from({ length: cols }, (_, cIdx) => {
                const r = rIdx + 1;
                const c = cIdx + 1;
                const key = `${r}-${c}`;
                const bed = bedMap.get(key);
                const isActive = selectedBed === key;

                return (
                  <motion.button
                    key={key}
                    onClick={() => toggleCell(r, c)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 font-bold text-sm ${
                      bed
                        ? isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-500 shadow-lg'
                          : bed.is_premium
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400'
                        : 'border-dashed border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-400 cursor-pointer'
                    }`}
                    id={`template-cell-${r}-${c}`}
                  >
                    {bed ? (
                      <>
                        <span className="text-lg">🛏️</span>
                        <span className="text-[11px]">{bed.identifier}</span>
                      </>
                    ) : (
                      <span className="text-lg">+</span>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Click empty cell to place a bed • Click placed bed to edit • Use panel below to configure
        </p>
      </div>

      {/* Bed property panel */}
      <AnimatePresence>
        {selectedBedData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-300">
                  Configure Bed {selectedBedData.identifier}
                </h4>
                <button
                  onClick={() => removeBed(selectedBedData.row, selectedBedData.col)}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  ⊘ Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Identifier</label>
                  <input
                    className="soft-input w-full mt-0.5 text-sm"
                    value={selectedBedData.identifier}
                    onChange={e => updateBed(selectedBed!, { identifier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    className="soft-input w-full mt-0.5 text-sm"
                    value={selectedBedData.category}
                    onChange={e => updateBed(selectedBed!, { category: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Window">Window</option>
                    <option value="Aisle">Aisle</option>
                    <option value="Corner">Corner</option>
                    <option value="Bunk-Upper">Bunk-Upper</option>
                    <option value="Bunk-Lower">Bunk-Lower</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBedData.is_premium}
                    onChange={e => updateBed(selectedBed!, { is_premium: e.target.checked, base_fee: e.target.checked ? 500 : 0 })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">★ Premium Bed</span>
                </label>
                {selectedBedData.is_premium && (
                  <div>
                    <input
                      type="number"
                      className="soft-input w-24 text-sm"
                      value={selectedBedData.base_fee}
                      onChange={e => updateBed(selectedBed!, { base_fee: parseFloat(e.target.value) || 0 })}
                      placeholder="Fee ₹"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room decorators */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Room Decorators</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Window Wall</label>
            <select className="soft-input w-full mt-0.5 text-sm" value={windowWall} onChange={e => setWindowWall(e.target.value as any)}>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Door Position</label>
            <select className="soft-input w-full mt-0.5 text-sm" value={doorPosition} onChange={e => setDoorPosition(e.target.value as any)}>
              <option value="bottom-right">Bottom-Right</option>
              <option value="bottom-left">Bottom-Left</option>
              <option value="top-right">Top-Right</option>
              <option value="top-left">Top-Left</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Attached Bathroom</label>
          <select className="soft-input w-full mt-0.5 text-sm" value={bathroomCorner || ''} onChange={e => setBathroomCorner(e.target.value || null)}>
            <option value="">None</option>
            <option value="top-right">Top-Right</option>
            <option value="top-left">Top-Left</option>
            <option value="bottom-right">Bottom-Right</option>
            <option value="bottom-left">Bottom-Left</option>
          </select>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !name || beds.length === 0}
        className="btn-primary w-full"
        id="template-save-btn"
      >
        {saving ? 'Saving...' : `💾 Save Template (${beds.length}-seater)`}
      </button>
    </div>
  );
}
