import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Scales } from '@phosphor-icons/react';
import { NodeChaosBanner } from './NodeChaosBanner';

function LoadBalancerNode({ id, data }: NodeProps & { data: any }) {
  const hasChaos = Boolean(data?.chaosActive || (data?.errors && data.errors > 0));

  return (
    <div
      className={`bg-[#FFFDF8] dark:bg-[#1E2433] border border-[#C8BFA9] dark:border-[#2E3545] border-l-[3px] rounded-xl shadow-sm min-w-[210px] transition-all ${
        hasChaos ? '!border-red-500 ring-2 ring-red-500 bg-red-50/90 dark:bg-red-950/80 shadow-lg shadow-red-500/30 animate-pulse' : ''
      }`}
      style={{ borderLeftColor: hasChaos ? '#EF4444' : '#D08C4A', fontFamily: "'Caveat', cursive" }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2">
        <Scales size={16} weight="bold" style={{ color: hasChaos ? '#EF4444' : '#D08C4A' }} />
        <span className="text-base font-bold text-[#2D2D2D] dark:text-[#D4D4D4] font-[Caveat]">Load Balancer</span>
      </div>

      <NodeChaosBanner id={id} data={data} />


      {data.metrics && (
        <div className="px-3 py-2 border-t border-[#E0D9CB] dark:border-[#2E3545] bg-[#F5F0E8]/60 dark:bg-[#161B28]/60 text-sm">
          <div className="flex items-center justify-between font-[Caveat]">
            <span className="text-[#6B6B6B] dark:text-[#8B8B9A] font-semibold">Utilization: {(data.metrics.utilization * 100).toFixed(0)}%</span>
            <span className={`font-semibold ${data.metrics.status === 'healthy' ? 'text-[#5B9A6F]' : 'text-[#C45B5B]'}`}>
              {data.metrics.processedQPS.toFixed(0)}/s
            </span>
          </div>
        </div>
      )}

      {/* Target input on the left/top */}
      <Handle
        type="target"
        position={data?.isVertical ? Position.Top : Position.Left}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />

      {/* Multiple outputs on the right/bottom */}
      <Handle
        type="source"
        position={data?.isVertical ? Position.Bottom : Position.Right}
        id="out-1"
        style={data?.isVertical ? { left: '30%' } : { top: '30%' }}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
      <Handle
        type="source"
        position={data?.isVertical ? Position.Bottom : Position.Right}
        id="out-2"
        style={data?.isVertical ? { left: '50%' } : { top: '50%' }}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
      <Handle
        type="source"
        position={data?.isVertical ? Position.Bottom : Position.Right}
        id="out-3"
        style={data?.isVertical ? { left: '70%' } : { top: '70%' }}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
    </div>
  );
}

export default memo(LoadBalancerNode);
