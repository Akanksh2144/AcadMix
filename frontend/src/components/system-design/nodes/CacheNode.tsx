import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lightning } from '@phosphor-icons/react';

interface CacheData {
  label: string;
  evictionPolicy: string;
  hitRatio: number;
  pattern: string;
  ttl: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  metrics?: {
    processedQPS: number;
    latencyAdded: number;
    utilization: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  [key: string]: unknown;
}

function CacheNode({ id, data }: NodeProps & { data: CacheData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  const hitRatio = data.hitRatio ?? 0.8;
  const ttl = data.ttl ?? 300;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-rose-400 dark:border-rose-500 rounded-2xl shadow-lg shadow-rose-500/10 min-w-[210px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 flex items-center gap-2">
        <Lightning size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Cache</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Eviction</label>
            <select
              value={data.evictionPolicy || 'LRU'}
              onChange={(e) => onChange('evictionPolicy', e.target.value)}
              className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all"
            >
              <option value="LRU">LRU</option>
              <option value="LFU">LFU</option>
              <option value="FIFO">FIFO</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pattern</label>
            <select
              value={data.pattern || 'cache-aside'}
              onChange={(e) => onChange('pattern', e.target.value)}
              className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all"
            >
              <option value="cache-aside">Cache-Aside</option>
              <option value="read-through">Read-Through</option>
              <option value="write-through">Write-Through</option>
              <option value="write-back">Write-Back</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Hit Ratio: <span className="text-rose-500 font-bold">{(hitRatio * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={hitRatio}
            onChange={(e) => onChange('hitRatio', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-rose-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            TTL: <span className="text-rose-500 font-bold">{ttl}s</span>
          </label>
          <input
            type="range"
            min={1}
            max={3600}
            step={1}
            value={ttl}
            onChange={(e) => onChange('ttl', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-rose-500 cursor-pointer"
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
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(CacheNode);
