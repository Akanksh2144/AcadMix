import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { WaveSawtooth } from '@phosphor-icons/react';

interface NoiseGeneratorData {
  label: string;
  noiseType: 'white' | 'gaussian';
  amplitude: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function NoiseGeneratorNode({ id, data }: NodeProps & { data: NoiseGeneratorData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-violet-400 dark:border-violet-500 rounded-2xl shadow-lg shadow-violet-500/10 min-w-[200px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2 flex items-center gap-2">
        <WaveSawtooth size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Noise Source</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        {/* Noise Type */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</label>
          <select
            value={data.noiseType || 'white'}
            onChange={(e) => onChange('noiseType', e.target.value)}
            className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all"
          >
            <option value="white">White (Uniform)</option>
            <option value="gaussian">Gaussian (AWGN)</option>
          </select>
        </div>

        {/* Amplitude */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Amplitude: <span className="text-violet-500 font-bold">{data.amplitude ?? 0.5}</span>
          </label>
          <input
            type="range"
            min={0.01}
            max={3}
            step={0.01}
            value={data.amplitude ?? 0.5}
            onChange={(e) => onChange('amplitude', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-violet-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(NoiseGeneratorNode);
