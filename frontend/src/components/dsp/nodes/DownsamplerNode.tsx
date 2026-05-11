import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowsDownUp } from '@phosphor-icons/react';

interface DownsamplerData {
  label: string;
  factor: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function DownsamplerNode({ id, data }: NodeProps & { data: DownsamplerData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-lime-400 dark:border-lime-500 rounded-2xl shadow-lg shadow-lime-500/10 min-w-[180px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500 to-green-500 px-4 py-2 flex items-center gap-2">
        <ArrowsDownUp size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Downsample</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Factor: <span className="text-lime-600 dark:text-lime-400 font-bold">↓{data.factor ?? 2}</span>
          </label>
          <input
            type="range"
            min={2}
            max={16}
            step={1}
            value={data.factor ?? 2}
            onChange={(e) => onChange('factor', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-lime-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-lime-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-lime-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(DownsamplerNode);
