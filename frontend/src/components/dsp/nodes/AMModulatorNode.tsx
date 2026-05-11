import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Broadcast } from '@phosphor-icons/react';

interface AMModData {
  label: string;
  carrierFreq: number;
  modulationIndex: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function AMModulatorNode({ id, data }: NodeProps & { data: AMModData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-fuchsia-400 dark:border-fuchsia-500 rounded-2xl shadow-lg shadow-fuchsia-500/10 min-w-[220px] overflow-hidden">
      <div className="bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 flex items-center gap-2">
        <Broadcast size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">AM Modulator</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Carrier: <span className="text-fuchsia-500 font-bold">{data.carrierFreq ?? 50} Hz</span>
          </label>
          <input type="range" min={10} max={200} step={1} value={data.carrierFreq ?? 50}
            onChange={(e) => onChange('carrierFreq', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-fuchsia-500 cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Mod Index: <span className="text-fuchsia-500 font-bold">{(data.modulationIndex ?? 0.8).toFixed(1)}</span>
          </label>
          <input type="range" min={0} max={2} step={0.1} value={data.modulationIndex ?? 0.8}
            onChange={(e) => onChange('modulationIndex', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-fuchsia-500 cursor-pointer"
          />
        </div>
      </div>
      {/* Message input */}
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(AMModulatorNode);
