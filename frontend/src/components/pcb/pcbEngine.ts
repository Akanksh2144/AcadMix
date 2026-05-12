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
    if (!connectedIds.has(c.id) && c.type !== 'testPoint' && c.type !== 'jumper') {
      results.push({
        id: `drc-unconnected-${c.id}`,
        severity: 'warning',
        message: `${c.refDes} (${c.type}) is not connected to anything.`,
        componentIds: [c.id],
      });
    }
  }

  // 3. Check for missing power connections
  const hasVCC = components.some(c => c.type === 'vcc' || c.type === 'dcSource' || c.type === 'battery');
  const hasGND = components.some(c => c.type === 'gnd');
  const hasActiveComponents = components.some(c =>
    ['opamp', 'timer555', 'microcontroller', 'icChip', 'logicGate', 'flipFlop', 'shiftRegister', 'voltageRegulator'].includes(c.type)
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
        (fromComp.type === 'vcc' && toComp.type === 'gnd') ||
        (fromComp.type === 'gnd' && toComp.type === 'vcc');
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
    if (['vcc', 'gnd', 'testPoint'].includes(c.type)) continue;
    const wireCount = wires.filter(w => w.fromComponent === c.id || w.toComponent === c.id).length;
    if (wireCount === 1 && !['vcc', 'gnd', 'testPoint', 'jumper'].includes(c.type)) {
      results.push({
        id: `drc-singlepin-${c.id}`,
        severity: 'warning',
        message: `${c.refDes} has only 1 connection — possible floating pin.`,
        componentIds: [c.id],
      });
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
