import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitFork } from '@phosphor-icons/react';

interface SplitterData {
  label: string;
  [key: string]: unknown;
}

function SplitterNode({ data }: NodeProps & { data: SplitterData }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-orange-400 dark:border-orange-500 rounded-2xl shadow-lg shadow-orange-500/10 min-w-[100px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 flex items-center gap-2">
        <GitFork size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Split</span>
      </div>

      {/* Body */}
      <div className="p-3 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 flex items-center justify-center">
          <GitFork size={20} weight="duotone" className="text-orange-600 dark:text-orange-400" />
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />

      {/* Two Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="out1"
        style={{ top: '35%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out2"
        style={{ top: '65%' }}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(SplitterNode);
