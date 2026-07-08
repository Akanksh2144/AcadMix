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
  // 119 Expanded & Categorized Components across 18 categories
  singlePageApp: 0,
  mobileClient: 0,
  desktopApp: 0,
  iotDevice: 0,
  smartTV: 0,
  serviceWorker: 0,
  graphqlClient: 0,
  websocketClient: 0,
  sseClient: 0,
  reverseProxy: 25,
  bastionHost: 20,
  vpnGateway: 40,
  natGateway: 30,
  bareMetal: 450,
  networkLoadBalancer: 45,
  apiGateway: 45,
  firewall: 60,
  serviceMesh: 90,
  ingressController: 35,
  egressProxy: 25,
  bgpRouter: 100,
  vpcPeering: 15,
  dnsResolver: 10,
  serverless: 35,
  kubernetes: 250,
  cronJob: 15,
  websocketServer: 70,
  presenceServer: 40,
  transcodingWorker: 150,
  syncService: 60,
  searchCrawler: 80,
  idGenerator: 25,
  microservice: 65,
  grpcService: 50,
  blockStorage: 45,
  fileSystem: 80,
  blobStorage: 30,
  coldStorage: 5,
  nvmePool: 120,
  timeSeriesDb: 110,
  graphDb: 140,
  vectorDb: 150,
  searchEngine: 130,
  dataWarehouse: 300,
  spatialIndex: 90,
  dataLake: 180,
  olapEngine: 220,
  etlPipeline: 70,
  llmGateway: 200,
  modelServing: 400,
  featureStore: 110,
  aiAgent: 80,
  embeddingEngine: 130,
  modelRegistry: 30,
  fineTuningWorker: 500,
  paymentGateway: 50,
  ledgerDatabase: 150,
  reconciliationEngine: 45,
  fraudDetection: 120,
  memcached: 50,
  cdnEdgeCache: 40,
  localCache: 0,
  leaderboardStore: 70,
  bufferCache: 35,
  eventBus: 35,
  deadLetterQueue: 10,
  streamProcessor: 120,
  pubsub: 30,
  taskQueue: 40,
  priorityQueue: 45,
  authService: 50,
  secretManager: 30,
  rateLimiter: 20,
  certificateAuthority: 25,
  hsmModule: 180,
  siemEngine: 160,
  zeroTrustProxy: 55,
  serviceRegistry: 35,
  configServer: 25,
  featureFlags: 40,
  portalGateway: 60,
  tenantRouter: 30,
  circuitBreaker: 15,
  chaosMonkey: 20,
  healthChecker: 10,
  backupService: 40,
  failoverController: 35,
  consistentHashRing: 20,
  logAggregator: 100,
  alertManager: 25,
  distributedTracer: 80,
  profilerNode: 50,
  bloomFilter: 5,
  hyperLogLog: 5,
  lruCacheNode: 5,
  merkleTree: 10,
  skipList: 10,
  quadTree: 15,
  consistentHashNode: 10,
  cqrsRouter: 30,
  eventSourcing: 60,
  sagaOrchestrator: 70,
  sidecarContainer: 15,
  stranglerFig: 40,
  shardingRouter: 35,
  factoryPattern: 5,
  singletonService: 5,
  observerBroker: 10,
  strategyRouter: 10,
  stateMachine: 25,
  commandBus: 20,
  pushGateway: 40,
  emailSmsService: 30,
  externalApi: 15,
  webhookReceiver: 25,
  mockServer: 10,
  legacyMainframe: 600,
  blockchainNode: 350,
  captchaService: 20,
};

// ── Capacity Limits ─────────────────────────────────────────────────────────

