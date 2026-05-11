import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Swap } from '@phosphor-icons/react';

interface PhaseShifterData {
  label: string;
  phaseDeg: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

function PhaseShifterNode({ id, data }: NodeProps & { data: PhaseShifterData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-cyan-400 dark:border-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/10 min-w-[180px] overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 flex items-center gap-2">
        <Swap size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Phase Shift</span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Phase: <span className="text-cyan-500 font-bold">{data.phaseDeg ?? 90}°</span>
          </label>
          <input type="range" min={0} max={360} step={1} value={data.phaseDeg ?? 90}
            onChange={(e) => onChange('phaseDeg', Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-cyan-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-cyan-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(PhaseShifterNode);
