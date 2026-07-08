import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { HardDrive } from '@phosphor-icons/react';
import { NodeChaosBanner } from './NodeChaosBanner';

function ObjectStorageNode({ id, data }: NodeProps & { data: any }) {
  const hasChaos = Boolean(data?.chaosActive || (data?.errors && data.errors > 0));

  return (
    <div
      className={`bg-[#FFFDF8] dark:bg-[#1E2433] border border-[#C8BFA9] dark:border-[#2E3545] border-l-[3px] rounded-xl shadow-sm min-w-[210px] transition-all ${
        hasChaos ? '!border-red-500 ring-2 ring-red-500 bg-red-50/90 dark:bg-red-950/80 shadow-lg shadow-red-500/30 animate-pulse' : ''
      }`}
      style={{ borderLeftColor: hasChaos ? '#EF4444' : '#7B7B7B', fontFamily: "'Caveat', cursive" }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <HardDrive size={16} weight="bold" style={{ color: hasChaos ? '#EF4444' : '#7B7B7B' }} />
        <span className="text-base font-bold text-[#2D2D2D] dark:text-[#D4D4D4] font-[Caveat]">Object Storage (S3)</span>
      </div>

      <NodeChaosBanner id={id} data={data} />


      {data.metrics && (
        <div className="px-3 py-2 border-t border-[#E0D9CB] dark:border-[#2E3545] bg-[#F5F0E8]/60 dark:bg-[#161B28]/60 text-sm font-[Caveat]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B] dark:text-[#8B8B9A] font-semibold">throughput: {data.metrics.processedQPS.toFixed(0)} req/s</span>
            <span className="font-bold text-[#7B7B7B]">+{data.metrics.latencyAdded}ms</span>
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={data?.isVertical ? Position.Top : Position.Left}
        className="!w-3 !h-3 !bg-[#3D3D3D] dark:!bg-[#8B8B9A] !border-2 !border-[#FFFDF8] dark:!border-[#1E2433] !rounded-full !shadow-none"
      />
    </div>
  );
}

export default memo(ObjectStorageNode);
