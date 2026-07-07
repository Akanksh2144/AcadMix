import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Globe } from '@phosphor-icons/react';

function DNSNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-sky-400 dark:border-sky-500 rounded-2xl shadow-lg shadow-sky-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 flex items-center gap-2">
        <Globe size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">DNS Resolver</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            TTL: <span className="text-sky-500 font-bold">{data.ttl ?? 300}s</span>
          </label>
          <input
            type="range"
            min={1}
            max={3600}
            step={10}
            value={data.ttl ?? 300}
            onChange={(e) => onChange('ttl', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-sky-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Routing Policy</label>
          <select
            value={data.routingPolicy || 'round-robin'}
            onChange={(e) => onChange('routingPolicy', e.target.value)}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition-all"
          >
            <option value="round-robin">Round Robin</option>
            <option value="geo">Geographic</option>
            <option value="weighted">Weighted</option>
            <option value="failover">Failover</option>
          </select>
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">QPS: {data.metrics.processedQPS.toFixed(0)}</span>
            <span className={`font-bold ${data.metrics.status === 'healthy' ? 'text-emerald-500' : 'text-red-500'}`}>
              +{data.metrics.latencyAdded}ms
            </span>
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-sky-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(DNSNode);
