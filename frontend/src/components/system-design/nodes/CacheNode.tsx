import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lightning } from '@phosphor-icons/react';
import { NodeChaosBanner } from './NodeChaosBanner';

function CacheNode({ id, data }: NodeProps & { data: any }) {
  const hasChaos = Boolean(data?.chaosActive || (data?.errors && data.errors > 0));

  return (
    <div
      className={`bg-[#FFFDF8] dark:bg-[#1E2433] border border-[#C8BFA9] dark:border-[#2E3545] border-l-[3px] rounded-xl shadow-sm min-w-[210px] transition-all ${
        hasChaos ? '!border-red-500 ring-2 ring-red-500 bg-red-50/90 dark:bg-red-950/80 shadow-lg shadow-red-500/30 animate-pulse' : ''
      }`}
      style={{ borderLeftColor: hasChaos ? '#EF4444' : '#C45B5B', fontFamily: "'Caveat', cursive" }}
    >
      <div className="px-3 pt-3 pb-1 flex items-center gap-2">
        <Lightning size={16} weight="bold" style={{ color: hasChaos ? '#EF4444' : '#C45B5B' }} />
        <span className="text-base font-bold text-[#2D2D2D] dark:text-[#D4D4D4] font-[Caveat]">Redis Cache</span>
      </div>

      <NodeChaosBanner id={id} data={data} />


      {data.metrics && (
        <div className="px-3 py-2 border-t border-[#E0D9CB] dark:border-[#2E3545] bg-[#F5F0E8]/60 dark:bg-[#161B28]/60 text-sm font-[Caveat]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B] dark:text-[#8B8B9A] font-semibold">Hits: {(data.metrics.processedQPS * (data.hitRatio ?? 0.8)).toFixed(0)}/s</span>
            <span className="font-bold text-[#C45B5B]">+{data.metrics.latencyAdded.toFixed(1)}ms</span>
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={data?.isVertical ? Position.Top : Position.Left}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
      <Handle
        type="source"
        position={data?.isVertical ? Position.Bottom : Position.Right}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
    </div>
  );
}

export default memo(CacheNode);
