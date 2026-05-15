// ── AcadMix PCB Studio — Client-Side PCB Engine ─────────────────────────────
// Runs DRC, generates netlists, BOMs, and exports — all in the browser.

import type {
  CircuitGraph,
  ComponentDef,
  WireDef,
  DRCResult,
  DRCSeverity,
  BOMEntry,
  NetlistNet,
} from './types';

// ── DRC (Design Rule Check) ─────────────────────────────────────────────────

export function runDRC(graph: CircuitGraph): DRCResult[] {
  const results: DRCResult[] = [];
  const { components, wires } = graph;

  if (components.length === 0) {
    results.push({ id: 'drc-empty', severity: 'info', message: 'Circuit is empty — add components to begin.' });
    return results;
  }

  // 1. Check for duplicate reference designators
  const refDesMap = new Map<string, string[]>();
  for (const c of components) {
    const list = refDesMap.get(c.refDes) || [];
    list.push(c.id);
    refDesMap.set(c.refDes, list);
  }
  for (const [refDes, ids] of refDesMap) {
    if (ids.length > 1) {
      results.push({
        id: `drc-dup-${refDes}`,
        severity: 'error',
        message: `Duplicate reference designator "${refDes}" used by ${ids.length} components.`,
        componentIds: ids,
      });
    }
  }

  // 2. Check for unconnected components (no wires at all)
  const connectedIds = new Set<string>();
  for (const w of wires) {
    connectedIds.add(w.fromComponent);
    connectedIds.add(w.toComponent);
  }
  for (const c of components) {
    if (!connectedIds.has(c.id) && c.type !== 'testPoint' && c.type !== 'jumper' && !c.type.startsWith('board_') && c.type !== 'board' && c.type !== 'copper_pour') {
      results.push({
        id: `drc-unconnected-${c.id}`,
        severity: 'warning',
        message: `${c.refDes} (${c.type}) is not connected to anything.`,
        componentIds: [c.id],
      });
    }
  }

  // 3. Check for missing power connections
  const isVCC = (t: string) => t === 'vcc' || t === 'vcc_node' || t === 'dcSource' || t === 'battery' || t === 'battery_cr2032' || t === 'battery_jst';
  const isGND = (t: string) => t === 'gnd' || t === 'gnd_node';
  const hasVCC = components.some(c => isVCC(c.type));
  const hasGND = components.some(c => isGND(c.type));
  const hasActiveComponents = components.some(c =>
    c.type.startsWith('mcu_') || c.type.startsWith('logic_') || c.type.startsWith('opamp_') ||
    ['opamp', 'timer555', 'microcontroller', 'icChip', 'logicGate', 'flipFlop', 'shiftRegister', 'voltageRegulator',
     'logic_ne555', 'logic_74hc595', 'logic_74hc138'].includes(c.type)
  );
  if (hasActiveComponents && !hasVCC) {
    results.push({ id: 'drc-no-vcc', severity: 'warning', message: 'Active components present but no power source (VCC/Battery) found.' });
  }
  if (hasActiveComponents && !hasGND) {
    results.push({ id: 'drc-no-gnd', severity: 'warning', message: 'Active components present but no ground (GND) found.' });
  }

  // 4. Check for direct VCC-to-GND short
  for (const w of wires) {
    const fromComp = components.find(c => c.id === w.fromComponent);
    const toComp = components.find(c => c.id === w.toComponent);
    if (fromComp && toComp) {
      const isShort =
        (isVCC(fromComp.type) && isGND(toComp.type)) ||
        (isGND(fromComp.type) && isVCC(toComp.type));
      if (isShort) {
        results.push({
          id: `drc-short-${w.id}`,
          severity: 'error',
          message: 'Direct short circuit detected between VCC and GND!',
          componentIds: [fromComp.id, toComp.id],
        });
      }
    }
  }

  // 5. Check for components with only one connection (might be floating)
  for (const c of components) {
    if (isVCC(c.type) || isGND(c.type) || c.type === 'testPoint' || c.type.startsWith('board_') || c.type === 'board' || c.type === 'copper_pour') continue;
    const wireCount = wires.filter(w => w.fromComponent === c.id || w.toComponent === c.id).length;
    if (wireCount === 1 && !isVCC(c.type) && !isGND(c.type) && c.type !== 'testPoint' && c.type !== 'jumper') {
      results.push({
        id: `drc-singlepin-${c.id}`,
        severity: 'warning',
        message: `${c.refDes} has only 1 connection — possible floating pin.`,
        componentIds: [c.id],
      });
    }
  }

  // 6. Check board dimension constraints (out of bounds)
  const board = components.find(c => c.type === 'board' || c.type?.startsWith('board_') || c.type === 'copper_pour');
  if (board) {
    const bWidth = Number(board.properties?.width) || 800;
    const bHeight = Number(board.properties?.height) || 600;
    const bX = board.position?.x || 0;
    const bY = board.position?.y || 0;

    for (const c of components) {
      if (c.id === board.id) continue;
      
      const cx = c.position?.x || 0;
      const cy = c.position?.y || 0;
      
      // Allow a small tolerance margin for component sizes
      if (cx < bX - 10 || cy < bY - 10 || cx > bX + bWidth + 10 || cy > bY + bHeight + 10) {
        results.push({
          id: `drc-out-of-bounds-${c.id}`,
          severity: 'error',
          message: `${c.refDes} is placed outside the board boundaries.`,
          componentIds: [c.id],
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ id: 'drc-pass', severity: 'info', message: 'All design rule checks passed. ✓' });
  }

  return results;
}

// ── Netlist Generator ────────────────────────────────────────────────────────

export function generateNets(graph: CircuitGraph): NetlistNet[] {
  const { components, wires } = graph;
  const netMap = new Map<string, Set<string>>(); // netId -> set of "RefDes.Pin"
  let netCounter = 0;

  // Union-Find for grouping connected pins into nets
  const pinToNet = new Map<string, string>(); // "compId.pinId" -> netName

  for (const w of wires) {
    const fromKey = `${w.fromComponent}.${w.fromPin}`;
    const toKey = `${w.toComponent}.${w.toPin}`;

    const existingFromNet = pinToNet.get(fromKey);
    const existingToNet = pinToNet.get(toKey);

    let netName: string;
    if (existingFromNet && existingToNet) {
      // Merge nets
      netName = existingFromNet;
      if (existingFromNet !== existingToNet) {
        const toMerge = netMap.get(existingToNet);
        const target = netMap.get(netName);
        if (toMerge && target) {
          for (const pin of toMerge) {
            target.add(pin);
            pinToNet.set(pin, netName);
          }
          netMap.delete(existingToNet);
        }
      }
    } else if (existingFromNet) {
      netName = existingFromNet;
    } else if (existingToNet) {
      netName = existingToNet;
    } else {
      netName = w.netName || `Net_${++netCounter}`;
    }

    if (!netMap.has(netName)) netMap.set(netName, new Set());
    netMap.get(netName)!.add(fromKey);
    netMap.get(netName)!.add(toKey);
    pinToNet.set(fromKey, netName);
    pinToNet.set(toKey, netName);
  }

  // Build result
  const nets: NetlistNet[] = [];
  for (const [name, pinKeys] of netMap) {
    const connections = Array.from(pinKeys).map(k => {
      const [compId, pin] = k.split('.');
      const comp = components.find(c => c.id === compId);
      return { componentRefDes: comp?.refDes || compId, pin };
    });
    nets.push({ name, connections });
  }

  return nets;
}

export function generateNetlistText(graph: CircuitGraph): string {
  const nets = generateNets(graph);
  const lines: string[] = [
    '* AcadMix PCB Studio — Netlist',
    `* Generated: ${new Date().toISOString()}`,
    `* Circuit: ${graph.metadata.name}`,
    '*',
    '* ── Components ──',
  ];

  for (const c of graph.components) {
    const value = c.properties.value || c.type;
    const pkg = c.properties.package || '';
    lines.push(`${c.refDes}  ${c.type}  ${value}  ${pkg}`);
  }

  lines.push('', '* ── Nets ──');
  for (const net of nets) {
    const pins = net.connections.map(c => `${c.componentRefDes}.${c.pin}`).join(', ');
    lines.push(`${net.name}: ${pins}`);
  }

  lines.push('', '* End of Netlist');
  return lines.join('\n');
}

// ── SPICE Netlist Generator (for eecircuit-engine) ───────────────────────────

export function generateSPICENetlist(graph: CircuitGraph): string {
  const nets = generateNets(graph);
  
  // Find ground nets
  const groundNets = new Set<string>();
  for (const net of nets) {
    for (const conn of net.connections) {
      const comp = graph.components.find(c => (c.refDes || c.id) === conn.componentRefDes);
      if (comp && (comp.type === 'gnd' || comp.type === 'gnd_node')) {
        groundNets.add(net.name);
      }
    }
  }

  const getNodeMap = () => {
    const map = new Map<string, string>();
    let nodeIdx = 1;
    for (const net of nets) {
      if (groundNets.has(net.name)) {
        map.set(net.name, '0');
      } else {
        map.set(net.name, String(nodeIdx++));
      }
    }
    return map;
  };
  
  const nodeMap = getNodeMap();

  const lines: string[] = [
    '* AcadMix PCB Studio - SPICE Netlist',
    `* Generated: ${new Date().toISOString()}`,
  ];

  for (const c of graph.components) {
    if (c.type === 'gnd' || c.type === 'gnd_node' || c.type === 'board' || c.type === 'copper_pour' || c.type === 'testPoint' || c.type.startsWith('board_')) continue;

    const getPinNode = (pinNames: string[]) => {
      for (const pin of pinNames) {
        for (const net of nets) {
          if (net.connections.some(conn => conn.componentRefDes === (c.refDes || c.id) && conn.pin === pin)) {
            return nodeMap.get(net.name) || '0';
          }
        }
      }
      return '0';
    };

    const n1 = getPinNode(['1', 'anode', 'a', 'in', 'p', 'plus', '+', 'pos', 'pwr']);
    const n2 = getPinNode(['2', 'cathode', 'k', 'out', 'n', 'minus', '-', 'neg', 'gnd']);
    
    let valStr = String(c.properties.value || '');
    valStr = valStr.replace(/[ΩFfHhVvAaWw]/g, '');
    if (!valStr) valStr = '1k';

    if (c.type === 'resistor' || c.type.startsWith('res_')) {
      lines.push(`${c.refDes.startsWith('R') ? c.refDes : 'R'+c.id} ${n1} ${n2} ${valStr}`);
    } else if (c.type === 'capacitor' || c.type.startsWith('cap_')) {
      lines.push(`${c.refDes.startsWith('C') ? c.refDes : 'C'+c.id} ${n1} ${n2} ${valStr}`);
    } else if (c.type === 'inductor' || c.type.startsWith('ind_')) {
      lines.push(`${c.refDes.startsWith('L') ? c.refDes : 'L'+c.id} ${n1} ${n2} ${valStr}`);
    } else if (c.type === 'vcc' || c.type === 'vcc_node' || c.type === 'dcSource' || c.type === 'battery' || c.type === 'battery_cr2032' || c.type === 'battery_jst') {
      lines.push(`${c.refDes.startsWith('V') ? c.refDes : 'V'+c.id} ${n1} ${n2} DC ${valStr}`);
    } else if (c.type === 'diode' || c.type === 'led' || c.type.startsWith('diode_') || c.type.startsWith('led_')) {
      lines.push(`${c.refDes.startsWith('D') ? c.refDes : 'D'+c.id} ${n1} ${n2} 1N4148`);
    } else if (c.type === 'npn' || c.type === 'bjt_2n2222') {
      const nb = getPinNode(['b', 'base', '2']);
      const nc = getPinNode(['c', 'collector', '3']);
      const ne = getPinNode(['e', 'emitter', '1']);
      lines.push(`${c.refDes.startsWith('Q') ? c.refDes : 'Q'+c.id} ${nc} ${nb} ${ne} 2N3904`);
    } else if (c.type === 'pnp' || c.type === 'bjt_2n2907') {
      const nb = getPinNode(['b', 'base', '2']);
      const nc = getPinNode(['c', 'collector', '3']);
      const ne = getPinNode(['e', 'emitter', '1']);
      lines.push(`${c.refDes.startsWith('Q') ? c.refDes : 'Q'+c.id} ${nc} ${nb} ${ne} 2N3906`);
    } else if (c.type.startsWith('mosfet_n_')) {
      const ng = getPinNode(['g', 'gate']);
      const nd = getPinNode(['d', 'drain']);
      const ns = getPinNode(['s', 'source']);
      lines.push(`${c.refDes.startsWith('M') ? c.refDes : 'M'+c.id} ${nd} ${ng} ${ns} ${ns} NMOS`);
    } else if (c.type.startsWith('mosfet_p_')) {
      const ng = getPinNode(['g', 'gate']);
      const nd = getPinNode(['d', 'drain']);
      const ns = getPinNode(['s', 'source']);
      lines.push(`${c.refDes.startsWith('M') ? c.refDes : 'M'+c.id} ${nd} ${ng} ${ns} ${ns} PMOS`);
    }
  }

  // Add standard diode models and default transient analysis
  lines.push('');
  lines.push('.model 1N4148 D(IS=1e-14 N=1 RS=0.1)');
  lines.push('.model 2N3904 NPN(IS=1e-14 VAF=100 BF=300)');
  lines.push('.model 2N3906 PNP(IS=1e-14 VAF=100 BF=200)');
  lines.push('.tran 1ms 100ms');
  lines.push('.end');

  return lines.join('\n');
}

// ── BOM Generator ────────────────────────────────────────────────────────────

export function generateBOM(graph: CircuitGraph): BOMEntry[] {
  const groupMap = new Map<string, BOMEntry>();

  for (const c of graph.components) {
    if (['vcc', 'gnd', 'testPoint', 'jumper'].includes(c.type)) continue;

    const value = String(c.properties.value || '');
    const pkg = String(c.properties.package || '');
    const key = `${c.type}|${value}|${pkg}`;

    if (groupMap.has(key)) {
      const entry = groupMap.get(key)!;
      entry.refDes.push(c.refDes);
      entry.quantity++;
    } else {
      groupMap.set(key, {
        refDes: [c.refDes],
        type: c.type,
        value,
        package: pkg,
        quantity: 1,
        description: getComponentDescription(c.type, value),
      });
    }
  }

  return Array.from(groupMap.values()).sort((a, b) => a.refDes[0].localeCompare(b.refDes[0]));
}

export function bomToCSV(bom: BOMEntry[]): string {
  const header = 'Ref Des,Type,Value,Package,Qty,Description';
  const rows = bom.map(e =>
    `"${e.refDes.join(', ')}","${e.type}","${e.value}","${e.package}",${e.quantity},"${e.description}"`
  );
  return [header, ...rows].join('\n');
}

function getComponentDescription(type: string, value: string): string {
  const map: Record<string, string> = {
    resistor: `Resistor ${value}`,
    capacitor: `Capacitor ${value}`,
    inductor: `Inductor ${value}`,
    diode: `Diode ${value}`,
    led: `LED ${value}`,
    crystal: `Crystal Oscillator ${value}`,
    fuse: `Fuse ${value}`,
    potentiometer: `Potentiometer ${value}`,
    npn: `NPN Transistor ${value}`,
    pnp: `PNP Transistor ${value}`,
    nmosfet: `N-MOSFET ${value}`,
    pmosfet: `P-MOSFET ${value}`,
    opamp: `Op-Amp ${value}`,
    voltageRegulator: `Voltage Regulator ${value}`,
    timer555: `555 Timer`,
    scr: `SCR/Thyristor ${value}`,
    logicGate: `Logic Gate ${value}`,
    flipFlop: `Flip-Flop ${value}`,
    icChip: `IC ${value}`,
    microcontroller: `MCU ${value}`,
    shiftRegister: `Shift Register ${value}`,
    header: `Pin Header ${value}`,
    usb: `USB Connector ${value}`,
    switch: `Switch`,
    relay: `Relay ${value}`,
    buzzer: `Buzzer`,
    motor: `DC Motor ${value}`,
    transformer: `Transformer ${value}`,
    battery: `Battery ${value}`,
    dcSource: `DC Supply ${value}`,
    ldr: `LDR ${value}`,
    thermistor: `Thermistor ${value}`,
    piezo: `Piezo Element`,
  };
  return map[type] || type;
}

// ── KiCad Netlist Export ─────────────────────────────────────────────────────

export function exportKiCadNetlist(graph: CircuitGraph): string {
  const nets = generateNets(graph);
  const lines = [
    '(export (version D)',
    '  (design',
    `    (source "AcadMix PCB Studio")`,
    `    (date "${new Date().toISOString()}")`,
    '  )',
    '  (components',
  ];

  for (const c of graph.components) {
    if (['vcc', 'gnd'].includes(c.type)) continue;
    lines.push(`    (comp (ref ${c.refDes}) (value "${c.properties.value || c.type}") (footprint "${c.properties.package || ''}"))`);
  }

  lines.push('  )', '  (nets');
  nets.forEach((net, i) => {
    const nodes = net.connections.map(c => `(node (ref ${c.componentRefDes}) (pin ${c.pin}))`).join(' ');
    lines.push(`    (net (code ${i + 1}) (name "${net.name}") ${nodes})`);
  });

  lines.push('  )', ')');
  return lines.join('\n');
}

// ── Pick and Place File Export ───────────────────────────────────────────────

export interface PickPlaceEntry {
  refDes: string;
  value: string;
  package: string;
  posX: number;
  posY: number;
  rotation: number;
  side: 'Top' | 'Bottom';
}

export function generatePickPlace(graph: CircuitGraph): PickPlaceEntry[] {
  return graph.components
    .filter(c => !c.type.startsWith('board_') && c.type !== 'board' && c.type !== 'copper_pour')
    .map(c => ({
      refDes: c.refDes,
      value: String(c.properties.value || c.type),
      package: String(c.properties.package || ''),
      posX: Math.round(c.position.x * 0.254 * 100) / 100, // px to mm approx
      posY: Math.round(c.position.y * 0.254 * 100) / 100,
      rotation: c.rotation || 0,
      side: 'Top' as const,
    }));
}

export function pickPlaceToCSV(entries: PickPlaceEntry[]): string {
  const header = 'Ref Des,Value,Package,PosX(mm),PosY(mm),Rotation,Side';
  const rows = entries.map(e =>
    `"${e.refDes}","${e.value}","${e.package}",${e.posX},${e.posY},${e.rotation},${e.side}`
  );
  return [header, ...rows].join('\n');
}

// ── PCB Information Report ──────────────────────────────────────────────────

export interface PCBInfo {
  boardWidth: number;
  boardHeight: number;
  componentCount: number;
  netCount: number;
  wireCount: number;
  smdCount: number;
  thCount: number;
  categories: Record<string, number>;
  created: string;
  modified: string;
}

export function generatePCBInfo(graph: CircuitGraph): PCBInfo {
  const board = graph.components.find(c => c.type === 'board_custom' || c.type.startsWith('board_'));
  const nonBoardComps = graph.components.filter(c => !c.type.startsWith('board_') && c.type !== 'board' && c.type !== 'copper_pour');
  const nets = generateNets(graph);

  const categories: Record<string, number> = {};
  let smdCount = 0;
  let thCount = 0;

  for (const c of nonBoardComps) {
    const pkg = String(c.properties.package || '');
    // Classify SMD vs TH
    if (pkg.includes('AXIAL') || pkg.includes('DIP') || pkg.includes('TO-220') || pkg.includes('DO-41') || c.type.includes('_th_')) {
      thCount++;
    } else {
      smdCount++;
    }
    // Count by category prefix
    const catPrefix = c.type.split('_')[0] || 'other';
    categories[catPrefix] = (categories[catPrefix] || 0) + 1;
  }

  return {
    boardWidth: Number(board?.properties?.width) || 800,
    boardHeight: Number(board?.properties?.height) || 600,
    componentCount: nonBoardComps.length,
    netCount: nets.length,
    wireCount: graph.wires.length,
    smdCount,
    thCount,
    categories,
    created: graph.metadata.created,
    modified: graph.metadata.modified,
  };
}

// ── File Download Helper ─────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
