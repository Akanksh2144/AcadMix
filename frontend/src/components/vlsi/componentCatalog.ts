import type { VLSIComponent, ComponentCategory } from './types';

export const CATEGORY_ORDER: ComponentCategory[] = ['io', 'gates', 'flipflops', 'combinational'];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  io: 'Inputs & Outputs',
  gates: 'Logic Gates',
  flipflops: 'Flip-Flops & Latches',
  combinational: 'Combinational Logic',
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
    description: 'JK Flip-Flop',
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
    description: 'Selects one of two inputs based on a selector bit',
    refDesPrefix: 'MUX',
    pins: [
      { id: 'in0', label: '0', type: 'input', side: 'left' },
      { id: 'in1', label: '1', type: 'input', side: 'left' },
      { id: 'sel', label: 'S', type: 'input', side: 'bottom' },
      { id: 'out', label: 'Y', type: 'output', side: 'right' }
    ]
  }
];

export function getCatalogEntry(type: string): VLSIComponent | undefined {
  return COMPONENT_CATALOG.find(c => c.type === type);
}
