import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { WaveSine } from '@phosphor-icons/react';

interface AbsValueData {
  label: string;
  [key: string]: unknown;
}

function AbsValueNode({ data }: NodeProps & { data: AbsValueData }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-pink-400 dark:border-pink-500 rounded-2xl shadow-lg shadow-pink-500/10 min-w-[120px] overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 flex items-center gap-2">
        <WaveSine size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">|x| Rectifier</span>
      </div>
      <div className="p-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-700 flex items-center justify-center">
          <span className="text-xl font-black text-pink-600 dark:text-pink-400">|x|</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-pink-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-pink-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(AbsValueNode);
