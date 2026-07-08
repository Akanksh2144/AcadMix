/**
 * System Design Arena — Simulation Engine
 *
 * Topologically sorts a React Flow graph of system components,
 * then propagates simulated request traffic through the pipeline.
 * Calculates per-node latency, throughput, utilization, and cost.
 */

import type { NodeMetrics, SimulationResult } from './types';

// ── Cost Table ($/month per unit) ───────────────────────────────────────────

const COST_TABLE: Record<string, number> = {
  client: 0,
  dns: 5,
  cdn: 50,
  loadBalancer: 30,
  appServer: 80,    // per replica
  cache: 60,
  sqlDatabase: 120, // per instance (primary + replicas)
  nosqlDatabase: 100,
  objectStorage: 20,
  messageQueue: 40,
  workerPool: 60,   // per worker
  metricsDashboard: 0,
  // 28 New Expanded Components
  apiGateway: 45,
  firewall: 60,
  reverseProxy: 25,
  serverless: 35,
  kubernetes: 250,
  cronJob: 15,
  websocketServer: 70,
  serviceMesh: 90,
  memcached: 50,
  cdnEdgeCache: 40,
  localCache: 0,
  timeSeriesDb: 110,
  graphDb: 140,
  vectorDb: 150,
  searchEngine: 130,
  dataWarehouse: 300,
  eventBus: 35,
  deadLetterQueue: 10,
  streamProcessor: 120,
  pubsub: 30,
  llmGateway: 200,
  modelServing: 400,
  featureStore: 110,
  aiAgent: 80,
  authService: 50,
  secretManager: 30,
  rateLimiter: 20,
  logAggregator: 100,
  alertManager: 25,
  vpnGateway: 40,
  bastionHost: 20,
  blockStorage: 45,
};

// ── Capacity Limits ─────────────────────────────────────────────────────────

function getNodeCapacity(type: string, data: Record<string, any>): number {
  switch (type) {
    case 'client':
      return Infinity;
    case 'dns':
      return 1_000_000;
    case 'cdn':
      return 500_000;
    case 'loadBalancer':
    case 'apiGateway':
    case 'firewall':
    case 'reverseProxy':
    case 'rateLimiter':
      return 200_000;
    case 'appServer': {
      const replicas = data.replicas ?? 1;
      const maxThreads = data.maxThreads ?? 200;
      return replicas * maxThreads;
    }
    case 'kubernetes': {
      const pods = data.pods ?? 6;
      return pods * 250;
    }
    case 'serverless':
      return 50_000;
    case 'cache':
    case 'memcached':
    case 'cdnEdgeCache':
    case 'localCache':
      return 300_000;
    case 'sqlDatabase': {
      const baseCapacity = data.indexed ? 10_000 : 2_000;
      const readReplicas = data.readReplicas ?? 0;
      const shardCount = data.sharded ? (data.shardCount ?? 1) : 1;
      return baseCapacity * (1 + readReplicas) * shardCount;
    }
    case 'nosqlDatabase':
    case 'timeSeriesDb':
    case 'graphDb':
      return 50_000;
    case 'vectorDb':
    case 'searchEngine':
      return 25_000;
    case 'dataWarehouse':
      return 5_000;
    case 'objectStorage':
    case 'blockStorage':
      return 15_000;
    case 'messageQueue':
    case 'eventBus':
    case 'pubsub':
    case 'streamProcessor': {
      const partitions = data.partitions ?? 4;
      return partitions * 10_000;
    }
    case 'deadLetterQueue':
      return 50_000;
    case 'workerPool':
    case 'cronJob': {
      const workers = data.workers ?? 4;
      const taskTime = data.taskProcessingTime ?? 200;
      return workers * (1000 / taskTime);
    }
    case 'websocketServer':
      return 100_000;
    case 'serviceMesh':
    case 'vpnGateway':
    case 'bastionHost':
      return 150_000;
    case 'llmGateway':
      return data.tps ?? 50;
    case 'modelServing':
      return (data.gpus ?? 4) * 50;
    case 'featureStore':
    case 'authService':
    case 'secretManager':
      return 50_000;
    case 'aiAgent':
      return 100;
    case 'logAggregator':
    case 'alertManager':
      return 100_000;
    case 'metricsDashboard':
      return Infinity;
    default:
      return 10_000;
  }
}

