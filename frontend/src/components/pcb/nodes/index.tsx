// ── AcadMix PCB Studio — Node Type Registry ──────────────────────────────────
import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseSchematicNode, type BaseNodeData } from './BaseSchematicNode';
import { getCatalogEntry } from '../componentCatalog';
import { PCBBoardNode } from './PCBBoardNode';
import * as Symbols from '../schematicSymbols';
import * as LogicSymbols from '../logicalSymbols';

// Define the mapping between catalog type and the SVG Symbol component
// Define the mapping between catalog type and the SVG Symbol component
const SYMBOL_MAP: Record<string, React.FC<any>> = {
  // New specific IDs
  vcc_node: Symbols.VCCSymbol,
  gnd_node: Symbols.GNDSymbol,
  led_red: Symbols.LEDSymbol,
  led_green: Symbols.LEDSymbol,
  led_blue: Symbols.LEDSymbol,
  diode_1n4148: Symbols.DiodeSymbol,
  diode_1n4007: Symbols.DiodeSymbol,
  bjt_2n2222: Symbols.NPNSymbol,
  bjt_2n2907: Symbols.PNPSymbol,
  mosfet_n_bss138: Symbols.NMOSFETSymbol,
  mosfet_p_bss84: Symbols.NMOSFETSymbol,
  mcu_esp32_wroom: Symbols.ESP32Symbol,
  mcu_stm32f103c8: Symbols.ATmega328Symbol, // Generic IC for now
  mcu_rp2040: Symbols.GenericIC.bind(null, { width: 60, height: 60, text: 'RP2040' }),
  mcu_atmega328p: Symbols.ATmega328Symbol,
  logic_74hc595: Symbols.LogicGateSymbol,
  logic_74hc138: Symbols.LogicGateSymbol,
  logic_ne555: Symbols.Timer555Symbol,
  opamp_lm358: Symbols.OpAmpSymbol,
  opamp_tl072: Symbols.OpAmpSymbol,
  usb_c: Symbols.USBSymbol,
  micro_usb: Symbols.USBSymbol,
  barrel_jack: Symbols.BarrelSymbol,
  bme280: Symbols.GenericIC.bind(null, { width: 40, height: 40, text: 'BME280' }),
  mpu6050: Symbols.MPU6050Symbol,
  oled_128x64: Symbols.GenericIC.bind(null, { width: 60, height: 40, text: 'OLED' }),
  hcsr04: Symbols.DHT11Symbol, // Similar outline
};

function getSymbolForType(type: string): React.FC<any> {
  if (SYMBOL_MAP[type]) return SYMBOL_MAP[type];
  if (type.startsWith('res_')) return Symbols.ResistorSymbol;
  if (type.startsWith('cap_elec_')) return Symbols.CapacitorElecSymbol;
  if (type.startsWith('cap_')) return Symbols.CapacitorSymbol;
  if (type.startsWith('ind_')) return Symbols.InductorSymbol;
  if (type.startsWith('header_')) return Symbols.HeaderSymbol;
  return Symbols.SMD0805;
}

// Factory to create a unified React Flow node component for any type
function createNodeComponent(type: string) {
  const SymbolComponent = getSymbolForType(type);
  
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
  vcc_node: LogicSymbols.SchGround, // Use ground-like but up for VCC? Actually SchGenericIC is better
  gnd_node: LogicSymbols.SchGround,
};

function getLogicalSymbolForType(type: string): React.FC<any> {
  if (LOGICAL_SYMBOL_MAP[type]) return LOGICAL_SYMBOL_MAP[type];
  if (type.startsWith('res_')) return LogicSymbols.SchResistor;
  if (type.startsWith('cap_')) return LogicSymbols.SchCapacitor;
  if (type.startsWith('ind_')) return LogicSymbols.SchInductor;
  if (type.startsWith('led_')) return LogicSymbols.SchDiode;
  if (type.startsWith('diode_')) return LogicSymbols.SchDiode;
  if (type.startsWith('bjt_')) return LogicSymbols.SchNPN;
  if (type.startsWith('opamp_')) return LogicSymbols.SchOpAmp;
  return (() => <LogicSymbols.SchGenericIC text={type.split('_')[0].toUpperCase()} />);
}

// Factory to create a logical React Flow node component
function createLogicalNodeComponent(type: string) {
  const SymbolComponent = getLogicalSymbolForType(type);
  
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

// Auto-register all types from our catalog
import { COMPONENT_CATALOG } from '../componentCatalog';

COMPONENT_CATALOG.forEach(entry => {
  pcbNodeTypes[entry.type] = createNodeComponent(entry.type);
  logicalNodeTypes[entry.type] = createLogicalNodeComponent(entry.type);
});

