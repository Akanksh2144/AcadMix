import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock } from '@phosphor-icons/react';

interface DelayData {
  label: string;
  delaySamples: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function DelayNode({ id, data }: NodeProps & { data: DelayData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-teal-400 dark:border-teal-500 rounded-2xl shadow-lg shadow-teal-500/10 min-w-[180px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 flex items-center gap-2">
        <Clock size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Delay</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Delay: <span className="text-teal-500 font-bold">{data.delaySamples ?? 50} samples</span>
          </label>
          <input
            type="range"
            min={1}
            max={256}
            step={1}
            value={data.delaySamples ?? 50}
            onChange={(e) => onChange('delaySamples', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-teal-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(DelayNode);
