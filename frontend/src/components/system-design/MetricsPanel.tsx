/**
 * System Design Arena — Metrics Panel
 *
 * Displays simulation results: latency profiles, throughput charts,
 * bottleneck alerts, and system grading. Uses Recharts.
 * Integrates an interactive Node Inspector & Concept Guide when a node is selected.
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  ChartLineUp, Warning, CheckCircle, XCircle, Trophy,
  Lightning, Clock, CurrencyDollar, ShieldCheck,
  Users, Globe, CloudArrowDown, Scales, Desktop, Database,
  Stack, HardDrive, Queue, Robot,
} from '@phosphor-icons/react';
import type { SimulationResult } from './types';

// ── Concept Guide Map ───────────────────────────────────────────────────────

const CONCEPT_GUIDES: Record<string, { title: string; category: string; description: string; tradeOffs: string[] }> = {
  client: {
    title: 'Client / Users',
    category: 'Traffic Generator',
    description: 'Simulates requests originating from users. Acts as the traffic seed for your architecture.',
    tradeOffs: [
      'HTTP/2: Allows multiplexing multiple requests over a single connection.',
      'WebSockets: Essential for persistent duplex real-time communication (e.g., chat/GPS tracking).',
    ]
  },
  dns: {
    title: 'Geo-DNS',
    category: 'Domain Router',
    description: 'Translates domain names to IP addresses. Directs users to the nearest regional cluster based on geographic location.',
    tradeOffs: [
      'Low TTL allows fast failover but increases lookup load on name servers.',
      'Routing policies: Failover, Geo-proximity, and Latency-based options help scale globally.',
    ]
  },
  cdn: {
    title: 'CDN (Content Delivery Network)',
    category: 'Edge Cache',
    description: 'Caches static assets (images, html, video chunks) at edge servers near users, cutting latency to 5-10ms.',
    tradeOffs: [
      'Edge latency is extremely low, bypassing backend tiers.',
      'Absorbs 85%+ read load, preventing app server thread exhaustion.',
      'Trade-off: Hard cache invalidation and stale cache issues.',
    ]
  },
  loadBalancer: {
    title: 'Load Balancer',
    category: 'Traffic Distributer',
    description: 'Balances requests across a cluster of application servers to prevent single-instance failure.',
    tradeOffs: [
      'Least Connections: Best for database-heavy or slow API endpoints.',
      'IP-Hash (Sticky Sessions): Binds clients to servers, necessary for persistent WebSockets.',
    ]
  },
  appServer: {
    title: 'App Server Cluster',
    category: 'Compute Tier',
    description: 'Hosts application services, runs logic, and coordinates database or queue interactions.',
    tradeOffs: [
      'Scale Horizontally (more replicas) to increase concurrent thread limits.',
      'Processing times must be minimized to avoid thread pool blocking under high QPS.',
    ]
  },
  cache: {
    title: 'Redis Cache',
    category: 'In-Memory Cache',
    description: 'Stores key-value data in RAM for sub-1ms read access, shielding persistent databases.',
    tradeOffs: [
      'Cache-Aside pattern: simple, but suffers from DB query latency on cache misses.',
      'Eviction Policies (LRU, LFU) prevent memory saturation.',
    ]
  },
  sqlDatabase: {
    title: 'SQL Relational DB',
    category: 'Storage Tier',
    description: 'Provides strong ACID transaction guarantees. Crucial for inventory, wallets, and order systems.',
    tradeOffs: [
      'Read Replicas: Scales read operations but introduces replication lag and stale reads.',
      'Indexes: Speeds up reads from O(N) to O(log N) but slows write operations.',
      'Sharding: Horizontally scales write bandwidth across shards but complicates queries.',
    ]
  },
  nosqlDatabase: {
    title: 'NoSQL Database',
    category: 'Storage Tier',
    description: 'Highly scalable key-value or document database, designed for massive write volumes (chat logs, analytics).',
    tradeOffs: [
      'Strong consistency guarantees increase write latency.',
      'Eventual consistency offers maximum availability (CAP Theorem tradeoff).',
    ]
  },
  objectStorage: {
    title: 'Object Storage (S3)',
    category: 'Bulk Storage',
    description: 'Low-cost, highly durable storage for large files, videos, images, and raw documents.',
    tradeOffs: [
      'Stores massive files cheaply and reliably.',
      'Trade-off: High request latency overhead (~50-100ms) compared to databases.',
    ]
  },
  messageQueue: {
    title: 'Message Queue (Kafka)',
    category: 'Async Buffering',
    description: 'Buffers write requests asynchronously to smooth out traffic spikes and prevent database saturation.',
    tradeOffs: [
      'Smooths peak write loads (writes are queued and processed at DB capability).',
      'Decouples microservices, but adds message delivery and ordering complexity.',
    ]
  },
  workerPool: {
    title: 'Background Workers',
    category: 'Compute Tier',
    description: 'Consumes jobs from queues to process heavy, long-running tasks asynchronously (video transcoding, emails).',
    tradeOffs: [
      'Keeps user requests fast by offloading heavy work to background workers.',
      'Scale workers horizontally to match queue consumption requirements.',
    ]
  },
  metricsDashboard: {
    title: 'Metrics Dashboard',
    category: 'Monitoring System',
    description: 'Aggregates real-time system stats (CPU, QPS, latency) for comprehensive visibility.',
    tradeOffs: [
      'Essential for detecting bottlenecks, resource leaks, and critical degradation.',
      'Negligible overhead, acts as a passive statistics collector.',
    ]
  }
};

function getIconForType(type: string) {
  switch (type) {
    case 'client': return Users;
    case 'dns': return Globe;
    case 'cdn': return CloudArrowDown;
    case 'loadBalancer': return Scales;
    case 'appServer': return Desktop;
    case 'cache': return Lightning;
    case 'sqlDatabase': return Database;
    case 'nosqlDatabase': return Stack;
    case 'objectStorage': return HardDrive;
    case 'messageQueue': return Queue;
    case 'workerPool': return Robot;
    case 'metricsDashboard': return ChartLineUp;
    default: return Desktop;
  }
}

// ── Props & Component ────────────────────────────────────────────────────────

interface MetricsPanelProps {
  result: SimulationResult | null;
  challengeTargets?: {
    maxLatencyP99: number;
    maxBudget: number;
    targetQPS: number;
  };
  challengeResult?: { passed: boolean; reasons: string[] };
  selectedNode?: any;
  selectedNodeMetrics?: any;
}

export default function MetricsPanel({
  result,
  challengeTargets,
  challengeResult,
  selectedNode,
  selectedNodeMetrics,
}: MetricsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'system' | 'node'>('system');

  // Auto-toggle tab when user selects/deselects a node
  React.useEffect(() => {
    if (selectedNode) {
      setActiveTab('node');
    } else {
      setActiveTab('system');
    }
  }, [selectedNode]);

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ChartLineUp size={28} weight="duotone" className="text-gray-400" />
        </div>
        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">No Simulation Data</h4>
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-[200px]">
          Click <strong>Run Simulation</strong> to test your architecture under load.
        </p>
      </div>
    );
  }

  const { system, bottlenecks, grade, nodeMetrics } = result;

  // Latency chart data
  const latencyData = [
    { name: 'p50', value: system.p50Latency, fill: '#22c55e' },
    { name: 'p95', value: system.p95Latency, fill: '#f59e0b' },
    { name: 'p99', value: system.p99Latency, fill: system.p99Latency > 200 ? '#ef4444' : '#f59e0b' },
  ];

  // Grade color
  const gradeColor = grade.startsWith('A') ? 'text-emerald-500' : grade.startsWith('B') ? 'text-blue-500' : grade.startsWith('C') ? 'text-amber-500' : 'text-red-500';
  const gradeBg = grade.startsWith('A') ? 'bg-emerald-50 dark:bg-emerald-500/10' : grade.startsWith('B') ? 'bg-blue-50 dark:bg-blue-500/10' : grade.startsWith('C') ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10';

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Pill-shaped Tab Selector */}
      {selectedNode && (
        <div className="mx-3 mt-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center shrink-0">
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${activeTab === 'system' ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            System Metrics
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`flex-1 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${activeTab === 'node' ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Node Details
          </button>
        </div>
      )}

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'system' ? (
          <div className="pb-4">
            {/* Challenge Result Banner */}
            {challengeResult && (
              <div className={`mx-3 mt-3 p-3 rounded-xl border ${challengeResult.passed ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {challengeResult.passed
                    ? <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                    : <XCircle size={18} weight="fill" className="text-red-500" />
                  }
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${challengeResult.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {challengeResult.passed ? 'Challenge Passed!' : 'Not Passing'}
                  </span>
                </div>
                {!challengeResult.passed && challengeResult.reasons.length > 0 && (
                  <ul className="space-y-0.5 mt-1.5">
                    {challengeResult.reasons.map((r, i) => (
                      <li key={i} className="text-[10px] text-red-500 dark:text-red-400 flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Grade Card */}
            <div className="mx-3 mt-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={18} weight="duotone" className="text-amber-500" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Grade</span>
                </div>
                <div className={`${gradeBg} px-3 py-1 rounded-lg`}>
                  <span className={`text-xl font-black ${gradeColor}`}>{grade}</span>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mx-3 mt-3">
              {[
                { icon: Lightning, label: 'Throughput', value: `${formatNum(system.successfulQPS)}`, sub: 'req/s', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { icon: XCircle, label: 'Error Rate', value: `${(system.errorRate * 100).toFixed(1)}%`, sub: `${formatNum(system.failedQPS)} dropped`, color: system.errorRate > 0.05 ? 'text-red-500' : 'text-emerald-500', bg: system.errorRate > 0.05 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10' },
                { icon: CurrencyDollar, label: 'Monthly Cost', value: `$${formatNum(system.totalMonthlyCost)}`, sub: '/month', color: challengeTargets && system.totalMonthlyCost > challengeTargets.maxBudget ? 'text-red-500' : 'text-emerald-500', bg: 'bg-gray-50 dark:bg-gray-800' },
                { icon: ShieldCheck, label: 'Availability', value: `${system.availabilityPercent.toFixed(2)}%`, sub: '', color: system.availabilityPercent > 99 ? 'text-emerald-500' : 'text-amber-500', bg: 'bg-gray-50 dark:bg-gray-800' },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className={`p-3 rounded-xl border border-gray-200 dark:border-gray-700 ${m.bg}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} weight="bold" className={m.color} />
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.label}</span>
                    </div>
                    <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
                    {m.sub && <p className="text-[10px] text-gray-400">{m.sub}</p>}
                  </div>
                );
              })}
            </div>

            {/* Latency Chart */}
            <div className="mx-3 mt-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock size={14} weight="bold" className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Latency Profile (ms)</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={latencyData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}ms`, 'Latency']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {latencyData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottleneck Alerts */}
            {bottlenecks.length > 0 && (
              <div className="mx-3 mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Warning size={14} weight="bold" className="text-amber-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Bottlenecks</span>
                </div>
                {bottlenecks.slice(0, 5).map((nodeId) => {
                  const m = nodeMetrics[nodeId];
                  if (!m) return null;
                  return (
                    <div
                      key={nodeId}
                      className={`px-3 py-2 rounded-lg border text-xs ${
                        m.status === 'critical'
                          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <p className="font-semibold">{m.bottleneck || nodeId}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        {formatNum(m.incomingQPS)} QPS → capacity {formatNum(getCapacityDisplay(m))} • {(m.utilization * 100).toFixed(0)}% utilized
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Node Inspector Tab */
          selectedNode && (() => {
            const guide = CONCEPT_GUIDES[selectedNode.type] || {
              title: selectedNode.data.label || selectedNode.type,
              category: 'Infrastructure Tier',
              description: 'Coordinates traffic or stores states inside the application architecture stack.',
              tradeOffs: [],
            };
            const metrics = selectedNodeMetrics;

            return (
              <div className="p-4 space-y-4">
                {/* Component Identity Card */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                    {React.createElement(getIconForType(selectedNode.type), { size: 20, weight: 'bold', className: 'text-white' })}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{guide.title}</h4>
                    <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{guide.category}</span>
                  </div>
                </div>

                {/* Live Telemetry details */}
                {metrics ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Throughput</span>
                        <span className="text-sm font-black text-slate-850 dark:text-slate-100">{formatNum(metrics.processedQPS)} QPS</span>
                        {metrics.droppedQPS > 0 && (
                          <span className="block text-[9px] font-bold text-red-500 mt-0.5">{formatNum(metrics.droppedQPS)} dropped</span>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Latency Added</span>
                        <span className="text-sm font-black text-slate-850 dark:text-slate-100">+{metrics.latencyAdded}ms</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-400 uppercase tracking-wider">Node Utilization</span>
                        <span className={metrics.status === 'critical' ? 'text-red-500' : metrics.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>
                          {(metrics.utilization * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            metrics.status === 'critical' ? 'bg-red-500' : metrics.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(metrics.utilization * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-white/5 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Run simulation to see real-time node telemetry metrics.
                  </div>
                )}

                {/* Concept Overview Description */}
                <div className="border-t border-slate-150 dark:border-white/5 pt-3">
                  <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Architect Guide</h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {guide.description}
                  </p>
                </div>

                {/* Interview Trade-offs & Tips */}
                {guide.tradeOffs.length > 0 && (
                  <div className="border-t border-slate-150 dark:border-white/5 pt-3">
                    <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Interview Trade-offs & Tips</h5>
                    <div className="space-y-2">
                      {guide.tradeOffs.map((tip, i) => (
                        <div key={i} className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed flex items-start gap-2 bg-indigo-50/20 dark:bg-indigo-950/15 p-3 rounded-2xl border border-indigo-100/30 dark:border-indigo-950/10 font-medium">
                          <span className="text-indigo-500 shrink-0 select-none">💡</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function getCapacityDisplay(m: { incomingQPS: number; utilization: number }): number {
  return m.utilization > 0 ? m.incomingQPS / m.utilization : 0;
}
