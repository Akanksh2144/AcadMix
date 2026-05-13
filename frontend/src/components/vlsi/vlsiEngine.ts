import { LogicGraph, LogicState } from './types';

// Evaluate a single node based on inputs
export function evaluateNode(
  type: string,
  inputs: Record<string, LogicState>,
  state: Record<string, any> // for internal state (e.g. flip-flops)
): { outputs: Record<string, LogicState>, newState: Record<string, any> } {
  const parseLogic = (val: LogicState) => val === 1;
  const toLogic = (val: boolean): LogicState => val ? 1 : 0;
  
  const newState = { ...state };
  let outputs: Record<string, LogicState> = {};

  switch (type) {
    case 'input_switch':
      outputs = { out: state.state === 1 ? 1 : 0 };
      break;
      
    case 'clock':
      outputs = { out: state.clockState === 1 ? 1 : 0 };
      break;

    case 'output_led':
      // LED has no logical output, it's an endpoint
      break;

    case 'gate_and':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) && parseLogic(inputs.in2)) };
      break;

    case 'gate_or':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) || parseLogic(inputs.in2)) };
      break;

    case 'gate_not':
      if (inputs.in === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(!parseLogic(inputs.in)) };
      break;

    case 'gate_nand':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(!(parseLogic(inputs.in1) && parseLogic(inputs.in2))) };
      break;

    case 'gate_nor':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(!(parseLogic(inputs.in1) || parseLogic(inputs.in2))) };
      break;

    case 'gate_xor':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) !== parseLogic(inputs.in2)) };
      break;

    case 'ff_d': {
      // D Flip Flop needs edge detection on clk
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const d = inputs.d === 1;
      
      let q = state.q ?? 0; // Default 0
      
      // Rising edge
      if (clk && !prevClk) {
        q = d ? 1 : 0;
      }
      
      newState.prevClk = clk;
      newState.q = q;
      outputs = { q: q as LogicState, qbar: (q === 1 ? 0 : 1) as LogicState };
      break;
    }
    
    case 'ff_t': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const t = inputs.t === 1;
      let q = state.q ?? 0;
      
      if (clk && !prevClk && t) {
        q = q === 1 ? 0 : 1;
      }
      
      newState.prevClk = clk;
      newState.q = q;
      outputs = { q: q as LogicState, qbar: (q === 1 ? 0 : 1) as LogicState };
      break;
    }

    case 'ff_jk': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const j = inputs.j === 1;
      const k = inputs.k === 1;
      let q = state.q ?? 0;
      
      if (clk && !prevClk) {
        if (j && !k) q = 1;
        else if (!j && k) q = 0;
        else if (j && k) q = q === 1 ? 0 : 1;
      }
      
      newState.prevClk = clk;
      newState.q = q;
      outputs = { q: q as LogicState, qbar: (q === 1 ? 0 : 1) as LogicState };
      break;
    }

    case 'mux_2x1': {
      const sel = inputs.sel === 1;
      if (sel) {
        outputs = { out: inputs.in1 ?? 'X' };
      } else {
        outputs = { out: inputs.in0 ?? 'X' };
      }
      break;
    }

    default:
      outputs = { out: 'X' };
  }

  return { outputs, newState };
}

// Generate Verilog from Graph
export function generateVerilog(graph: LogicGraph): string {
  let moduleName = "TopModule";
  
  let inputs: string[] = [];
  let outputs: string[] = [];
  let wires: string[] = [];
  let instances: string[] = [];
  
  // Map of node handle to wire name
  const edgeToWireName = new Map<string, string>();
  
  graph.edges.forEach((edge, index) => {
    const wireName = `w_${edge.source}_${edge.sourceHandle}`;
    edgeToWireName.set(edge.id, wireName);
    if (!wires.includes(wireName)) wires.push(wireName);
  });
  
  graph.nodes.forEach(node => {
    if (node.type === 'input_switch' || node.type === 'clock') {
      const inName = node.properties.label || node.refDes;
      inputs.push(inName);
    } else if (node.type === 'output_led') {
      const outName = node.properties.label || node.refDes;
      outputs.push(outName);
    }
  });

  const getWireForInput = (nodeId: string, handle: string): string => {
    const edge = graph.edges.find(e => e.target === nodeId && e.targetHandle === handle);
    if (!edge) return "1'b0"; // Default to 0 if unconnected
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    if (sourceNode?.type === 'input_switch' || sourceNode?.type === 'clock') {
      return sourceNode.properties.label || sourceNode.refDes;
    }
    return `w_${edge.source}_${edge.sourceHandle}`;
  };

  const getWireForOutput = (nodeId: string, handle: string): string => {
    const targetEdge = graph.edges.find(e => e.source === nodeId && e.sourceHandle === handle);
    if (targetEdge) {
      const targetNode = graph.nodes.find(n => n.id === targetEdge.target);
      if (targetNode?.type === 'output_led') {
        return targetNode.properties.label || targetNode.refDes;
      }
    }
    return `w_${nodeId}_${handle}`;
  };

  graph.nodes.forEach(node => {
    switch (node.type) {
      case 'gate_and':
        instances.push(`  and ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'gate_or':
        instances.push(`  or ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'gate_not':
        instances.push(`  not ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in')});`);
        break;
      case 'gate_nand':
        instances.push(`  nand ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'gate_nor':
        instances.push(`  nor ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'gate_xor':
        instances.push(`  xor ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'mux_2x1':
        instances.push(`  assign ${getWireForOutput(node.id, 'out')} = ${getWireForInput(node.id, 'sel')} ? ${getWireForInput(node.id, 'in1')} : ${getWireForInput(node.id, 'in0')};`);
        break;
      case 'ff_d':
        // Generate D-FF module inst
        instances.push(`  dff ${node.refDes} (.clk(${getWireForInput(node.id, 'clk')}), .d(${getWireForInput(node.id, 'd')}), .q(${getWireForOutput(node.id, 'q')}), .qbar(${getWireForOutput(node.id, 'qbar')}));`);
        break;
      case 'ff_t':
        instances.push(`  tff ${node.refDes} (.clk(${getWireForInput(node.id, 'clk')}), .t(${getWireForInput(node.id, 't')}), .q(${getWireForOutput(node.id, 'q')}), .qbar(${getWireForOutput(node.id, 'qbar')}));`);
        break;
      case 'ff_jk':
        instances.push(`  jkff ${node.refDes} (.clk(${getWireForInput(node.id, 'clk')}), .j(${getWireForInput(node.id, 'j')}), .k(${getWireForInput(node.id, 'k')}), .q(${getWireForOutput(node.id, 'q')}), .qbar(${getWireForOutput(node.id, 'qbar')}));`);
        break;
    }
  });

  let portList = [...inputs, ...outputs].join(', ');
  let code = `module ${moduleName}(${portList});\n`;
  if (inputs.length > 0) code += `  input ${inputs.join(', ')};\n`;
  if (outputs.length > 0) code += `  output ${outputs.join(', ')};\n`;
  
  // Filter out wires that are directly connected to outputs
  const internalWires = wires.filter(w => !outputs.includes(w));
  if (internalWires.length > 0) {
    code += `  wire ${internalWires.join(', ')};\n`;
  }
  
  code += `\n`;
  code += instances.join('\n');
  code += `\nendmodule\n`;

  return code;
}
