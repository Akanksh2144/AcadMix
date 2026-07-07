/**
 * System Design Arena — Type Definitions
 *
 * Shared interfaces for canvas nodes, simulation engine,
 * challenge system, and metrics dashboard.
 */

// ── Protocol types ──────────────────────────────────────────────────────────

export type Protocol = 'http1' | 'http2' | 'http3' | 'websocket' | 'grpc' | 'sse';

export type LBAlgorithm = 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted';

export type CacheEviction = 'lru' | 'lfu' | 'fifo' | 'random';

export type CachePattern = 'cache-aside' | 'read-through' | 'write-through' | 'write-back';

export type ConsistencyLevel = 'strong' | 'eventual' | 'causal';

export type QueueType = 'rabbitmq' | 'kafka' | 'sqs';

export type DNSRouting = 'round-robin' | 'geo' | 'weighted' | 'failover';

// ── Node Data Interfaces ────────────────────────────────────────────────────

export interface BaseNodeData {
  label: string;
  onDataChange?: (id: string, field: string, value: any) => void;
  /** Injected after simulation — per-node metrics */
  metrics?: NodeMetrics;
  [key: string]: unknown;
}

export interface ClientNodeData extends BaseNodeData {
  requestsPerSec: number;
  protocol: Protocol;
}

export interface DNSNodeData extends BaseNodeData {
  ttl: number;           // seconds
  routingPolicy: DNSRouting;
}

export interface CDNNodeData extends BaseNodeData {
  cacheHitRatio: number; // 0-1
  edgeLatency: number;   // ms
}

export interface LoadBalancerNodeData extends BaseNodeData {
  algorithm: LBAlgorithm;
  healthCheckInterval: number; // seconds
}

export interface AppServerNodeData extends BaseNodeData {
  replicas: number;
  maxThreads: number;
  processingTime: number; // ms per request
}

export interface CacheNodeData extends BaseNodeData {
  evictionPolicy: CacheEviction;
  maxSize: number;        // MB
  ttl: number;            // seconds
  pattern: CachePattern;
  hitRatio: number;       // 0-1
}

export interface SQLDatabaseNodeData extends BaseNodeData {
  readReplicas: number;
  replicationLag: number; // ms
  indexed: boolean;
  sharded: boolean;
  shardCount: number;
}

export interface NoSQLDatabaseNodeData extends BaseNodeData {
  consistencyLevel: ConsistencyLevel;
  partitionKey: string;
}

export interface ObjectStorageNodeData extends BaseNodeData {
  latency: number;       // ms
  maxThroughput: number; // MB/s
}

export interface MessageQueueNodeData extends BaseNodeData {
  queueType: QueueType;
  partitions: number;
  consumerGroups: number;
}

export interface WorkerPoolNodeData extends BaseNodeData {
  workers: number;
  taskProcessingTime: number; // ms per task
}

export interface MetricsDashboardNodeData extends BaseNodeData {
  /** Injected after simulation */
  simResult?: SimulationResult;
}

// ── Union of all node data types ────────────────────────────────────────────

export type SystemDesignNodeData =
  | ClientNodeData
  | DNSNodeData
  | CDNNodeData
  | LoadBalancerNodeData
  | AppServerNodeData
  | CacheNodeData
  | SQLDatabaseNodeData
  | NoSQLDatabaseNodeData
  | ObjectStorageNodeData
  | MessageQueueNodeData
  | WorkerPoolNodeData
  | MetricsDashboardNodeData;

// ── Simulation Results ──────────────────────────────────────────────────────

export interface NodeMetrics {
  /** Incoming requests per second */
  incomingQPS: number;
  /** Successfully processed QPS */
  processedQPS: number;
  /** Requests that failed (capacity exceeded) */
  droppedQPS: number;
  /** Latency added by this node (ms) */
  latencyAdded: number;
  /** Total latency from client to this node (ms) */
  cumulativeLatency: number;
  /** 0-1 utilization factor */
  utilization: number;
  /** Monthly cost estimate ($) */
  monthlyCost: number;
  /** Status: healthy, warning, critical */
  status: 'healthy' | 'warning' | 'critical';
  /** Human-readable bottleneck description */
  bottleneck?: string;
}

export interface SimulationResult {
  /** Per-node metrics keyed by node ID */
  nodeMetrics: Record<string, NodeMetrics>;
  /** Overall system metrics */
  system: {
    totalQPS: number;
    successfulQPS: number;
    failedQPS: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    totalMonthlyCost: number;
    errorRate: number;      // 0-1
    availabilityPercent: number;
  };
  /** Ordered list of bottleneck node IDs (worst first) */
  bottlenecks: string[];
  /** Grade: A+ through F */
  grade: string;
}

// ── Challenge System ────────────────────────────────────────────────────────

export interface ChallengeConfig {
  id: string;
  stage: number;
  title: string;
  description: string;
  /** Target QPS the design must handle */
  targetQPS: number;
  /** Maximum acceptable p99 latency (ms) */
  maxLatencyP99: number;
  /** Monthly budget cap ($) */
  maxBudget: number;
  /** Pre-placed nodes for this challenge */
  initialNodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;
  /** Pre-placed edges */
  initialEdges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  /** Progressive hints */
  hints: string[];
  /** Locked until previous challenge is passed */
  locked: boolean;
}

// ── Palette Item ────────────────────────────────────────────────────────────

export interface PaletteItem {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;       // gradient class
  borderColor: string; // border class for node
  defaults: Record<string, any>;
}

export interface PaletteSection {
  title: string;
  items: PaletteItem[];
}
