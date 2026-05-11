import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { WaveSine } from '@phosphor-icons/react';

interface SignalGeneratorData {
  label: string;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  frequency: number;
  amplitude: number;
  dcOffset: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle'] as const;

function SignalGeneratorNode({ id, data }: NodeProps & { data: SignalGeneratorData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-indigo-400 dark:border-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/10 min-w-[220px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 flex items-center gap-2">
        <WaveSine size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Signal Generator</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        {/* Waveform Select */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waveform</label>
          <select
            value={data.waveform || 'sine'}
            onChange={(e) => onChange('waveform', e.target.value)}
            className="w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
          >
            {WAVEFORMS.map((w) => (
              <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Frequency: <span className="text-indigo-500 font-bold">{data.frequency ?? 5} Hz</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={data.frequency ?? 5}
            onChange={(e) => onChange('frequency', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Amplitude */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Amplitude: <span className="text-indigo-500 font-bold">{data.amplitude ?? 1}</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={data.amplitude ?? 1}
            onChange={(e) => onChange('amplitude', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(SignalGeneratorNode);
