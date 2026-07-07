import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Robot } from '@phosphor-icons/react';

function WorkerPoolNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-indigo-400 dark:border-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 flex items-center gap-2">
        <Robot size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Background Workers</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Worker Count</label>
          <input
            type="number"
            min={1}
            max={50}
            value={data.workers ?? 4}
            onChange={(e) => onChange('workers', Math.max(1, Number(e.target.value)))}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Task execution: <span className="text-indigo-500 font-bold">{data.taskProcessingTime ?? 200}ms</span>
          </label>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={data.taskProcessingTime ?? 200}
            onChange={(e) => onChange('taskProcessingTime', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Util: {(data.metrics.utilization * 100).toFixed(0)}%</span>
            <span className="font-bold text-indigo-500">{data.metrics.processedQPS.toFixed(0)} tasks/s</span>
          </div>
          <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data.metrics.utilization > 0.9 ? 'bg-red-500' : data.metrics.utilization > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(data.metrics.utilization * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(WorkerPoolNode);
