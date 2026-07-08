import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChartLineUp } from '@phosphor-icons/react';
import { NodeChaosBanner } from './NodeChaosBanner';

function MetricsDashboardNode({ id, data }: NodeProps & { data: any }) {
  const hasChaos = Boolean(data?.chaosActive || (data?.errors && data.errors > 0));

  return (
    <div
      className={`bg-[#FFFDF8] dark:bg-[#1E2433] border border-[#C8BFA9] dark:border-[#2E3545] border-l-[3px] rounded-xl shadow-sm min-w-[210px] transition-all ${
        hasChaos ? '!border-red-500 ring-2 ring-red-500 bg-red-50/90 dark:bg-red-950/80 shadow-lg shadow-red-500/30 animate-pulse' : ''
      }`}
      style={{ borderLeftColor: hasChaos ? '#EF4444' : '#C45BA0', fontFamily: "'Caveat', cursive" }}
    >
      <div className="px-3 pt-3 pb-1 flex items-center gap-2">
        <ChartLineUp size={16} weight="bold" style={{ color: hasChaos ? '#EF4444' : '#C45BA0' }} />
        <span className="text-base font-bold text-[#2D2D2D] dark:text-[#D4D4D4] font-[Caveat]">Metrics Dashboard</span>
      </div>

      <NodeChaosBanner id={id} data={data} />


      <Handle
        type="target"
        position={data?.isVertical ? Position.Top : Position.Left}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
    </div>
  );
}

export default memo(MetricsDashboardNode);
