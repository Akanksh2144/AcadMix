import React from 'react';
import { type NodeProps, useStore } from '@xyflow/react';

export default function LaneNode({ data, positionAbsoluteX }: NodeProps) {
  // Map our abstract color name to tailwind classes
  const colorMap: Record<string, { bg: string; text: string }> = {
    purple: { bg: 'bg-purple-500/5', text: 'text-purple-400' },
    blue: { bg: 'bg-blue-500/5', text: 'text-blue-400' },
    slate: { bg: 'bg-slate-500/5', text: 'text-slate-400' },
    emerald: { bg: 'bg-emerald-500/5', text: 'text-emerald-400' }
  };

  const style = colorMap[data.color] || colorMap.slate;
  const labelOffsetY = data.labelOffsetY || 0;
  
  const transform = useStore((s) => s.transform);
  const tx = transform[0];
  const zoom = transform[2];
  
  // Calculate the left edge of the viewport in the node's local coordinate space
  const screenLeftLocalX = -tx / zoom - positionAbsoluteX;
  const labelX = Math.max(24, screenLeftLocalX + 24);

  return (
    <div className={`w-full h-full border-b border-[var(--ink-border)] ${style.bg} relative`}>
      <div 
        className={`absolute text-sm font-bold uppercase tracking-widest ${style.text}`}
        style={{ transform: `translate(${labelX}px, ${labelOffsetY + 24}px)` }}
      >
        {data.label}
      </div>
    </div>
  );
}
