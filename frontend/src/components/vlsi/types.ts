export type LogicState = 0 | 1 | 'Z' | 'X';

export interface TimingData {
  timestamp: number;
  signals: Record<string, LogicState>;
}

export type ComponentCategory =
  | 'io'
  | 'gates'
  | 'flipflops'
  | 'combinational'
  | 'arithmetic'
  | 'sequential_adv'
  | 'display'
  | 'memory'
  | 'timing'
  | 'interface'
  | 'communication'
  | 'processor'
  | 'dsp'
  | 'testing'
  | 'annotation';

export type ComponentSource = 'builtin' | 'user' | 'community';

export interface VLSIPin {
  id: string;
  label: string;
  type: 'input' | 'output';
  side: 'left' | 'right' | 'top' | 'bottom';
  bitWidth?: number; // default 1
}

/**
 * Core component definition — loaded from components.json at startup.
 * Each component carries its own Verilog synthesis template,
 * eliminating the need for hand-wired switch statements.
 */
export interface VLSIComponent {
  type: string;
  category: ComponentCategory;
  label: string;
  description: string;
  refDesPrefix: string;
  pins: VLSIPin[];
  defaultProperties?: Record<string, string | number | boolean>;
  source?: ComponentSource;

  /**
   * Verilog synthesis template using placeholder syntax:
   *   {{in:pinId}}   → wire name connected to input pin
   *   {{out:pinId}}  → wire name connected to output pin
   *   {{ref}}        → reference designator
   *   {{prop:key}}   → component property value
   *
   * Example for a 2-input AND gate:
   *   "and {{ref}} ({{out:out}}, {{in:in1}}, {{in:in2}});"
   *
   * Multi-line templates use \n as delimiter.
   */
  verilogTemplate?: string;

  /**
   * Simulation behavior definition.
   * - 'combinational': outputs are pure functions of inputs
   * - 'sequential':    outputs depend on clock edges and state
   * - 'blackbox':      no simulation (complex IP, just renders)
   */
  simulationType?: 'combinational' | 'sequential' | 'blackbox';

  /**
   * For combinational components: maps output pin IDs to
   * simple boolean expressions using input pin IDs.
   * Supported operators: & (AND), | (OR), ^ (XOR), ~ (NOT)
   *
   * Example for XOR gate:
   *   { "out": "in1 ^ in2" }
   */
  simulationOutputs?: Record<string, string>;

  /**
   * For sequential components: identifies the behavioral pattern.
   * Maps to a pre-built simulation function in the engine.
   * Examples: 'dff', 'tff', 'jkff', 'counter_up', 'shift_right', etc.
   */
  simulationBehavior?: string;
}

/**
 * User-created subcircuit definition (Phase 3).
 * A subcircuit is a saved composition of base components that
 * can be reused as a single block.
 */
export interface SubcircuitDefinition {
  id: string;
  name: string;
  description: string;
  author: string;
  source: 'user' | 'community';
  category: ComponentCategory;
  pins: VLSIPin[];
  /** The serialized internal graph (nodes + edges) */
  internalGraph: LogicGraph;
  /** Auto-generated from the internal graph */
  verilogTemplate?: string;
  createdAt: string;
  updatedAt: string;
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
