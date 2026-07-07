/**
 * System Design Arena — Challenge Definitions
 *
 * 7-stage progressive challenges from "1 User" to "1 Billion Users".
 * Each challenge provides initial nodes, target QPS, latency budgets,
 * cost caps, and progressive hints.
 */

import type { ChallengeConfig } from './types';

export const CHALLENGES: ChallengeConfig[] = [
  // ── Stage 0: Free-Build Sandbox ─────────────────────────────────────────
  {
    id: 'sandbox',
    stage: 0,
    title: 'Sandbox Mode',
    description: 'Free-build mode. Design any system architecture without constraints. Experiment freely with all components.',
    targetQPS: 0,
    maxLatencyP99: Infinity,
    maxBudget: Infinity,
    initialNodes: [],
    initialEdges: [],
    hints: [
      'Drag components from the palette on the left.',
      'Connect nodes by dragging from a source handle to a target handle.',
      'Click "Run Simulation" to test your architecture under load.',
    ],
    locked: false,
  },

  // ── Stage 1: Single Server (1 User) ────────────────────────────────────
  {
    id: 'stage-1-single-server',
    stage: 1,
    title: 'The Monolith',
    description: 'A single server hosting both the application and database. Can it handle 100 concurrent users?',
    targetQPS: 100,
    maxLatencyP99: 500,
    maxBudget: 100,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 180 },
        data: { label: 'Users', requestsPerSec: 100, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 350, y: 150 },
        data: { label: 'Web Server', replicas: 1, maxThreads: 200, processingTime: 50 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 650, y: 150 },
        data: { label: 'Database', readReplicas: 0, replicationLag: 0, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'This simple setup works fine at low traffic. Try increasing the client QPS to see when it breaks.',
      'Notice how the server has limited threads — what happens when concurrent requests exceed thread count?',
    ],
    locked: false,
  },

  // ── Stage 2: Separate Tiers (10K Users) ─────────────────────────────────
  {
    id: 'stage-2-separate-tiers',
    stage: 2,
    title: 'Dedicated Database',
    description: 'Traffic has grown to 5,000 QPS. The monolith server is crashing because app logic and database compete for CPU/RAM. Separate them.',
    targetQPS: 5_000,
    maxLatencyP99: 400,
    maxBudget: 300,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 180 },
        data: { label: 'Users', requestsPerSec: 5000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 350, y: 150 },
        data: { label: 'App Server', replicas: 1, maxThreads: 200, processingTime: 50 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
    ],
    hints: [
      'The app server only has 200 threads but needs to handle 5,000 QPS. You need to scale.',
      'Try adding a dedicated SQL Database and connecting the app server to it.',
      'Enable indexing on the database to reduce query latency from O(N) to O(log N).',
      'Consider increasing app server replicas to handle more concurrent connections.',
    ],
    locked: false,
  },

  // ── Stage 3: Load Balancer & Horizontal Scale (100K Users) ──────────────
  {
    id: 'stage-3-load-balancer',
    stage: 3,
    title: 'Horizontal Scaling',
    description: '25,000 QPS is hitting your single app server. It\'s a single point of failure. Scale horizontally with a load balancer.',
    targetQPS: 25_000,
    maxLatencyP99: 300,
    maxBudget: 800,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 200 },
        data: { label: 'Users', requestsPerSec: 25000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 500, y: 200 },
        data: { label: 'App Server', replicas: 1, maxThreads: 200, processingTime: 50 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 800, y: 200 },
        data: { label: 'PostgreSQL', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'A single app server with 200 threads cannot handle 25,000 QPS.',
      'Add a Load Balancer between the client and app server.',
      'Scale the app server to 3+ replicas using the replicas slider.',
      'Round-robin load balancing distributes requests evenly across replicas.',
    ],
    locked: false,
  },

  // ── Stage 4: Caching & CDN (1M Users) ──────────────────────────────────
  {
    id: 'stage-4-caching',
    stage: 4,
    title: 'Cache Everything',
    description: '100,000 QPS with heavy read traffic. Your database is the bottleneck. Add caching and a CDN to absorb repeated requests.',
    targetQPS: 100_000,
    maxLatencyP99: 200,
    maxBudget: 2_000,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 220 },
        data: { label: 'Users', requestsPerSec: 100000, protocol: 'http2' },
      },
      {
        id: 'lb-1',
        type: 'loadBalancer',
        position: { x: 300, y: 200 },
        data: { label: 'Load Balancer', algorithm: 'round-robin', healthCheckInterval: 10 },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 550, y: 200 },
        data: { label: 'App Cluster', replicas: 5, maxThreads: 200, processingTime: 50 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 850, y: 200 },
        data: { label: 'PostgreSQL', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-lb1', source: 'client-1', target: 'lb-1' },
      { id: 'e-lb1-s1', source: 'lb-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'The database can only handle ~10,000 QPS even with indexes. You need a cache.',
      'Add a Redis Cache between the App Server and Database with an 80%+ hit ratio.',
      'Add a CDN at the edge to serve static assets — this offloads ~85% of requests before they even hit your servers.',
      'Cache-aside pattern: app checks cache first, on miss reads DB and writes result to cache.',
    ],
    locked: false,
  },

  // ── Stage 5: Database Scale-Out (100M Users) ───────────────────────────
  {
    id: 'stage-5-read-replicas',
    stage: 5,
    title: 'Database Scale-Out',
    description: '500,000 QPS. Your single database primary is the write bottleneck. Add read replicas and consider message queues for write buffering.',
    targetQPS: 500_000,
    maxLatencyP99: 150,
    maxBudget: 5_000,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 250 },
        data: { label: 'Users', requestsPerSec: 500000, protocol: 'http2' },
      },
      {
        id: 'cdn-1',
        type: 'cdn',
        position: { x: 250, y: 100 },
        data: { label: 'CDN', cacheHitRatio: 0.85, edgeLatency: 10 },
      },
      {
        id: 'lb-1',
        type: 'loadBalancer',
        position: { x: 250, y: 300 },
        data: { label: 'Load Balancer', algorithm: 'least-connections', healthCheckInterval: 10 },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 500, y: 300 },
        data: { label: 'App Cluster', replicas: 10, maxThreads: 200, processingTime: 30 },
      },
      {
        id: 'cache-1',
        type: 'cache',
        position: { x: 750, y: 200 },
        data: { label: 'Redis', evictionPolicy: 'lru', hitRatio: 0.85, pattern: 'cache-aside', maxSize: 512, ttl: 300 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 1000, y: 300 },
        data: { label: 'PostgreSQL Primary', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-cdn', source: 'client-1', target: 'cdn-1' },
      { id: 'e-c1-lb1', source: 'client-1', target: 'lb-1' },
      { id: 'e-lb1-s1', source: 'lb-1', target: 'server-1' },
      { id: 'e-s1-cache', source: 'server-1', target: 'cache-1' },
      { id: 'e-cache-db1', source: 'cache-1', target: 'db-1' },
    ],
    hints: [
      'The primary database is saturated. Add 3+ read replicas to distribute read queries.',
      'Be aware of replication lag — reads from replicas might return stale data.',
      'Consider adding a Message Queue (Kafka) to buffer heavy write operations like activity logs.',
      'A write-back cache can reduce write pressure on the primary database.',
    ],
    locked: false,
  },

  // ── Stage 6: Global Scale (1B Users) ───────────────────────────────────
  {
    id: 'stage-6-billion-users',
    stage: 6,
    title: 'One Billion Users',
    description: '1,000,000 QPS across global regions. Data exceeds 10TB. You need sharding, async processing, and multi-region architecture.',
    targetQPS: 1_000_000,
    maxLatencyP99: 100,
    maxBudget: 10_000,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 300 },
        data: { label: 'Global Users', requestsPerSec: 1000000, protocol: 'http2' },
      },
      {
        id: 'dns-1',
        type: 'dns',
        position: { x: 250, y: 300 },
        data: { label: 'Geo-DNS', ttl: 60, routingPolicy: 'geo' },
      },
    ],
    initialEdges: [
      { id: 'e-c1-dns', source: 'client-1', target: 'dns-1' },
    ],
    hints: [
      'Start with a CDN to absorb static traffic, then route through a Load Balancer.',
      'You need multiple app server clusters with 15+ replicas and optimized processing times.',
      'Add Redis cache with 90%+ hit ratio before the database layer.',
      'Shard the SQL database across 4+ shards with consistent hashing on user_id.',
      'Use Kafka to buffer high-volume writes (activity logs, analytics events) asynchronously.',
      'Add a Worker Pool to process queued tasks without blocking the request path.',
      'Target: p99 < 100ms, error rate < 1%, budget under $10K/month.',
    ],
    locked: false,
  },
];

