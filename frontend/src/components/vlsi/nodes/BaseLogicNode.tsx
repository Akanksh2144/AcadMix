import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { VLSIPin } from '../types';

interface BaseLogicNodeProps {
  data: {
    label: string;
    refDes: string;
    pins: VLSIPin[];
    state?: Record<string, any>; // Internal states
    logicOutputs?: Record<string, any>; // Logic output states (0 or 1)
    logicInputs?: Record<string, any>;
    properties?: Record<string, any>;
    icon?: React.ReactNode;
    svgShape?: React.ReactNode;
  };
  selected?: boolean;
}

export default function BaseLogicNode({ data, selected }: BaseLogicNodeProps) {
  return (
    <div className={`relative min-w-[60px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all ${
      selected ? 'ring-2 ring-emerald-500 bg-slate-800 shadow-lg shadow-emerald-500/20' : 'bg-slate-800/80 shadow border border-slate-700/50 hover:bg-slate-700'
    }`}>
      {/* Node Content */}
      <div className="flex flex-col items-center gap-1 z-10">
        {data.svgShape ? (
          data.svgShape
        ) : data.icon ? (
          <div className="text-emerald-400">{data.icon}</div>
        ) : (
          <div className="text-xs font-bold text-slate-300 px-2">{data.label}</div>
        )}
        <div className="text-[9px] font-mono text-slate-500 mt-1">{data.properties?.label || data.refDes}</div>
      </div>

      {/* Handles */}
      {data.pins.map((pin, i) => {
        let position = Position.Left;
        let isRight = false;
        if (pin.side === 'right') { position = Position.Right; isRight = true; }
        else if (pin.side === 'top') position = Position.Top;
        else if (pin.side === 'bottom') position = Position.Bottom;

        // Calculate logic state for this pin
        let pinState = 'X';
        if (pin.type === 'output' && data.logicOutputs) {
           pinState = data.logicOutputs[pin.id] !== undefined ? data.logicOutputs[pin.id] : 'X';
        } else if (pin.type === 'input' && data.logicInputs) {
           pinState = data.logicInputs[pin.id] !== undefined ? data.logicInputs[pin.id] : 'X';
        }

        const isHigh = pinState === 1 || pinState === true;
        const isLow = pinState === 0 || pinState === false;

        let handleColor = 'bg-slate-500 border-slate-700'; // Default undefined state
        if (isHigh) handleColor = 'bg-emerald-500 border-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
        else if (isLow) handleColor = 'bg-rose-500 border-rose-700 shadow-[0_0_8px_rgba(244,63,94,0.5)]';

        return (
          <div key={pin.id} className="absolute" style={{
            [pin.side === 'left' || pin.side === 'right' ? 'top' : 'left']: `${100 / (data.pins.filter(p => p.side === pin.side).length + 1) * (data.pins.filter(p => p.side === pin.side).indexOf(pin) + 1)}%`,
            [pin.side]: '-4px',
            transform: pin.side === 'left' ? 'translateY(-50%)' : pin.side === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
          }}>
            <Handle
              type={pin.type === 'input' ? 'target' : 'source'}
              position={position}
              id={pin.id}
              className={`!w-3 !h-3 !border-[2px] transition-colors ${handleColor}`}
            />
            {/* Pin Label */}
            <div className={`absolute text-[8px] font-bold text-slate-400 font-mono whitespace-nowrap top-1/2 -translate-y-1/2 ${isRight ? 'right-4' : 'left-4'}`}>
              {pin.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
