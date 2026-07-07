import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChartLineUp } from '@phosphor-icons/react';

interface SimulationResult {
  system: {
    totalQPS: number;
    successfulQPS: number;
    failedQPS: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    totalMonthlyCost: number;
    errorRate: number;
    availabilityPercent: number;
  };
  grade: string;
  bottlenecks: string[];
}

interface MetricsDashboardData {
  label: string;
  simResult?: SimulationResult | null;
  onDataChange?: (id: string, field: string, value: any) => void;
  metrics?: {
    processedQPS: number;
    latencyAdded: number;
    utilization: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  [key: string]: unknown;
}

function MetricsDashboardNode({ id, data }: NodeProps & { data: MetricsDashboardData }) {
  const sim = data.simResult;

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-500';
    if (grade.startsWith('B')) return 'text-sky-500';
    if (grade.startsWith('C')) return 'text-amber-500';
    if (grade.startsWith('D')) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-fuchsia-400 dark:border-fuchsia-500 rounded-2xl shadow-lg shadow-fuchsia-500/10 min-w-[210px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-2 flex items-center gap-2">
        <ChartLineUp size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Metrics</span>
      </div>

      {/* Results or Placeholder */}
      <div className="p-3">
        {sim ? (
          <div className="space-y-3">
            {/* Grade Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</span>
              <span className={`text-2xl font-black ${gradeColor(sim.grade)}`}>{sim.grade}</span>
            </div>

            {/* Latency */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Latency</span>
              <div className="grid grid-cols-3 gap-1">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">p50</div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{sim.system.p50Latency}ms</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">p95</div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{sim.system.p95Latency}ms</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">p99</div>
                  <div className="text-xs font-bold text-amber-500">{sim.system.p99Latency}ms</div>
                </div>
              </div>
            </div>

            {/* Throughput & Error Rate */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Throughput</div>
                <div className="text-xs font-bold text-emerald-500">{sim.system.successfulQPS} req/s</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Error Rate</div>
                <div className={`text-xs font-bold ${sim.system.errorRate > 0.05 ? 'text-red-500' : sim.system.errorRate > 0.01 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {(sim.system.errorRate * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Availability & Cost */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Availability</div>
                <div className="text-xs font-bold text-sky-500">{sim.system.availabilityPercent.toFixed(2)}%</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">Cost/mo</div>
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">${sim.system.totalMonthlyCost.toLocaleString()}</div>
              </div>
            </div>

            {/* Bottlenecks */}
            {sim.bottlenecks.length > 0 && (
              <div>
                <span className="text-[9px] font-semibold text-red-400 uppercase tracking-wider">Bottlenecks</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {sim.bottlenecks.slice(0, 3).map((b) => (
                    <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ChartLineUp size={32} weight="thin" className="text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-xs text-gray-400 dark:text-gray-500">Run simulation to see metrics</p>
          </div>
        )}
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

      {/* Target Handle only (visualizer — receives data, doesn't output) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(MetricsDashboardNode);