/**
 * Checks if a simulation result passes a challenge's constraints.
 */
export function checkChallengePassed(
  challenge: ChallengeConfig,
  result: { system: { p99Latency: number; errorRate: number; totalMonthlyCost: number; successfulQPS: number } },
): { passed: boolean; reasons: string[] } {
  if (challenge.id === 'sandbox') return { passed: true, reasons: [] };

  const reasons: string[] = [];

  if (result.system.p99Latency > challenge.maxLatencyP99) {
    reasons.push(`p99 latency ${result.system.p99Latency.toFixed(0)}ms exceeds ${challenge.maxLatencyP99}ms limit`);
  }

  if (result.system.errorRate > 0.05) {
    reasons.push(`Error rate ${(result.system.errorRate * 100).toFixed(1)}% exceeds 5% threshold`);
  }

  if (result.system.totalMonthlyCost > challenge.maxBudget) {
    reasons.push(`Monthly cost $${result.system.totalMonthlyCost.toFixed(0)} exceeds $${challenge.maxBudget} budget`);
  }

  if (result.system.successfulQPS < challenge.targetQPS * 0.95) {
    reasons.push(`Throughput ${result.system.successfulQPS.toFixed(0)} QPS below ${challenge.targetQPS} target`);
  }

  return { passed: reasons.length === 0, reasons };
}
