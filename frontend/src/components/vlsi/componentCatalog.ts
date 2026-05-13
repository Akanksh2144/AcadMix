import type { VLSIComponent, ComponentCategory } from './types';

export const CATEGORY_ORDER: ComponentCategory[] = ['io', 'gates', 'flipflops', 'combinational', 'arithmetic', 'sequential_adv', 'memory', 'display'];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  io: 'Inputs & Outputs',
  gates: 'Logic Gates',
  flipflops: 'Flip-Flops & Latches',
  combinational: 'Combinational Logic',
  arithmetic: 'Arithmetic Blocks',
  sequential_adv: 'Advanced Sequential',
  memory: 'Memory Elements',
  display: 'Output Displays',
};

export const COMPONENT_CATALOG: VLSIComponent[] = [
  // ... (previous entries preserved via replacement block)
  {
    type: 'input_switch',
    category: 'io',
    label: 'Input Switch',
    description: 'Toggleable logic input (0 or 1)',
    refDesPrefix: 'SW',
    pins: [{ id: 'out', label: 'Out', type: 'output', side: 'right' }],
    defaultProperties: { state: 0, label: 'In' },
  },
  {
    type: 'clock',
    category: 'io',
    label: 'Clock Source',
    description: 'Periodic clock signal',
    refDesPrefix: 'CLK',
    pins: [{ id: 'out', label: 'CLK', type: 'output', side: 'right' }],
    defaultProperties: { frequency: 1, label: 'CLK' },
  },
  {
    type: 'output_led',
    category: 'io',
    label: 'Output LED',
    description: 'Displays logic state (Light up if 1)',
    refDesPrefix: 'LED',
    pins: [{ id: 'in', label: 'In', type: 'input', side: 'left' }],
    defaultProperties: { label: 'Out', color: 'red' },
  },
  {
    type: 'logic_analyzer',
    category: 'io',
    label: 'Logic Analyzer',
    description: '4-channel timing diagram visualizer',
    refDesPrefix: 'LA',
    pins: [
      { id: 'ch0', label: 'CH0', type: 'input', side: 'left' },
      { id: 'ch1', label: 'CH1', type: 'input', side: 'left' },
      { id: 'ch2', label: 'CH2', type: 'input', side: 'left' },
      { id: 'ch3', label: 'CH3', type: 'input', side: 'left' },
    ]
  },
  
  // Logic Gates
  {
    type: 'gate_and',
    category: 'gates',
    label: 'AND Gate',
    description: 'Logical AND (outputs 1 if all inputs are 1)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_and3',
    category: 'gates',
    label: 'AND3 Gate',
    description: '3-Input Logical AND',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'in3', label: 'C', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_or',
    category: 'gates',
    label: 'OR Gate',
    description: 'Logical OR (outputs 1 if any input is 1)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_or3',
    category: 'gates',
    label: 'OR3 Gate',
    description: '3-Input Logical OR',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'in3', label: 'C', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_not',
    category: 'gates',
    label: 'NOT Gate',
    description: 'Logical NOT (Inverter)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in', label: 'A', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_buffer',
    category: 'gates',
    label: 'Buffer',
    description: 'Logical Buffer (passes signal unchanged)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in', label: 'A', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_nand',
    category: 'gates',
    label: 'NAND Gate',
    description: 'Logical NAND (outputs 0 if all inputs are 1)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_nor',
    category: 'gates',
    label: 'NOR Gate',
    description: 'Logical NOR (outputs 0 if any input is 1)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_xor',
    category: 'gates',
    label: 'XOR Gate',
    description: 'Logical XOR (outputs 1 if inputs are different)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'gate_xnor',
    category: 'gates',
    label: 'XNOR Gate',
    description: 'Logical XNOR (outputs 1 if inputs are same)',
    refDesPrefix: 'U',
    pins: [
      { id: 'in1', label: 'A', type: 'input', side: 'left' },
      { id: 'in2', label: 'B', type: 'input', side: 'left' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  
  // Flip-Flops & Latches
  {
    type: 'ff_d',
    category: 'flipflops',
    label: 'D Flip-Flop',
    description: 'Data Flip-Flop (captures D on clock edge)',
    refDesPrefix: 'FF',
    pins: [
      { id: 'd', label: 'D', type: 'input', side: 'left' },
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 'q', label: 'Q', type: 'output', side: 'right' },
      { id: 'qbar', label: 'Q̅', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'latch_d',
    category: 'flipflops',
    label: 'D-Latch',
    description: 'Transparent D-Latch (level-sensitive)',
    refDesPrefix: 'L',
    pins: [
      { id: 'd', label: 'D', type: 'input', side: 'left' },
      { id: 'en', label: 'E', type: 'input', side: 'left' },
      { id: 'q', label: 'Q', type: 'output', side: 'right' },
      { id: 'qbar', label: 'Q̅', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'ff_t',
    category: 'flipflops',
    label: 'T Flip-Flop',
    description: 'Toggle Flip-Flop (toggles Q on clock edge if T is 1)',
    refDesPrefix: 'FF',
    pins: [
      { id: 't', label: 'T', type: 'input', side: 'left' },
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 'q', label: 'Q', type: 'output', side: 'right' },
      { id: 'qbar', label: 'Q̅', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'ff_jk',
    category: 'flipflops',
    label: 'JK Flip-Flop',
    description: 'JK Flip-Flop with toggle capability',
    refDesPrefix: 'FF',
    pins: [
      { id: 'j', label: 'J', type: 'input', side: 'left' },
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 'k', label: 'K', type: 'input', side: 'left' },
      { id: 'q', label: 'Q', type: 'output', side: 'right' },
      { id: 'qbar', label: 'Q̅', type: 'output', side: 'right' }
    ]
  },

  // Combinational
  {
    type: 'mux_2x1',
    category: 'combinational',
    label: '2:1 Multiplexer',
    description: 'Selects one of two inputs based on S',
    refDesPrefix: 'MUX',
    pins: [
      { id: 'in0', label: 'I0', type: 'input', side: 'left' },
      { id: 'in1', label: 'I1', type: 'input', side: 'left' },
      { id: 'sel', label: 'S', type: 'input', side: 'bottom' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'mux_4x1',
    category: 'combinational',
    label: '4:1 Multiplexer',
    description: 'Selects one of four inputs based on 2-bit S',
    refDesPrefix: 'MUX',
    pins: [
      { id: 'in0', label: 'I0', type: 'input', side: 'left' },
      { id: 'in1', label: 'I1', type: 'input', side: 'left' },
      { id: 'in2', label: 'I2', type: 'input', side: 'left' },
      { id: 'in3', label: 'I3', type: 'input', side: 'left' },
      { id: 's0', label: 'S0', type: 'input', side: 'bottom' },
      { id: 's1', label: 'S1', type: 'input', side: 'bottom' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'demux_1x4',
    category: 'combinational',
    label: '1:4 Demultiplexer',
    description: 'Routes input to one of four outputs',
    refDesPrefix: 'DMUX',
    pins: [
      { id: 'in', label: 'I', type: 'input', side: 'left' },
      { id: 's0', label: 'S0', type: 'input', side: 'bottom' },
      { id: 's1', label: 'S1', type: 'input', side: 'bottom' },
      { id: 'out0', label: 'Y0', type: 'output', side: 'right' },
      { id: 'out1', label: 'Y1', type: 'output', side: 'right' },
      { id: 'out2', label: 'Y2', type: 'output', side: 'right' },
      { id: 'out3', label: 'Y3', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'decoder_3x8',
    category: 'combinational',
    label: '3:8 Decoder',
    description: 'Binary to 1-of-8 decoder',
    refDesPrefix: 'DEC',
    pins: [
      { id: 'a', label: 'A', type: 'input', side: 'left' },
      { id: 'b', label: 'B', type: 'input', side: 'left' },
      { id: 'c', label: 'C', type: 'input', side: 'left' },
      { id: 'out0', label: 'Y0', type: 'output', side: 'right' },
      { id: 'out1', label: 'Y1', type: 'output', side: 'right' },
      { id: 'out2', label: 'Y2', type: 'output', side: 'right' },
      { id: 'out3', label: 'Y3', type: 'output', side: 'right' },
      { id: 'out4', label: 'Y4', type: 'output', side: 'right' },
      { id: 'out5', label: 'Y5', type: 'output', side: 'right' },
      { id: 'out6', label: 'Y6', type: 'output', side: 'right' },
      { id: 'out7', label: 'Y7', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'priority_enc_8x3',
    category: 'combinational',
    label: 'Priority Encoder 8:3',
    description: 'Outputs binary index of highest active input',
    refDesPrefix: 'ENC',
    pins: [
      { id: 'in0', label: 'D0', type: 'input', side: 'left' },
      { id: 'in1', label: 'D1', type: 'input', side: 'left' },
      { id: 'in2', label: 'D2', type: 'input', side: 'left' },
      { id: 'in3', label: 'D3', type: 'input', side: 'left' },
      { id: 'in4', label: 'D4', type: 'input', side: 'left' },
      { id: 'in5', label: 'D5', type: 'input', side: 'left' },
      { id: 'in6', label: 'D6', type: 'input', side: 'left' },
      { id: 'in7', label: 'D7', type: 'input', side: 'left' },
      { id: 'a', label: 'A', type: 'output', side: 'right' },
      { id: 'b', label: 'B', type: 'output', side: 'right' },
      { id: 'c', label: 'C', type: 'output', side: 'right' },
      { id: 'v', label: 'V', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'bcd_to_7seg',
    category: 'combinational',
    label: 'BCD to 7-Seg Decoder',
    description: '7447 style BCD to 7-segment decoder IC',
    refDesPrefix: 'IC',
    pins: [
      { id: 'a', label: 'A', type: 'input', side: 'left' },
      { id: 'b', label: 'B', type: 'input', side: 'left' },
      { id: 'c', label: 'C', type: 'input', side: 'left' },
      { id: 'd', label: 'D', type: 'input', side: 'left' },
      { id: 'sa', label: 'a', type: 'output', side: 'right' },
      { id: 'sb', label: 'b', type: 'output', side: 'right' },
      { id: 'sc', label: 'c', type: 'output', side: 'right' },
      { id: 'sd', label: 'd', type: 'output', side: 'right' },
      { id: 'se', label: 'e', type: 'output', side: 'right' },
      { id: 'sf', label: 'f', type: 'output', side: 'right' },
      { id: 'sg', label: 'g', type: 'output', side: 'right' }
    ]
  },

  // Arithmetic
  {
    type: 'half_adder',
    category: 'arithmetic',
    label: 'Half Adder',
    description: '2-bit binary adder without carry-in',
    refDesPrefix: 'ADD',
    pins: [
      { id: 'a', label: 'A', type: 'input', side: 'left' },
      { id: 'b', label: 'B', type: 'input', side: 'left' },
      { id: 'sum', label: 'Σ', type: 'output', side: 'right' },
      { id: 'cout', label: 'Co', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'full_adder',
    category: 'arithmetic',
    label: 'Full Adder',
    description: '2-bit binary adder with carry-in',
    refDesPrefix: 'ADD',
    pins: [
      { id: 'a', label: 'A', type: 'input', side: 'left' },
      { id: 'b', label: 'B', type: 'input', side: 'left' },
      { id: 'cin', label: 'Ci', type: 'input', side: 'left' },
      { id: 'sum', label: 'Σ', type: 'output', side: 'right' },
      { id: 'cout', label: 'Co', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'alu_4bit',
    category: 'arithmetic',
    label: '4-bit ALU',
    description: 'Arithmetic Logic Unit (Add, Sub, AND, OR, XOR)',
    refDesPrefix: 'ALU',
    pins: [
      { id: 'a0', label: 'A0', type: 'input', side: 'left' },
      { id: 'a1', label: 'A1', type: 'input', side: 'left' },
      { id: 'a2', label: 'A2', type: 'input', side: 'left' },
      { id: 'a3', label: 'A3', type: 'input', side: 'left' },
      { id: 'b0', label: 'B0', type: 'input', side: 'left' },
      { id: 'b1', label: 'B1', type: 'input', side: 'left' },
      { id: 'b2', label: 'B2', type: 'input', side: 'left' },
      { id: 'b3', label: 'B3', type: 'input', side: 'left' },
      { id: 's0', label: 'S0', type: 'input', side: 'bottom' },
      { id: 's1', label: 'S1', type: 'input', side: 'bottom' },
      { id: 's2', label: 'S2', type: 'input', side: 'bottom' },
      { id: 'y0', label: 'Y0', type: 'output', side: 'right' },
      { id: 'y1', label: 'Y1', type: 'output', side: 'right' },
      { id: 'y2', label: 'Y2', type: 'output', side: 'right' },
      { id: 'y3', label: 'Y3', type: 'output', side: 'right' },
      { id: 'cf', label: 'CF', type: 'output', side: 'right' },
      { id: 'zf', label: 'ZF', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'multiplier_4bit',
    category: 'arithmetic',
    label: '4-bit Multiplier',
    description: 'Binary multiplier (4x4 to 8-bit)',
    refDesPrefix: 'MUL',
    pins: [
      { id: 'a0', label: 'A0', type: 'input', side: 'left' },
      { id: 'a1', label: 'A1', type: 'input', side: 'left' },
      { id: 'a2', label: 'A2', type: 'input', side: 'left' },
      { id: 'a3', label: 'A3', type: 'input', side: 'left' },
      { id: 'b0', label: 'B0', type: 'input', side: 'left' },
      { id: 'b1', label: 'B1', type: 'input', side: 'left' },
      { id: 'b2', label: 'B2', type: 'input', side: 'left' },
      { id: 'b3', label: 'B3', type: 'input', side: 'left' },
      { id: 'y0', label: 'Y0', type: 'output', side: 'right' },
      { id: 'y1', label: 'Y1', type: 'output', side: 'right' },
      { id: 'y2', label: 'Y2', type: 'output', side: 'right' },
      { id: 'y3', label: 'Y3', type: 'output', side: 'right' },
      { id: 'y4', label: 'Y4', type: 'output', side: 'right' },
      { id: 'y5', label: 'Y5', type: 'output', side: 'right' },
      { id: 'y6', label: 'Y6', type: 'output', side: 'right' },
      { id: 'y7', label: 'Y7', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'comparator_4bit',
    category: 'arithmetic',
    label: '4-bit Magnitude Comparator',
    description: 'Compares two 4-bit binary values',
    refDesPrefix: 'CMP',
    pins: [
      { id: 'a0', label: 'A0', type: 'input', side: 'left' },
      { id: 'a1', label: 'A1', type: 'input', side: 'left' },
      { id: 'a2', label: 'A2', type: 'input', side: 'left' },
      { id: 'a3', label: 'A3', type: 'input', side: 'left' },
      { id: 'b0', label: 'B0', type: 'input', side: 'left' },
      { id: 'b1', label: 'B1', type: 'input', side: 'left' },
      { id: 'b2', label: 'B2', type: 'input', side: 'left' },
      { id: 'b3', label: 'B3', type: 'input', side: 'left' },
      { id: 'gt', label: 'A>B', type: 'output', side: 'right' },
      { id: 'eq', label: 'A=B', type: 'output', side: 'right' },
      { id: 'lt', label: 'A<B', type: 'output', side: 'right' }
    ]
  },

  // Advanced Sequential
  {
    type: 'counter_4bit',
    category: 'sequential_adv',
    label: '4-bit Binary Counter',
    description: 'Up-counter with async reset',
    refDesPrefix: 'CNT',
    pins: [
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 'rst', label: 'CLR', type: 'input', side: 'left' },
      { id: 'q0', label: 'Q0', type: 'output', side: 'right' },
      { id: 'q1', label: 'Q1', type: 'output', side: 'right' },
      { id: 'q2', label: 'Q2', type: 'output', side: 'right' },
      { id: 'q3', label: 'Q3', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'shift_reg_4bit',
    category: 'sequential_adv',
    label: '4-bit Shift Register',
    description: 'Serial-In Parallel-Out (SIPO)',
    refDesPrefix: 'SHFT',
    pins: [
      { id: 'sin', label: 'SI', type: 'input', side: 'left' },
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 'q0', label: 'Q0', type: 'output', side: 'right' },
      { id: 'q1', label: 'Q1', type: 'output', side: 'right' },
      { id: 'q2', label: 'Q2', type: 'output', side: 'right' },
      { id: 'q3', label: 'Q3', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'univ_shift_reg',
    category: 'sequential_adv',
    label: 'Universal Shift Register',
    description: '4-bit Bidirectional USR with Parallel Load',
    refDesPrefix: 'SHFT',
    pins: [
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 's0', label: 'S0', type: 'input', side: 'bottom' },
      { id: 's1', label: 'S1', type: 'input', side: 'bottom' },
      { id: 'sl', label: 'SL', type: 'input', side: 'left' },
      { id: 'sr', label: 'SR', type: 'input', side: 'left' },
      { id: 'd0', label: 'D0', type: 'input', side: 'top' },
      { id: 'd1', label: 'D1', type: 'input', side: 'top' },
      { id: 'd2', label: 'D2', type: 'input', side: 'top' },
      { id: 'd3', label: 'D3', type: 'input', side: 'top' },
      { id: 'q0', label: 'Q0', type: 'output', side: 'right' },
      { id: 'q1', label: 'Q1', type: 'output', side: 'right' },
      { id: 'q2', label: 'Q2', type: 'output', side: 'right' },
      { id: 'q3', label: 'Q3', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'reg_8bit',
    category: 'sequential_adv',
    label: '8-bit Register',
    description: 'Parallel Load 8-bit Register with Enable',
    refDesPrefix: 'REG',
    pins: [
      { id: 'clk', label: '▶', type: 'input', side: 'left' },
      { id: 'en', label: 'EN', type: 'input', side: 'left' },
      { id: 'd0', label: 'D0', type: 'input', side: 'top' },
      { id: 'd1', label: 'D1', type: 'input', side: 'top' },
      { id: 'd2', label: 'D2', type: 'input', side: 'top' },
      { id: 'd3', label: 'D3', type: 'input', side: 'top' },
      { id: 'd4', label: 'D4', type: 'input', side: 'top' },
      { id: 'd5', label: 'D5', type: 'input', side: 'top' },
      { id: 'd6', label: 'D6', type: 'input', side: 'top' },
      { id: 'd7', label: 'D7', type: 'input', side: 'top' },
      { id: 'q0', label: 'Q0', type: 'output', side: 'right' },
      { id: 'q1', label: 'Q1', type: 'output', side: 'right' },
      { id: 'q2', label: 'Q2', type: 'output', side: 'right' },
      { id: 'q3', label: 'Q3', type: 'output', side: 'right' },
      { id: 'q4', label: 'Q4', type: 'output', side: 'right' },
      { id: 'q5', label: 'Q5', type: 'output', side: 'right' },
      { id: 'q6', label: 'Q6', type: 'output', side: 'right' },
      { id: 'q7', label: 'Q7', type: 'output', side: 'right' }
    ]
  },

  // Memory
  {
    type: 'ram_16x4',
    category: 'memory',
    label: '16x4 RAM',
    description: 'Random Access Memory (16 addresses x 4 bits)',
    refDesPrefix: 'MEM',
    pins: [
      { id: 'a0', label: 'A0', type: 'input', side: 'left' },
      { id: 'a1', label: 'A1', type: 'input', side: 'left' },
      { id: 'a2', label: 'A2', type: 'input', side: 'left' },
      { id: 'a3', label: 'A3', type: 'input', side: 'left' },
      { id: 'di0', label: 'D0', type: 'input', side: 'top' },
      { id: 'di1', label: 'D1', type: 'input', side: 'top' },
      { id: 'di2', label: 'D2', type: 'input', side: 'top' },
      { id: 'di3', label: 'D3', type: 'input', side: 'top' },
      { id: 'we', label: 'WE', type: 'input', side: 'bottom' },
      { id: 'do0', label: 'Q0', type: 'output', side: 'right' },
      { id: 'do1', label: 'Q1', type: 'output', side: 'right' },
      { id: 'do2', label: 'Q2', type: 'output', side: 'right' },
      { id: 'do3', label: 'Q3', type: 'output', side: 'right' }
    ],
    defaultProperties: { memory: '0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0' }
  },
  {
    type: 'rom_16x4',
    category: 'memory',
    label: '16x4 ROM',
    description: 'Read Only Memory (Pre-programmed 16x4)',
    refDesPrefix: 'ROM',
    pins: [
      { id: 'a0', label: 'A0', type: 'input', side: 'left' },
      { id: 'a1', label: 'A1', type: 'input', side: 'left' },
      { id: 'a2', label: 'A2', type: 'input', side: 'left' },
      { id: 'a3', label: 'A3', type: 'input', side: 'left' },
      { id: 'q0', label: 'Q0', type: 'output', side: 'right' },
      { id: 'q1', label: 'Q1', type: 'output', side: 'right' },
      { id: 'q2', label: 'Q2', type: 'output', side: 'right' },
      { id: 'q3', label: 'Q3', type: 'output', side: 'right' }
    ],
    defaultProperties: { data: '0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F' }
  },

  // Display
  {
    type: 'display_7seg',
    category: 'display',
    label: '7-Segment Display',
    description: 'Displays 0-F based on BCD input',
    refDesPrefix: 'DS',
    pins: [
      { id: 'a', label: 'A', type: 'input', side: 'bottom' },
      { id: 'b', label: 'B', type: 'input', side: 'bottom' },
      { id: 'c', label: 'C', type: 'input', side: 'bottom' },
      { id: 'd', label: 'D', type: 'input', side: 'bottom' }
    ],
    defaultProperties: { color: 'red' }
  }
  },

  // ─── Timing & Clock ────────────────────────────────────────────────────────
  {
    type: 'clk_div_2',
    category: 'timing',
    label: 'Clock Div /2',
    description: 'Frequency divider by 2 using a flip-flop.',
    refDesPrefix: 'DIV',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'out', label: 'OUT', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'clk_div_4',
    category: 'timing',
    label: 'Clock Div /4',
    description: 'Frequency divider by 4.',
    refDesPrefix: 'DIV',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'out', label: 'OUT', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'pulse_gen',
    category: 'timing',
    label: 'Pulse Gen',
    description: 'Generates a single clock-cycle pulse on trigger.',
    refDesPrefix: 'PGEN',
    pins: [
      { id: 'trig', label: 'TRIG', type: 'input', side: 'left' },
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'out', label: 'OUT', type: 'output', side: 'right' }
    ]
  },

  // ─── Communication Controllers ──────────────────────────────────────────────
  {
    type: 'uart_tx_8bit',
    category: 'interface',
    label: 'UART TX',
    description: '8-bit UART Transmitter core.',
    refDesPrefix: 'UART',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'tx_en', label: 'EN', type: 'input', side: 'left' },
      { id: 'd0', label: 'D0', type: 'input', side: 'bottom' },
      { id: 'd1', label: 'D1', type: 'input', side: 'bottom' },
      { id: 'd2', label: 'D2', type: 'input', side: 'bottom' },
      { id: 'd3', label: 'D3', type: 'input', side: 'bottom' },
      { id: 'd4', label: 'D4', type: 'input', side: 'bottom' },
      { id: 'd5', label: 'D5', type: 'input', side: 'bottom' },
      { id: 'd6', label: 'D6', type: 'input', side: 'bottom' },
      { id: 'd7', label: 'D7', type: 'input', side: 'bottom' },
      { id: 'txd', label: 'TXD', type: 'output', side: 'right' },
      { id: 'busy', label: 'BUSY', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'spi_master',
    category: 'interface',
    label: 'SPI Master',
    description: 'Simplified SPI Master controller.',
    refDesPrefix: 'SPI',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'start', label: 'START', type: 'input', side: 'left' },
      { id: 'miso', label: 'MISO', type: 'input', side: 'right' },
      { id: 'sclk', label: 'SCLK', type: 'output', side: 'right' },
      { id: 'mosi', label: 'MOSI', type: 'output', side: 'right' },
      { id: 'ss', label: 'SS', type: 'output', side: 'right' }
    ]
  },

  // ─── Advanced Arithmetic ────────────────────────────────────────────────────
  {
    type: 'cla_adder_4bit',
    category: 'arithmetic',
    label: '4-bit CLA Adder',
    description: 'High-speed Carry Look-Ahead Adder.',
    refDesPrefix: 'CLA',
    pins: [
      { id: 'a0', label: 'A0', type: 'input', side: 'left' },
      { id: 'a1', label: 'A1', type: 'input', side: 'left' },
      { id: 'a2', label: 'A2', type: 'input', side: 'left' },
      { id: 'a3', label: 'A3', type: 'input', side: 'left' },
      { id: 'b0', label: 'B0', type: 'input', side: 'left' },
      { id: 'b1', label: 'B1', type: 'input', side: 'left' },
      { id: 'b2', label: 'B2', type: 'input', side: 'left' },
      { id: 'b3', label: 'B3', type: 'input', side: 'left' },
      { id: 'cin', label: 'Ci', type: 'input', side: 'top' },
      { id: 's0', label: 'S0', type: 'output', side: 'right' },
      { id: 's1', label: 'S1', type: 'output', side: 'right' },
      { id: 's2', label: 'S2', type: 'output', side: 'right' },
      { id: 's3', label: 'S3', type: 'output', side: 'right' },
      { id: 'cout', label: 'Co', type: 'output', side: 'top' }
    ]
  },
  {
    type: 'lfsr_8bit',
    category: 'sequential_adv',
    label: '8-bit LFSR',
    description: 'Linear Feedback Shift Register for PRNG.',
    refDesPrefix: 'PRNG',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'rst', label: 'RST', type: 'input', side: 'left' },
      { id: 'q0', label: 'Q0', type: 'output', side: 'bottom' },
      { id: 'q1', label: 'Q1', type: 'output', side: 'bottom' },
      { id: 'q2', label: 'Q2', type: 'output', side: 'bottom' },
      { id: 'q3', label: 'Q3', type: 'output', side: 'bottom' },
      { id: 'q4', label: 'Q4', type: 'output', side: 'bottom' },
      { id: 'q5', label: 'Q5', type: 'output', side: 'bottom' },
      { id: 'q6', label: 'Q6', type: 'output', side: 'bottom' },
      { id: 'q7', label: 'Q7', type: 'output', side: 'bottom' }
    ]
  },

  // ─── Industrial Interface ───────────────────────────────────────────────────
  {
    type: 'pwm_gen',
    category: 'interface',
    label: 'PWM Gen',
    description: '8-bit Pulse Width Modulator.',
    refDesPrefix: 'PWM',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'd0', label: 'D0', type: 'input', side: 'bottom' },
      { id: 'd1', label: 'D1', type: 'input', side: 'bottom' },
      { id: 'd2', label: 'D2', type: 'input', side: 'bottom' },
      { id: 'd3', label: 'D3', type: 'input', side: 'bottom' },
      { id: 'd4', label: 'D4', type: 'input', side: 'bottom' },
      { id: 'd5', label: 'D5', type: 'input', side: 'bottom' },
      { id: 'd6', label: 'D6', type: 'input', side: 'bottom' },
      { id: 'd7', label: 'D7', type: 'input', side: 'bottom' },
      { id: 'pwm_out', label: 'PWM', type: 'output', side: 'right' }
    ]
  },
  {
    type: 'debounce',
    category: 'interface',
    label: 'Debouncer',
    description: 'Switch debouncing logic core.',
    refDesPrefix: 'DBNC',
    pins: [
      { id: 'clk', label: 'CLK', type: 'input', side: 'left' },
      { id: 'in', label: 'IN', type: 'input', side: 'left' },
      { id: 'out', label: 'OUT', type: 'output', side: 'right' }
    ]
  }
];

export function getCatalogEntry(type: string): VLSIComponent | undefined {
  return COMPONENT_CATALOG.find(c => c.type === type);
}
