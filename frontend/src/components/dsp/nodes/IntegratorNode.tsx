import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowsClockwise } from '@phosphor-icons/react';

interface IntegratorData {
  label: string;
  [key: string]: unknown;
}

function IntegratorNode({ data }: NodeProps & { data: IntegratorData }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-blue-400 dark:border-blue-500 rounded-2xl shadow-lg shadow-blue-500/10 min-w-[120px] overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 flex items-center gap-2">
        <ArrowsClockwise size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Integrator</span>
      </div>
      <div className="p-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-center">
          <span className="text-xl font-black text-blue-600 dark:text-blue-400">∫</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(IntegratorNode);
