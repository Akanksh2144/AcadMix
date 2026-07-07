import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lightning } from '@phosphor-icons/react';

function CacheNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-rose-400 dark:border-rose-500 rounded-2xl shadow-lg shadow-rose-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 flex items-center gap-2">
        <Lightning size={16} weight="bold" className="text-white animate-pulse" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Redis Cache</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Eviction Policy</label>
          <select
            value={data.evictionPolicy || 'lru'}
            onChange={(e) => onChange('evictionPolicy', e.target.value)}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all"
          >
            <option value="lru">LRU (Least Recently Used)</option>
            <option value="lfu">LFU (Least Frequently Used)</option>
            <option value="fifo">FIFO (First In First Out)</option>
            <option value="random">Random</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Write Pattern</label>
          <select
            value={data.pattern || 'cache-aside'}
            onChange={(e) => onChange('pattern', e.target.value)}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all"
          >
            <option value="cache-aside">Cache Aside</option>
            <option value="read-through">Read Through</option>
            <option value="write-through">Write Through</option>
            <option value="write-back">Write Back</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Hit Ratio: <span className="text-rose-500 font-bold">{((data.hitRatio ?? 0.8) * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={0.99}
            step={0.01}
            value={data.hitRatio ?? 0.8}
            onChange={(e) => onChange('hitRatio', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-rose-500 cursor-pointer"
          />
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Hits: {(data.metrics.processedQPS * (data.hitRatio ?? 0.8)).toFixed(0)}/s</span>
            <span className="font-bold text-rose-500">+{data.metrics.latencyAdded.toFixed(1)}ms</span>
          </div>
        </div>
      )}

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
