import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Funnel } from '@phosphor-icons/react';

interface FilterData {
  label: string;
  filterType: 'lowpass' | 'highpass';
  cutoff: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function FilterNode({ id, data }: NodeProps & { data: FilterData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-sky-400 dark:border-sky-500 rounded-2xl shadow-lg shadow-sky-500/10 min-w-[200px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 flex items-center gap-2">
        <Funnel size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Filter</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        {/* Filter Type */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</label>
          <select
            value={data.filterType || 'lowpass'}
            onChange={(e) => onChange('filterType', e.target.value)}
            className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition-all"
          >
            <option value="lowpass">Low-Pass</option>
            <option value="highpass">High-Pass</option>
          </select>
        </div>

        {/* Cutoff */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Cutoff: <span className="text-sky-500 font-bold">{((data.cutoff ?? 0.2) * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0.01}
            max={0.49}
            step={0.01}
            value={data.cutoff ?? 0.2}
            onChange={(e) => onChange('cutoff', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(FilterNode);