// ── Latency Calculation ─────────────────────────────────────────────────────

function getNodeLatency(type: string, data: Record<string, any>): number {
  switch (type) {
    case 'client':
      return 0;
    case 'dns': {
      const ttl = data.ttl ?? 300;
      return ttl > 60 ? 2 : 10;
    }
    case 'cdn':
    case 'cdnEdgeCache': {
      const hitRatio = data.cacheHitRatio ?? data.hitRatio ?? 0.85;
      const edgeLat = data.edgeLatency ?? 10;
      return edgeLat * hitRatio;
    }
    case 'loadBalancer':
    case 'apiGateway':
    case 'firewall':
    case 'reverseProxy':
    case 'rateLimiter':
    case 'serviceMesh':
      return 2;
    case 'appServer':
    case 'websocketServer':
      return data.processingTime ?? 50;
    case 'serverless':
      return data.coldStartMs ? 45 : 15;
    case 'kubernetes':
      return 20;
    case 'cache':
    case 'memcached':
    case 'localCache': {
      const hitRatio = data.hitRatio ?? 0.8;
      return 1 * hitRatio;
    }
    case 'sqlDatabase': {
      const indexed = data.indexed ?? true;
      const replicationLag = data.replicationLag ?? 50;
      const baseLatency = indexed ? 5 : 50;
      const readReplicas = data.readReplicas ?? 0;
      return baseLatency + (readReplicas > 0 ? replicationLag * 0.1 : 0);
    }
    case 'nosqlDatabase':
    case 'timeSeriesDb': {
      const consistency = data.consistencyLevel ?? 'eventual';
      return consistency === 'strong' ? 15 : consistency === 'causal' ? 8 : 3;
    }
    case 'graphDb':
    case 'vectorDb':
    case 'searchEngine':
      return data.latency ?? 15;
    case 'dataWarehouse':
      return 150;
    case 'objectStorage':
    case 'blockStorage':
      return data.latency ?? 30;
    case 'messageQueue':
    case 'eventBus':
    case 'pubsub':
    case 'deadLetterQueue':
      return 5;
    case 'streamProcessor':
      return 25;
    case 'workerPool':
    case 'cronJob':
      return data.taskProcessingTime ?? 200;
    case 'llmGateway':
      return data.latency ?? 450;
    case 'modelServing':
      return data.latency ?? 120;
    case 'featureStore':
    case 'authService':
    case 'secretManager':
      return 10;
    case 'aiAgent':
      return 600;
    case 'logAggregator':
    case 'alertManager':
      return 5;
    case 'vpnGateway':
    case 'bastionHost':
      return 3;
    case 'metricsDashboard':
      return 0;
    default:
      return 10;
  }
}

// ── Monthly Cost Calculation ────────────────────────────────────────────────

function getNodeCost(type: string, data: Record<string, any>): number {
  const base = COST_TABLE[type] ?? 0;
  switch (type) {
    case 'appServer':
      return base * (data.replicas ?? 1);
    case 'kubernetes':
      return base + (data.pods ?? 6) * 20;
    case 'sqlDatabase': {
      const replicas = data.readReplicas ?? 0;
      const shards = data.sharded ? (data.shardCount ?? 1) : 1;
      return base * (1 + replicas) * shards;
    }
    case 'workerPool':
    case 'cronJob':
      return base * (data.workers ?? 4);
    case 'cache':
    case 'memcached':
      return base * Math.ceil((data.maxSize ?? 256) / 256);
    case 'messageQueue':
    case 'eventBus':
    case 'pubsub':
      return base * (data.partitions ?? 4);
    case 'modelServing':
      return base * (data.gpus ?? 4);
    default:
      return base;
  }
}

// ── QPS Split Logic ─────────────────────────────────────────────────────────

/**
 * Determines how a node splits/modifies QPS to downstream nodes.
 * Some nodes absorb QPS (like caches with hit ratios), others pass through.
 */
