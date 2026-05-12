import React from 'react';
import { Trash, Copy, ArrowClockwise } from '@phosphor-icons/react';
import type { ComponentType } from './types';
import { getCatalogEntry } from './componentCatalog';

interface SelectedComponent {
  id: string;
  type: ComponentType;
  refDes: string;
  properties: Record<string, string | number | boolean>;
}

interface Props {
  selected: SelectedComponent | null;
  onPropertyChange: (id: string, field: string, value: string | number | boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
}

export default function PropertiesInspector({ selected, onPropertyChange, onDelete, onDuplicate, onRotate }: Props) {
  if (!selected) {
    return (
      <div className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-l border-gray-200/60 dark:border-gray-700/40">
        <div className="px-3 pt-3 pb-2 border-b border-gray-200/60 dark:border-gray-700/40">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center leading-relaxed">
            Select a component to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  const catalog = getCatalogEntry(selected.type);
  const props = selected.properties || {};
  const editableFields = Object.entries(props).filter(([k]) => !['onDataChange', 'selected'].includes(k));

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-l border-gray-200/60 dark:border-gray-700/40">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-200/60 dark:border-gray-700/40">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* Component type badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <span className="text-white text-[10px] font-bold">{selected.refDes.replace(/\d+/g, '')}</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{catalog?.label || selected.type}</div>
            <div className="text-[10px] font-mono text-gray-400">{selected.refDes}</div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Parameters</div>
          {editableFields.map(([key, value]) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{key}</label>
              <input
                type="text"
                value={String(value)}
                onChange={e => onPropertyChange(selected.id, key, e.target.value)}
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/40 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500/40 focus:!outline-none transition-all"
              />
            </div>
          ))}
        </div>

        {/* Pins */}
        {catalog && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Pins</div>
            {catalog.pins.map(pin => (
              <div key={pin.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-[10px] font-mono text-gray-500">{pin.id}</span>
                <span className="text-[10px] text-gray-400">{pin.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">{pin.side}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200/60 dark:border-gray-700/40 flex gap-2">
        <button onClick={() => onRotate(selected.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Rotate 90°">
          <ArrowClockwise size={12} weight="bold" /> Rotate
        </button>
        <button onClick={() => onDuplicate(selected.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Duplicate">
          <Copy size={12} weight="bold" /> Copy
        </button>
        <button onClick={() => onDelete(selected.id)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Delete">
          <Trash size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}
