import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X } from '@phosphor-icons/react';

interface MultiplierData {
  label: string;
  [key: string]: unknown;
}

function MultiplierNode({ data }: NodeProps & { data: MultiplierData }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-rose-400 dark:border-rose-500 rounded-2xl shadow-lg shadow-rose-500/10 min-w-[120px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 flex items-center gap-2">
        <X size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Multiplier</span>
      </div>

      {/* Body */}
      <div className="p-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 flex items-center justify-center">
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">×</span>
        </div>
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '35%' }}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ top: '65%' }}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(MultiplierNode);
