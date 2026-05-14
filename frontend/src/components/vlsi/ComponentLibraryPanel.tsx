import React, { useState, useMemo } from 'react';
import { MagnifyingGlass, CaretDown, CaretRight, Circuitry, Cpu, Plugs, Memory, Function, Calculator, Rows, Database, Monitor, Clock, Broadcast, ArrowsLeftRight, Waveform, Bug, TextT } from '@phosphor-icons/react';
import { COMPONENT_CATALOG, CATEGORY_ORDER, CATEGORY_LABELS, getCatalogEntry } from './componentCatalog';
import { vlsiNodeTypes } from './nodes';
import type { ComponentCategory, VLSIComponent } from './types';

const CATEGORY_ICONS: Record<ComponentCategory, React.ReactNode> = {
  io: <Plugs size={14} weight="duotone" />,
  gates: <Circuitry size={14} weight="duotone" />,
  flipflops: <Memory size={14} weight="duotone" />,
  combinational: <Function size={14} weight="duotone" />,
  arithmetic: <Calculator size={14} weight="duotone" />,
  sequential_adv: <Rows size={14} weight="duotone" />,
  memory: <Database size={14} weight="duotone" />,
  display: <Monitor size={14} weight="duotone" />,
  timing: <Clock size={14} weight="duotone" />,
  communication: <Broadcast size={14} weight="duotone" />,
  interface: <ArrowsLeftRight size={14} weight="duotone" />,
  processor: <Cpu size={14} weight="duotone" />,
  dsp: <Waveform size={14} weight="duotone" />,
  testing: <Bug size={14} weight="duotone" />,
  annotation: <TextT size={14} weight="duotone" />,
};

interface Props {
  onAddComponent: (type: string) => void;
}

function LibraryItem({ entry, onAddComponent }: { entry: any, onAddComponent: (t: string) => void }) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Try to get a visual representation
  const NodeComp = vlsiNodeTypes[entry.type];
  const catalog = getCatalogEntry(entry.type);

  return (
    <div className="relative group/item">
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/reactflow', entry.type);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onAddComponent(entry.type)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left text-[11px] font-medium text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-lg transition-all relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
        
        {/* Tiny Icon/Preview Placeholder */}
        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-slate-800/50 rounded border border-slate-700/50 group-hover/item:border-emerald-500/30 transition-colors">
           <span className="text-[8px] font-bold text-slate-500 group-hover/item:text-emerald-400 opacity-70">
             {entry.refDesPrefix || 'U'}
           </span>
        </div>

        <span className="truncate group-hover/item:translate-x-0.5 transition-transform">{entry.label}</span>
      </div>

      {/* Premium Hover Overview */}
      {isHovered && catalog && (
        <div className="absolute left-full ml-4 top-0 z-[100] w-72 bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl p-0 overflow-hidden pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200">
           {/* Visual Header / Preview Area */}
           <div className="h-32 bg-slate-900/50 flex items-center justify-center border-b border-slate-800/50 relative overflow-hidden group-hover/item:bg-slate-900/80 transition-colors">
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{backgroundImage: 'radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)', backgroundSize: '12px 12px'}} />
              
              <div className="scale-110 drop-shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                {NodeComp ? (
                  <NodeComp 
                    data={{ 
                      ...catalog, 
                      refDes: catalog.refDesPrefix + '?', 
                      pins: catalog.pins || [],
                      logicInputs: {}, 
                      logicOutputs: {},
                      properties: catalog.defaultProperties || {}
                    }} 
                  />
                ) : (
                  <div className="text-[10px] text-slate-600 font-mono">NO PREVIEW</div>
                )}
              </div>
           </div>

           <div className="p-4">
             <div className="flex items-center justify-between mb-2">
               <h4 className="text-xs font-bold text-emerald-400 tracking-tight">{catalog.label}</h4>
               <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 font-bold uppercase">{catalog.category}</span>
             </div>
           
           <p className="text-[10px] text-slate-400 leading-relaxed mb-3 italic">
             "{catalog.description}"
           </p>

           <div className="space-y-2">
             <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Pin Layout</span>
                <div className="h-[1px] flex-1 bg-slate-800" />
             </div>
             <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
               {catalog.pins.map(pin => (
                 <div key={pin.id} className="flex items-center gap-1.5 overflow-hidden">
                   <div className={`w-1.5 h-1.5 rounded-full ${pin.type === 'input' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                   <span className="text-[9px] text-slate-300 truncate font-mono">{pin.label}</span>
                   <span className="text-[8px] text-slate-600 uppercase font-bold">{pin.type.slice(0, 2)}</span>
                 </div>
               ))}
             </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
              <span className="text-[8px] text-slate-500">Prefix: <span className="text-slate-400">{catalog.refDesPrefix}</span></span>
              <span className="text-[8px] text-indigo-400/80 font-bold">DRAG TO ADD</span>
           </div>
        </div>
      )}
    </div>
  );
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
          <Cpu size={14} className="text-emerald-400" />
          Logic Library
        </h3>
        <div className="relative group">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Search gates..."
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
                  {CATEGORY_ICONS[cat as ComponentCategory]}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                  {CATEGORY_LABELS[cat as ComponentCategory]}
                </span>
                <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  {items.length}
                </span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                <div className="py-1 px-2 space-y-1">
                  {items.map(entry => (
                    <LibraryItem 
                      key={entry.type} 
                      entry={entry} 
                      onAddComponent={onAddComponent} 
                    />
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
