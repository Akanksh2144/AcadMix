import React, { useState, useMemo } from 'react';
import { MagnifyingGlass, CaretDown, CaretRight, Circuitry, Lightning, Cpu, Plugs, BatteryFull, Thermometer, Chalkboard } from '@phosphor-icons/react';
import { COMPONENT_CATALOG, CATEGORY_ORDER, CATEGORY_LABELS } from './componentCatalog';
import type { ComponentCategory, ComponentType } from './types';

const CATEGORY_ICONS: Record<ComponentCategory, React.ReactNode> = {
  passive: <Circuitry size={14} weight="duotone" />,
  active: <Lightning size={14} weight="duotone" />,
  ic: <Cpu size={14} weight="duotone" />,
  connector: <Plugs size={14} weight="duotone" />,
  power: <BatteryFull size={14} weight="duotone" />,
  sensor: <Thermometer size={14} weight="duotone" />,
  board: <Chalkboard size={14} weight="duotone" />,
};

interface Props {
  onAddComponent: (type: ComponentType) => void;
}

export default function ComponentLibraryPanel({ onAddComponent }: Props) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return COMPONENT_CATALOG;
    const q = search.toLowerCase();
    return COMPONENT_CATALOG.filter(c =>
      c.label.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [search]);

  const toggle = (cat: string) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]/95 backdrop-blur-2xl border-r border-slate-800/60 shadow-2xl">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/60 bg-gradient-to-b from-[#111827] to-transparent">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-3 flex items-center gap-2">
          <Circuitry size={14} className="text-emerald-400" />
          Component Library
        </h3>
        <div className="relative group">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#1E293B]/40 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
        {CATEGORY_ORDER.map(cat => {
          const items = filtered.filter(c => c.category === cat);
          if (items.length === 0) return null;
          const isOpen = expanded[cat] ?? false;

          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-slate-800/40 transition-colors group"
              >
                <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
                  {isOpen ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
                </span>
                <span className="text-emerald-500/70 group-hover:text-emerald-400 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  {CATEGORY_ICONS[cat]}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  {items.length}
                </span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                <div className="py-1 px-2">
                  {items.map(entry => (
                    <button
                      key={entry.type}
                      onClick={() => onAddComponent(entry.type)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-[11px] font-medium text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-lg transition-all group relative overflow-hidden"
                      title={entry.description}
                    >
                      {/* Hover subtle left border highlight */}
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <span className="w-6 text-center text-[9px] font-mono font-bold text-slate-500 group-hover:text-emerald-400 transition-colors bg-[#0B0F19] group-hover:bg-[#0B0F19]/50 rounded px-1 py-0.5 border border-slate-800 group-hover:border-emerald-500/30">
                        {entry.refDesPrefix}
                      </span>
                      <span className="truncate group-hover:translate-x-0.5 transition-transform">{entry.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
