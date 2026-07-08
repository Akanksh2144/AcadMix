/**
 * System Design Arena — Component Palette (Sidebar)
 *
 * Categorized draggable component list. Items use the HTML5 Drag
 * API to transfer node-type data to the React Flow canvas.
 */

import React, { useState } from 'react';
import { CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { PALETTE_SECTIONS } from './nodeRegistry';

// ── Component ───────────────────────────────────────────────────────────────

interface ComponentPaletteProps {
  className?: string;
}

export default function ComponentPalette({ className = '' }: ComponentPaletteProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, defaults: Record<string, any>) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-defaults', JSON.stringify(defaults));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredSections = PALETTE_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden bg-[var(--paper-alt)] border-r border-[var(--ink-border)] ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--ink-border)] shrink-0">
        <h3 className="text-xs font-extrabold text-[var(--ink-light)] uppercase tracking-widest mb-2 ">
          Components
        </h3>
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-light)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-[var(--paper-node)] border border-[var(--ink-border)] text-[var(--ink)] placeholder-[var(--ink-light)] focus:ring-1 focus:ring-[var(--ink-light)] focus:border-transparent outline-none transition-all "
          />
        </div>
      </div>

      {/* Scrollable palette */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {filteredSections.map((section) => {
          const isCollapsed = collapsedSections[section.title];
          return (
            <div key={section.title}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center gap-1.5 px-4 py-2 text-sm font-bold tracking-wider text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors "
              >
                {isCollapsed
                  ? <CaretRight size={12} weight="bold" />
                  : <CaretDown size={12} weight="bold" />
                }
                {section.title}
              </button>

              {/* Section items */}
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type, item.defaults)}
                        className="group flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-[var(--ink)] bg-[var(--paper-node)] hover:bg-[var(--paper-alt)] border border-[var(--ink-border)] hover:border-[var(--ink)] cursor-grab active:cursor-grabbing transition-all active:scale-[0.97] shadow-sm hover:shadow-md"
                      >
                        <div 
                          className="w-6 h-6 flex items-center justify-center shrink-0"
                          style={{ color: item.color }}
                        >
                          <Icon size={24} weight="fill" />
                        </div>
                        <span className="text-center leading-tight">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
