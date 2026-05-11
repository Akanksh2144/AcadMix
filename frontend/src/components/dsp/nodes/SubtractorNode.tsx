import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Minus } from '@phosphor-icons/react';

interface SubtractorData {
  label: string;
  [key: string]: unknown;
}

function SubtractorNode({ data }: NodeProps & { data: SubtractorData }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-red-400 dark:border-red-500 rounded-2xl shadow-lg shadow-red-500/10 min-w-[120px] overflow-hidden">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center gap-2">
        <Minus size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Subtractor</span>
      </div>
      <div className="p-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 flex items-center justify-center">
          <span className="text-2xl font-black text-red-600 dark:text-red-400">−</span>
        </div>
      </div>
      {/* A - B: top handle = A (+), bottom handle = B (-) */}
      <Handle type="target" position={Position.Left} id="a" style={{ top: '35%' }} className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="target" position={Position.Left} id="b" style={{ top: '65%' }} className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(SubtractorNode);
