export type LogicState = 0 | 1 | 'Z' | 'X';

export type ComponentCategory = 'io' | 'gates' | 'flipflops' | 'combinational' | 'arithmetic' | 'sequential_adv' | 'display' | 'memory' | 'timing' | 'interface';

export interface VLSIPin {
  id: string;
  label: string;
  type: 'input' | 'output';
  side: 'left' | 'right' | 'top' | 'bottom';
  bitWidth?: number; // default 1
}

export interface VLSIComponent {
  type: string;
  category: ComponentCategory;
  label: string;
  description: string;
  refDesPrefix: string;
  pins: VLSIPin[];
  defaultProperties?: Record<string, string | number | boolean>;
}

export interface LogicGraph {
  nodes: {
    id: string;
    type: string;
    properties: Record<string, any>;
    refDes: string;
  }[];
  edges: {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
  }[];
}
