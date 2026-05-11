import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus } from '@phosphor-icons/react';

interface AdderData {
  label: string;
  [key: string]: unknown;
}

function AdderNode({ data }: NodeProps & { data: AdderData }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-emerald-400 dark:border-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/10 min-w-[120px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 flex items-center gap-2">
        <Plus size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Adder</span>
      </div>

      {/* Body */}
      <div className="p-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Σ</span>
        </div>
      </div>

      {/* Input Handles (left side, two inputs) */}
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '35%' }}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ top: '65%' }}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(AdderNode);
