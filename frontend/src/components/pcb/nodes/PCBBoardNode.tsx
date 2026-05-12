import React, { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';

export interface PCBBoardNodeData {
  width?: number;
  height?: number;
  [key: string]: unknown;
}

function PCBBoardNodeInner({ data, selected }: NodeProps<PCBBoardNodeData>) {
  const rotation = Number((data.properties as any)?.rotation || 0);

  return (
    <>
      <div
        className="relative flex items-center justify-center shadow-2xl transition-all duration-200"
        style={{
          transform: `rotate(${rotation}deg)`,
          width: '100%',
          height: '100%',
          backgroundColor: '#06301A', // Deep green PCB substrate
          border: '2px solid #facc15', // Gold/Yellow Edge Cuts (silkscreen/outline)
          borderRadius: '12px',
          zIndex: -10, // Ensure it stays behind all components
        }}
      >
      {/* ── Mounting Holes (Vias) ── */}
      <div className="absolute top-4 left-4 w-6 h-6 rounded-full border-4 border-[#D4AF37] bg-[#111827] shadow-inner" />
      <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-4 border-[#D4AF37] bg-[#111827] shadow-inner" />
      <div className="absolute bottom-4 left-4 w-6 h-6 rounded-full border-4 border-[#D4AF37] bg-[#111827] shadow-inner" />
      <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-[#D4AF37] bg-[#111827] shadow-inner" />

      {/* Optional: Central watermark or faint logo */}
      <div className="absolute opacity-10 pointer-events-none flex flex-col items-center select-none">
        <span className="text-6xl font-bold text-white tracking-widest font-mono">AcadMix</span>
        <span className="text-xl font-bold text-white tracking-widest font-mono mt-2">PCB STUDIO</span>
      </div>
    </div>
    <NodeResizer 
      color="#facc15" 
      isVisible={selected} 
      minWidth={100} 
      minHeight={100} 
      lineStyle={{ borderWidth: 2, borderColor: '#facc15' }}
      handleStyle={{ width: 12, height: 12, backgroundColor: '#facc15', borderRadius: '2px' }}
    />
    </>
  );
}

export const PCBBoardNode = memo(PCBBoardNodeInner);
