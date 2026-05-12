// ── AcadMix PCB Studio — Circuit DSL Parser & Serializer ─────────────────────
// Bidirectional: parse DSL text → CircuitGraph, and serialize CircuitGraph → DSL text.

import type { CircuitGraph, ComponentDef, WireDef, ComponentType } from './types';
import { COMPONENT_CATALOG } from './componentCatalog';

// ── DSL Syntax ───────────────────────────────────────────────────────────────
//
// circuit MyCircuit {
//   R1: resistor(10kΩ, "0805")
//   C1: capacitor(100nF, "0603")
//   D1: led(red)
//   VCC: power(5V)
//   GND: ground()
//
//   wire(VCC → R1.1)
//   wire(R1.2 → D1.anode)
//   wire(D1.cathode → GND)
// }

// ── Type Aliases for DSL parsing ─────────────────────────────────────────────

const DSL_TYPE_MAP: Record<string, ComponentType> = {
  'resistor': 'resistor',
  'capacitor': 'capacitor',
  'cap': 'capacitor',
  'inductor': 'inductor',
  'diode': 'diode',
  'led': 'led',
  'crystal': 'crystal',
  'fuse': 'fuse',
  'pot': 'potentiometer',
  'potentiometer': 'potentiometer',
  'npn': 'npn',
  'pnp': 'pnp',
  'nmosfet': 'nmosfet',
  'nmos': 'nmosfet',
  'pmosfet': 'pmosfet',
  'pmos': 'pmosfet',
  'opamp': 'opamp',
  'op-amp': 'opamp',
  'vreg': 'voltageRegulator',
  'regulator': 'voltageRegulator',
  '555': 'timer555',
  'timer555': 'timer555',
  'scr': 'scr',
  'and': 'logicGate',
  'or': 'logicGate',
  'not': 'logicGate',
  'nand': 'logicGate',
  'nor': 'logicGate',
  'xor': 'logicGate',
  'flipflop': 'flipFlop',
  'ic': 'icChip',
  'mcu': 'microcontroller',
  'shift_register': 'shiftRegister',
  'header': 'header',
  'usb': 'usb',
  'switch': 'switch',
  'relay': 'relay',
  'buzzer': 'buzzer',
  'motor': 'motor',
  'transformer': 'transformer',
  'power': 'vcc',
  'vcc': 'vcc',
  'ground': 'gnd',
  'gnd': 'gnd',
  'battery': 'battery',
  'dc': 'dcSource',
  'testpoint': 'testPoint',
  'jumper': 'jumper',
  'ldr': 'ldr',
  'thermistor': 'thermistor',
  'piezo': 'piezo',
};

const REVERSE_TYPE_MAP: Record<ComponentType, string> = {
  resistor: 'resistor', capacitor: 'capacitor', inductor: 'inductor',
  diode: 'diode', led: 'led', crystal: 'crystal', fuse: 'fuse',
  potentiometer: 'pot', npn: 'npn', pnp: 'pnp', nmosfet: 'nmos',
  pmosfet: 'pmos', opamp: 'opamp', voltageRegulator: 'vreg',
  timer555: '555', scr: 'scr', logicGate: 'gate', flipFlop: 'flipflop',
  icChip: 'ic', microcontroller: 'mcu', shiftRegister: 'shift_register',
  header: 'header', usb: 'usb', switch: 'switch', relay: 'relay',
  buzzer: 'buzzer', motor: 'motor', transformer: 'transformer',
  vcc: 'power', gnd: 'ground', battery: 'battery', dcSource: 'dc',
  testPoint: 'testpoint', jumper: 'jumper', ldr: 'ldr',
  thermistor: 'thermistor', piezo: 'piezo',
};

// ── Parser ───────────────────────────────────────────────────────────────────

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  graph: CircuitGraph | null;
  errors: ParseError[];
}

