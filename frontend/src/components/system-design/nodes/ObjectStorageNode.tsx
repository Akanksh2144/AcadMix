import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { HardDrive } from '@phosphor-icons/react';

interface ObjectStorageData {
  label: string;
  latency: number;
  maxThroughput: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  metrics?: {
    processedQPS: number;
    latencyAdded: number;
    utilization: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  [key: string]: unknown;
}

function ObjectStorageNode({ id, data }: NodeProps & { data: ObjectStorageData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  const latency = data.latency ?? 50;
  const maxThroughput = data.maxThroughput ?? 100;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-slate-400 dark:border-slate-500 rounded-2xl shadow-lg shadow-slate-500/10 min-w-[210px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-500 to-gray-500 px-4 py-2 flex items-center gap-2">
        <HardDrive size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Object Storage</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Latency: <span className="text-slate-500 font-bold">{latency}ms</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={latency}
            onChange={(e) => onChange('latency', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-slate-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Throughput: <span className="text-slate-500 font-bold">{maxThroughput} MB/s</span>
          </label>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={maxThroughput}
            onChange={(e) => onChange('maxThroughput', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-slate-500 cursor-pointer"
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

      {/* Target Handle only (no source — this is a terminal storage node) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-slate-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(ObjectStorageNode);
