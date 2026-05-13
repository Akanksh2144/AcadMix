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

  gate_and3: () => (
    <svg width="72" height="64" viewBox="0 0 72 64" className="overflow-visible drop-shadow-md">
      <path d="M 10 6 L 35 6 A 24 24 0 0 1 35 58 L 10 58 Z" fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="2"/>
      <line x1="0" y1="16" x2="10" y2="16" stroke="#818cf8" strokeWidth="1.8"/>
      <line x1="0" y1="32" x2="10" y2="32" stroke="#818cf8" strokeWidth="1.8"/>
      <line x1="0" y1="48" x2="10" y2="48" stroke="#818cf8" strokeWidth="1.8"/>
      <line x1="58" y1="32" x2="72" y2="32" stroke="#818cf8" strokeWidth="1.8"/>
    </svg>
  ),

  gate_or3: () => (
    <svg width="72" height="64" viewBox="0 0 72 64" className="overflow-visible drop-shadow-md">
      <path d="M 8 6 Q 25 6 45 32 Q 25 58 8 58 Q 20 45 20 32 Q 20 19 8 6 Z" fill="rgba(139,92,246,0.15)" stroke="#a78bfa" strokeWidth="2"/>
      <line x1="0" y1="16" x2="15" y2="16" stroke="#a78bfa" strokeWidth="1.8"/>
      <line x1="0" y1="32" x2="18" y2="32" stroke="#a78bfa" strokeWidth="1.8"/>
      <line x1="0" y1="48" x2="15" y2="48" stroke="#a78bfa" strokeWidth="1.8"/>
      <line x1="45" y1="32" x2="72" y2="32" stroke="#a78bfa" strokeWidth="1.8"/>
    </svg>
  ),

  gate_buffer: () => (
    <svg width="56" height="48" viewBox="0 0 56 48" className="overflow-visible drop-shadow-md">
      <path d="M 8 8 L 40 24 L 8 40 Z" fill="rgba(148,163,184,0.12)" stroke="#94a3b8" strokeWidth="2"/>
      <line x1="0" y1="24" x2="8" y2="24" stroke="#94a3b8" strokeWidth="1.8"/>
      <line x1="40" y1="24" x2="56" y2="24" stroke="#94a3b8" strokeWidth="1.8"/>
    </svg>
  ),

  gate_xnor: () => (
    <svg width="72" height="48" viewBox="0 0 72 48" className="overflow-visible drop-shadow-md">
      <path d="M 4 6 Q 14 14 14 24 Q 14 34 4 42" fill="none" stroke="#22d3ee" strokeWidth="2"/>
      <path d="M 10 6 Q 24 6 40 24 Q 24 42 10 42 Q 20 34 20 24 Q 20 14 10 6 Z" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="2"/>
      <circle cx="44" cy="24" r="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="2"/>
      <line x1="0" y1="16" x2="14" y2="16" stroke="#22d3ee" strokeWidth="1.8"/>
      <line x1="0" y1="32" x2="14" y2="32" stroke="#22d3ee" strokeWidth="1.8"/>
      <line x1="48" y1="24" x2="72" y2="24" stroke="#22d3ee" strokeWidth="1.8"/>
    </svg>
  ),
};

// ─── Arithmetic Blocks ────────────────────────────────────────────────────────
function ArithmeticNode(props: any) {
  const type = props.data.componentType as string;
  const label = type === 'half_adder' ? 'H-ADD' : type === 'full_adder' ? 'F-ADD' : 'CMP';
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <svg width="64" height="72" viewBox="0 0 64 72" className="overflow-visible drop-shadow-lg">
            <rect x="2" y="2" width="60" height="68" rx="4" fill="rgba(236,72,153,0.08)" stroke="#ec4899" strokeWidth="1.8"/>
            <text x="32" y="32" textAnchor="middle" fontSize="10" fill="#ec4899" fontWeight="800" fontFamily="monospace">{label}</text>
            <text x="32" y="46" textAnchor="middle" fontSize="8" fill="#f472b6" fontFamily="monospace">ARITH</text>
          </svg>
        ),
      }}
    />
  );
}

// ─── Decoder/Mux 4x1/Demux Blocks ─────────────────────────────────────────────
function MultiPinBlockNode(props: any) {
  const type = props.data.componentType as string;
  const label = type.includes('decoder') ? 'DEC' : type.includes('mux') ? 'MUX' : 'DMUX';
  const sub = type.includes('3x8') ? '3:8' : '4:1';
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <svg width="60" height="84" viewBox="0 0 60 84" className="overflow-visible drop-shadow-lg">
            <rect x="2" y="2" width="56" height="80" rx="4" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="1.8"/>
            <text x="30" y="36" textAnchor="middle" fontSize="11" fill="#f59e0b" fontWeight="800" fontFamily="monospace">{label}</text>
            <text x="30" y="52" textAnchor="middle" fontSize="9" fill="#fbbf24" fontFamily="monospace">{sub}</text>
          </svg>
        ),
      }}
    />
  );
}

