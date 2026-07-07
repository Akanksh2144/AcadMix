import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { HardDrive } from '@phosphor-icons/react';

function ObjectStorageNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-slate-400 dark:border-slate-500 rounded-2xl shadow-lg shadow-slate-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-slate-500 to-gray-500 px-4 py-2 flex items-center gap-2">
        <HardDrive size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Object Storage (S3)</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Latency: <span className="text-slate-500 font-bold">{data.latency ?? 50}ms</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={data.latency ?? 50}
            onChange={(e) => onChange('latency', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-slate-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Max Throughput: <span className="text-slate-500 font-bold">{data.maxThroughput ?? 100} MB/s</span>
          </label>
          <input
            type="range"
            min={10}
            max={1000}
            step={50}
            value={data.maxThroughput ?? 100}
            onChange={(e) => onChange('maxThroughput', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-slate-500 cursor-pointer"
          />
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">throughput: {data.metrics.processedQPS.toFixed(0)} req/s</span>
            <span className="font-bold text-slate-500">+{data.metrics.latencyAdded}ms</span>
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-slate-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(ObjectStorageNode);
