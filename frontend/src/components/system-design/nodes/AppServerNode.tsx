import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Desktop } from '@phosphor-icons/react';

interface AppServerData {
  label: string;
  replicas: number;
  maxThreads: number;
  processingTime: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  metrics?: {
    processedQPS: number;
    latencyAdded: number;
    utilization: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  [key: string]: unknown;
}

function AppServerNode({ id, data }: NodeProps & { data: AppServerData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  const processingTime = data.processingTime ?? 50;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-blue-400 dark:border-blue-500 rounded-2xl shadow-lg shadow-blue-500/10 min-w-[210px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 flex items-center gap-2">
        <Desktop size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">App Server</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Replicas</label>
            <input
              type="number"
              min={1}
              max={20}
              value={data.replicas ?? 1}
              onChange={(e) => onChange('replicas', Number(e.target.value))}
              className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Threads</label>
            <input
              type="number"
              min={1}
              value={data.maxThreads ?? 200}
              onChange={(e) => onChange('maxThreads', Number(e.target.value))}
              className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Processing: <span className="text-blue-500 font-bold">{processingTime}ms</span>
          </label>
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={processingTime}
            onChange={(e) => onChange('processingTime', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Metrics Footer */}
      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{data.metrics.processedQPS} req/s</span>
            <span className={`font-bold ${data.metrics.status === 'healthy' ? 'text-emerald-500' : data.metrics.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
              {data.metrics.latencyAdded}ms
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${data.metrics.utilization > 0.9 ? 'bg-red-500' : data.metrics.utilization > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(data.metrics.utilization * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(AppServerNode);
