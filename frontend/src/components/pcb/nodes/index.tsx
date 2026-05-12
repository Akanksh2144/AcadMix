// ── AcadMix PCB Studio — Node Type Registry ──────────────────────────────────
import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseSchematicNode, type BaseNodeData } from './BaseSchematicNode';
import { getCatalogEntry } from '../componentCatalog';
import { PCBBoardNode } from './PCBBoardNode';
import * as Symbols from '../schematicSymbols';
import * as LogicSymbols from '../logicalSymbols';

// Define the mapping between catalog type and the SVG Symbol component
const SYMBOL_MAP: Record<string, React.FC<any>> = {
  resistor: Symbols.ResistorSymbol,
  resistor_th: Symbols.ResistorTHSymbol,
  capacitor: Symbols.CapacitorSymbol,
  capacitor_elec: Symbols.CapacitorElecSymbol,
  inductor: Symbols.InductorSymbol,
  diode: Symbols.DiodeSymbol,
  led: Symbols.LEDSymbol,
  crystal: Symbols.CrystalSymbol,

  npn: Symbols.NPNSymbol,
  pnp: Symbols.PNPSymbol,
  nmosfet: Symbols.NMOSFETSymbol,
  opamp: Symbols.OpAmpSymbol,
  voltageRegulator: Symbols.VoltageRegulatorSymbol,

  timer555: Symbols.Timer555Symbol,
  atmega328: Symbols.ATmega328Symbol,
  esp32: Symbols.ESP32Symbol,
  l298n: Symbols.L298NSymbol,
  logicGate: Symbols.LogicGateSymbol,
  icChip: Symbols.ICChipSymbol,

  header: Symbols.HeaderSymbol,
  usb: Symbols.USBSymbol,
  switch: Symbols.SwitchSymbol,
  barrel: Symbols.BarrelSymbol,

  vcc: Symbols.VCCSymbol,
  gnd: Symbols.GNDSymbol,
  battery: Symbols.BatterySymbol,

  testPoint: Symbols.TestPointSymbol,
  mpu6050: Symbols.MPU6050Symbol,
  dht11: Symbols.DHT11Symbol,
};

// Factory to create a unified React Flow node component for any type
function createNodeComponent(type: string) {
  const SymbolComponent = SYMBOL_MAP[type] || Symbols.SMD0805;
  
  const NodeComponent = ({ id, data }: NodeProps & { data: BaseNodeData }) => {
    const catalog = getCatalogEntry(type);
    if (!catalog) return null;
    return (
      <BaseSchematicNode
        id={id}
        data={{
          ...data,
          componentType: type as any,
          category: catalog.category,
          label: catalog.label,
          pins: catalog.pins as any,
        }}
        symbol={<SymbolComponent />}
      />
    );
  };
  
  return memo(NodeComponent);
}

// Generate the final nodeTypes object for React Flow (Physical Layout)
export const pcbNodeTypes: Record<string, React.ComponentType<any>> = {
  board: PCBBoardNode,
  board_custom: PCBBoardNode,
  board_100x100: PCBBoardNode,
  board_50x50: PCBBoardNode,
  board_uno: PCBBoardNode,
  board_hat: PCBBoardNode,
  copper_pour: PCBBoardNode,
};

// Generate the nodeTypes object for Schematic view
export const logicalNodeTypes: Record<string, React.ComponentType<any>> = {
  board: PCBBoardNode,
  board_custom: PCBBoardNode,
  board_100x100: PCBBoardNode,
  board_50x50: PCBBoardNode,
  board_uno: PCBBoardNode,
  board_hat: PCBBoardNode,
  copper_pour: PCBBoardNode,
};

const LOGICAL_SYMBOL_MAP: Record<string, React.FC<any>> = {
  resistor: LogicSymbols.SchResistor,
  resistor_th: LogicSymbols.SchResistor,
  capacitor: LogicSymbols.SchCapacitor,
  capacitor_elec: LogicSymbols.SchCapacitor,
  inductor: LogicSymbols.SchInductor,
  diode: LogicSymbols.SchDiode,
  led: LogicSymbols.SchDiode,
  npn: LogicSymbols.SchNPN,
  pnp: LogicSymbols.SchNPN, // simplify for now
  opamp: LogicSymbols.SchOpAmp,
  gnd: LogicSymbols.SchGround,
};

// Factory to create a logical React Flow node component
function createLogicalNodeComponent(type: string) {
  const SymbolComponent = LOGICAL_SYMBOL_MAP[type] || (() => <LogicSymbols.SchGenericIC text={type} />);
  
  const NodeComponent = ({ id, data }: NodeProps & { data: BaseNodeData }) => {
    const catalog = getCatalogEntry(type);
    if (!catalog) return null;
    return (
      <BaseSchematicNode
        id={id}
        data={{
          ...data,
          componentType: type as any,
          category: catalog.category,
          label: catalog.label,
          pins: catalog.pins as any,
        }}
        symbol={<SymbolComponent />}
      />
    );
  };
  
  return memo(NodeComponent);
}

// Auto-register all types from our map
for (const type of Object.keys(SYMBOL_MAP)) {
  pcbNodeTypes[type] = createNodeComponent(type);
  logicalNodeTypes[type] = createLogicalNodeComponent(type);
}

