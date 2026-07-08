import React, { useState } from 'react';
import {
  CaretDown, CaretRight, MagnifyingGlass, Skull, Lightning, CloudLightning,
  ShieldWarning, LockKey, Fire, Wrench, HardDrives, Timer, Globe, Waves,
  Package, Scales, Broadcast, Anchor, Plugs, Stethoscope, Lock, Brain,
  Spinner, LinkBreak, GridFour, Sun, Buildings, Stack, ChartLineDown,
  GlobeHemisphereWest, Cube, Trash
} from '@phosphor-icons/react';
import { PALETTE_SECTIONS } from './nodeRegistry';

// ── Chaos Engineering Sections (Paperdraw+ / AcadMix Enterprise) ────────────

export const CHAOS_SECTIONS = [
  {
    title: 'Infrastructure Failures',
    items: [
      { id: 'az_failure', label: 'Availability Zone', emoji: '🧱', icon: Stack, description: 'Drop entire Availability Zone and take offline 50% of compute instances', impact: { killReplicasPct: 50, errorRate: 60 } },
      { id: 'dc_blackout', label: 'Data Center', emoji: '🏢', icon: Buildings, description: 'Total datacenter blackout. All local servers and storage drop offline simultaneously', impact: { killReplicasPct: 100, errorRate: 100 } },
      { id: 'instance_crash', label: 'Instance Crash', emoji: '💥', icon: Lightning, description: 'Sudden SIGKILL crash on active backend app server instance', impact: { killReplicasPct: 33, errorRate: 35 } },
      { id: 'instance_slow', label: 'Instance Slow', emoji: '🐢', icon: Timer, description: 'CPU and memory starvation causing severe node processing delays', impact: { addedLatency: 800, capacityMultiplier: 0.2 } },
      { id: 'disk_failure', label: 'Disk Failure', emoji: '💾', icon: HardDrives, description: 'Physical disk/controller failure on storage nodes causing I/O stall', impact: { addedLatency: 1200, errorRate: 45 } },
      { id: 'disk_corruption', label: 'Disk Corruption', emoji: '🧬', icon: ShieldWarning, description: 'Bit rot and data block corruption triggering database read verification errors', impact: { errorRate: 40 } },
      { id: 'storage_iops', label: 'Storage IOPS', emoji: '📉', icon: ChartLineDown, description: 'Exhausted storage volume IOPS quota resulting in disk write queue backups', impact: { addedLatency: 600, capacityMultiplier: 0.3 } },
      { id: 'file_system', label: 'File System', emoji: '🔒', icon: LockKey, description: 'Root filesystem mounted read-only due to journal errors', impact: { errorRate: 75 } },
      { id: 'vm_cpu', label: 'VM CPU', emoji: '🔥', icon: Fire, description: '100% CPU runaway spike from background kernel task or intensive query', impact: { addedLatency: 1500, capacityMultiplier: 0.1 } },
      { id: 'host_hardware', label: 'Host Hardware', emoji: '🛠️', icon: Wrench, description: 'Physical hypervisor host hardware fault triggering immediate kernel panic', impact: { killReplicasPct: 50, errorRate: 80 } },
    ]
  },
  {
    title: 'Network Chaos',
    items: [
      { id: 'net_partition', label: 'Network Partition', emoji: '🌊', icon: Waves, description: 'Split-brain network disconnection isolating database leader from app servers', impact: { errorRate: 90, addedLatency: 2000 } },
      { id: 'cross_region', label: 'Cross-Region Loss', emoji: '🪐', icon: Globe, description: 'Inter-region backbone fiber cut disconnecting multi-region replication links', impact: { addedLatency: 3500, errorRate: 50 } },
      { id: 'packet_loss', label: 'Packet Loss', emoji: '📦', icon: Package, description: 'Random 25% packet drop and TCP retransmits across internal VPC subnets', impact: { addedLatency: 450, errorRate: 25 } },
      { id: 'high_latency', label: 'High Latency', emoji: '⏳', icon: Timer, description: 'Simulated network jitter and 1,000ms delay injected into inter-service calls', impact: { addedLatency: 1000 } },
      { id: 'bandwidth_throttle', label: 'Bandwidth Throttle', emoji: '📡', icon: Broadcast, description: 'Restricted network link bandwidth causing connection queue congestion', impact: { capacityMultiplier: 0.25, addedLatency: 300 } },
      { id: 'conn_flap', label: 'Connection Flap', emoji: '⚖️', icon: Scales, description: 'Repeated TCP SYN/RST connection oscillation and socket exhaustion', impact: { errorRate: 35, addedLatency: 250 } },
      { id: 'lb_degraded', label: 'Load Balancer', emoji: '⚓', icon: Anchor, description: 'Load balancer health probe loop dropping healthy backend instances', impact: { capacityMultiplier: 0.4, errorRate: 30 } },
      { id: 'port_closed', label: 'Backend Port', emoji: '🔌', icon: Plugs, description: 'Service listening port closed or hung, rejecting new TCP connections', impact: { errorRate: 85 } },
      { id: 'health_check_fail', label: 'Health Check', emoji: '🩺', icon: Stethoscope, description: 'False positive health check failures triggering continuous pod evictions', impact: { killReplicasPct: 40, errorRate: 20 } },
      { id: 'tls_expired', label: 'TLS Certificate', emoji: '🔐', icon: Lock, description: 'Expired or untrusted TLS/SSL certificate rejecting HTTPS handshakes', impact: { errorRate: 95 } },
      { id: 'dns_timeout', label: 'DNS Resolution', emoji: '🌐', icon: GlobeHemisphereWest, description: 'DNS resolver lookup timeouts returning sporadic NXDOMAIN errors', impact: { addedLatency: 5000, errorRate: 70 } },
    ]
  },
  {
    title: 'Application-Level Chaos',
    items: [
      { id: 'memory_leak', label: 'Memory Leak', emoji: '🧠', icon: Brain, description: 'Continuous heap RAM growth triggering frequent major Garbage Collection pauses', impact: { addedLatency: 650, capacityMultiplier: 0.5 } },
      { id: 'oom_killer', label: 'Out of Memory', emoji: '💀', icon: Skull, description: 'Linux OOM Killer terminating main application process when RAM limit exceeded', impact: { killReplicasPct: 60, errorRate: 80 } },
      { id: 'thread_pool', label: 'Thread Pool', emoji: '🧵', icon: Spinner, description: 'Starved worker threads and connection pool exhaustion from long-running queries', impact: { addedLatency: 2500, errorRate: 65 } },
      { id: 'deadlock', label: 'Deadlock', emoji: '🔗', icon: LinkBreak, description: 'Database table lock deadlock contention freezing concurrent transaction updates', impact: { addedLatency: 3000, errorRate: 90 } },
      { id: 'cache_stampede', label: 'Cache Stampede', emoji: '▦', icon: GridFour, description: 'Thundering herd overwhelming backend DB after simultaneous cache expiration', impact: { addedLatency: 1800, errorRate: 55, capacityMultiplier: 0.2 } },
      { id: 'error_storm', label: 'Error Storm', emoji: '⚡', icon: CloudLightning, description: 'Cascading unhandled exceptions and HTTP 5xx flood across downstream dependencies', impact: { errorRate: 85 } },
    ]
  },
  {
    title: 'Global Events',
    items: [
      { id: 'traffic_surge', label: 'Traffic Surge', emoji: '☀️', icon: Sun, description: 'Sudden 25x flash crowd QPS spike from viral event overwhelming edge and backend', impact: { qpsMultiplier: 25, addedLatency: 900 } },
    ]
  }
];

