import React from 'react';
import BaseLogicNode from './nodes/BaseLogicNode';
import { COMPONENT_CATALOG } from './componentCatalog';

// ─── IEEE/ANSI Standard Gate SVG Bodies ───────────────────────────────────────
// These float naked on the canvas — no card background

const GateSVGs: Record<string, () => React.ReactElement> = {
  gate_and: () => (
    <svg width="64" height="48" viewBox="0 0 64 48" className="overflow-visible drop-shadow-md">
      {/* Body */}
      <path
        d="M 10 6 L 30 6 A 18 18 0 0 1 30 42 L 10 42 Z"
        fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Input lines */}
      <line x1="0" y1="16" x2="10" y2="16" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="0" y1="32" x2="10" y2="32" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Output line */}
      <line x1="48" y1="24" x2="64" y2="24" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  gate_nand: () => (
    <svg width="72" height="48" viewBox="0 0 72 48" className="overflow-visible drop-shadow-md">
      <path
        d="M 10 6 L 30 6 A 18 18 0 0 1 30 42 L 10 42 Z"
        fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Bubble */}
      <circle cx="52" cy="24" r="4" fill="#0f172a" stroke="#818cf8" strokeWidth="2"/>
      <line x1="0"  y1="16" x2="10" y2="16" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="0"  y1="32" x2="10" y2="32" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="56" y1="24" x2="72" y2="24" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  gate_or: () => (
    <svg width="64" height="48" viewBox="0 0 64 48" className="overflow-visible drop-shadow-md">
      {/* OR curved body */}
      <path
        d="M 8 6 Q 22 6 38 24 Q 22 42 8 42 Q 18 34 18 24 Q 18 14 8 6 Z"
        fill="rgba(139,92,246,0.15)" stroke="#a78bfa" strokeWidth="2"
      />
      <line x1="0"  y1="16" x2="13" y2="16" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="0"  y1="32" x2="13" y2="32" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="38" y1="24" x2="64" y2="24" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  gate_nor: () => (
    <svg width="72" height="48" viewBox="0 0 72 48" className="overflow-visible drop-shadow-md">
      <path
        d="M 8 6 Q 22 6 38 24 Q 22 42 8 42 Q 18 34 18 24 Q 18 14 8 6 Z"
        fill="rgba(139,92,246,0.15)" stroke="#a78bfa" strokeWidth="2"
      />
      <circle cx="42" cy="24" r="4" fill="#0f172a" stroke="#a78bfa" strokeWidth="2"/>
      <line x1="0"  y1="16" x2="13" y2="16" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="0"  y1="32" x2="13" y2="32" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="46" y1="24" x2="72" y2="24" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  gate_xor: () => (
    <svg width="64" height="48" viewBox="0 0 64 48" className="overflow-visible drop-shadow-md">
      {/* XOR extra arc */}
      <path
        d="M 4 6 Q 14 14 14 24 Q 14 34 4 42"
        fill="none" stroke="#22d3ee" strokeWidth="2"
      />
      {/* Body */}
      <path
        d="M 10 6 Q 24 6 40 24 Q 24 42 10 42 Q 20 34 20 24 Q 20 14 10 6 Z"
        fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="2"
      />
      <line x1="0"  y1="16" x2="14" y2="16" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="0"  y1="32" x2="14" y2="32" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="40" y1="24" x2="64" y2="24" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  gate_not: () => (
    <svg width="56" height="48" viewBox="0 0 56 48" className="overflow-visible drop-shadow-md">
      <path
        d="M 8 8 L 40 24 L 8 40 Z"
        fill="rgba(251,113,133,0.12)" stroke="#fb7185" strokeWidth="2" strokeLinejoin="round"
      />
      <circle cx="44" cy="24" r="4" fill="#0f172a" stroke="#fb7185" strokeWidth="2"/>
      <line x1="0"  y1="24" x2="8"  y2="24" stroke="#fb7185" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="48" y1="24" x2="56" y2="24" stroke="#fb7185" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Flip-Flop box node ────────────────────────────────────────────────────────
function FlipFlopNode(props: any) {
  const type = props.data.componentType as string;
  const label = type === 'ff_d' ? 'D' : type === 'ff_t' ? 'T' : 'JK';
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <div className="flex flex-col items-center">
            <svg width="60" height="68" viewBox="0 0 60 68" className="overflow-visible drop-shadow-lg">
              <rect x="2" y="2" width="56" height="64" rx="7"
                fill="rgba(16,185,129,0.08)" stroke="#34d399" strokeWidth="1.8"/>
              {/* Label */}
              <text x="30" y="24" textAnchor="middle" fontSize="13" fill="#34d399" fontWeight="800" fontFamily="monospace">{label}</text>
              <text x="30" y="36" textAnchor="middle" fontSize="9" fill="#6ee7b7" fontFamily="monospace">FF</text>
              {/* Clock triangle */}
              <path d="M 2 50 L 10 55 L 2 60" fill="none" stroke="#34d399" strokeWidth="1.5"/>
            </svg>
          </div>
        ),
      }}
    />
  );
}