function getEffectiveOutgoingQPS(
  type: string,
  data: Record<string, any>,
  incomingQPS: number,
): number {
  switch (type) {
    case 'cdn':
    case 'cdnEdgeCache': {
      const hitRatio = data.cacheHitRatio ?? data.hitRatio ?? 0.85;
      return incomingQPS * (1 - hitRatio);
    }
    case 'cache':
    case 'memcached':
    case 'localCache': {
      const hitRatio = data.hitRatio ?? 0.8;
      return incomingQPS * (1 - hitRatio);
    }
    case 'messageQueue':
    case 'eventBus':
    case 'pubsub':
      return incomingQPS;
    default:
      return incomingQPS;
  }
}

// ── Graph Types ─────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

// ── Main Simulation ─────────────────────────────────────────────────────────

export function runSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
): SimulationResult {
  // Build adjacency maps
  const outbound: Record<string, string[]> = {};
  const inbound: Record<string, string[]> = {};
  for (const n of nodes) {
    outbound[n.id] = [];
    inbound[n.id] = [];
  }
  for (const e of edges) {
    outbound[e.source]?.push(e.target);
    inbound[e.target]?.push(e.source);
  }

  // ── Topological sort (Kahn's algorithm) ─────────────────────────────────
  const indegree: Record<string, number> = {};
  for (const n of nodes) indegree[n.id] = 0;
  for (const e of edges) indegree[e.target] = (indegree[e.target] || 0) + 1;

  const queue: string[] = [];
  for (const n of nodes) {
    if (indegree[n.id] === 0) queue.push(n.id);
  }

  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const targetId of (outbound[id] || [])) {
      indegree[targetId]--;
      if (indegree[targetId] === 0) queue.push(targetId);
    }
  }

  // ── Evaluate each node in topological order ─────────────────────────────
  const nodeMap: Record<string, GraphNode> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const metrics: Record<string, NodeMetrics> = {};
  const latencies: number[] = []; // collect all path latencies for percentile calc

  for (const id of order) {
    const node = nodeMap[id];
    if (!node) continue;

    const type = node.type || 'unknown';
    const data = node.data || {};

    // Aggregate incoming QPS from parent nodes
    const parentIds = inbound[id] || [];
    let incomingQPS = 0;
    let cumulativeLatency = 0;

    if (parentIds.length === 0) {
      // Source node (e.g., Client)
      incomingQPS = data.requestsPerSec ?? 0;
      cumulativeLatency = 0;
    } else {
      for (const pid of parentIds) {
        const parentMetrics = metrics[pid];
        if (parentMetrics) {
          const parentNode = nodeMap[pid];
          const parentType = parentNode?.type || 'unknown';
          const parentData = parentNode?.data || {};
          const parentOutgoing = getEffectiveOutgoingQPS(
            parentType,
            parentData,
            parentMetrics.processedQPS,
          );
          // Split outgoing QPS evenly among downstream targets
          const parentDownstream = outbound[pid] || [];
          const splitFactor = parentDownstream.length || 1;
          incomingQPS += parentOutgoing / splitFactor;
          cumulativeLatency = Math.max(cumulativeLatency, parentMetrics.cumulativeLatency);
        }
      }
    }

    // Calculate this node's metrics
    const capacity = getNodeCapacity(type, data);
    const latencyAdded = getNodeLatency(type, data);
    
    // If the node has NO outbound connections, and it is NOT a valid sink, all incoming traffic is dropped
    const isSink = [
      'sqlDatabase', 'nosqlDatabase', 'objectStorage', 'metricsDashboard', 'appServer',
      'timeSeriesDb', 'graphDb', 'vectorDb', 'searchEngine', 'dataWarehouse',
      'deadLetterQueue', 'pubsub', 'logAggregator', 'alertManager', 'blockStorage'
    ].includes(type);
    const hasOutbound = (outbound[id] || []).length > 0;
    
    let processedQPS = 0;
    let droppedQPS = 0;
    
    if (!hasOutbound && !isSink) {
      processedQPS = 0;
      droppedQPS = incomingQPS;
    } else {
      processedQPS = Math.min(incomingQPS, capacity);
      droppedQPS = Math.max(0, incomingQPS - capacity);
    }

    const utilization = capacity > 0 && capacity !== Infinity
      ? Math.min(incomingQPS / capacity, 1)
      : 0;
    const nodeCumulativeLatency = cumulativeLatency + latencyAdded;
    const monthlyCost = getNodeCost(type, data);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let bottleneck: string | undefined;

    if (utilization > 0.95) {
      status = 'critical';
      bottleneck = `${data.label || type} at ${(utilization * 100).toFixed(0)}% capacity — will drop requests`;
    } else if (utilization > 0.75) {
      status = 'warning';
      bottleneck = `${data.label || type} at ${(utilization * 100).toFixed(0)}% capacity — approaching limit`;
    }

    metrics[id] = {
      incomingQPS,
      processedQPS,
      droppedQPS,
      latencyAdded,
      cumulativeLatency: nodeCumulativeLatency,
      utilization,
      monthlyCost,
      status,
      bottleneck,
    };

    // If this is a terminal node (no outbound or is a visualizer), record latency
    const isTerminal = (outbound[id] || []).length === 0 || type === 'metricsDashboard';
    if (isTerminal && incomingQPS > 0) {
      latencies.push(nodeCumulativeLatency);
    }
  }

  // ── Compute system-level metrics ────────────────────────────────────────

  // Find all client nodes' total QPS
  let totalQPS = 0;
  let totalFailed = 0;
  let totalCost = 0;

  for (const id of order) {
    const node = nodeMap[id];
    if (!node) continue;
    if (node.type === 'client') {
      totalQPS += node.data.requestsPerSec ?? 0;
    }
    totalFailed += metrics[id]?.droppedQPS ?? 0;
    totalCost += metrics[id]?.monthlyCost ?? 0;
  }

  const successfulQPS = Math.max(0, totalQPS - totalFailed);
  const errorRate = totalQPS > 0 ? totalFailed / totalQPS : 0;

  // Latency percentiles
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p = (pct: number) => {
    if (sortedLatencies.length === 0) return 0;
    const baseVal = sortedLatencies[sortedLatencies.length - 1];
    if (pct === 50) return Math.ceil(baseVal * 0.95);
    if (pct === 95) return Math.ceil(baseVal * 1.12 + 2);
    if (pct === 99) return Math.ceil(baseVal * 1.35 + 8);

    const idx = Math.min(
      Math.ceil(pct / 100 * sortedLatencies.length) - 1,
      sortedLatencies.length - 1,
    );
    return sortedLatencies[Math.max(0, idx)];
  };

  // Bottleneck ranking
  const bottleneckNodeIds = Object.entries(metrics)
    .filter(([, m]) => m.status === 'critical' || m.status === 'warning')
    .sort(([, a], [, b]) => b.utilization - a.utilization)
    .map(([id]) => id);

  // Grade calculation
  const grade = calculateGrade(errorRate, p(99), totalCost, bottleneckNodeIds.length);

  return {
    nodeMetrics: metrics,
    system: {
      totalQPS,
      successfulQPS,
      failedQPS: totalFailed,
      p50Latency: p(50),
      p95Latency: p(95),
      p99Latency: p(99),
      totalMonthlyCost: totalCost,
      errorRate,
      availabilityPercent: (1 - errorRate) * 100,
    },
    bottlenecks: bottleneckNodeIds,
    grade,
  };
}

// ── Grading ─────────────────────────────────────────────────────────────────

function calculateGrade(
  errorRate: number,
  p99: number,
  cost: number,
  bottleneckCount: number,
): string {
  let score = 100;

  // Error rate penalties
  if (errorRate > 0.5) score -= 50;
  else if (errorRate > 0.2) score -= 30;
  else if (errorRate > 0.05) score -= 15;
  else if (errorRate > 0.01) score -= 5;

  // Latency penalties
  if (p99 > 1000) score -= 30;
  else if (p99 > 500) score -= 20;
  else if (p99 > 200) score -= 10;
  else if (p99 > 100) score -= 5;

  // Bottleneck penalties
  score -= bottleneckCount * 10;

  // Cost efficiency penalties (penalize excessive expenditure)
  if (cost > 8000) score -= 40;
  else if (cost > 4000) score -= 25;
  else if (cost > 1500) score -= 15;
  else if (cost > 600) score -= 8;
  else if (cost > 300) score -= 3;

  score = Math.max(0, Math.min(100, score));

  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
