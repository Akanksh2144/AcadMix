import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CloudArrowDown } from '@phosphor-icons/react';

interface CDNData {
  label: string;
  cacheHitRatio: number;
  edgeLatency: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  metrics?: {
    processedQPS: number;
    latencyAdded: number;
    utilization: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  [key: string]: unknown;
}

function CDNNode({ id, data }: NodeProps & { data: CDNData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  const cacheHitRatio = data.cacheHitRatio ?? 0.85;
  const edgeLatency = data.edgeLatency ?? 10;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-cyan-400 dark:border-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/10 min-w-[210px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 flex items-center gap-2">
        <CloudArrowDown size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">CDN</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Cache Hit: <span className="text-cyan-500 font-bold">{(cacheHitRatio * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={cacheHitRatio}
            onChange={(e) => onChange('cacheHitRatio', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-cyan-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Edge Latency: <span className="text-cyan-500 font-bold">{edgeLatency}ms</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={edgeLatency}
            onChange={(e) => onChange('edgeLatency', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-cyan-500 cursor-pointer"
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
        className="!w-3.5 !h-3.5 !bg-cyan-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-cyan-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(CDNNode);
