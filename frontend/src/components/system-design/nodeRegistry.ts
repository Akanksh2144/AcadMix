/**
 * System Design Arena — Comprehensive Component Registry
 *
 * Centralized registry of 53 system design components across 10 architectural categories,
 * directly referencing all standard components from Alex Xu (Vol 1 & Vol 2), ByteByteGo, and Paperdraw diagrams.
 */

import {
  Users, Globe, CloudArrowDown, Scales, Desktop, Lightning,
  Database, Stack, HardDrive, Queue, Robot, ChartLineUp,
  PlugsConnected, ShieldCheck, ArrowsSplit, Cloud, Hexagon,
  Clock, Broadcast, ShareNetwork, Cpu, ChartBar, Compass,
  MagnifyingGlass, Buildings, FlowArrow, Skull, Waves,
  Megaphone, Brain, Table, Key, Vault, Gauge,
  TerminalWindow, Siren, ShieldPlus, DesktopTower,
  type Icon
} from '@phosphor-icons/react';

export interface ComponentMetadata {
  type: string;
  label: string;
  category: string;
  icon: Icon;
  color: string;
  defaults: Record<string, any>;
  description?: string;
}

export interface PaletteSection {
  title: string;
  items: ComponentMetadata[];
}

export const PALETTE_SECTIONS: PaletteSection[] = [
  {
    title: 'Edge & Routing',
    items: [
      { type: 'client', label: 'Client / Users', category: 'Edge & Routing', icon: Users, color: 'var(--accent-purple)', defaults: { label: 'Users', requestsPerSec: 1000, protocol: 'http2' } },
      { type: 'dns', label: 'DNS / Anycast', category: 'Edge & Routing', icon: Globe, color: 'var(--accent-blue)', defaults: { label: 'DNS / Route53', ttl: 300, routingPolicy: 'round-robin' } },
      { type: 'cdn', label: 'CDN', category: 'Edge & Routing', icon: CloudArrowDown, color: 'var(--accent-teal)', defaults: { label: 'CDN / CloudFront', cacheHitRatio: 0.85, edgeLatency: 10 } },
      { type: 'loadBalancer', label: 'Load Balancer', category: 'Edge & Routing', icon: Scales, color: 'var(--accent-orange)', defaults: { label: 'Load Balancer (ALB)', algorithm: 'round-robin', healthCheckInterval: 10 } },
      { type: 'apiGateway', label: 'API Gateway', category: 'Edge & Routing', icon: PlugsConnected, color: '#3B82F6', defaults: { label: 'API Gateway (Kong)', authCheck: true, rateLimit: 10000, processingTime: 5 } },
      { type: 'firewall', label: 'WAF / Firewall', category: 'Edge & Routing', icon: ShieldCheck, color: '#EF4444', defaults: { label: 'WAF / DDoS Shield', blockedRate: 0.05, processingTime: 2 } },
      { type: 'reverseProxy', label: 'Reverse Proxy', category: 'Edge & Routing', icon: ArrowsSplit, color: '#06B6D4', defaults: { label: 'Reverse Proxy (NGINX)', routingRules: 10, processingTime: 3 } },
      { type: 'consistentHashRing', label: 'Consistent Hash Ring', category: 'Edge & Routing', icon: Hexagon, color: '#8B5CF6', defaults: { label: 'Consistent Hash Ring', virtualNodes: 150, replicationFactor: 3 } },
    ],
  },
  {
    title: 'Compute & Orchestration',
    items: [
      { type: 'appServer', label: 'App Server / API', category: 'Compute & Orchestration', icon: Desktop, color: 'var(--accent-blue)', defaults: { label: 'App Server / API', replicas: 1, maxThreads: 200, processingTime: 50 } },
      { type: 'workerPool', label: 'Worker Pool', category: 'Compute & Orchestration', icon: Robot, color: 'var(--accent-purple)', defaults: { label: 'Async Workers', workers: 4, taskProcessingTime: 200 } },
      { type: 'serverless', label: 'Serverless Lambda', category: 'Compute & Orchestration', icon: Cloud, color: '#F59E0B', defaults: { label: 'AWS Lambda / Function', coldStartMs: 150, memoryMb: 512, processingTime: 30 } },
      { type: 'kubernetes', label: 'Kubernetes Cluster', category: 'Compute & Orchestration', icon: Hexagon, color: '#3B82F6', defaults: { label: 'K8s Cluster (EKS)', pods: 6, autoScaling: true, maxThreads: 500 } },
      { type: 'cronJob', label: 'Cron Scheduler', category: 'Compute & Orchestration', icon: Clock, color: '#8B5CF6', defaults: { label: 'Cron / Airflow Job', intervalSec: 3600, batchSize: 1000 } },
      { type: 'websocketServer', label: 'WebSocket Server', category: 'Compute & Orchestration', icon: Broadcast, color: '#10B981', defaults: { label: 'WebSocket Gateway', maxConnections: 50000, keepAlive: true } },
      { type: 'serviceMesh', label: 'Service Mesh', category: 'Compute & Orchestration', icon: ShareNetwork, color: '#6366F1', defaults: { label: 'Service Mesh (Istio)', mtlsEnabled: true, retryPolicy: 'exponential', processingTime: 4 } },
      { type: 'presenceServer', label: 'Presence Server', category: 'Compute & Orchestration', icon: Users, color: '#10B981', defaults: { label: 'Presence Service (Heartbeat)', heartbeatIntervalSec: 5, activeSessions: 100000 } },
      { type: 'transcodingWorker', label: 'Video Transcoder', category: 'Compute & Orchestration', icon: Waves, color: '#F97316', defaults: { label: 'Transcoding Engine (FFmpeg)', chunkDurationSec: 10, resolutions: ['1080p', '720p', '480p'] } },
      { type: 'syncService', label: 'Delta Sync Engine', category: 'Compute & Orchestration', icon: FlowArrow, color: '#06B6D4', defaults: { label: 'File Sync Engine (Rsync)', blockChunkSizeKb: 4096, conflictResolution: 'last-write-wins' } },
      { type: 'searchCrawler', label: 'Web Crawler Engine', category: 'Compute & Orchestration', icon: MagnifyingGlass, color: '#EAB308', defaults: { label: 'Distributed Crawler', politenessDelayMs: 500, concurrentFetchers: 100 } },
      { type: 'idGenerator', label: 'Unique ID Generator', category: 'Compute & Orchestration', icon: Key, color: '#64748B', defaults: { label: 'Twitter Snowflake / Ticket Server', bits: 64, datacenterId: 1 } },
    ],
  },
  {
    title: 'Caching & In-Memory',
    items: [
      { type: 'cache', label: 'Redis Cache', category: 'Caching & In-Memory', icon: Lightning, color: 'var(--accent-red)', defaults: { label: 'Redis Cluster', evictionPolicy: 'lru', hitRatio: 0.8, pattern: 'cache-aside', maxSize: 256, ttl: 300 } },
      { type: 'memcached', label: 'Memcached Pool', category: 'Caching & In-Memory', icon: Cpu, color: '#EF4444', defaults: { label: 'Memcached Pool', hitRatio: 0.85, threadsPerNode: 8, maxSize: 512 } },
      { type: 'cdnEdgeCache', label: 'Edge KV Storage', category: 'Caching & In-Memory', icon: CloudArrowDown, color: '#06B6D4', defaults: { label: 'Cloudflare Workers KV', hitRatio: 0.9, edgeLatency: 5 } },
      { type: 'localCache', label: 'In-Memory Cache', category: 'Caching & In-Memory', icon: HardDrive, color: '#F59E0B', defaults: { label: 'Local Cache (Guava)', hitRatio: 0.75, latency: 0.2 } },
      { type: 'leaderboardStore', label: 'Redis ZSET Store', category: 'Caching & In-Memory', icon: ChartLineUp, color: '#EC4899', defaults: { label: 'Redis ZSET Leaderboard', maxRankings: 1000000, updateComplexity: 'O(log N)' } },
    ],
  },
  {
    title: 'Databases & Storage',
    items: [
      { type: 'sqlDatabase', label: 'SQL Database', category: 'Databases & Storage', icon: Database, color: 'var(--accent-green)', defaults: { label: 'PostgreSQL DB', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 } },
      { type: 'nosqlDatabase', label: 'NoSQL Database', category: 'Databases & Storage', icon: Stack, color: 'var(--accent-green)', defaults: { label: 'MongoDB / DynamoDB', consistencyLevel: 'eventual', partitionKey: 'user_id' } },
      { type: 'objectStorage', label: 'Object Storage', category: 'Databases & Storage', icon: HardDrive, color: 'var(--ink-light)', defaults: { label: 'AWS S3 Bucket', latency: 50, maxThroughput: 100 } },
      { type: 'timeSeriesDb', label: 'Time-Series DB', category: 'Databases & Storage', icon: ChartBar, color: '#10B981', defaults: { label: 'InfluxDB / Prometheus', retentionDays: 30, writeThroughput: 50000 } },
      { type: 'graphDb', label: 'Graph Database', category: 'Databases & Storage', icon: ShareNetwork, color: '#8B5CF6', defaults: { label: 'Graph DB (Neo4j)', maxHops: 3, indexed: true } },
      { type: 'vectorDb', label: 'Vector Database', category: 'Databases & Storage', icon: Compass, color: '#EC4899', defaults: { label: 'Vector DB (Pinecone)', dimensions: 1536, indexType: 'HNSW', latency: 15 } },
      { type: 'searchEngine', label: 'Search Engine', category: 'Databases & Storage', icon: MagnifyingGlass, color: '#EAB308', defaults: { label: 'Elasticsearch Index', shards: 5, replicas: 1, fullTextIndex: true } },
      { type: 'dataWarehouse', label: 'Data Warehouse', category: 'Databases & Storage', icon: Buildings, color: '#3B82F6', defaults: { label: 'Snowflake / BigQuery', computeNodes: 8, columnar: true } },
      { type: 'spatialIndex', label: 'Spatial Index DB', category: 'Databases & Storage', icon: Compass, color: '#10B981', defaults: { label: 'Spatial DB (Geohash / Quadtree)', precision: 6, readReplicas: 2 } },
      { type: 'ledgerDatabase', label: 'Immutable Ledger DB', category: 'Databases & Storage', icon: Vault, color: '#64748B', defaults: { label: 'Double-Entry Ledger DB', acidStrict: true, appendOnly: true } },
    ],
  },
  {
    title: 'Messaging & Streaming',
    items: [
      { type: 'messageQueue', label: 'Message Queue', category: 'Messaging & Streaming', icon: Queue, color: 'var(--accent-orange)', defaults: { label: 'Apache Kafka', queueType: 'kafka', partitions: 4, consumerGroups: 1 } },
      { type: 'eventBus', label: 'Event Bus', category: 'Messaging & Streaming', icon: FlowArrow, color: '#F97316', defaults: { label: 'AWS EventBridge', schemaValidation: true, fanout: true } },
      { type: 'deadLetterQueue', label: 'Dead Letter Queue', category: 'Messaging & Streaming', icon: Skull, color: '#EF4444', defaults: { label: 'DLQ / Retry Buffer', retentionHours: 336, maxRetries: 5 } },
      { type: 'streamProcessor', label: 'Stream Processor', category: 'Messaging & Streaming', icon: Waves, color: '#06B6D4', defaults: { label: 'Apache Flink / Spark', windowSec: 60, stateful: true } },
      { type: 'pubsub', label: 'Pub/Sub Topic', category: 'Messaging & Streaming', icon: Megaphone, color: '#A855F7', defaults: { label: 'Google Pub/Sub / SNS', subscribers: 3, pushDelivery: true } },
      { type: 'pushGateway', label: 'Push Notification Gateway', category: 'Messaging & Streaming', icon: Broadcast, color: '#EC4899', defaults: { label: 'APNS / FCM Gateway', batchSize: 1000, retryExponential: true } },
      { type: 'emailSmsService', label: 'Email / SMS Gateway', category: 'Messaging & Streaming', icon: ShareNetwork, color: '#8B5CF6', defaults: { label: 'Twilio / AWS SES', ratePerSec: 500, templatesEnabled: true } },
    ],
  },
  {
    title: 'AI & Machine Learning',
    items: [
      { type: 'llmGateway', label: 'LLM Gateway', category: 'AI & Machine Learning', icon: Brain, color: '#EC4899', defaults: { label: 'Vertex AI / OpenAI Gateway', model: 'gpt-4o / gemini-1.5', tps: 50, latency: 450 } },
      { type: 'modelServing', label: 'ML Model Server', category: 'AI & Machine Learning', icon: Cpu, color: '#8B5CF6', defaults: { label: 'GPU Inference (Triton)', gpus: 4, batchSize: 32, latency: 120 } },
      { type: 'featureStore', label: 'Feature Store', category: 'AI & Machine Learning', icon: Table, color: '#10B981', defaults: { label: 'Feature Store (Feast)', lowLatencyStore: 'redis', offlineStore: 'bigquery' } },
      { type: 'aiAgent', label: 'Autonomous AI Agent', category: 'AI & Machine Learning', icon: Robot, color: '#6366F1', defaults: { label: 'AI Agent (LangChain)', maxSteps: 5, memoryEnabled: true } },
    ],
  },
  {
    title: 'Security & Identity',
    items: [
      { type: 'authService', label: 'Auth Provider', category: 'Security & Identity', icon: Key, color: '#EAB308', defaults: { label: 'Auth0 / Keycloak SSO', jwtExpirySec: 3600, mfaEnabled: true, latency: 15 } },
      { type: 'secretManager', label: 'Secret Manager', category: 'Security & Identity', icon: Vault, color: '#64748B', defaults: { label: 'HashiCorp Vault', autoRotateDays: 30, encryption: 'AES-256' } },
      { type: 'rateLimiter', label: 'Rate Limiter Engine', category: 'Security & Identity', icon: Gauge, color: '#F97316', defaults: { label: 'Token Bucket Limiter', maxQpsPerUser: 100, algorithm: 'token-bucket' } },
    ],
  },
  {
    title: 'Monitoring & Observability',
    items: [
      { type: 'metricsDashboard', label: 'Metrics Dashboard', category: 'Monitoring & Observability', icon: ChartLineUp, color: 'var(--accent-pink)', defaults: { label: 'Grafana Dashboard' } },
      { type: 'logAggregator', label: 'Log Aggregator', category: 'Monitoring & Observability', icon: TerminalWindow, color: '#3B82F6', defaults: { label: 'Datadog Logs / Splunk', logVolumeGbDay: 500, retentionDays: 14 } },
      { type: 'alertManager', label: 'Alert Manager', category: 'Monitoring & Observability', icon: Siren, color: '#EF4444', defaults: { label: 'PagerDuty / Opsgenie', escalationTimeoutMin: 15, onCallActive: true } },
    ],
  },
  {
    title: 'Networking & Infra',
    items: [
      { type: 'vpnGateway', label: 'VPN / Direct Connect', category: 'Networking & Infra', icon: ShieldPlus, color: '#10B981', defaults: { label: 'AWS Direct Connect', bandwidthGbps: 10, encrypted: true } },
      { type: 'bastionHost', label: 'Bastion Host', category: 'Networking & Infra', icon: DesktopTower, color: '#64748B', defaults: { label: 'SSH Bastion / NAT', sshAuditLogging: true, ipWhitelist: true } },
      { type: 'blockStorage', label: 'Block Storage', category: 'Networking & Infra', icon: HardDrive, color: '#475569', defaults: { label: 'NVMe Block Disk (EBS)', iops: 10000, sizeGb: 500 } },
    ],
  },
  {
    title: 'Fintech & Audit Case Studies',
    items: [
      { type: 'paymentGateway', label: 'Payment Gateway API', category: 'Fintech & Audit Case Studies', icon: Key, color: '#10B981', defaults: { label: 'Stripe / PayPal API', idempotencyCheck: true, pciDssCompliant: true, latency: 120 } },
      { type: 'reconciliationEngine', label: 'Reconciliation Engine', category: 'Fintech & Audit Case Studies', icon: Scales, color: '#8B5CF6', defaults: { label: 'Daily Audit Engine', batchCronHour: 2, discrepancyThreshold: 0.0001 } },
    ],
  },
];

// Flat lookup map by node type
export const COMPONENT_MAP: Record<string, ComponentMetadata> = {};
for (const section of PALETTE_SECTIONS) {
  for (const item of section.items) {
    COMPONENT_MAP[item.type] = item;
  }
}
