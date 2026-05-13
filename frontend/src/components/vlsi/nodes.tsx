import React from 'react';
import BaseLogicNode from './nodes/BaseLogicNode';
import { COMPONENT_CATALOG } from './componentCatalog';

// ─── SVG Gate Body Shapes ──────────────────────────────────────────────────────
// IEEE/ANSI logic gate symbols as SVG, properly sized for the node cards.

const GateSVGs: Record<string, (props: { isOn?: boolean }) => React.ReactElement> = {
  gate_and: () => (
    <svg width="56" height="44" viewBox="-2 0 58 44" className="overflow-visible">
      <path
        d="M 8 4 L 26 4 A 18 18 0 0 1 44 22 A 18 18 0 0 1 26 40 L 8 40 Z"
        className="fill-indigo-900/60 stroke-indigo-400"
        strokeWidth="2"
      />
      {/* input stubs */}
      <line x1="0" y1="14" x2="8" y2="14" className="stroke-indigo-400/60" strokeWidth="1.5"/>
      <line x1="0" y1="30" x2="8" y2="30" className="stroke-indigo-400/60" strokeWidth="1.5"/>
      {/* output stub */}
      <line x1="44" y1="22" x2="56" y2="22" className="stroke-indigo-400/60" strokeWidth="1.5"/>
      <text x="22" y="26" fontSize="10" fill="#818cf8" fontWeight="700" fontFamily="monospace">&amp;</text>
    </svg>
  ),
  gate_nand: () => (
    <svg width="64" height="44" viewBox="-2 0 66 44" className="overflow-visible">
      <path d="M 8 4 L 26 4 A 18 18 0 0 1 44 22 A 18 18 0 0 1 26 40 L 8 40 Z" className="fill-indigo-900/60 stroke-indigo-400" strokeWidth="2"/>
      <circle cx="48" cy="22" r="4" className="fill-slate-900 stroke-indigo-400" strokeWidth="2"/>
      <line x1="0" y1="14" x2="8" y2="14" className="stroke-indigo-400/60" strokeWidth="1.5"/>
      <line x1="0" y1="30" x2="8" y2="30" className="stroke-indigo-400/60" strokeWidth="1.5"/>
      <line x1="52" y1="22" x2="63" y2="22" className="stroke-indigo-400/60" strokeWidth="1.5"/>
      <text x="22" y="26" fontSize="10" fill="#818cf8" fontWeight="700" fontFamily="monospace">&amp;</text>
    </svg>
  ),
  gate_or: () => (
    <svg width="56" height="44" viewBox="-2 0 58 44" className="overflow-visible">
      <path d="M 6 4 Q 20 4 36 22 Q 20 40 6 40 Q 18 30 18 22 Q 18 14 6 4 Z" className="fill-violet-900/60 stroke-violet-400" strokeWidth="2"/>
      <line x1="0" y1="14" x2="11" y2="14" className="stroke-violet-400/60" strokeWidth="1.5"/>
      <line x1="0" y1="30" x2="11" y2="30" className="stroke-violet-400/60" strokeWidth="1.5"/>
      <line x1="36" y1="22" x2="56" y2="22" className="stroke-violet-400/60" strokeWidth="1.5"/>
      <text x="17" y="26" fontSize="10" fill="#a78bfa" fontWeight="700" fontFamily="monospace">≥1</text>
    </svg>
  ),
  gate_nor: () => (
    <svg width="64" height="44" viewBox="-2 0 66 44" className="overflow-visible">
      <path d="M 6 4 Q 20 4 36 22 Q 20 40 6 40 Q 18 30 18 22 Q 18 14 6 4 Z" className="fill-violet-900/60 stroke-violet-400" strokeWidth="2"/>
      <circle cx="40" cy="22" r="4" className="fill-slate-900 stroke-violet-400" strokeWidth="2"/>
      <line x1="0" y1="14" x2="11" y2="14" className="stroke-violet-400/60" strokeWidth="1.5"/>
      <line x1="0" y1="30" x2="11" y2="30" className="stroke-violet-400/60" strokeWidth="1.5"/>
      <line x1="44" y1="22" x2="63" y2="22" className="stroke-violet-400/60" strokeWidth="1.5"/>
      <text x="15" y="26" fontSize="10" fill="#a78bfa" fontWeight="700" fontFamily="monospace">≥1</text>
    </svg>
  ),
  gate_xor: () => (
    <svg width="56" height="44" viewBox="-2 0 58 44" className="overflow-visible">
      <path d="M 10 4 Q 24 4 40 22 Q 24 40 10 40 Q 22 30 22 22 Q 22 14 10 4 Z" className="fill-cyan-900/60 stroke-cyan-400" strokeWidth="2"/>
      {/* XOR extra arc */}
      <path d="M 4 4 Q 12 14 12 22 Q 12 30 4 40" className="fill-none stroke-cyan-400" strokeWidth="2"/>
      <line x1="0" y1="14" x2="13" y2="14" className="stroke-cyan-400/60" strokeWidth="1.5"/>
      <line x1="0" y1="30" x2="13" y2="30" className="stroke-cyan-400/60" strokeWidth="1.5"/>
      <line x1="40" y1="22" x2="56" y2="22" className="stroke-cyan-400/60" strokeWidth="1.5"/>
      <text x="18" y="26" fontSize="10" fill="#22d3ee" fontWeight="700" fontFamily="monospace">=1</text>
    </svg>
  ),
  gate_not: () => (
    <svg width="50" height="44" viewBox="-2 0 52 44" className="overflow-visible">
      <path d="M 6 4 L 38 22 L 6 40 Z" className="fill-rose-900/60 stroke-rose-400" strokeWidth="2"/>
      <circle cx="42" cy="22" r="4" className="fill-slate-900 stroke-rose-400" strokeWidth="2"/>
      <line x1="0" y1="22" x2="6" y2="22" className="stroke-rose-400/60" strokeWidth="1.5"/>
      <line x1="46" y1="22" x2="50" y2="22" className="stroke-rose-400/60" strokeWidth="1.5"/>
      <text x="13" y="26" fontSize="9" fill="#fb7185" fontWeight="700" fontFamily="monospace">NOT</text>
    </svg>
  ),
};

