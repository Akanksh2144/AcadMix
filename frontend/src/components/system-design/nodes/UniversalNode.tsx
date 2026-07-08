import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Desktop, WarningCircle } from '@phosphor-icons/react';
import { COMPONENT_MAP } from '../nodeRegistry';

function UniversalNode({ id, data, type, nodeType }: NodeProps & { data: any; nodeType?: string }) {
  const resolvedType = nodeType || type || 'appServer';
  const metadata = COMPONENT_MAP[resolvedType];
  
  const Icon = metadata?.icon || Desktop;
  const color = metadata?.color || '#3B82F6';
  const label = data?.label || metadata?.label || 'System Node';

  const isVertical = data?.isVertical;
  const metrics = data?.metrics;
  const status = metrics?.status || 'healthy';

  return (
    <div
      className={`bg-[#FFFDF8] dark:bg-[#1E2433] border border-[#C8BFA9] dark:border-[#2E3545] border-l-[3px] rounded-xl shadow-sm min-w-[210px] transition-all ${
        status === 'critical' ? 'ring-2 ring-red-500 bg-red-50/30 dark:bg-red-950/20' :
        status === 'warning' ? 'ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/20' : ''
      }`}
      style={{ borderLeftColor: color, fontFamily: "'Caveat', cursive" }}
    >
      <div className="px-3 pt-3 pb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={18} weight="bold" style={{ color }} />
          <span className="text-base font-bold text-[#2D2D2D] dark:text-[#D4D4D4] font-[Caveat] truncate max-w-[140px]" title={label}>
            {label}
          </span>
        </div>
        {status !== 'healthy' && (
          <WarningCircle 
            size={16} 
            weight="fill" 
            className={status === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'} 
            title={metrics?.bottleneck || 'Warning'} 
          />
        )}
      </div>

      {metrics && (
        <div className="px-3 py-2 border-t border-[#E0D9CB] dark:border-[#2E3545] bg-[#F5F0E8]/60 dark:bg-[#161B28]/60 text-sm font-[Caveat]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B] dark:text-[#8B8B9A] font-semibold">
              QPS: {metrics.processedQPS?.toFixed(0)}/s
            </span>
            <span className="font-bold" style={{ color }}>
              +{metrics.latencyAdded?.toFixed(1)}ms
            </span>
          </div>
          {metrics.utilization !== undefined && metrics.utilization > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.utilization > 0.95 ? 'bg-red-500' :
                  metrics.utilization > 0.75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, metrics.utilization * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      <Handle
        type="target"
        position={isVertical ? Position.Top : Position.Left}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
      <Handle
        type="source"
        position={isVertical ? Position.Bottom : Position.Right}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
    </div>
  );
}

export default memo(UniversalNode);
