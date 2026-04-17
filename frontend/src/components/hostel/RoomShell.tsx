import React from 'react';
import type { RoomDecorators } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM SHELL — Decorative SVG overlay (walls, door, window markers)
// Wraps the CSS grid of BedCells. Does NOT affect data model.
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomShellProps {
  decorators?: RoomDecorators;
  children: React.ReactNode;
  roomNumber?: string;
}

export default function RoomShell({ decorators, children, roomNumber }: RoomShellProps) {
  const windowWall = decorators?.window_wall || 'top';
  const doorPosition = decorators?.door_position || 'bottom-right';
  const bathroomCorner = decorators?.bathroom_corner;

  return (
    <div className="relative">
      {/* Room border — floor plan outline */}
      <div className="relative border-2 border-slate-300 dark:border-slate-600 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900/50">

        {/* Window wall indicator */}
        <div className={`flex items-center justify-center gap-2 py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-sky-50/50 dark:bg-sky-900/10 border-b border-slate-200/50 dark:border-slate-700/50 ${
          windowWall === 'bottom' ? 'order-last border-t border-b-0' : ''
        }`}>
          <span>🪟</span>
          <span>Window Wall</span>
        </div>

        {/* Bed grid container */}
        <div className="p-4 sm:p-6">
          {children}
        </div>

        {/* Walkway */}
        {/* This is injected by the parent FloorPlanView when rendering multi-row grids */}

        {/* Door indicator */}
        <div className={`flex items-center py-2 px-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 ${
          doorPosition?.includes('right') ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <span className="text-base">🚪</span>
            Door
          </span>
        </div>
      </div>

      {/* Bathroom corner indicator */}
      {bathroomCorner && (
        <div className={`absolute w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-xs ${
          bathroomCorner === 'top-right' ? '-top-1 -right-1' :
          bathroomCorner === 'top-left' ? '-top-1 -left-1' :
          bathroomCorner === 'bottom-right' ? '-bottom-1 -right-1' :
          '-bottom-1 -left-1'
        }`} title="Bathroom">
          🚿
        </div>
      )}
    </div>
  );
}