// ─── FF Body – box with D/CLK labels ──────────────────────────────────────────
function FFShape({ label }: { label: string }) {
  return (
    <svg width="56" height="60" viewBox="0 0 56 60" className="overflow-visible">
      <rect x="2" y="2" width="52" height="56" rx="6" className="fill-emerald-900/40 stroke-emerald-500/80" strokeWidth="1.5"/>
      <text x="28" y="22" textAnchor="middle" fontSize="11" fill="#34d399" fontWeight="800" fontFamily="monospace">{label}</text>
      {/* clock triangle */}
      <path d="M 2 44 L 10 48 L 2 52" className="fill-none stroke-emerald-400/80" strokeWidth="1.5"/>
    </svg>
  );
}

// ─── MUX Body ─────────────────────────────────────────────────────────────────
function MuxShape() {
  return (
    <svg width="44" height="56" viewBox="0 0 44 56" className="overflow-visible">
      <path d="M 2 4 L 42 12 L 42 44 L 2 52 Z" className="fill-amber-900/40 stroke-amber-500/80" strokeWidth="1.5"/>
      <text x="22" y="30" textAnchor="middle" fontSize="10" fill="#fbbf24" fontWeight="800" fontFamily="monospace">MUX</text>
      <text x="22" y="42" textAnchor="middle" fontSize="8" fill="#fbbf24/60" fontFamily="monospace">2:1</text>
    </svg>
  );
}

