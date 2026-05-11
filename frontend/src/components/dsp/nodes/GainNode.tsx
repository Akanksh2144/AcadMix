import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SlidersHorizontal } from '@phosphor-icons/react';

interface GainData {
  label: string;
  gain: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function GainNode({ id, data }: NodeProps & { data: GainData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-amber-400 dark:border-amber-500 rounded-2xl shadow-lg shadow-amber-500/10 min-w-[180px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center gap-2">
        <SlidersHorizontal size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Gain</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Gain: <span className="text-amber-500 font-bold">{data.gain ?? 1}×</span>
          </label>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={data.gain ?? 1}
            onChange={(e) => onChange('gain', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(GainNode);
