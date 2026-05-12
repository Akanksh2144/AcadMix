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
    <div className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-700/40">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-200/60 dark:border-gray-700/40">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Component Library</h3>
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/40 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {CATEGORY_ORDER.map(cat => {
          const items = filtered.filter(c => c.category === cat);
          if (items.length === 0) return null;
          const isOpen = expanded[cat] ?? false;

          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <span className="text-gray-400 dark:text-gray-500">{isOpen ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}</span>
                <span className="text-gray-500 dark:text-gray-400">{CATEGORY_ICONS[cat]}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[cat]}</span>
                <span className="ml-auto text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{items.length}</span>
              </button>
              {isOpen && (
                <div className="pb-1">
                  {items.map(entry => (
                    <button
                      key={entry.type}
                      onClick={() => onAddComponent(entry.type)}
                      className="w-full flex items-center gap-2.5 px-4 pl-8 py-1.5 text-left text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors group"
                      title={entry.description}
                    >
                      <span className="w-5 text-center text-[9px] font-mono text-gray-400 group-hover:text-emerald-500 transition-colors">{entry.refDesPrefix}</span>
                      <span className="truncate">{entry.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
