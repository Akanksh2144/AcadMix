// ── AcadMix PCB Studio — Core Types ──────────────────────────────────────────

export type ComponentCategory =
  | 'passive'
  | 'active'
  | 'ic'
  | 'connector'
  | 'power'
  | 'sensor'
  | 'board';

export type ComponentType = string;

export interface PinDef {
  id: string;        // e.g. "1", "2", "anode", "cathode", "gate"
  label: string;     // Display label
  type: 'input' | 'output' | 'bidirectional' | 'power' | 'ground';
  side: 'left' | 'right' | 'top' | 'bottom';
  index: number;     // position index on its side (for multi-pin ICs)
}

export interface ComponentDef {
  id: string;            // Unique instance ID (e.g. "comp-1")
  type: ComponentType;
  refDes: string;        // Reference designator (e.g. "R1", "C3", "U1")
  position: { x: number; y: number };
  rotation: number;      // 0, 90, 180, 270
  properties: Record<string, string | number | boolean>;
  // e.g. { value: "10k", package: "0805", tolerance: "5%" }
}

export interface WireDef {
  id: string;
  fromComponent: string; // component ID
  fromPin: string;       // pin ID
  toComponent: string;
  toPin: string;
  netName?: string;      // auto-generated or user-defined
}

export interface CircuitGraph {
  components: ComponentDef[];
  wires: WireDef[];
  metadata: {
    name: string;
    author: string;
    created: string;
    modified: string;
    version: number;
  };
}

// ── Component Catalog Entry (for the Library panel) ──────────────────────────

export interface CatalogEntry {
  type: ComponentType;
  label: string;
  category: ComponentCategory;
  description: string;
  defaultProperties: Record<string, string | number | boolean>;
  pins: Omit<PinDef, 'index'>[];
  refDesPrefix: string; // "R", "C", "U", etc.
}

// ── DRC Result ───────────────────────────────────────────────────────────────

export type DRCSeverity = 'error' | 'warning' | 'info';

export interface DRCResult {
  id: string;
  severity: DRCSeverity;
  message: string;
  componentIds?: string[];
  pinIds?: string[];
}

// ── BOM Entry ────────────────────────────────────────────────────────────────

export interface BOMEntry {
  refDes: string[];
  type: ComponentType;
  value: string;
  package: string;
  quantity: number;
  description: string;
}

// ── Netlist Entry ────────────────────────────────────────────────────────────

export interface NetlistNet {
  name: string;
  connections: { componentRefDes: string; pin: string }[];
}
