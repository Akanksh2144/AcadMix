import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SquaresFour } from '@phosphor-icons/react';

interface QuantizerData {
  label: string;
  bits: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function QuantizerNode({ id, data }: NodeProps & { data: QuantizerData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  const levels = Math.pow(2, data.bits ?? 4);

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-yellow-400 dark:border-yellow-500 rounded-2xl shadow-lg shadow-yellow-500/10 min-w-[180px] overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-2 flex items-center gap-2">
        <SquaresFour size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Quantizer</span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Bits: <span className="text-yellow-600 dark:text-yellow-400 font-bold">{data.bits ?? 4}</span>
            <span className="text-gray-400 ml-1">({levels} levels)</span>
          </label>
          <input type="range" min={1} max={12} step={1} value={data.bits ?? 4}
            onChange={(e) => onChange('bits', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-yellow-500 cursor-pointer"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-yellow-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-yellow-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(QuantizerNode);
