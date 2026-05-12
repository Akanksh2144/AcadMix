// ── AcadMix PCB Studio — Base Schematic Node ─────────────────────────────────
// Shared base component for all PCB schematic nodes.
// Provides consistent premium styling, handles, labels, and selection glow.

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ComponentType, PinDef } from '../types';

// ── Color theme per category ─────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { border: string; gradient: string; handle: string; glow: string }> = {
  passive: {
    border: 'border-teal-500/60 dark:border-teal-400/50',
    gradient: 'from-teal-600 to-emerald-600',
    handle: '!bg-teal-500',
    glow: 'shadow-teal-500/25',
  },
  active: {
    border: 'border-amber-500/60 dark:border-amber-400/50',
    gradient: 'from-amber-600 to-orange-600',
    handle: '!bg-amber-500',
    glow: 'shadow-amber-500/25',
  },
  ic: {
    border: 'border-violet-500/60 dark:border-violet-400/50',
    gradient: 'from-violet-600 to-purple-600',
    handle: '!bg-violet-500',
    glow: 'shadow-violet-500/25',
  },
  connector: {
    border: 'border-cyan-500/60 dark:border-cyan-400/50',
    gradient: 'from-cyan-600 to-blue-600',
    handle: '!bg-cyan-500',
    glow: 'shadow-cyan-500/25',
  },
  power: {
    border: 'border-red-500/60 dark:border-red-400/50',
    gradient: 'from-red-600 to-rose-600',
    handle: '!bg-red-500',
    glow: 'shadow-red-500/25',
  },
  sensor: {
    border: 'border-lime-500/60 dark:border-lime-400/50',
    gradient: 'from-lime-600 to-green-600',
    handle: '!bg-lime-500',
    glow: 'shadow-lime-500/25',
  },
};

function getCategoryFromType(type: ComponentType): string {
  if (['resistor', 'capacitor', 'inductor', 'diode', 'led', 'crystal', 'fuse', 'potentiometer'].includes(type)) return 'passive';
  if (['npn', 'pnp', 'nmosfet', 'pmosfet', 'opamp', 'voltageRegulator', 'timer555', 'scr'].includes(type)) return 'active';
  if (['logicGate', 'flipFlop', 'icChip', 'microcontroller', 'shiftRegister'].includes(type)) return 'ic';
  if (['header', 'usb', 'switch', 'relay', 'buzzer', 'motor', 'transformer'].includes(type)) return 'connector';
  if (['vcc', 'gnd', 'battery', 'dcSource'].includes(type)) return 'power';
  return 'sensor';
}

// ── Pin position calculation ─────────────────────────────────────────────────

interface PinPlacement {
  id: string;
  label: string;
  type: 'source' | 'target';
  position: Position;
  style: React.CSSProperties;
}

function computePinPlacements(pins: PinDef[], nodeWidth: number, nodeHeight: number): PinPlacement[] {
  const sidePins: Record<string, PinDef[]> = { left: [], right: [], top: [], bottom: [] };
  pins.forEach(p => { sidePins[p.side] = sidePins[p.side] || []; sidePins[p.side].push(p); });

  const result: PinPlacement[] = [];

  for (const [side, list] of Object.entries(sidePins)) {
    const count = list.length;
    list.forEach((pin, i) => {
      const offset = count === 1 ? 50 : 20 + (60 / Math.max(count - 1, 1)) * i;
      let pos: Position;
      let style: React.CSSProperties;

      switch (side) {
        case 'left':
          pos = Position.Left;
          style = { top: `${offset}%`, left: 2 };
          break;
        case 'right':
          pos = Position.Right;
          style = { top: `${offset}%`, right: 2 };
          break;
        case 'top':
          pos = Position.Top;
          style = { left: `${offset}%`, top: 2 };
          break;
        case 'bottom':
          pos = Position.Bottom;
          style = { left: `${offset}%`, bottom: 2 };
          break;
        default:
          pos = Position.Left;
          style = { top: `${offset}%` };
      }

      result.push({
        id: pin.id,
        label: pin.label,
        type: ['input', 'ground'].includes(pin.type) ? 'target' : 'source',
        position: pos,
        style,
      });
    });
  }

  return result;
}

// ── Base Node Component ──────────────────────────────────────────────────────

export interface BaseNodeData {
  label: string;
  refDes: string;
  componentType: ComponentType;
  category: string;
  pins: PinDef[];
  properties: Record<string, string | number | boolean>;
  selected?: boolean;
  onDataChange?: (id: string, field: string, value: any) => void;
  [key: string]: unknown;
}

interface BaseSchematicNodeProps {
  id: string;
  data: BaseNodeData;
  icon?: React.ReactNode;
  symbol?: React.ReactNode;
  children?: React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  compact?: boolean;
}

function BaseSchematicNodeInner({
  id,
  data,
  icon,
  symbol,
  children,
  compact = false,
}: BaseSchematicNodeProps) {
  const pins = data.pins || [];
  const placements = computePinPlacements(pins, 0, 0);

  return (
    <div
      className={`relative flex flex-col items-center justify-center group
        ${data.selected ? 'ring-1 ring-yellow-400/50 bg-yellow-400/5' : ''}
        transition-all duration-200
      `}
    >
      {/* ── RefDes (Silkscreen text) ── */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-yellow-400 opacity-90 whitespace-nowrap drop-shadow-md">
        {data.refDes}
      </div>

      {/* ── Symbol (Draws its own pads) ── */}
      <div className="drop-shadow-[0_0_2px_rgba(250,204,21,0.2)]">
        {symbol}
      </div>

      {/* ── Value (Silkscreen text) ── */}
      {data.properties?.value && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-yellow-200 opacity-80 whitespace-nowrap drop-shadow-md">
          {String(data.properties.value)}
        </div>
      )}

      {/* Custom content (editable controls) if any */}
      {children && (
        <div className="absolute top-full mt-6 left-1/2 -translate-x-1/2 z-10">
          {children}
        </div>
      )}

      {/* ── Handles (Invisible routers) ── */}
      {placements.map((pin) => (
        <Handle
          key={pin.id}
          id={pin.id}
          type={pin.type}
          position={pin.position}
          style={pin.style}
          className="!w-2 !h-2 opacity-0"
          title={`${pin.label} (${pin.id})`}
        />
      ))}
    </div>
  );
}

export const BaseSchematicNode = memo(BaseSchematicNodeInner);
export { getCategoryFromType, CATEGORY_COLORS, computePinPlacements };
