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
    case 'logic_analyzer':
      break;

    case 'gate_and':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) && parseLogic(inputs.in2)) };
      break;

    case 'gate_and3':
      if (inputs.in1 === undefined || inputs.in2 === undefined || inputs.in3 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) && parseLogic(inputs.in2) && parseLogic(inputs.in3)) };
      break;

    case 'gate_or':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) || parseLogic(inputs.in2)) };
      break;

    case 'gate_or3':
      if (inputs.in1 === undefined || inputs.in2 === undefined || inputs.in3 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) || parseLogic(inputs.in2) || parseLogic(inputs.in3)) };
      break;

    case 'gate_not':
      if (inputs.in === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(!parseLogic(inputs.in)) };
      break;

    case 'gate_buffer':
      outputs = { out: inputs.in ?? 'X' };
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

    case 'gate_xnor':
      if (inputs.in1 === undefined || inputs.in2 === undefined) outputs = { out: 'X' };
      else outputs = { out: toLogic(parseLogic(inputs.in1) === parseLogic(inputs.in2)) };
      break;

    case 'ff_d': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const d = inputs.d === 1;
      let q = state.q ?? 0;
      if (clk && !prevClk) q = d ? 1 : 0;
      newState.prevClk = clk;
      newState.q = q;
      outputs = { q: q as LogicState, qbar: (q === 1 ? 0 : 1) as LogicState };
      break;
    }

    case 'latch_d': {
      const en = inputs.en === 1;
      const d = inputs.d === 1;
      let q = state.q ?? 0;
      if (en) q = d ? 1 : 0;
      newState.q = q;
      outputs = { q: q as LogicState, qbar: (q === 1 ? 0 : 1) as LogicState };
      break;
    }
    
    case 'ff_t': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const t = inputs.t === 1;
      let q = state.q ?? 0;
      if (clk && !prevClk && t) q = q === 1 ? 0 : 1;
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
      outputs = { out: sel ? (inputs.in1 ?? 'X') : (inputs.in0 ?? 'X') };
      break;
    }

    case 'mux_4x1': {
      const s0 = inputs.s0 === 1;
      const s1 = inputs.s1 === 1;
      const index = (s1 ? 2 : 0) + (s0 ? 1 : 0);
      outputs = { out: inputs[`in${index}`] ?? 'X' };
      break;
    }

    case 'demux_1x4': {
      const s0 = inputs.s0 === 1;
      const s1 = inputs.s1 === 1;
      const index = (s1 ? 2 : 0) + (s0 ? 1 : 0);
      const val = inputs.in ?? 0;
      outputs = { out0: 0, out1: 0, out2: 0, out3: 0 };
      outputs[`out${index}`] = val;
      break;
    }

    case 'decoder_3x8': {
      const a = inputs.a === 1;
      const b = inputs.b === 1;
      const c = inputs.c === 1;
      const index = (c ? 4 : 0) + (b ? 2 : 0) + (a ? 1 : 0);
      for (let i = 0; i < 8; i++) outputs[`out${i}`] = (i === index ? 1 : 0);
      break;
    }

    case 'priority_enc_8x3': {
      let index = -1;
      for (let i = 7; i >= 0; i--) {
        if (inputs[`in${i}`] === 1) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        outputs = { a: 0, b: 0, c: 0, v: 0 };
      } else {
        outputs = {
          a: toLogic((index & 1) !== 0),
          b: toLogic((index & 2) !== 0),
          c: toLogic((index & 4) !== 0),
          v: 1
        };
      }
      break;
    }

    case 'bcd_to_7seg': {
      const a = inputs.a === 1;
      const b = inputs.b === 1;
      const c = inputs.c === 1;
      const d = inputs.d === 1;
      const n = (d ? 8 : 0) + (c ? 4 : 0) + (b ? 2 : 0) + (a ? 1 : 0);
      const segments = [
        0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71
      ];
      const seg = segments[n % 16];
      outputs = {
        sa: toLogic((seg & 0x01) !== 0),
        sb: toLogic((seg & 0x02) !== 0),
        sc: toLogic((seg & 0x04) !== 0),
        sd: toLogic((seg & 0x08) !== 0),
        se: toLogic((seg & 0x10) !== 0),
        sf: toLogic((seg & 0x20) !== 0),
        sg: toLogic((seg & 0x40) !== 0),
      };
      break;
    }

    case 'half_adder': {
      const a = inputs.a === 1;
      const b = inputs.b === 1;
      outputs = { sum: toLogic(a !== b), cout: toLogic(a && b) };
      break;
    }

    case 'full_adder': {
      const a = inputs.a === 1;
      const b = inputs.b === 1;
      const cin = inputs.cin === 1;
      const sum = (a !== b) !== cin;
      const cout = (a && b) || (cin && (a !== b));
      outputs = { sum: toLogic(sum), cout: toLogic(cout) };
      break;
    }

    case 'alu_4bit': {
      const a = (inputs.a3 === 1 ? 8 : 0) + (inputs.a2 === 1 ? 4 : 0) + (inputs.a1 === 1 ? 2 : 0) + (inputs.a0 === 1 ? 1 : 0);
      const b = (inputs.b3 === 1 ? 8 : 0) + (inputs.b2 === 1 ? 4 : 0) + (inputs.b1 === 1 ? 2 : 0) + (inputs.b0 === 1 ? 1 : 0);
      const sel = (inputs.s2 === 1 ? 4 : 0) + (inputs.s1 === 1 ? 2 : 0) + (inputs.s0 === 1 ? 1 : 0);
      let res = 0;
      switch (sel) {
        case 0: res = a + b; break; // Add
        case 1: res = a - b; break; // Sub
        case 2: res = a & b; break; // AND
        case 3: res = a | b; break; // OR
        case 4: res = a ^ b; break; // XOR
        case 5: res = ~a & 0xF; break; // NOT A
        case 6: res = a << 1; break; // SHL
        case 7: res = a >> 1; break; // SHR
      }
      outputs = {
        y0: toLogic((res & 1) !== 0),
        y1: toLogic((res & 2) !== 0),
        y2: toLogic((res & 4) !== 0),
        y3: toLogic((res & 8) !== 0),
        cf: toLogic((res & 0x10) !== 0 || res < 0),
        zf: toLogic((res & 0xF) === 0)
      };
      break;
    }

    case 'multiplier_4bit': {
      const a = (inputs.a3 === 1 ? 8 : 0) + (inputs.a2 === 1 ? 4 : 0) + (inputs.a1 === 1 ? 2 : 0) + (inputs.a0 === 1 ? 1 : 0);
      const b = (inputs.b3 === 1 ? 8 : 0) + (inputs.b2 === 1 ? 4 : 0) + (inputs.b1 === 1 ? 2 : 0) + (inputs.b0 === 1 ? 1 : 0);
      const res = a * b;
      for (let i = 0; i < 8; i++) outputs[`y${i}`] = toLogic((res & (1 << i)) !== 0);
      break;
    }

    case 'comparator_4bit': {
      const a = (inputs.a3 === 1 ? 8 : 0) + (inputs.a2 === 1 ? 4 : 0) + (inputs.a1 === 1 ? 2 : 0) + (inputs.a0 === 1 ? 1 : 0);
      const b = (inputs.b3 === 1 ? 8 : 0) + (inputs.b2 === 1 ? 4 : 0) + (inputs.b1 === 1 ? 2 : 0) + (inputs.b0 === 1 ? 1 : 0);
      outputs = { gt: toLogic(a > b), eq: toLogic(a === b), lt: toLogic(a < b) };
      break;
    }

    case 'counter_4bit': {
      const clk = inputs.clk === 1;
      const rst = inputs.rst === 1;
      const prevClk = state.prevClk === true;
      let count = state.count ?? 0;
      if (rst) count = 0;
      else if (clk && !prevClk) count = (count + 1) % 16;
      newState.prevClk = clk;
      newState.count = count;
      outputs = {
        q0: toLogic((count & 1) !== 0),
        q1: toLogic((count & 2) !== 0),
        q2: toLogic((count & 4) !== 0),
        q3: toLogic((count & 8) !== 0),
      };
      break;
    }

    case 'shift_reg_4bit': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const sin = inputs.sin === 1;
      let bits = state.bits ?? [0, 0, 0, 0];
      if (clk && !prevClk) bits = [sin ? 1 : 0, ...bits.slice(0, 3)];
      newState.prevClk = clk;
      newState.bits = bits;
      outputs = { q0: bits[0] as LogicState, q1: bits[1] as LogicState, q2: bits[2] as LogicState, q3: bits[3] as LogicState };
      break;
    }

    case 'univ_shift_reg': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const s = (inputs.s1 === 1 ? 2 : 0) + (inputs.s0 === 1 ? 1 : 0);
      let bits = state.bits ?? [0, 0, 0, 0];
      if (clk && !prevClk) {
        if (s === 1) bits = [inputs.sr === 1 ? 1 : 0, ...bits.slice(0, 3)]; // Shift Right
        else if (s === 2) bits = [...bits.slice(1), inputs.sl === 1 ? 1 : 0]; // Shift Left
        else if (s === 3) bits = [inputs.d0 === 1 ? 1 : 0, inputs.d1 === 1 ? 1 : 0, inputs.d2 === 1 ? 1 : 0, inputs.d3 === 1 ? 1 : 0]; // Parallel Load
      }
      newState.prevClk = clk;
      newState.bits = bits;
      outputs = { q0: bits[0] as LogicState, q1: bits[1] as LogicState, q2: bits[2] as LogicState, q3: bits[3] as LogicState };
      break;
    }

    case 'reg_8bit': {
      const clk = inputs.clk === 1;
      const prevClk = state.prevClk === true;
      const en = inputs.en === 1;
      let bits = state.bits ?? [0, 0, 0, 0, 0, 0, 0, 0];
      if (clk && !prevClk && en) {
        for (let i = 0; i < 8; i++) bits[i] = inputs[`d${i}`] === 1 ? 1 : 0;
      }
      newState.prevClk = clk;
      newState.bits = bits;
      for (let i = 0; i < 8; i++) outputs[`q${i}`] = bits[i] as LogicState;
      break;
    }

    case 'ram_16x4': {
      const addr = (inputs.a3 === 1 ? 8 : 0) + (inputs.a2 === 1 ? 4 : 0) + (inputs.a1 === 1 ? 2 : 0) + (inputs.a0 === 1 ? 1 : 0);
      const we = inputs.we === 1;
      let memory = state.memory ?? Array(16).fill(0);
      if (we) {
        const val = (inputs.di3 === 1 ? 8 : 0) + (inputs.di2 === 1 ? 4 : 0) + (inputs.di1 === 1 ? 2 : 0) + (inputs.di0 === 1 ? 1 : 0);
        memory[addr] = val;
      }
      newState.memory = memory;
      const outVal = memory[addr];
      outputs = {
        do0: toLogic((outVal & 1) !== 0),
        do1: toLogic((outVal & 2) !== 0),
        do2: toLogic((outVal & 4) !== 0),
        do3: toLogic((outVal & 8) !== 0),
      };
      break;
    }

    case 'rom_16x4': {
      const addr = (inputs.a3 === 1 ? 8 : 0) + (inputs.a2 === 1 ? 4 : 0) + (inputs.a1 === 1 ? 2 : 0) + (inputs.a0 === 1 ? 1 : 0);
      const data = state.data ? state.data.split(',').map((x: string) => parseInt(x, 16)) : Array.from({length: 16}, (_, i) => i);
      const outVal = data[addr] ?? 0;
      outputs = {
        q0: toLogic((outVal & 1) !== 0),
        q1: toLogic((outVal & 2) !== 0),
        q2: toLogic((outVal & 4) !== 0),
        q3: toLogic((outVal & 8) !== 0),
      };
      break;
    }

    case 'display_7seg': {
      const a = inputs.a === 1;
      const b = inputs.b === 1;
      const c = inputs.c === 1;
      const d = inputs.d === 1;
      newState.value = (d ? 8 : 0) + (c ? 4 : 0) + (b ? 2 : 0) + (a ? 1 : 0);
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
    if (!edge) return "1'b0"; 
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
      case 'gate_and3':
        instances.push(`  and ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')}, ${getWireForInput(node.id, 'in3')});`);
        break;
      case 'gate_or':
        instances.push(`  or ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'gate_or3':
        instances.push(`  or ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')}, ${getWireForInput(node.id, 'in3')});`);
        break;
      case 'gate_not':
        instances.push(`  not ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in')});`);
        break;
      case 'gate_buffer':
        instances.push(`  buf ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in')});`);
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
      case 'gate_xnor':
        instances.push(`  xnor ${node.refDes} (${getWireForOutput(node.id, 'out')}, ${getWireForInput(node.id, 'in1')}, ${getWireForInput(node.id, 'in2')});`);
        break;
      case 'mux_2x1':
        instances.push(`  assign ${getWireForOutput(node.id, 'out')} = ${getWireForInput(node.id, 'sel')} ? ${getWireForInput(node.id, 'in1')} : ${getWireForInput(node.id, 'in0')};`);
        break;
      case 'mux_4x1':
        instances.push(`  assign ${getWireForOutput(node.id, 'out')} = {${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd0 ? ${getWireForInput(node.id, 'in0')} : 
                                   {${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd1 ? ${getWireForInput(node.id, 'in1')} :
                                   {${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd2 ? ${getWireForInput(node.id, 'in2')} : ${getWireForInput(node.id, 'in3')};`);
        break;
      case 'demux_1x4':
        instances.push(`  assign ${getWireForOutput(node.id, 'out0')} = ({${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd0) ? ${getWireForInput(node.id, 'in')} : 1'b0;`);
        instances.push(`  assign ${getWireForOutput(node.id, 'out1')} = ({${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd1) ? ${getWireForInput(node.id, 'in')} : 1'b0;`);
        instances.push(`  assign ${getWireForOutput(node.id, 'out2')} = ({${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd2) ? ${getWireForInput(node.id, 'in')} : 1'b0;`);
        instances.push(`  assign ${getWireForOutput(node.id, 'out3')} = ({${getWireForInput(node.id, 's1')}, ${getWireForInput(node.id, 's0')}} == 2'd3) ? ${getWireForInput(node.id, 'in')} : 1'b0;`);
        break;
      case 'decoder_3x8':
        for (let i = 0; i < 8; i++) {
          instances.push(`  assign ${getWireForOutput(node.id, `out${i}`)} = ({${getWireForInput(node.id, 'c')}, ${getWireForInput(node.id, 'b')}, ${getWireForInput(node.id, 'a')}} == 3'd${i});`);
        }
        break;
      case 'half_adder':
        instances.push(`  assign ${getWireForOutput(node.id, 'sum')} = ${getWireForInput(node.id, 'a')} ^ ${getWireForInput(node.id, 'b')};`);
        instances.push(`  assign ${getWireForOutput(node.id, 'cout')} = ${getWireForInput(node.id, 'a')} & ${getWireForInput(node.id, 'b')};`);
        break;
      case 'full_adder':
        instances.push(`  assign ${getWireForOutput(node.id, 'sum')} = ${getWireForInput(node.id, 'a')} ^ ${getWireForInput(node.id, 'b')} ^ ${getWireForInput(node.id, 'cin')};`);
        instances.push(`  assign ${getWireForOutput(node.id, 'cout')} = (${getWireForInput(node.id, 'a')} & ${getWireForInput(node.id, 'b')}) | (${getWireForInput(node.id, 'cin')} & (${getWireForInput(node.id, 'a')} ^ ${getWireForInput(node.id, 'b')}));`);
        break;
      case 'ff_d':
        instances.push(`  always @(posedge ${getWireForInput(node.id, 'clk')}) ${getWireForOutput(node.id, 'q')} <= ${getWireForInput(node.id, 'd')};`);
        instances.push(`  assign ${getWireForOutput(node.id, 'qbar')} = ~${getWireForOutput(node.id, 'q')};`);
        break;
      case 'alu_4bit':
        instances.push(`  // 4-bit ALU instantiation here...`);
        break;
      case 'ram_16x4':
        instances.push(`  // RAM 16x4 instantiation here...`);
        break;
    }
  });

  let portList = [...inputs, ...outputs].join(', ');
  let code = `module TopModule(${portList});\n`;
  if (inputs.length > 0) code += `  input ${inputs.join(', ')};\n`;
  if (outputs.length > 0) code += `  output ${outputs.join(', ')};\n`;
  
  const internalWires = wires.filter(w => !outputs.includes(w) && !inputs.includes(w));
  if (internalWires.length > 0) {
    code += `  wire ${internalWires.join(', ')};\n`;
  }
  
  code += `\n`;
  code += instances.join('\n');
  code += `\nendmodule\n`;

  return code;
}