// ── Component ───────────────────────────────────────────────────────────────

interface ComponentPaletteProps {
  className?: string;
  isSimulating?: boolean;
  onStartSimulation?: () => void;
  onInjectChaos?: (chaosItem: any) => void;
  onClearChaos?: () => void;
}

export default function ComponentPalette({
  className = '',
  isSimulating = false,
  onStartSimulation,
  onInjectChaos,
  onClearChaos,
}: ComponentPaletteProps) {
  const [activeTab, setActiveTab] = useState<'components' | 'chaos'>('components');

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PALETTE_SECTIONS.forEach((section, idx) => {
      if (idx > 0) initial[section.title] = true;
    });
    return initial;
  });

  const [collapsedChaosSections, setCollapsedChaosSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CHAOS_SECTIONS.forEach((section, idx) => {
      if (idx > 0) initial[section.title] = true;
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleChaosSection = (title: string) => {
    setCollapsedChaosSections((prev) => ({ ...prev, [title]: !prev[title] }));
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

  const filteredChaosSections = CHAOS_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden bg-[var(--paper-alt)] border-r border-[var(--ink-border)] ${className}`}>
      {/* Pill-shaped Tab Menu with active tab matching outer pill container */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--ink-border)] shrink-0">
        <div className="flex p-1 bg-[var(--paper-node)] rounded-full border border-[var(--ink-border)] gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => { setActiveTab('components'); setSearchQuery(''); }}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 truncate ${
              activeTab === 'components'
                ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                : 'text-[var(--ink-light)] hover:text-[var(--ink)]'
            }`}
          >
            <Cube size={14} weight="bold" />
            <span>Components</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('chaos'); setSearchQuery(''); }}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 truncate ${
              activeTab === 'chaos'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-[var(--ink-light)] hover:text-red-400'
            }`}
          >
            <Skull size={14} weight="bold" />
            <span>Chaos Arena</span>
          </button>
        </div>
      </div>

      {/* Header & Search */}
      <div className="px-3 py-2.5 border-b border-[var(--ink-border)] shrink-0">
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-light)]" />
          <input
            type="text"
            placeholder={activeTab === 'components' ? 'Search components...' : 'Search chaos...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--paper-node)] border border-[var(--ink-border)] text-[var(--ink)] placeholder-[var(--ink-light)] focus:ring-1 focus:ring-[var(--accent-blue)] focus:border-transparent outline-none transition-all font-mono"
          />
        </div>
      </div>

      {/* Tab 1: Components Palette */}
      {activeTab === 'components' && (
        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {filteredSections.map((section) => {
            const isCollapsed = searchQuery.trim() !== '' ? false : collapsedSections[section.title];
            return (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold tracking-wider text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors uppercase"
                >
                  <div className="flex items-center gap-1.5">
                    {isCollapsed
                      ? <CaretRight size={12} weight="bold" />
                      : <CaretDown size={12} weight="bold" />
                    }
                    <span>{section.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--paper-node)] border border-[var(--ink-border)]">
                    {section.items.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-2 px-2.5 pb-2.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.type}
                          draggable
                          onDragStart={(e) => onDragStart(e, item.type, item.defaults)}
                          className="group flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl text-[11px] font-bold text-[var(--ink)] bg-[var(--paper-node)] hover:bg-[var(--paper-alt)] border border-[var(--ink-border)] hover:border-[var(--ink)] cursor-grab active:cursor-grabbing transition-all active:scale-[0.97] shadow-sm hover:shadow-md"
                        >
                          <div 
                            className="w-6 h-6 flex items-center justify-center shrink-0"
                            style={{ color: item.color }}
                          >
                            <Icon size={22} weight="fill" />
                          </div>
                          <span className="text-center leading-tight truncate w-full">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Chaos Engineering Arena */}
      {activeTab === 'chaos' && (
        <div className="flex-1 overflow-y-auto min-h-0 py-1">
          {/* Paperdraw+ Simulation Banner */}
          {!isSimulating ? (
            <div
              onClick={onStartSimulation}
              className="mx-3 mt-2 mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-sm font-bold text-amber-400">▶</span>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                    <span>Start simulation to enable chaos</span>
                  </div>
                  <div className="text-[10px] text-[var(--ink-light)] font-mono mt-0.5">
                    🔒 Chaos engineering requires Paperdraw+
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-3 mt-2 mb-3 p-3 rounded-xl bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <div>
                  <div className="text-xs font-extrabold text-red-400">Chaos Arena Live</div>
                  <div className="text-[10px] text-[var(--ink-light)] mt-0.5">Click any fault to inject into simulation</div>
                </div>
              </div>
              {onClearChaos && (
                <button
                  onClick={onClearChaos}
                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-mono text-[10px] font-bold border border-red-500/40 transition-colors flex items-center gap-1 shrink-0"
                  title="Clear all injected chaos faults"
                >
                  <Trash size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          )}

          {/* Categorized Chaos Items */}
          {filteredChaosSections.map((section) => {
            const isCollapsed = searchQuery.trim() !== '' ? false : collapsedChaosSections[section.title];
            return (
              <div key={section.title} className="mb-2">
                <button
                  onClick={() => toggleChaosSection(section.title)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold tracking-wider text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors uppercase"
                >
                  <div className="flex items-center gap-1.5">
                    {isCollapsed
                      ? <CaretRight size={12} weight="bold" />
                      : <CaretDown size={12} weight="bold" />
                    }
                    <span>{section.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--paper-node)] border border-[var(--ink-border)]">
                    {section.items.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="flex flex-col gap-1.5 px-3 pb-2">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isSimulating && onStartSimulation) {
                            onStartSimulation();
                          } else if (onInjectChaos) {
                            onInjectChaos(item);
                          }
                        }}
                        draggable={isSimulating}
                        onDragStart={(e) => {
                          if (isSimulating) {
                            e.dataTransfer.setData('application/reactflow', 'chaosMonkey');
                            e.dataTransfer.setData('application/reactflow-defaults', JSON.stringify({
                              label: `Chaos: ${item.label}`,
                              killRatePct: item.impact?.errorRate || 50,
                              chaosId: item.id,
                              description: item.description,
                              impact: item.impact,
                              rawChaosItem: item,
                            }));
                          }
                        }}
                        className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
                          !isSimulating
                            ? 'bg-[var(--paper-node)] border-[var(--ink-border)] opacity-85 hover:opacity-100 hover:border-amber-500/40 cursor-pointer'
                            : 'bg-[var(--paper-node)] border-red-500/20 hover:border-red-500/60 hover:bg-red-500/10 cursor-pointer active:scale-[0.98] shadow-sm'
                        }`}
                        title={item.description}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-base shrink-0 select-none leading-none">{item.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[var(--ink)] font-semibold group-hover:text-red-400 transition-colors">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-[var(--ink-light)] font-normal truncate opacity-80">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {!isSimulating ? (
                            <span className="text-sm select-none" title="Start simulation to enable">🔒</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-mono font-bold border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              Inject ⚡
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
