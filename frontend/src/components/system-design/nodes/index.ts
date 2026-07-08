export { default as ClientNode } from './ClientNode';
export { default as DNSNode } from './DNSNode';
export { default as CDNNode } from './CDNNode';
export { default as LoadBalancerNode } from './LoadBalancerNode';
export { default as AppServerNode } from './AppServerNode';
export { default as CacheNode } from './CacheNode';
export { default as SQLDatabaseNode } from './SQLDatabaseNode';
export { default as NoSQLDatabaseNode } from './NoSQLDatabaseNode';
export { default as ObjectStorageNode } from './ObjectStorageNode';
export { default as MessageQueueNode } from './MessageQueueNode';
export { default as WorkerPoolNode } from './WorkerPoolNode';
export { default as MetricsDashboardNode } from './MetricsDashboardNode';
export { default as UniversalNode } from './UniversalNode';

import ClientNode from './ClientNode';
import DNSNode from './DNSNode';
import CDNNode from './CDNNode';
import LoadBalancerNode from './LoadBalancerNode';
import AppServerNode from './AppServerNode';
import CacheNode from './CacheNode';
import SQLDatabaseNode from './SQLDatabaseNode';
import NoSQLDatabaseNode from './NoSQLDatabaseNode';
import ObjectStorageNode from './ObjectStorageNode';
import MessageQueueNode from './MessageQueueNode';
import WorkerPoolNode from './WorkerPoolNode';
import MetricsDashboardNode from './MetricsDashboardNode';
import UniversalNode from './UniversalNode';

/**
 * nodeTypes registry for React Flow's <ReactFlow nodeTypes={nodeTypes} />
 * Supports all 53 system design components across 10 architectural categories.
 */
export const systemDesignNodeTypes = {
  // Existing 12 nodes (for exact backward compatibility)
  client: ClientNode,
  dns: DNSNode,
  cdn: CDNNode,
  loadBalancer: LoadBalancerNode,
  appServer: AppServerNode,
  cache: CacheNode,
  sqlDatabase: SQLDatabaseNode,
  nosqlDatabase: NoSQLDatabaseNode,
  objectStorage: ObjectStorageNode,
  messageQueue: MessageQueueNode,
  workerPool: WorkerPoolNode,
  metricsDashboard: MetricsDashboardNode,

  // 41 Expanded & Case-Study System Design Nodes (powered by UniversalNode)
  apiGateway: UniversalNode,
  firewall: UniversalNode,
  reverseProxy: UniversalNode,
  consistentHashRing: UniversalNode,
  serverless: UniversalNode,
  kubernetes: UniversalNode,
  cronJob: UniversalNode,
  websocketServer: UniversalNode,
  serviceMesh: UniversalNode,
  presenceServer: UniversalNode,
  transcodingWorker: UniversalNode,
  syncService: UniversalNode,
  searchCrawler: UniversalNode,
  idGenerator: UniversalNode,
  memcached: UniversalNode,
  cdnEdgeCache: UniversalNode,
  localCache: UniversalNode,
  leaderboardStore: UniversalNode,
  timeSeriesDb: UniversalNode,
  graphDb: UniversalNode,
  vectorDb: UniversalNode,
  searchEngine: UniversalNode,
  dataWarehouse: UniversalNode,
  spatialIndex: UniversalNode,
  ledgerDatabase: UniversalNode,
  eventBus: UniversalNode,
  deadLetterQueue: UniversalNode,
  streamProcessor: UniversalNode,
  pubsub: UniversalNode,
  pushGateway: UniversalNode,
  emailSmsService: UniversalNode,
  llmGateway: UniversalNode,
  modelServing: UniversalNode,
  featureStore: UniversalNode,
  aiAgent: UniversalNode,
  authService: UniversalNode,
  secretManager: UniversalNode,
  rateLimiter: UniversalNode,
  logAggregator: UniversalNode,
  alertManager: UniversalNode,
  vpnGateway: UniversalNode,
  bastionHost: UniversalNode,
  blockStorage: UniversalNode,
  paymentGateway: UniversalNode,
  reconciliationEngine: UniversalNode,
} as const;

export type SystemDesignNodeType = keyof typeof systemDesignNodeTypes;
