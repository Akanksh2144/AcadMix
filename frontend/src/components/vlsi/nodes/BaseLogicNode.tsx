import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { VLSIPin } from '../types';

interface BaseLogicNodeProps {
  id?: string;
  data: {
    label?: string;
    refDes: string;
    componentType?: string;
    pins: VLSIPin[];
    state?: Record<string, any>;
    logicOutputs?: Record<string, any>;
    logicInputs?: Record<string, any>;
    properties?: Record<string, any>;
    icon?: React.ReactNode;
    svgShape?: React.ReactNode;
    naked?: boolean; // When true: no card background — gate floats on canvas
    onPropertyChange?: (id: string, field: string, value: any) => void;
  };
  selected?: boolean;
}

function getHandlePosition(pin: VLSIPin, allPins: VLSIPin[]): Record<string, string> {
  const sameSidePins = allPins.filter(p => p.side === pin.side);
  const indexOnSide = sameSidePins.findIndex(p => p.id === pin.id);
  const total = sameSidePins.length;
  const pct = `${(100 / (total + 1)) * (indexOnSide + 1)}%`;

  const style: Record<string, string> = {};
  if (pin.side === 'left' || pin.side === 'right') {
    style.top = pct;
    style[pin.side] = '-6px';
    style.transform = 'translateY(-50%)';
  } else {
    style.left = pct;
    style[pin.side] = '-6px';
    style.transform = 'translateX(-50%)';
  }
  return style;
}

export default function BaseLogicNode({ id, data, selected }: BaseLogicNodeProps) {
  const isNaked = data.naked === true;

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-150 select-none
        ${isNaked
          ? selected
            ? 'ring-2 ring-emerald-400/60 rounded-xl shadow-[0_0_16px_rgba(16,185,129,0.2)]'
            : ''
          : selected
            ? 'rounded-xl ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-slate-800 p-3'
            : 'rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-md hover:border-slate-600/60 hover:bg-slate-800 p-3'
        }`}
      style={{ minWidth: isNaked ? 0 : 64, minHeight: isNaked ? 0 : 48 }}
    >
      {/* Node Body */}
      <div className="flex flex-col items-center gap-0.5 z-10 pointer-events-none">
        {data.svgShape ?? (
          <div className="text-xs font-bold text-slate-300 px-2">{data.label || data.refDes}</div>
        )}
      </div>

      {/* Handles with pin labels */}
      {data.pins.map(pin => {
        const rfPosition =
          pin.side === 'right' ? Position.Right :
          pin.side === 'top'   ? Position.Top   :
          pin.side === 'bottom'? Position.Bottom :
                                 Position.Left;

        const logicVal =
          pin.type === 'output'
            ? data.logicOutputs?.[pin.id]
            : data.logicInputs?.[pin.id];

        const isHigh = logicVal === 1;
        const isLow  = logicVal === 0;

        const dotClass = isHigh
          ? 'bg-emerald-400 border-emerald-600 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
          : isLow
            ? 'bg-rose-500 border-rose-700 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
            : 'bg-slate-500 border-slate-700';

        const posStyle = getHandlePosition(pin, data.pins);
        let labelPos = "";
        if (pin.side === 'left') labelPos = "right-full mr-1.5 top-1/2 -translate-y-1/2";
        else if (pin.side === 'right') labelPos = "left-full ml-1.5 top-1/2 -translate-y-1/2";
        else if (pin.side === 'top') labelPos = "bottom-full mb-1.5 left-1/2 -translate-x-1/2";
        else if (pin.side === 'bottom') labelPos = "top-full mt-1.5 left-1/2 -translate-x-1/2";

        return (
          <div key={pin.id} className="absolute" style={posStyle}>
            <Handle
              type={pin.type === 'input' ? 'target' : 'source'}
              position={rfPosition}
              id={pin.id}
              className={`!w-3 !h-3 !border-2 transition-all duration-100 ${dotClass}`}
            />
            {/* Pin label — skip for nodes that show their own label */}
            {pin.label && (
              <span
                className={`absolute text-[9px] font-bold font-mono text-slate-300 whitespace-nowrap pointer-events-none bg-slate-900 px-1 rounded-sm border border-slate-700/50 shadow-sm ${labelPos}`}
              >
                {pin.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
