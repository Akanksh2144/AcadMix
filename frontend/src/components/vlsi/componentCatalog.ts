import type { VLSIComponent, ComponentCategory } from './types';

export const CATEGORY_ORDER: ComponentCategory[] = ['io', 'gates', 'flipflops', 'combinational', 'arithmetic', 'sequential_adv', 'display'];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  io: 'Inputs & Outputs',
  gates: 'Logic Gates',
  flipflops: 'Flip-Flops & Latches',
  combinational: 'Combinational Logic',
  arithmetic: 'Arithmetic Blocks',
  sequential_adv: 'Advanced Sequential',
  display: 'Output Displays',
};

export const COMPONENT_CATALOG: VLSIComponent[] = [
  // I/O
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
  
  // Flip-Flops
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
    type: 'comparator_2bit',
    category: 'arithmetic',
    label: '2-bit Comparator',
    description: 'Compares two binary values',
    refDesPrefix: 'CMP',
    pins: [
      { id: 'a', label: 'A', type: 'input', side: 'left' },
      { id: 'b', label: 'B', type: 'input', side: 'left' },
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
];    ]
  }
];

export function getCatalogEntry(type: string): VLSIComponent | undefined {
  return COMPONENT_CATALOG.find(c => c.type === type);
}