// ─── 4-bit Counter/Shift Register ─────────────────────────────────────────────
function SequentialAdvNode(props: any) {
  const type = props.data.componentType as string;
  const label = type.includes('counter') ? 'COUNT' : 'SHIFT';
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <svg width="68" height="88" viewBox="0 0 68 88" className="overflow-visible drop-shadow-lg">
            <rect x="2" y="2" width="64" height="84" rx="4" fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="1.8"/>
            <text x="34" y="38" textAnchor="middle" fontSize="10" fill="#06b6d4" fontWeight="800" fontFamily="monospace">{label}</text>
            <text x="34" y="54" textAnchor="middle" fontSize="8" fill="#22d3ee" fontFamily="monospace">4-BIT</text>
            {/* Clock triangle */}
            <path d="M 2 70 L 10 75 L 2 80" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
          </svg>
        ),
      }}
    />
  );
}

// ─── 7-Segment Display ────────────────────────────────────────────────────────
function Display7SegNode(props: any) {
  const val = props.data.logicState?.value ?? 0;
  const segments = get7SegSegments(val);
  const color = '#f87171'; // Red LED
  
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700 shadow-2xl">
            <svg width="40" height="60" viewBox="0 0 40 60">
              {/* Segments: a, b, c, d, e, f, g */}
              <path d="M 8 4 L 32 4" stroke={segments[0] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" className="transition-all duration-200" />
              <path d="M 36 8 L 36 26" stroke={segments[1] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
              <path d="M 36 34 L 36 52" stroke={segments[2] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
              <path d="M 8 56 L 32 56" stroke={segments[3] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
              <path d="M 4 34 L 4 52" stroke={segments[4] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
              <path d="M 4 8 L 4 26" stroke={segments[5] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
              <path d="M 8 30 L 32 30" stroke={segments[6] ? color : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        ),
      }}
    />
  );
}

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
              <text x="30" y="24" textAnchor="middle" fontSize="13" fill="#34d399" fontWeight="800" fontFamily="monospace">{label}</text>
              <text x="30" y="36" textAnchor="middle" fontSize="9" fill="#6ee7b7" fontFamily="monospace">FF</text>
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
  const Shape = GateSVGs[type as keyof typeof GateSVGs];
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        naked: true,
        svgShape: Shape ? <Shape /> : null,
      }}
    />
  );
}

function get7SegSegments(val: number): boolean[] {
  const map: Record<number, boolean[]> = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
    10: [true, true, true, false, true, true, true], // A
    11: [false, false, true, true, true, true, true], // b
    12: [true, false, false, true, true, true, false], // C
    13: [false, true, true, true, true, false, true], // d
    14: [true, false, false, true, true, true, true], // E
    15: [true, false, false, false, true, true, true], // F
  };
  return map[val] || [false, false, false, false, false, false, false];
}

// ─── Node type registry ────────────────────────────────────────────────────────
export const vlsiNodeTypes: Record<string, React.ComponentType<any>> = {
  input_switch: InputSwitchNode,
  output_led:   OutputLedNode,
  clock:        ClockNode,
  gate_and:     GateNode,
  gate_and3:    GateNode,
  gate_or:      GateNode,
  gate_or3:     GateNode,
  gate_not:     GateNode,
  gate_buffer:  GateNode,
  gate_nand:    GateNode,
  gate_nor:     GateNode,
  gate_xor:     GateNode,
  gate_xnor:    GateNode,
  ff_d:         FlipFlopNode,
  ff_t:         FlipFlopNode,
  ff_jk:        FlipFlopNode,
  mux_2x1:      MuxNode,
  mux_4x1:      MultiPinBlockNode,
  demux_1x4:    MultiPinBlockNode,
  decoder_3x8:  MultiPinBlockNode,
  half_adder:   ArithmeticNode,
  full_adder:   ArithmeticNode,
  comparator_2bit: ArithmeticNode,
  counter_4bit: SequentialAdvNode,
  shift_reg_4bit: SequentialAdvNode,
  display_7seg: Display7SegNode,
};

// Fallback for any unlisted catalog entry
COMPONENT_CATALOG.forEach(c => {
  if (!vlsiNodeTypes[c.type]) {
    vlsiNodeTypes[c.type] = BaseLogicNode;
  }
});
