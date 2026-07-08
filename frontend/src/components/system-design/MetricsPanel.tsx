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
import { NodeConfigurationMenu } from './NodeConfigurationMenu';

// ── Concept Guide Map ───────────────────────────────────────────────────────

export const CONCEPT_GUIDES: Record<string, { title: string; category: string; description: string; tradeOffs: string[] }> = {
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

export function getIconForType(type: string) {
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
}

export default function MetricsPanel({
  result,
  challengeTargets,
  challengeResult,
}: MetricsPanelProps) {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 ">
        <div className="w-16 h-16 rounded-2xl bg-[var(--paper-node)] border border-[var(--ink-border)] flex items-center justify-center mb-4">
          <ChartLineUp size={28} weight="bold" className="text-[var(--ink-light)]" />
        </div>
        <h4 className="text-xl font-bold text-[var(--ink)] mb-1">No Simulation Data</h4>
        <p className="text-lg text-[var(--ink-light)] leading-relaxed max-w-[200px]">
          Click <strong>Run Simulation</strong> to test your architecture under load.
        </p>
      </div>
    );
  }

  const { system, bottlenecks, grade, nodeMetrics } = result;

  // Latency chart data
  const latencyData = [
    { name: 'p50', value: system.p50Latency, fill: 'var(--accent-green)' },
    { name: 'p95', value: system.p95Latency, fill: 'var(--accent-orange)' },
    { name: 'p99', value: system.p99Latency, fill: system.p99Latency > 200 ? 'var(--accent-red)' : 'var(--accent-orange)' },
  ];

  // Grade color
  const gradeColor = grade.startsWith('A') ? 'text-[var(--accent-green)]' : grade.startsWith('B') ? 'text-[var(--accent-blue)]' : grade.startsWith('C') ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-red)]';

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="pb-4">
          {/* Challenge Result Banner */}
          {challengeResult && (
            <div className={`mx-3 mt-3 p-3 rounded-xl border ${challengeResult.passed ? 'bg-[var(--paper-node)] border-[var(--accent-green)] text-[var(--accent-green)]' : 'bg-[var(--paper-node)] border-[var(--accent-red)] text-[var(--accent-red)]'} `}>
              <div className="flex items-center gap-2 mb-1">
                {challengeResult.passed
                  ? <CheckCircle size={20} weight="bold" />
                  : <XCircle size={20} weight="bold" />
                }
                <span className="text-lg font-bold tracking-wider">
                  {challengeResult.passed ? 'Challenge Passed!' : 'Not Passing'}
                </span>
              </div>
              {!challengeResult.passed && challengeResult.reasons.length > 0 && (
                <ul className="space-y-0.5 mt-1.5">
                  {challengeResult.reasons.map((r, i) => (
                    <li key={i} className="text-sm font-bold opacity-90 flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Grade Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-extrabold text-[var(--ink)]">Performance</h4>
              <div className="flex items-center gap-1.5 bg-[var(--paper-node)] px-2 py-1 rounded-lg border border-[var(--ink-border)]">
                <Trophy size={16} weight="bold" className={gradeColor} />
                <span className={`text-lg font-black ${gradeColor}`}>{grade}</span>
              </div>
            </div>
          </div>

          <div className="px-3 space-y-3">
            {/* System KPIs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)]">
                <span className="block text-xs font-bold text-[var(--ink-light)] tracking-wider mb-0.5">Max Throughput</span>
                <span className="text-xl font-bold text-[var(--ink)]">{formatNum(system.successfulQPS)} QPS</span>
              </div>
              <div className="p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)]">
                <span className="block text-xs font-bold text-[var(--ink-light)] tracking-wider mb-0.5">Availability</span>
                <span className={`text-xl font-bold ${system.availabilityPercent < 99 ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'}`}>
                  {system.availabilityPercent.toFixed(2)}%
                </span>
              </div>
              <div className="p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)]">
                <span className="block text-xs font-bold text-[var(--ink-light)] tracking-wider mb-0.5">Global Error Rate</span>
                <span className={`text-xl font-bold ${system.errorRate > 0.05 ? 'text-[var(--accent-red)]' : system.errorRate > 0.01 ? 'text-[var(--accent-orange)]' : 'text-[var(--ink)]'}`}>
                  {(system.errorRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)]">
                <span className="block text-xs font-bold text-[var(--ink-light)] tracking-wider mb-0.5">Peak Saturation</span>
                <span className="text-xl font-bold text-[var(--ink)]">
                  {(Math.max(0, ...Object.values(nodeMetrics).map(m => m.utilization)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="col-span-2 p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)]">
                <span className="block text-xs font-bold text-[var(--ink-light)] tracking-wider mb-0.5">Est. Network</span>
                <span className="text-xl font-bold text-[var(--ink)]">{formatNum(system.successfulQPS * 0.05)} MB/s</span>
              </div>
            </div>

            {/* Overall Latency Profile */}
            <div className="p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={16} weight="bold" className="text-[var(--ink-light)]" />
                <span className="text-sm font-bold text-[var(--ink-light)] tracking-wider">Latency Profile (ms)</span>
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
              <div className="space-y-1.5 ">
                <div className="flex items-center gap-1.5 px-1">
                  <Warning size={16} weight="bold" className="text-[var(--accent-orange)]" />
                  <span className="text-sm font-bold text-[var(--ink-light)] tracking-wider">Bottlenecks</span>
                </div>
                {bottlenecks.slice(0, 5).map((nodeId) => {
                  const m = nodeMetrics[nodeId];
                  if (!m) return null;
                  return (
                    <div
                      key={nodeId}
                      className={`px-3 py-2 rounded-xl border text-sm ${
                        m.status === 'critical'
                          ? 'bg-[var(--paper-node)] border-[var(--accent-red)] text-[var(--accent-red)]'
                          : 'bg-[var(--paper-node)] border-[var(--accent-orange)] text-[var(--accent-orange)]'
                      }`}
                    >
                      <p className="font-bold">{m.bottleneck || nodeId}</p>
                      <p className="text-sm opacity-70 mt-0.5">
                        {formatNum(m.incomingQPS)} QPS → capacity {formatNum(getCapacityDisplay(m))} • {(m.utilization * 100).toFixed(0)}% utilized
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function getCapacityDisplay(m: { incomingQPS: number; utilization: number }): number {
  return m.utilization > 0 ? m.incomingQPS / m.utilization : 0;
}
