import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { WaveSine } from '@phosphor-icons/react';

interface ChirpData {
  label: string;
  startFreq: number;
  endFreq: number;
  amplitude: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function ChirpGeneratorNode({ id, data }: NodeProps & { data: ChirpData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-indigo-400 dark:border-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/10 min-w-[220px] overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 flex items-center gap-2">
        <WaveSine size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Chirp / Sweep</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Start: <span className="text-indigo-500 font-bold">{data.startFreq ?? 1} Hz</span>
          </label>
          <input type="range" min={1} max={100} step={1} value={data.startFreq ?? 1}
            onChange={(e) => onChange('startFreq', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-indigo-500 cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            End: <span className="text-indigo-500 font-bold">{data.endFreq ?? 50} Hz</span>
          </label>
          <input type="range" min={1} max={200} step={1} value={data.endFreq ?? 50}
            onChange={(e) => onChange('endFreq', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(ChirpGeneratorNode);