function getRawNodeCapacity(type: string, data: Record<string, any>): number {
  if (data.throughput !== undefined && typeof data.throughput === 'number' && data.throughput > 0) {
    return data.throughput;
  }
  if (data.capacity !== undefined && typeof data.capacity === 'number' && data.capacity > 0) {
    return data.capacity;
  }
  switch (type) {
    case 'client':
      return Infinity;
    case 'dns':
      return 1_000_000;
    case 'cdn':
      return 500_000;
    case 'loadBalancer':
    case 'networkLoadBalancer':
    case 'apiGateway':
    case 'firewall':
    case 'reverseProxy':
    case 'rateLimiter':
    case 'consistentHashRing':
    case 'presenceServer':
    case 'ingressController':
    case 'egressProxy':
    case 'bgpRouter':
    case 'vpcPeering':
    case 'dnsResolver':
    case 'tenantRouter':
    case 'circuitBreaker':
    case 'shardingRouter':
    case 'cqrsRouter':
    case 'stranglerFig':
      return 300_000;
    case 'idGenerator':
    case 'bloomFilter':
    case 'hyperLogLog':
    case 'lruCacheNode':
    case 'merkleTree':
    case 'skipList':
    case 'quadTree':
    case 'consistentHashNode':
      return 1_000_000;
    case 'appServer':
    case 'microservice':
    case 'grpcService': {
      const replicas = data.replicas ?? 2;
      const maxThreads = data.maxThreads ?? 250;
      return replicas * maxThreads;
    }
    case 'kubernetes': {
      const pods = data.pods ?? 8;
      return pods * 300;
    }
    case 'bareMetal':
      return 50_000;
    case 'serverless':
    case 'syncService':
    case 'emailSmsService':
    case 'webhookReceiver':
      return 80_000;
    case 'cache':
    case 'memcached':
    case 'cdnEdgeCache':
    case 'localCache':
    case 'leaderboardStore':
    case 'bufferCache':
      return 500_000;
    case 'sqlDatabase':
    case 'olapEngine': {
      const baseCapacity = data.indexed ? 15_000 : 3_000;
      const readReplicas = data.readReplicas ?? 0;
      return baseCapacity * (1 + readReplicas);
    }
    case 'nosqlDatabase':
    case 'timeSeriesDb':
    case 'graphDb':
      return 60_000;
    case 'vectorDb':
    case 'searchEngine':
    case 'spatialIndex':
    case 'searchCrawler':
      return 30_000;
    case 'dataWarehouse':
    case 'ledgerDatabase':
    case 'reconciliationEngine':
    case 'dataLake':
      return 15_000;
    case 'objectStorage':
    case 'blockStorage':
    case 'fileSystem':
    case 'blobStorage':
    case 'coldStorage':
    case 'nvmePool':
    case 'eventSourcing':
      return 25_000;
    case 'messageQueue':
    case 'eventBus':
    case 'pubsub':
    case 'streamProcessor':
    case 'pushGateway':
    case 'taskQueue':
    case 'priorityQueue': {
      const partitions = data.partitions ?? 8;
      return partitions * 12_000;
    }
    case 'deadLetterQueue':
      return 80_000;
    case 'workerPool':
    case 'cronJob':
    case 'transcodingWorker':
    case 'sagaOrchestrator': {
      const workers = data.workers ?? 6;
      const taskTime = data.taskProcessingTime ?? 180;
      return workers * (1000 / taskTime);
    }
    case 'websocketServer':
      return 150_000;
    case 'serviceMesh':
    case 'vpnGateway':
    case 'bastionHost':
    case 'natGateway':
    case 'zeroTrustProxy':
      return 200_000;
    case 'llmGateway':
      return data.tps ?? 60;
    case 'modelServing':
    case 'fineTuningWorker':
      return (data.gpus ?? 8) * 60;
    case 'embeddingEngine':
      return 500;
    case 'featureStore':
    case 'authService':
    case 'secretManager':
    case 'certificateAuthority':
    case 'serviceRegistry':
    case 'configServer':
    case 'featureFlags':
      return 75_000;
    case 'paymentGateway':
    case 'fraudDetection':
      return 30_000;
    case 'aiAgent':
      return 150;
    case 'logAggregator':
    case 'alertManager':
    case 'distributedTracer':
    case 'siemEngine':
      return 120_000;
    case 'legacyMainframe':
      return 50;
    case 'blockchainNode':
      return 100;
    case 'metricsDashboard':
      return Infinity;
    default:
      return 10_000;
  }
}

function getNodeCapacity(type: string, data: Record<string, any>): number {
  let base = getRawNodeCapacity(type, data);
  if (base === Infinity) return base;
  if (typeof data.chaosCapacityMultiplier === 'number' && data.chaosCapacityMultiplier > 0) {
    base = Math.max(1, Math.round(base * data.chaosCapacityMultiplier));
  } else if (typeof data.capacityMultiplier === 'number' && data.capacityMultiplier > 0) {
    base = Math.max(1, Math.round(base * data.capacityMultiplier));
  }
  return base;
}

// ── Latency Calculation ─────────────────────────────────────────────────────

