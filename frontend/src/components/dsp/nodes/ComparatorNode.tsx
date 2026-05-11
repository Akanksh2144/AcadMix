import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Gauge } from '@phosphor-icons/react';

interface ComparatorData {
  label: string;
  threshold: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function ComparatorNode({ id, data }: NodeProps & { data: ComparatorData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-red-400 dark:border-red-500 rounded-2xl shadow-lg shadow-red-500/10 min-w-[180px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 flex items-center gap-2">
        <Gauge size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Comparator</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Threshold: <span className="text-red-500 font-bold">{data.threshold ?? 0}</span>
          </label>
          <input
            type="range"
            min={-3}
            max={3}
            step={0.1}
            value={data.threshold ?? 0}
            onChange={(e) => onChange('threshold', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-red-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(ComparatorNode);
