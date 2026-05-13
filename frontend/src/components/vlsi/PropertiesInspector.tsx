import React from 'react';
import { Trash, SlidersHorizontal, Info } from '@phosphor-icons/react';
import { getCatalogEntry } from './componentCatalog';

interface Props {
  selectedNode: any;
  onPropertyChange: (id: string, field: string, value: string | number | boolean) => void;
  onDelete: (id: string) => void;
}

export default function PropertiesInspector({ selectedNode, onPropertyChange, onDelete }: Props) {
  if (!selectedNode) {
    return (
      <div className="flex flex-col h-full bg-[#0B0F19]/95 backdrop-blur-2xl border-l border-slate-800/60 shadow-2xl">
        <div className="px-4 pt-4 pb-3 border-b border-slate-800/60 bg-gradient-to-b from-[#111827] to-transparent">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-emerald-400" />
            Properties
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 shadow-inner border border-slate-700/50">
            <Info size={24} className="text-slate-500" weight="duotone" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-mono">
            Select a logic gate to<br/>view and edit properties
          </p>
        </div>
      </div>
    );
  }

  const catalog = getCatalogEntry(selectedNode.data.componentType);
  const props = selectedNode.data.properties || {};
  const editableFields = Object.entries(props);

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]/95 backdrop-blur-2xl border-l border-slate-800/60 shadow-2xl">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/60 bg-gradient-to-b from-[#111827] to-transparent shrink-0">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-emerald-400" />
          Properties
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 shadow-inner">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <span className="text-white text-xs font-bold tracking-wider">{selectedNode.data.refDes.replace(/\d+/g, '')}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-200 truncate">{catalog?.label || selectedNode.type}</div>
            <div className="text-[11px] font-mono text-emerald-400/80 mt-0.5">{selectedNode.data.refDes}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-800" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Parameters</div>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          
          <div className="space-y-2.5">
            {editableFields.length === 0 ? (
              <div className="text-center py-2 text-[11px] text-slate-500 font-mono italic">No editable parameters</div>
            ) : (
              editableFields.map(([key, value]) => (
                <div key={key} className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 group-focus-within:text-emerald-400 transition-colors">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={String(value)}
                    onChange={e => onPropertyChange(selectedNode.id, key, e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#1E293B]/40 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-0 transition-all shadow-inner"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-800/60 bg-[#0B0F19] shrink-0">
        <button onClick={() => onDelete(selectedNode.id)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all shadow-sm">
          <Trash size={14} weight="bold" /> Delete Node
        </button>
      </div>
    </div>
  );
}
