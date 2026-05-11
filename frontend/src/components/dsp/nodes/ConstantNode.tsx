import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Pulse } from '@phosphor-icons/react';

interface ConstantData {
  label: string;
  value: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function ConstantNode({ id, data }: NodeProps & { data: ConstantData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 rounded-2xl shadow-lg shadow-gray-500/10 min-w-[160px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-500 to-slate-500 px-4 py-2 flex items-center gap-2">
        <Pulse size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">DC Source</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Value: <span className="text-gray-700 dark:text-gray-300 font-bold">{data.value ?? 1}</span>
          </label>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={data.value ?? 1}
            onChange={(e) => onChange('value', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-gray-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-gray-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(ConstantNode);
