import React from 'react';
import BaseLogicNode from './nodes/BaseLogicNode';
import { COMPONENT_CATALOG } from './componentCatalog';

// Interactive Switch Node
function InputSwitchNode(props: any) {
  const isHigh = props.data.logicOutputs?.out === 1;
  const toggle = () => {
    if (props.data.onPropertyChange) {
      props.data.onPropertyChange(props.id, 'state', isHigh ? 0 : 1);
    }
  };

  return (
    <div onClick={toggle} className="cursor-pointer">
      <BaseLogicNode {...props} data={{
        ...props.data,
        svgShape: (
          <div className="w-10 h-10 flex flex-col items-center justify-center">
            <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-inner transition-colors ${isHigh ? 'bg-emerald-500 text-white shadow-emerald-500/50' : 'bg-slate-700 text-slate-400 shadow-black/50'}`}>
              {isHigh ? '1' : '0'}
            </div>
            <div className="text-[8px] font-bold uppercase mt-1 text-slate-500">{props.data.properties?.label || props.data.refDes}</div>
          </div>
        )
      }} />
    </div>
  );
}

// LED Output Node
function OutputLedNode(props: any) {
  const isHigh = props.data.logicInputs?.in === 1;
  const color = props.data.properties?.color || 'red';
  
  let ledColor = 'bg-slate-700 shadow-inner'; // off
  if (isHigh) {
    if (color === 'red') ledColor = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';
    else if (color === 'green') ledColor = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]';
    else if (color === 'blue') ledColor = 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]';
    else if (color === 'yellow') ledColor = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]';
  }

  return (
    <BaseLogicNode {...props} data={{
      ...props.data,
      svgShape: (
        <div className="w-10 h-10 flex flex-col items-center justify-center">
          <div className={`w-6 h-6 rounded-full border-2 border-slate-900 transition-all duration-100 ${ledColor}`}></div>
          <div className="text-[8px] font-bold uppercase mt-1 text-slate-500">{props.data.properties?.label || props.data.refDes}</div>
        </div>
      )
    }} />
  );
}

// Clock Node
function ClockNode(props: any) {
  const isHigh = props.data.logicOutputs?.out === 1;
  return (
    <BaseLogicNode {...props} data={{
      ...props.data,
      svgShape: (
        <div className="w-10 h-10 flex flex-col items-center justify-center">
          <div className={`w-8 h-6 border-2 rounded flex items-center justify-center transition-colors ${isHigh ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-slate-600 text-slate-500 bg-slate-800'}`}>
            <svg width="20" height="12" viewBox="0 0 20 12" className="stroke-current fill-none stroke-2">
              <path d="M 2 10 L 6 10 L 6 2 L 14 2 L 14 10 L 18 10" />
            </svg>
          </div>
          <div className="text-[8px] font-bold uppercase mt-1 text-slate-500">{props.data.properties?.frequency || 1}Hz</div>
        </div>
      )
    }} />
  );
}

// Gate SVG Shapes
const GateShapes: Record<string, React.FC<any>> = {
  gate_and: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M 5 5 L 20 5 A 15 15 0 0 1 35 20 A 15 15 0 0 1 20 35 L 5 35 Z" className={color} strokeWidth="2" fillOpacity="0.2" />
    </svg>
  ),
  gate_nand: ({ color }) => (
    <svg width="45" height="40" viewBox="0 0 45 40">
      <path d="M 5 5 L 20 5 A 15 15 0 0 1 35 20 A 15 15 0 0 1 20 35 L 5 35 Z" className={color} strokeWidth="2" fillOpacity="0.2" />
      <circle cx="40" cy="20" r="3" className={color} strokeWidth="2" fillOpacity="0.2" />
    </svg>
  ),
  gate_or: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M 5 5 Q 15 20 5 35 L 15 35 Q 35 35 35 20 Q 35 5 15 5 Z" className={color} strokeWidth="2" fillOpacity="0.2" />
    </svg>
  ),
  gate_nor: ({ color }) => (
    <svg width="45" height="40" viewBox="0 0 45 40">
      <path d="M 5 5 Q 15 20 5 35 L 15 35 Q 35 35 35 20 Q 35 5 15 5 Z" className={color} strokeWidth="2" fillOpacity="0.2" />
      <circle cx="40" cy="20" r="3" className={color} strokeWidth="2" fillOpacity="0.2" />
    </svg>
  ),
  gate_xor: ({ color }) => (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M 5 5 Q 15 20 5 35 M 10 5 Q 20 20 10 35 L 15 35 Q 35 35 35 20 Q 35 5 15 5 Z" className={color} strokeWidth="2" fillOpacity="0.2" fill="none" />
    </svg>
  ),
  gate_not: ({ color }) => (
    <svg width="45" height="40" viewBox="0 0 45 40">
      <path d="M 10 5 L 35 20 L 10 35 Z" className={color} strokeWidth="2" fillOpacity="0.2" />
      <circle cx="40" cy="20" r="3" className={color} strokeWidth="2" fillOpacity="0.2" />
    </svg>
  ),
};

function GenericGateNode(props: any) {
  const type = props.data.componentType;
  const Shape = GateShapes[type];
  const color = 'stroke-indigo-400 fill-indigo-900';
  
  return (
    <BaseLogicNode {...props} data={{
      ...props.data,
      svgShape: Shape ? <Shape color={color} /> : null
    }} />
  );
}

// Generate the nodeTypes mapping dynamically
const generatedNodeTypes: Record<string, React.ComponentType<any>> = {
  input_switch: InputSwitchNode,
  output_led: OutputLedNode,
  clock: ClockNode,
};

COMPONENT_CATALOG.forEach(c => {
  if (!generatedNodeTypes[c.type]) {
    if (c.category === 'gates') {
      generatedNodeTypes[c.type] = GenericGateNode;
    } else {
      generatedNodeTypes[c.type] = BaseLogicNode; // Fallback to basic box
    }
  }
});

export const vlsiNodeTypes = generatedNodeTypes;
