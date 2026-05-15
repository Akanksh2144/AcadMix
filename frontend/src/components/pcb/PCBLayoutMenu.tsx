// ── AcadMix Copper Studio — Professional PCB Layout Menu ────────────────────
// A comprehensive dropdown menu matching industry-standard EDA tools.

import React, { useState, useRef, useEffect } from 'react';
import {
  Gear, Wrench, Stack, Path, ShareNetwork, Polygon, CornersOut,
  Cpu, ShieldCheck, Fingerprint, TreeStructure, ArrowsClockwise,
  GridFour, Eye, Cube, Info, PuzzlePiece, Export, FileArrowDown,
  MapPin, ShoppingCart, CaretRight, X
} from '@phosphor-icons/react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

interface MenuAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  children?: MenuAction[];
  badge?: string;
}

interface PCBLayoutMenuProps {
  // Existing actions
  onRunDRC: () => void;
  onShowNetlist: () => void;
  onExportBOM: () => void;
  onExportGerber: () => void;
  onShowLayers: () => void;
  onShow3D: () => void;
  onShowPCBInfo: () => void;
  onExportPickPlace: () => void;
  onCanvasSettings: () => void;
  // Menu state
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PCBLayoutMenu({
  onRunDRC,
  onShowNetlist,
  onExportBOM,
  onExportGerber,
  onShowLayers,
  onShow3D,
  onShowPCBInfo,
  onExportPickPlace,
  onCanvasSettings,
  isOpen,
  onToggle,
  onClose,
}: PCBLayoutMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const comingSoon = (feature: string) => {
    toast.info(`${feature} — Coming Soon`, {
      description: 'This feature is on our roadmap.',
      duration: 2500,
    });
    onClose();
  };

  const menuItems: MenuAction[] = [
    // ── Settings ──
    {
      id: 'canvas-settings',
      label: 'Canvas and Unit Setting',
      icon: <Gear size={14} weight="duotone" />,
      action: () => { onCanvasSettings(); onClose(); },
    },
    // ── Tools ──
    {
      id: 'pcb-tools',
      label: 'PCB Tools',
      icon: <Wrench size={14} weight="duotone" />,
      action: () => comingSoon('PCB Tools'),
    },
    {
      id: 'layers-objects',
      label: 'Layers and Objects Tool',
      icon: <Stack size={14} weight="duotone" />,
      action: () => { onShowLayers(); onClose(); },
    },
    {
      id: 'layer-manager',
      label: 'Layer Manager',
      icon: <Stack size={14} weight="duotone" />,
      action: () => { onShowLayers(); onClose(); },
    },
    { id: 'sep-1', label: '', separator: true },
    // ── Routing ──
    {
      id: 'ratline',
      label: 'Ratline',
      icon: <Path size={14} weight="duotone" />,
      action: () => comingSoon('Ratline Visualization'),
    },
    {
      id: 'pcb-net',
      label: 'PCB Net',
      icon: <ShareNetwork size={14} weight="duotone" />,
      action: () => { onShowNetlist(); onClose(); },
    },
    {
      id: 'board-outline',
      label: 'Board Outline',
      icon: <CornersOut size={14} weight="duotone" />,
      action: () => comingSoon('Board Outline Editor'),
    },
    {
      id: 'route-tracks',
      label: 'Route Tracks',
      icon: <Path size={14} weight="duotone" />,
      shortcut: 'W',
      action: () => comingSoon('Interactive Track Router'),
    },
    { id: 'sep-2', label: '', separator: true },
    // ── Fills & Regions ──
    {
      id: 'copper-pour',
      label: 'Copper Pour',
      icon: <Polygon size={14} weight="duotone" />,
      action: () => comingSoon('Copper Pour Tool'),
    },
    {
      id: 'solid-region',
      label: 'Solid Region',
      icon: <Polygon size={14} weight="duotone" />,
      action: () => comingSoon('Solid Region'),
    },
    { id: 'sep-3', label: '', separator: true },
    // ── Analysis ──
    {
      id: 'drc',
      label: 'Design Rule Check',
      icon: <ShieldCheck size={14} weight="duotone" />,
      shortcut: 'F5',
      action: () => { onRunDRC(); onClose(); },
      badge: 'DRC',
    },
    {
      id: 'footprint-attributes',
      label: 'Footprint Attributes',
      icon: <Fingerprint size={14} weight="duotone" />,
      action: () => comingSoon('Footprint Attributes'),
    },
    {
      id: 'design-manager',
      label: 'Design Manager',
      icon: <TreeStructure size={14} weight="duotone" />,
      action: () => comingSoon('Design Manager'),
    },
    {
      id: 'import-changes',
      label: 'Import Changes',
      icon: <ArrowsClockwise size={14} weight="duotone" />,
      action: () => comingSoon('Import Changes from Schematic'),
    },
    { id: 'sep-4', label: '', separator: true },
    // ── Layout ──
    {
      id: 'panelize',
      label: 'Panelize',
      icon: <GridFour size={14} weight="duotone" />,
      disabled: true,
      action: () => comingSoon('Board Panelization'),
    },
    {
      id: 'layout-no-schematic',
      label: 'Layout PCB Without Schematic',
      icon: <Cpu size={14} weight="duotone" />,
      action: () => comingSoon('Layout Without Schematic'),
    },
    { id: 'sep-5', label: '', separator: true },
    // ── Preview & Info ──
    {
      id: 'pcb-preview',
      label: 'PCB Preview',
      icon: <Eye size={14} weight="duotone" />,
      action: () => comingSoon('PCB Preview (Fabrication View)'),
    },
    {
      id: '3d-model-manager',
      label: '3D Model Manager',
      icon: <Cube size={14} weight="duotone" />,
      action: () => { onShow3D(); onClose(); },
    },
    {
      id: 'pcb-information',
      label: 'PCB Information',
      icon: <Info size={14} weight="duotone" />,
      action: () => { onShowPCBInfo(); onClose(); },
    },
    {
      id: 'pcb-modules',
      label: 'PCB Modules',
      icon: <PuzzlePiece size={14} weight="duotone" />,
      action: () => comingSoon('PCB Modules'),
    },
    { id: 'sep-6', label: '', separator: true },
    // ── Export ──
    {
      id: 'export-gerber',
      label: 'Generate Fabrication File (Gerber)',
      icon: <FileArrowDown size={14} weight="duotone" />,
      action: () => { onExportGerber(); onClose(); },
    },
    {
      id: 'export-bom',
      label: 'Export BOM',
      icon: <Export size={14} weight="duotone" />,
      action: () => { onExportBOM(); onClose(); },
    },
    {
      id: 'export-pick-place',
      label: 'Export Pick and Place File',
      icon: <MapPin size={14} weight="duotone" />,
      action: () => { onExportPickPlace(); onClose(); },
    },
    {
      id: 'export-dxf',
      label: 'Export DXF',
      icon: <Export size={14} weight="duotone" />,
      disabled: true,
      action: () => comingSoon('DXF Export'),
    },
    {
      id: 'order-pcb',
      label: 'Order PCB',
      icon: <ShoppingCart size={14} weight="duotone" />,
      action: () => comingSoon('PCB Ordering Integration'),
    },
  ];

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className="absolute top-full left-0 mt-1 z-[200]">
      <div className="w-72 bg-[#1a1f2e]/98 backdrop-blur-2xl border border-gray-700/60 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-b border-gray-700/40">
          <div className="flex items-center gap-2">
            <Cpu size={15} weight="duotone" className="text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400">PCB Layout</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
          >
            <X size={12} weight="bold" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar py-1.5">
          {menuItems.map((item) => {
            if (item.separator) {
              return <div key={item.id} className="my-1.5 mx-3 h-px bg-gray-700/40" />;
            }

            return (
              <button
                key={item.id}
                onClick={item.action}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left text-[12px] transition-all group relative
                  ${item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer'
                  }`}
              >
                {/* Left accent on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />

                <span className={`shrink-0 ${item.disabled ? 'opacity-40' : 'text-gray-500 group-hover:text-emerald-400'} transition-colors`}>
                  {item.icon}
                </span>

                <span className="flex-1 font-medium truncate">{item.label}</span>

                {item.shortcut && (
                  <kbd className="text-[9px] font-mono font-bold text-gray-600 bg-gray-800/60 px-1.5 py-0.5 rounded border border-gray-700/50 shrink-0">
                    {item.shortcut}
                  </kbd>
                )}

                {item.badge && (
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {item.badge}
                  </span>
                )}

                {item.disabled && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-gray-600 shrink-0">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-800/30 border-t border-gray-700/30">
          <p className="text-[9px] text-gray-600 font-mono text-center">Copper Studio v1.0 · AcadMix</p>
        </div>
      </div>
    </div>
  );
}