export function parseDSL(text: string): ParseResult {
  const errors: ParseError[] = [];
  const components: ComponentDef[] = [];
  const wires: WireDef[] = [];
  let circuitName = 'Untitled';

  const lines = text.split('\n');
  let insideBlock = false;
  let compCounter = 0;
  let wireCounter = 0;

  // Auto-layout: place components in a grid
  let gridX = 100;
  let gridY = 80;
  let colCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!raw || raw.startsWith('//') || raw.startsWith('#')) continue;

    // Circuit block header
    const headerMatch = raw.match(/^circuit\s+(\w+)\s*\{?\s*$/i);
    if (headerMatch) {
      circuitName = headerMatch[1];
      insideBlock = true;
      continue;
    }

    // Closing brace
    if (raw === '}') {
      insideBlock = false;
      continue;
    }

    // Component declaration: R1: resistor(10kΩ, "0805")
    const compMatch = raw.match(/^(\w+)\s*:\s*(\w[\w-]*)\s*\(([^)]*)\)\s*$/);
    if (compMatch) {
      const refDes = compMatch[1];
      const typeName = compMatch[2].toLowerCase();
      const argsStr = compMatch[3];
      const compType = DSL_TYPE_MAP[typeName];

      if (!compType) {
        errors.push({ line: lineNum, message: `Unknown component type: "${typeName}"` });
        continue;
      }

      const args = argsStr.split(',').map(a => a.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

      const properties: Record<string, string | number | boolean> = {};
      if (args[0]) properties.value = args[0];
      if (args[1]) properties.package = args[1];
      if (args[2]) properties.extra = args[2];

      // Handle special types
      if (typeName === 'led' && args[0]) properties.color = args[0];
      if (['and', 'or', 'not', 'nand', 'nor', 'xor'].includes(typeName)) {
        properties.gateType = typeName.toUpperCase();
      }

      components.push({
        id: `comp-${++compCounter}`,
        type: compType,
        refDes,
        position: { x: gridX, y: gridY },
        rotation: 0,
        properties,
      });

      colCount++;
      gridX += 220;
      if (colCount >= 4) {
        colCount = 0;
        gridX = 100;
        gridY += 160;
      }
      continue;
    }

    // Wire declaration: wire(R1.2 → D1.anode)  or  wire(R1.2 -> D1.anode)
    const wireMatch = raw.match(/^wire\s*\(\s*(\w+)(?:\.(\w+))?\s*(?:→|->|=>)\s*(\w+)(?:\.(\w+))?\s*\)\s*$/);
    if (wireMatch) {
      const fromRef = wireMatch[1];
      const fromPin = wireMatch[2] || '1';
      const toRef = wireMatch[3];
      const toPin = wireMatch[4] || '1';

      // Resolve refDes to component ID
      const fromComp = components.find(c => c.refDes === fromRef);
      const toComp = components.find(c => c.refDes === toRef);

      if (!fromComp) {
        errors.push({ line: lineNum, message: `Unknown component "${fromRef}" in wire.` });
        continue;
      }
      if (!toComp) {
        errors.push({ line: lineNum, message: `Unknown component "${toRef}" in wire.` });
        continue;
      }

      wires.push({
        id: `wire-${++wireCounter}`,
        fromComponent: fromComp.id,
        fromPin,
        toComponent: toComp.id,
        toPin,
      });
      continue;
    }

    // If none matched and we're inside a block, it's an error
    if (insideBlock && raw !== '{') {
      errors.push({ line: lineNum, message: `Unrecognized syntax: "${raw}"` });
    }
  }

  if (components.length === 0 && errors.length === 0) {
    errors.push({ line: 1, message: 'No components found. Start with: circuit MyCircuit {' });
  }

  return {
    graph: {
      components,
      wires,
      metadata: {
        name: circuitName,
        author: 'AcadMix User',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: 1,
      },
    },
    errors,
  };
}

// ── Serializer ───────────────────────────────────────────────────────────────

export function serializeDSL(graph: CircuitGraph): string {
  const lines: string[] = [];
  lines.push(`circuit ${graph.metadata.name.replace(/\s+/g, '_')} {`);
  lines.push('');

  // Group components by category
  const categories = new Map<string, ComponentDef[]>();
  for (const c of graph.components) {
    const cat = getCategoryLabel(c.type);
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(c);
  }

  for (const [cat, comps] of categories) {
    lines.push(`  // ${cat}`);
    for (const c of comps) {
      const typeName = REVERSE_TYPE_MAP[c.type] || c.type;
      const args: string[] = [];
      if (c.properties.value) args.push(String(c.properties.value));
      if (c.properties.package) args.push(`"${c.properties.package}"`);
      if (c.properties.color) args.push(String(c.properties.color));
      lines.push(`  ${c.refDes}: ${typeName}(${args.join(', ')})`);
    }
    lines.push('');
  }

  // Wires
  if (graph.wires.length > 0) {
    lines.push('  // Connections');
    for (const w of graph.wires) {
      const fromComp = graph.components.find(c => c.id === w.fromComponent);
      const toComp = graph.components.find(c => c.id === w.toComponent);
      if (fromComp && toComp) {
        lines.push(`  wire(${fromComp.refDes}.${w.fromPin} → ${toComp.refDes}.${w.toPin})`);
      }
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function getCategoryLabel(type: ComponentType): string {
  if (['resistor', 'capacitor', 'inductor', 'diode', 'led', 'crystal', 'fuse', 'potentiometer'].includes(type)) return 'Passive Components';
  if (['npn', 'pnp', 'nmosfet', 'pmosfet', 'opamp', 'voltageRegulator', 'timer555', 'scr'].includes(type)) return 'Active Components';
  if (['logicGate', 'flipFlop', 'icChip', 'microcontroller', 'shiftRegister'].includes(type)) return 'Integrated Circuits';
  if (['header', 'usb', 'switch', 'relay', 'buzzer', 'motor', 'transformer'].includes(type)) return 'Connectors';
  if (['vcc', 'gnd', 'battery', 'dcSource'].includes(type)) return 'Power';
  return 'Other';
}

// ── Default DSL Template ─────────────────────────────────────────────────────

export const DEFAULT_DSL = `circuit LED_Blinker {

  // Power
  VCC: power(5V)
  GND: ground()

  // Components
  R1: resistor(330Ω, "0805")
  D1: led(red, "0805")

  // Connections
  wire(VCC → R1.1)
  wire(R1.2 → D1.anode)
  wire(D1.cathode → GND)
}
`;