// ─── Input Switch Node ─────────────────────────────────────────────────────────
function InputSwitchNode(props: any) {
  const isHigh = props.data.logicOutputs?.out === 1;

  const handleClick = () => {
    // Call back via data.onPropertyChange which the studio wires up
    if (props.data.onPropertyChange) {
      props.data.onPropertyChange(props.id, 'state', isHigh ? 0 : 1);
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <BaseLogicNode
        {...props}
        data={{
          ...props.data,
          svgShape: (
            <div className="flex flex-col items-center gap-1 py-1">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl shadow-inner transition-all duration-150
                  ${isHigh
                    ? 'bg-emerald-500 text-white shadow-emerald-800 ring-2 ring-emerald-300/40'
                    : 'bg-slate-700 text-slate-400 shadow-black/60'
                  }`}
              >
                {isHigh ? '1' : '0'}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {props.data.properties?.label || props.data.refDes}
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
}

// ─── Output LED Node ──────────────────────────────────────────────────────────
function OutputLedNode(props: any) {
  const isHigh = props.data.logicInputs?.in === 1;
  const color = props.data.properties?.color || 'red';

  const ledClass = isHigh
    ? color === 'green'  ? 'bg-emerald-400 shadow-[0_0_18px_6px_rgba(52,211,153,0.7)]'
    : color === 'blue'   ? 'bg-blue-400 shadow-[0_0_18px_6px_rgba(96,165,250,0.7)]'
    : color === 'yellow' ? 'bg-yellow-300 shadow-[0_0_18px_6px_rgba(253,224,71,0.7)]'
    :                      'bg-red-500 shadow-[0_0_18px_6px_rgba(239,68,68,0.7)]'
    : 'bg-slate-700/80 shadow-inner';

  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <div className="flex flex-col items-center gap-1 py-1">
            <div className={`w-8 h-8 rounded-full border-[3px] border-slate-900/80 transition-all duration-100 ${ledClass}`} />
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {props.data.properties?.label || props.data.refDes}
            </div>
          </div>
        ),
      }}
    />
  );
}

// ─── Clock Node ────────────────────────────────────────────────────────────────
function ClockNode(props: any) {
  const isHigh = props.data.logicOutputs?.out === 1;
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: (
          <div className="flex flex-col items-center gap-1 py-1">
            <div
              className={`w-12 h-8 rounded-lg border-2 flex items-center justify-center transition-colors duration-100
                ${isHigh ? 'border-emerald-400 bg-emerald-500/15' : 'border-slate-600 bg-slate-800'}`}
            >
              <svg width="28" height="14" viewBox="0 0 28 14" className="overflow-visible">
                <path
                  d="M 1 12 L 6 12 L 6 2 L 14 2 L 14 12 L 21 12 L 21 2 L 27 2"
                  fill="none"
                  stroke={isHigh ? '#34d399' : '#64748b'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-[9px] font-bold font-mono text-slate-500">
              {props.data.properties?.frequency || 1} Hz
            </div>
          </div>
        ),
      }}
    />
  );
}

// ─── Generic Gate Node ────────────────────────────────────────────────────────
function GateNode(props: any) {
  const type = props.data.componentType as string;
  const Shape = GateSVGs[type];
  return (
    <BaseLogicNode
      {...props}
      data={{
        ...props.data,
        svgShape: Shape ? <Shape /> : null,
      }}
    />
  );
}

// ─── Flip-Flop Node ───────────────────────────────────────────────────────────
function FlipFlopNode(props: any) {
  const type = props.data.componentType as string;
  const label = type === 'ff_d' ? 'D-FF' : type === 'ff_t' ? 'T-FF' : 'JK-FF';
  return (
    <BaseLogicNode
      {...props}
      data={{ ...props.data, svgShape: <FFShape label={label} /> }}
    />
  );
}

// ─── MUX Node ─────────────────────────────────────────────────────────────────
function MuxNode(props: any) {
  return (
    <BaseLogicNode
      {...props}
      data={{ ...props.data, svgShape: <MuxShape /> }}
    />
  );
}

// ─── Export node type map ──────────────────────────────────────────────────────
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

// Ensure any catalog items not explicitly handled fall back to BaseLogicNode
COMPONENT_CATALOG.forEach(c => {
  if (!vlsiNodeTypes[c.type]) {
    vlsiNodeTypes[c.type] = BaseLogicNode;
  }
});