// ─── MUX node ─────────────────────────────────────────────────────────────────
function MuxNode(props: any) {
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <svg width="52" height="64" viewBox="0 0 52 64" className="overflow-visible drop-shadow-lg">
            <path d="M 2 6 L 50 14 L 50 50 L 2 58 Z"
              fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="1.8"/>
            <text x="26" y="34" textAnchor="middle" fontSize="10" fill="#fbbf24" fontWeight="800" fontFamily="monospace">MUX</text>
            <text x="26" y="46" textAnchor="middle" fontSize="8"  fill="#f59e0b" fontFamily="monospace">2:1</text>
          </svg>
        ),
      }}
    />
  );
}

// ─── Input Switch (card-based, interactive) ────────────────────────────────────
function InputSwitchNode(props: any) {
  const isHigh = props.data.logicOutputs?.out === 1;
  const handleClick = () => {
    props.data.onPropertyChange?.(props.id, 'state', isHigh ? 0 : 1);
  };
  return (
    <div onClick={handleClick} className="cursor-pointer">
      <BaseLogicNode
        {...props}
        data={{
          ...props.data,
          svgShape: (
            <div className="flex flex-col items-center gap-1 py-0.5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl transition-all duration-100
                ${isHigh
                  ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-300/50'
                  : 'bg-slate-700 text-slate-400 shadow-inner'
                }`}
              >
                {isHigh ? '1' : '0'}
              </div>
              <div className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                {props.data.properties?.label || props.data.refDes}
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
}

// ─── Output LED (card-based) ──────────────────────────────────────────────────
function OutputLedNode(props: any) {
  const isHigh = props.data.logicInputs?.in === 1;
  const color  = props.data.properties?.color || 'red';
  const ledClass = isHigh
    ? color === 'green'  ? 'bg-emerald-400 shadow-[0_0_16px_6px_rgba(52,211,153,0.65)]'
    : color === 'blue'   ? 'bg-blue-400 shadow-[0_0_16px_6px_rgba(96,165,250,0.65)]'
    : color === 'yellow' ? 'bg-yellow-300 shadow-[0_0_16px_6px_rgba(253,224,71,0.65)]'
    :                      'bg-red-500 shadow-[0_0_16px_6px_rgba(239,68,68,0.65)]'
    : 'bg-slate-700/80';
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <div className="flex flex-col items-center gap-1 py-0.5">
            <div className={`w-8 h-8 rounded-full border-[3px] border-slate-900/80 transition-all duration-100 ${ledClass}`}/>
            <div className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
              {props.data.properties?.label || props.data.refDes}
            </div>
          </div>
        ),
      }}
    />
  );
}

// ─── Clock node (card-based) ──────────────────────────────────────────────────
function ClockNode(props: any) {
  const isHigh = props.data.logicOutputs?.out === 1;
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <div className="flex flex-col items-center gap-1 py-0.5">
            <div className={`w-12 h-8 rounded-lg border-2 flex items-center justify-center transition-colors duration-100
              ${isHigh ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-600 bg-slate-800/60'}`}
            >
              <svg width="28" height="14" viewBox="0 0 28 14">
                <path
                  d="M 1 12 L 6 12 L 6 2 L 14 2 L 14 12 L 21 12 L 21 2 L 27 2"
                  fill="none" stroke={isHigh ? '#34d399' : '#64748b'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-[9px] font-mono text-slate-500">
              {props.data.properties?.frequency || 1} Hz
            </div>
          </div>
        ),
      }}
    />
  );
}

// ─── Generic Gate Node (naked — no card bg) ───────────────────────────────────
function GateNode(props: any) {
  const type  = props.data.componentType as string;
  const Shape = GateSVGs[type];
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        naked: true,     // ← no card background, SVG floats on canvas
        svgShape: Shape ? <Shape /> : null,
      }}
    />
  );
}

// ─── Node type registry ────────────────────────────────────────────────────────
export const vlsiNodeTypes: Record<string, React.ComponentType<any>> = {
  input_switch: InputSwitchNode,
  output_led:   OutputLedNode,
  clock:        ClockNode,
  gate_and:     GateNode,
  gate_or:      GateNode,
  gate_not:     GateNode,
  gate_nand:    GateNode,
  gate_nor:     GateNode,
  gate_xor:     GateNode,
  ff_d:         FlipFlopNode,
  ff_t:         FlipFlopNode,
  ff_jk:        FlipFlopNode,
  mux_2x1:      MuxNode,
};

// Fallback for any unlisted catalog entry
COMPONENT_CATALOG.forEach(c => {
  if (!vlsiNodeTypes[c.type]) {
    vlsiNodeTypes[c.type] = BaseLogicNode;
  }
});
