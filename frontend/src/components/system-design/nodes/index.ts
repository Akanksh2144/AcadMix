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

/**
 * nodeTypes registry for React Flow's <ReactFlow nodeTypes={nodeTypes} />
 */
export const systemDesignNodeTypes = {
  client: ClientNode,
  dns: DNSNode,
  cdn: CDNNode,
  loadBalancer: LoadBalancerNode,
  appServer: AppServerNode,
  cache: CacheNode,
  sqlDatabase: SQLDatabaseNode,
  noSqlDatabase: NoSQLDatabaseNode,
  objectStorage: ObjectStorageNode,
  messageQueue: MessageQueueNode,
  workerPool: WorkerPoolNode,
  metricsDashboard: MetricsDashboardNode,
} as const;

export type SystemDesignNodeType = keyof typeof systemDesignNodeTypes;
