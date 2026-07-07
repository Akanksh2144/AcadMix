import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Scales } from '@phosphor-icons/react';

function LoadBalancerNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-amber-400 dark:border-amber-500 rounded-2xl shadow-lg shadow-amber-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center gap-2">
        <Scales size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Load Balancer</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Algorithm</label>
          <select
            value={data.algorithm || 'round-robin'}
            onChange={(e) => onChange('algorithm', e.target.value)}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
          >
            <option value="round-robin">Round Robin</option>
            <option value="least-connections">Least Connections</option>
            <option value="ip-hash">IP Hash</option>
            <option value="weighted">Weighted</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Health Check: <span className="text-amber-500 font-bold">{data.healthCheckInterval ?? 10}s</span>
          </label>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={data.healthCheckInterval ?? 10}
            onChange={(e) => onChange('healthCheckInterval', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Utilization: {(data.metrics.utilization * 100).toFixed(0)}%</span>
            <span className={`font-bold ${data.metrics.status === 'healthy' ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.metrics.processedQPS.toFixed(0)}/s
            </span>
          </div>
        </div>
      )}

      {/* Target input on the left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />

      {/* Multiple outputs on the right */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-1"
        style={{ top: '30%' }}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-2"
        style={{ top: '50%' }}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-3"
        style={{ top: '70%' }}
        className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(LoadBalancerNode);
