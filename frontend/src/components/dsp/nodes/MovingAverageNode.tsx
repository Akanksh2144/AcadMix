import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Equalizer } from '@phosphor-icons/react';

interface MovingAvgData {
  label: string;
  windowSize: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function MovingAverageNode({ id, data }: NodeProps & { data: MovingAvgData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-slate-400 dark:border-slate-500 rounded-2xl shadow-lg shadow-slate-500/10 min-w-[180px] overflow-hidden">
      <div className="bg-gradient-to-r from-slate-500 to-gray-500 px-4 py-2 flex items-center gap-2">
        <Equalizer size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Moving Avg</span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Window: <span className="text-slate-600 dark:text-slate-300 font-bold">{data.windowSize ?? 8}</span>
          </label>
          <input type="range" min={2} max={64} step={1} value={data.windowSize ?? 8}
            onChange={(e) => onChange('windowSize', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-slate-500 cursor-pointer"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-slate-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-slate-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(MovingAverageNode);
