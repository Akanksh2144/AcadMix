import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Gauge } from '@phosphor-icons/react';

interface PowerMeterData {
  label: string;
  signalData?: Float64Array;
  [key: string]: unknown;
}

function PowerMeterNode({ data }: NodeProps & { data: PowerMeterData }) {
  const stats = useMemo(() => {
    if (!data.signalData || data.signalData.length === 0) return null;
    const arr = data.signalData;
    let sum = 0, sumSq = 0, min = Infinity, max = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      sumSq += arr[i] * arr[i];
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    const mean = sum / arr.length;
    const rms = Math.sqrt(sumSq / arr.length);
    const peak = Math.max(Math.abs(min), Math.abs(max));
    const powerDbm = 10 * Math.log10(rms * rms + 1e-20);
    return { mean, rms, peak, min, max, powerDbm };
  }, [data.signalData]);

  return (
    <div className="bg-gray-900 border-2 border-green-400 rounded-2xl shadow-lg shadow-green-500/20 min-w-[220px] overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center gap-2">
        <Gauge size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Power Meter</span>
      </div>
      <div className="p-3">
        {stats ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase font-semibold">RMS</div>
              <div className="text-sm font-bold text-green-400 font-mono">{stats.rms.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase font-semibold">Peak</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">{stats.peak.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase font-semibold">Mean</div>
              <div className="text-sm font-bold text-amber-400 font-mono">{stats.mean.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase font-semibold">Power</div>
              <div className="text-sm font-bold text-rose-400 font-mono">{stats.powerDbm.toFixed(1)} dB</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600 text-xs font-mono py-4">
            No signal — connect an input
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3.5 !h-3.5 !bg-green-400 !border-2 !border-gray-900 !rounded-full !shadow-md" />
    </div>
  );
}

export default memo(PowerMeterNode);
