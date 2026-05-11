import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lightning } from '@phosphor-icons/react';

interface ImpulseData {
  label: string;
  amplitude: number;
  position: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function ImpulseGeneratorNode({ id, data }: NodeProps & { data: ImpulseData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-orange-400 dark:border-orange-500 rounded-2xl shadow-lg shadow-orange-500/10 min-w-[200px] overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 flex items-center gap-2">
        <Lightning size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Impulse δ(n)</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Amplitude: <span className="text-orange-500 font-bold">{data.amplitude ?? 1}</span>
          </label>
          <input type="range" min={0.1} max={5} step={0.1} value={data.amplitude ?? 1}
            onChange={(e) => onChange('amplitude', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-orange-500 cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Position: <span className="text-orange-500 font-bold">n={data.position ?? 0}</span>
          </label>
          <input type="range" min={0} max={512} step={1} value={data.position ?? 0}
            onChange={(e) => onChange('position', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-orange-500 cursor-pointer"
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(ImpulseGeneratorNode);