function getNodeLatency(type: string, data: Record<string, any>): number {
  if (data.latency !== undefined && typeof data.latency === 'number' && data.latency >= 0) {
    return data.latency;
  }
  if (data.customLatency !== undefined && typeof data.customLatency === 'number' && data.customLatency >= 0) {
    return data.customLatency;
  }
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
    case 'networkLoadBalancer':
    case 'apiGateway':
    case 'firewall':
    case 'reverseProxy':
    case 'rateLimiter':
    case 'serviceMesh':
    case 'leaderboardStore':
    case 'bufferCache':
    case 'circuitBreaker':
    case 'shardingRouter':
    case 'cqrsRouter':
    case 'stranglerFig':
      return 2;
    case 'consistentHashRing':
    case 'idGenerator':
    case 'bloomFilter':
    case 'hyperLogLog':
    case 'lruCacheNode':
    case 'merkleTree':
    case 'skipList':
    case 'quadTree':
    case 'consistentHashNode':
      return 1;
    case 'appServer':
    case 'microservice':
    case 'grpcService':
    case 'websocketServer':
      return data.processingTime ?? 40;
    case 'bareMetal':
      return 15;
    case 'serverless':
      return data.coldStartMs ? 45 : 15;
    case 'kubernetes':
    case 'syncService':
      return 20;
    case 'cache':
    case 'memcached':
    case 'localCache': {
      const hitRatio = data.hitRatio ?? 0.82;
      return 1 * hitRatio;
    }
    case 'sqlDatabase':
    case 'olapEngine': {
      const indexed = data.indexed ?? true;
      const baseLatency = indexed ? 4 : 45;
      const readReplicas = data.readReplicas ?? 0;
      return baseLatency + (readReplicas > 0 ? 5 : 0);
    }
    case 'nosqlDatabase':
    case 'timeSeriesDb':
    case 'spatialIndex': {
      const consistency = data.consistencyLevel ?? 'eventual';
      return consistency === 'strong' ? 14 : consistency === 'causal' ? 7 : 3;
    }
    case 'graphDb':
    case 'vectorDb':
    case 'searchEngine':
    case 'ledgerDatabase':
    case 'dataLake':
      return data.latency ?? 14;
    case 'dataWarehouse':
    case 'reconciliationEngine':
      return 140;
    case 'objectStorage':
    case 'blockStorage':
    case 'fileSystem':
    case 'blobStorage':
    case 'nvmePool':
      return data.latency ?? 25;
    case 'coldStorage':
      return 5000;
    case 'messageQueue':
    case 'eventBus':
    case 'pubsub':
    case 'deadLetterQueue':
    case 'pushGateway':
    case 'taskQueue':
    case 'priorityQueue':
      return 4;
    case 'streamProcessor':
    case 'emailSmsService':
    case 'webhookReceiver':
      return 20;
    case 'workerPool':
    case 'cronJob':
    case 'transcodingWorker':
    case 'sagaOrchestrator':
      return data.taskProcessingTime ?? 180;
    case 'llmGateway':
      return data.latency ?? 420;
    case 'modelServing':
    case 'fineTuningWorker':
      return data.latency ?? 95;
    case 'embeddingEngine':
      return 35;
    case 'featureStore':
    case 'authService':
    case 'secretManager':
    case 'presenceServer':
    case 'serviceRegistry':
    case 'configServer':
    case 'featureFlags':
      return 8;
    case 'paymentGateway':
    case 'fraudDetection':
      return 80;
    case 'aiAgent':
      return 500;
    case 'logAggregator':
    case 'alertManager':
    case 'distributedTracer':
    case 'siemEngine':
      return 4;
    case 'vpnGateway':
    case 'bastionHost':
    case 'natGateway':
    case 'zeroTrustProxy':
      return 2;
    case 'searchCrawler':
      return 80;
    case 'legacyMainframe':
      return 800;
    case 'blockchainNode':
      return 1200;
    case 'metricsDashboard':
      return 0;
    default:
      return 10;
  }
}

// ── Monthly Cost Calculation ────────────────────────────────────────────────

function getNodeCost(type: string, data: Record<string, any>): number {
  if (data.cost !== undefined && typeof data.cost === 'number' && data.cost >= 0) {
    return data.cost;
  }
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
      'deadLetterQueue', 'pubsub', 'logAggregator', 'alertManager', 'blockStorage',
      'spatialIndex', 'ledgerDatabase', 'leaderboardStore', 'pushGateway', 'emailSmsService',
      'reconciliationEngine', 'paymentGateway', 'fileSystem', 'blobStorage', 'coldStorage',
      'dataLake', 'olapEngine', 'modelRegistry', 'siemEngine', 'distributedTracer',
      'profilerNode', 'eventSourcing', 'externalApi', 'mockServer', 'legacyMainframe',
      'blockchainNode', 'singlePageApp', 'mobileClient', 'desktopApp', 'iotDevice', 'smartTV'
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

    if (processedQPS > 0) {
      const customErrorPercent = typeof data.errors === 'number' ? data.errors : (typeof data.errorRate === 'number' ? data.errorRate : 0);
      if (customErrorPercent > 0) {
        const errorDrops = processedQPS * (customErrorPercent / 100);
        processedQPS = Math.max(0, processedQPS - errorDrops);
        droppedQPS += errorDrops;
      }
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
