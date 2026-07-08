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
 * Supports all 131 system design components across all 18 exact architectural categories.
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

  // 119 Expanded & Categorized Nodes (powered by UniversalNode) across 18 exact categories
  singlePageApp: UniversalNode,
  mobileClient: UniversalNode,
  desktopApp: UniversalNode,
  iotDevice: UniversalNode,
  smartTV: UniversalNode,
  serviceWorker: UniversalNode,
  graphqlClient: UniversalNode,
  websocketClient: UniversalNode,
  sseClient: UniversalNode,

  reverseProxy: UniversalNode,
  bastionHost: UniversalNode,
  vpnGateway: UniversalNode,
  natGateway: UniversalNode,
  bareMetal: UniversalNode,

  networkLoadBalancer: UniversalNode,
  apiGateway: UniversalNode,
  firewall: UniversalNode,
  serviceMesh: UniversalNode,
  ingressController: UniversalNode,
  egressProxy: UniversalNode,
  bgpRouter: UniversalNode,
  vpcPeering: UniversalNode,
  dnsResolver: UniversalNode,

  serverless: UniversalNode,
  kubernetes: UniversalNode,
  cronJob: UniversalNode,
  websocketServer: UniversalNode,
  presenceServer: UniversalNode,
  transcodingWorker: UniversalNode,
  syncService: UniversalNode,
  searchCrawler: UniversalNode,
  idGenerator: UniversalNode,
  microservice: UniversalNode,
  grpcService: UniversalNode,

  blockStorage: UniversalNode,
  fileSystem: UniversalNode,
  blobStorage: UniversalNode,
  coldStorage: UniversalNode,
  nvmePool: UniversalNode,

  timeSeriesDb: UniversalNode,
  graphDb: UniversalNode,
  vectorDb: UniversalNode,
  searchEngine: UniversalNode,
  dataWarehouse: UniversalNode,
  spatialIndex: UniversalNode,
  dataLake: UniversalNode,
  olapEngine: UniversalNode,
  etlPipeline: UniversalNode,

  llmGateway: UniversalNode,
  modelServing: UniversalNode,
  featureStore: UniversalNode,
  aiAgent: UniversalNode,
  embeddingEngine: UniversalNode,
  modelRegistry: UniversalNode,
  fineTuningWorker: UniversalNode,

  paymentGateway: UniversalNode,
  ledgerDatabase: UniversalNode,
  reconciliationEngine: UniversalNode,
  fraudDetection: UniversalNode,

  memcached: UniversalNode,
  cdnEdgeCache: UniversalNode,
  localCache: UniversalNode,
  leaderboardStore: UniversalNode,
  bufferCache: UniversalNode,

  eventBus: UniversalNode,
  deadLetterQueue: UniversalNode,
  streamProcessor: UniversalNode,
  pubsub: UniversalNode,
  taskQueue: UniversalNode,
  priorityQueue: UniversalNode,

  authService: UniversalNode,
  secretManager: UniversalNode,
  rateLimiter: UniversalNode,
  certificateAuthority: UniversalNode,
  hsmModule: UniversalNode,
  siemEngine: UniversalNode,
  zeroTrustProxy: UniversalNode,

  serviceRegistry: UniversalNode,
  configServer: UniversalNode,
  featureFlags: UniversalNode,
  portalGateway: UniversalNode,
  tenantRouter: UniversalNode,

  circuitBreaker: UniversalNode,
  chaosMonkey: UniversalNode,
  healthChecker: UniversalNode,
  backupService: UniversalNode,
  failoverController: UniversalNode,
  consistentHashRing: UniversalNode,

  logAggregator: UniversalNode,
  alertManager: UniversalNode,
  distributedTracer: UniversalNode,
  profilerNode: UniversalNode,

  bloomFilter: UniversalNode,
  hyperLogLog: UniversalNode,
  lruCacheNode: UniversalNode,
  merkleTree: UniversalNode,
  skipList: UniversalNode,
  quadTree: UniversalNode,
  consistentHashNode: UniversalNode,

  cqrsRouter: UniversalNode,
  eventSourcing: UniversalNode,
  sagaOrchestrator: UniversalNode,
  sidecarContainer: UniversalNode,
  stranglerFig: UniversalNode,
  shardingRouter: UniversalNode,

  factoryPattern: UniversalNode,
  singletonService: UniversalNode,
  observerBroker: UniversalNode,
  strategyRouter: UniversalNode,
  stateMachine: UniversalNode,
  commandBus: UniversalNode,

  pushGateway: UniversalNode,
  emailSmsService: UniversalNode,
  externalApi: UniversalNode,
  webhookReceiver: UniversalNode,
  mockServer: UniversalNode,
  legacyMainframe: UniversalNode,
  blockchainNode: UniversalNode,
  captchaService: UniversalNode,
} as const;

export type SystemDesignNodeType = keyof typeof systemDesignNodeTypes;
