import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CloudArrowDown } from '@phosphor-icons/react';

function CDNNode({ id, data }: NodeProps & { data: any }) {
  return (
    <div
      className="bg-[#FFFDF8] dark:bg-[#1E2433] border border-[#C8BFA9] dark:border-[#2E3545] border-l-[3px] rounded-xl shadow-sm min-w-[210px]"
      style={{ borderLeftColor: '#3A9A8B', fontFamily: "'Caveat', cursive" }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2">
        <CloudArrowDown size={16} weight="bold" style={{ color: '#3A9A8B' }} />
        <span className="text-base font-bold text-[#2D2D2D] dark:text-[#D4D4D4] font-[Caveat]">CDN Edge Cache</span>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-[#E0D9CB] dark:border-[#2E3545] bg-[#F5F0E8]/60 dark:bg-[#161B28]/60 text-sm">
          <div className="flex items-center justify-between font-[Caveat]">
            <span className="text-[#6B6B6B] dark:text-[#8B8B9A] font-semibold">Hits: {(data.metrics.processedQPS * (data.cacheHitRatio ?? 0.85)).toFixed(0)}/s</span>
            <span className="font-semibold" style={{ color: '#3A9A8B' }}>+{data.metrics.latencyAdded.toFixed(1)}ms</span>
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

export default memo(CDNNode);
