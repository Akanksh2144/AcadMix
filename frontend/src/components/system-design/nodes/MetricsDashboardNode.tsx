import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChartLineUp } from '@phosphor-icons/react';

function MetricsDashboardNode({ id, data }: NodeProps & { data: any }) {
  const result = data.simResult;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-fuchsia-400 dark:border-fuchsia-500 rounded-2xl shadow-lg shadow-fuchsia-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-2 flex items-center gap-2">
        <ChartLineUp size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Metrics Dashboard</span>
      </div>

      <div className="p-3 space-y-2">
        {!result ? (
          <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
            Run simulation to see live system telemetry.
          </div>
        ) : (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Total QPS:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{result.system.totalQPS.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">p99 Latency:</span>
              <span className="font-bold text-fuchsia-500">{result.system.p99Latency.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Availability:</span>
              <span className={`font-bold ${result.system.availabilityPercent > 99 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {result.system.availabilityPercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-1.5 mt-1.5">
              <span className="text-gray-400">Monthly Cost:</span>
              <span className="font-bold text-emerald-500">${result.system.totalMonthlyCost}</span>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(MetricsDashboardNode);
