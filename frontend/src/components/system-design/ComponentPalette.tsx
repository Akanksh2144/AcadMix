/**
 * System Design Arena — Component Palette (Sidebar)
 *
 * Categorized draggable component list. Items use the HTML5 Drag
 * API to transfer node-type data to the React Flow canvas.
 */

import React, { useState } from 'react';
import {
  Users, Globe, CloudArrowDown, Scales, Desktop, Lightning,
  Database, Stack, HardDrive, Queue, Robot, ChartLineUp,
  CaretDown, CaretRight, MagnifyingGlass,
} from '@phosphor-icons/react';

// ── Palette Data ────────────────────────────────────────────────────────────

const PALETTE_SECTIONS = [
  {
    title: 'Edge & Routing',
    items: [
      { type: 'client', label: 'Client / Users', icon: Users, color: 'from-violet-500 to-purple-600', defaults: { label: 'Users', requestsPerSec: 1000, protocol: 'http2' } },
      { type: 'dns', label: 'DNS', icon: Globe, color: 'from-sky-500 to-blue-500', defaults: { label: 'DNS', ttl: 300, routingPolicy: 'round-robin' } },
      { type: 'cdn', label: 'CDN', icon: CloudArrowDown, color: 'from-cyan-500 to-teal-500', defaults: { label: 'CDN', cacheHitRatio: 0.85, edgeLatency: 10 } },
      { type: 'loadBalancer', label: 'Load Balancer', icon: Scales, color: 'from-amber-500 to-orange-500', defaults: { label: 'Load Balancer', algorithm: 'round-robin', healthCheckInterval: 10 } },
    ],
  },
  {
    title: 'Compute',
    items: [
      { type: 'appServer', label: 'App Server', icon: Desktop, color: 'from-blue-500 to-indigo-500', defaults: { label: 'App Server', replicas: 1, maxThreads: 200, processingTime: 50 } },
      { type: 'workerPool', label: 'Worker Pool', icon: Robot, color: 'from-indigo-500 to-violet-500', defaults: { label: 'Workers', workers: 4, taskProcessingTime: 200 } },
    ],
  },
  {
    title: 'Caching',
    items: [
      { type: 'cache', label: 'Redis Cache', icon: Lightning, color: 'from-rose-500 to-pink-500', defaults: { label: 'Redis', evictionPolicy: 'lru', hitRatio: 0.8, pattern: 'cache-aside', maxSize: 256, ttl: 300 } },
    ],
  },
  {
    title: 'Storage',
    items: [
      { type: 'sqlDatabase', label: 'SQL Database', icon: Database, color: 'from-emerald-500 to-green-500', defaults: { label: 'PostgreSQL', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 } },
      { type: 'nosqlDatabase', label: 'NoSQL Database', icon: Stack, color: 'from-lime-500 to-green-500', defaults: { label: 'MongoDB', consistencyLevel: 'eventual', partitionKey: 'user_id' } },
      { type: 'objectStorage', label: 'Object Storage', icon: HardDrive, color: 'from-slate-500 to-gray-500', defaults: { label: 'S3 / Blob', latency: 50, maxThroughput: 100 } },
    ],
  },
  {
    title: 'Messaging',
    items: [
      { type: 'messageQueue', label: 'Message Queue', icon: Queue, color: 'from-orange-500 to-amber-500', defaults: { label: 'Kafka', queueType: 'kafka', partitions: 4, consumerGroups: 1 } },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { type: 'metricsDashboard', label: 'Metrics Dashboard', icon: ChartLineUp, color: 'from-fuchsia-500 to-pink-500', defaults: { label: 'Metrics' } },
    ],
  },
];

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
    <div className={`flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
          Components
        </h3>
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
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
                className="w-full flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {isCollapsed
                  ? <CaretRight size={10} weight="bold" />
                  : <CaretDown size={10} weight="bold" />
                }
                {section.title}
              </button>

              {/* Section items */}
              {!isCollapsed && section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.defaults)}
                    className="group flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing transition-all active:scale-[0.97]"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm shrink-0`}>
                      <Icon size={16} weight="bold" className="text-white" />
                    </div>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Drag components onto the canvas, then connect them by dragging between handles.
        </p>
      </div>
    </div>
  );
}
