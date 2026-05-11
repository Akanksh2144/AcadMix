import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowsDownUp } from '@phosphor-icons/react';

interface UpsamplerData {
  label: string;
  factor: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function UpsamplerNode({ id, data }: NodeProps & { data: UpsamplerData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-green-400 dark:border-green-500 rounded-2xl shadow-lg shadow-green-500/10 min-w-[180px] overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center gap-2">
        <ArrowsDownUp size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Upsample</span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Factor: <span className="text-green-600 dark:text-green-400 font-bold">↑{data.factor ?? 2}</span>
          </label>
          <input type="range" min={2} max={16} step={1} value={data.factor ?? 2}
            onChange={(e) => onChange('factor', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-green-500 cursor-pointer"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-green-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-green-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(UpsamplerNode);
